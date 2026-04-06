import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Flag, Target, Zap, ShieldAlert,
    Activity, Users, Globe, ExternalLink, ChevronRight,
    Database, Terminal, Info, Layout, ShieldCheck
} from 'lucide-react';
import api from '../api/axios';
import TechniqueDrawer from '../components/TechniqueDrawer';

const useActorProfile = (id) => {
    return useQuery({
        queryKey: ['threat_group', id],
        queryFn: async () => {
            const res = await api.get(`/mitre/groups/${id}`);
            return res.data;
        }
    });
};

export default function ThreatActorProfile() {
    const { id } = useParams();
    const { data: actor, isLoading } = useActorProfile(id);
    const [drawerTechId, setDrawerTechId] = useState(null);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-full gap-5 animate-pulse">
            <Activity size={48} className="text-sky-500 animate-spin" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Reconstructing_Actor_Signature...</p>
        </div>
    );

    if (!actor) return (
        <div className="flex flex-col items-center justify-center h-full gap-5">
            <ShieldAlert size={48} className="text-rose-500" />
            <p className="text-sm font-black text-white uppercase tracking-widest">Entity_Profile_Null</p>
            <Link to="/dashboard/threat-actors" className="text-xs text-sky-500 underline font-black uppercase tracking-widest">Return_To_Directory</Link>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-[#030712] overflow-hidden">

            {/* Action Bar */}
            <div className="px-10 py-5 bg-[#0a0f1c]/40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between sticky top-0 z-30">
                <Link to="/dashboard/threat-actors" className="flex items-center gap-3 text-[11px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest group">
                    <div className="w-8 h-8 rounded-xl bg-white/2 border border-white/5 flex items-center justify-center group-hover:bg-white/5 group-hover:border-white/10">
                        <ArrowLeft size={16} />
                    </div>
                    <span>Back_To_Directory</span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-emerald-500" /> Integrity_Verified
                    </div>
                </div>
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto stagger-children space-y-10">

                    {/* Hero Profile Panel */}
                    <div className="glass-card p-10 border-white/5 bg-[#0d1117] relative overflow-hidden group shadow-2xl">
                        {/* High-detail background vector */}
                        <div className="absolute right-0 top-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                            <Users size={280} className="text-white" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pb-8 border-b border-white/5">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 shadow-2xl shadow-sky-500/10">
                                            <Users size={28} />
                                        </div>
                                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{actor.name}</h1>
                                    </div>
                                    <div className="flex items-center gap-5 ml-16">
                                        <p className="text-sm font-mono font-black text-sky-500 tracking-widest">{actor.id}</p>
                                        <div className="w-px h-3 bg-white/10" />
                                        {actor.country_of_origin && (
                                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Globe size={13} className="text-emerald-500" /> {actor.country_of_origin}
                                            </span>
                                        )}
                                        <div className="w-px h-3 bg-white/10" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Last_Updated: GLOBAL_SYNC_v14</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.open(`https://attack.mitre.org/groups/${actor.id}`, '_blank')}
                                    className="h-14 px-8 rounded-2xl bg-white/2 hover:bg-white/5 border border-white/5 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shrink-0"
                                >
                                    Full_External_Profile <ExternalLink size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                                <div className="lg:col-span-2">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Info size={14} className="text-sky-500" /> Strategic_Abstract</p>
                                    <p className="text-slate-300 leading-relaxed text-sm font-medium whitespace-pre-line tracking-tight border-l-2 border-white/5 pl-8 italic">
                                        {actor.description || 'Global telemetry has not yet extracted descriptive behavioral intelligence for this entity. Operational profile remains restricted.'}
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {actor.aliases?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Target size={14} className="text-rose-500" /> Operational_Aliases</p>
                                            <div className="flex flex-wrap gap-2">
                                                {actor.aliases.map(a => (
                                                    <span key={a} className="bg-slate-900/50 border border-white/5 px-4 py-1.5 text-slate-400 text-[11px] font-black rounded-xl uppercase tracking-tighter hover:text-white hover:border-sky-500/30 transition-all cursor-default">
                                                        {a}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {actor.target_sectors?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Layout size={14} className="text-sky-500" /> Priority_Verticals</p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {actor.target_sectors.map(s => (
                                                    <span key={s} className="bg-sky-500/5 text-sky-400 border border-sky-500/10 px-4 py-2 text-[10px] rounded-xl font-black uppercase tracking-widest">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Inventory */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Associated Techniques Matrix */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                                    <Activity className="text-sky-500" /> TTP_Inventory_Matrix
                                </h2>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{actor.techniques?.length || 0} Nodes_Mapped</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {actor.techniques?.map(tech => (
                                    <div
                                        key={tech.id}
                                        onClick={() => setDrawerTechId(tech.id)}
                                        className="p-5 glass-card border-white/5 bg-[#0d1117]/60 cursor-pointer hover:border-sky-500/30 hover:bg-[#0d1117] transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-20 transition-opacity">
                                            <Zap size={20} className="text-sky-400" />
                                        </div>
                                        <p className="text-white text-[13px] font-black uppercase group-hover:text-sky-400 transition-colors leading-tight mb-2 pr-6">{tech.name}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sky-500 font-mono text-[10px] font-black tracking-widest">{tech.id}</span>
                                            <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">NODE_ACTIVE</span>
                                        </div>
                                    </div>
                                ))}
                                {actor.techniques?.length === 0 && (
                                    <div className="col-span-full py-16 text-center glass-card border-dashed border-white/5 opacity-40">
                                        <Database size={30} className="mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">No_Technical_Map_Defined</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Software Payload / Tooling Box */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Software_Arsenal</h2>
                            </div>

                            <div className="space-y-4">
                                {actor.software?.map(sw => (
                                    <div key={sw.id} className="p-6 glass-card border-white/5 bg-black/30 group hover:border-rose-500/30 transition-all flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-white text-sm font-black uppercase group-hover:text-rose-400 transition-colors">{sw.name}</p>
                                            <span className="text-slate-600 font-mono text-[10px] font-bold">{sw.id}</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${sw.type === 'malware' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-slate-900 border-white/10 text-slate-500'}`}>
                                            {sw.type}
                                        </div>
                                    </div>
                                ))}
                                {actor.software?.length === 0 && (
                                    <div className="py-16 text-center glass-card border-dashed border-white/5 opacity-40">
                                        <Terminal size={30} className="mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">No_Software_Verified</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Floating Navigation HUD Footer */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="HUD-pill flex items-center gap-6 pointer-events-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2.5 text-[10px] font-black text-slate-500 shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> PROFILE_LOADED</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-widest"><ShieldCheck size={12} className="text-slate-600" /> STATUS: <span className="text-white">ENCRYPTED_STREAM</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-widest"><Database size={12} className="text-slate-600" /> SOURCE: <span className="text-sky-500 font-mono tracking-tighter">MITRE_GRAPH_v1.0.4</span></div>
                </div>
            </div>

            <TechniqueDrawer techniqueId={drawerTechId} isOpen={!!drawerTechId} onClose={() => setDrawerTechId(null)} />
        </div>
    );
}

const RefreshCw = ({ size, className }) => (
    <Activity size={size} className={className} />
);
