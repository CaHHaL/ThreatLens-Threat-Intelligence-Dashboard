import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from stix2 import MemoryStore, Filter
import requests
from app.core.database import AsyncSessionLocal
from app.models.mitre import Tactic, Technique, ThreatGroup, Software

logger = logging.getLogger(__name__)

async def seed_mitre_if_empty():
    """Fires during startup if mitre matrices are empty to prevent blocking UI"""
    
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        res = await db.execute(select(Tactic).limit(1))
        if res.scalar_one_or_none():
            logger.info("MITRE already populated.")
            return
            
        logger.info("MITRE ATT&CK base tables empty. Sinking STIX2 data... This will take a moment.")

        url = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
        try:
            # stix2 needs file or dictionary
            r = await asyncio.to_thread(requests.get, url, timeout=45)
            stix_data = r.json()
            mem = MemoryStore(stix_data=stix_data)

            def get_ext_id(obj, prefix):
                if 'external_references' in obj:
                    for ext in obj['external_references']:
                        if ext.get('external_id', '').startswith(prefix):
                            return ext['external_id']
                return None

            # Collect references quickly inside memory
            tactics = mem.query([Filter("type", "=", "x-mitre-tactic")])
            techniques = mem.query([Filter("type", "=", "attack-pattern")])
            groups = mem.query([Filter("type", "=", "intrusion-set")])
            softwares = mem.query([Filter("type", "in", ["malware", "tool"])])
            rels = mem.query([Filter("type", "=", "relationship")])

            # Building dict structures
            saved_tactics = {}
            for t in tactics:
                tid = get_ext_id(t, "TA")
                if tid:
                    db.add(Tactic(id=tid, name=t.get("name", "Unknown"), shortname=t.get("x_mitre_shortname", ""), description=t.get("description", "")))
                    saved_tactics[t.get("id")] = tid

            saved_techniques = {}
            for t in techniques:
                tid = get_ext_id(t, "T")
                if tid:
                    db.add(Technique(
                        id=tid, 
                        name=t.get("name", "Unknown"), 
                        description=t.get("description", ""),
                        detection=t.get("x_mitre_detection", ""),
                        is_subtechnique=int(t.get("x_mitre_is_subtechnique", False)),
                    ))
                    saved_techniques[t.get("id")] = tid

            saved_groups = {}
            for g in groups:
                gid = get_ext_id(g, "G")
                if gid:
                    aliases = g.get("aliases", [])
                    db.add(ThreatGroup(
                        id=gid,
                        name=g.get("name", "Unknown"),
                        aliases=aliases,
                        description=g.get("description", "")
                    ))
                    saved_groups[g.get("id")] = gid

            saved_software = {}
            for s in softwares:
                sid = get_ext_id(s, "S")
                if sid:
                    db.add(Software(
                        id=sid,
                        name=s.get("name", "Unknown"),
                        type=s.get("type", "tool"),
                        description=s.get("description", "")
                    ))
                    saved_software[s.get("id")] = sid
            
            await db.commit() # Flush base objects
            
            # Reconstruct relations
            for t in techniques:
                tid = saved_techniques.get(t.get("id"))
                if not tid: continue
                if "kill_chain_phases" in t:
                    for phase in t.get("kill_chain_phases", []):
                        res = await db.execute(select(Tactic).where(Tactic.shortname == phase.get("phase_name", "")))
                        tactic_obj = res.scalar_one_or_none()
                        if tactic_obj:
                            try:
                                await db.execute(
                                    Tactic.techniques.property.secondary.insert().values(
                                        tactic_id=tactic_obj.id,
                                        technique_id=tid
                                    )
                                )
                            except: pass

            for r in rels:
                if r.get("relationship_type") == "uses":
                    if r.get("source_ref") in saved_groups and r.get("target_ref") in saved_techniques:
                        try:
                            await db.execute(ThreatGroup.techniques.property.secondary.insert().values(
                                group_id=saved_groups[r.get("source_ref")],
                                technique_id=saved_techniques[r.get("target_ref")]
                            ))
                        except: pass
                    
                    if r.get("source_ref") in saved_software and r.get("target_ref") in saved_techniques:
                        try:
                            await db.execute(Software.techniques.property.secondary.insert().values(
                                software_id=saved_software[r.get("source_ref")],
                                technique_id=saved_techniques[r.get("target_ref")]
                            ))
                        except: pass
                        
                    if r.get("source_ref") in saved_groups and r.get("target_ref") in saved_software:
                        try:
                            await db.execute(ThreatGroup.software.property.secondary.insert().values(
                                group_id=saved_groups[r.get("source_ref")],
                                software_id=saved_software[r.get("target_ref")]
                            ))
                        except: pass

                elif r.get("relationship_type") == "subtechnique-of":
                    if r.get("source_ref") in saved_techniques and r.get("target_ref") in saved_techniques:
                        res = await db.execute(select(Technique).where(Technique.id == saved_techniques[r.get("source_ref")]))
                        child = res.scalar_one_or_none()
                        if child:
                            child.parent_id = saved_techniques[r.get("target_ref")]

            await db.commit()
            logger.info("MITRE ATT&CK parsed and loaded successfully into base tables.")

        except Exception as e:
            logger.error(f"Failed to bootstrap MITRE data: {e}")
