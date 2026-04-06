import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity, X, Shield, ExternalLink, ShieldAlert,
    Terminal, Layers, Database, ChevronRight, FileText, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const useTechniqueDetails = (id) => {
    return useQuery({
        queryKey: ['technique', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await api.get(`/mitre/techniques/${id}`);
            return res.data;
        },
        enabled: !!id
    });
};

export default function TechniqueDrawer({ techniqueId, isOpen, onClose }) {
    const { data: tech, isLoading } = useTechniqueDetails(techniqueId);

    return (
        <>
            {/* Backdrop with gradient blur */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 transition-opacity duration-500"
                    onClick={onClose}
                />
            )}

            {/* Side Panel Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0d1117] border-l border-white/5 z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Top header with glowing branding */}
                <div className="flex items-center justify-between p-7 border-b border-white/5 bg-[#0a0f1c]/80 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Layers size={140} className="text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shadow-lg shadow-sky-500/10">
                                <Activity size={18} />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">
                                {tech?.name || (isLoading ? 'COMPUTING_TECHNIQUE...' : 'TECHNIQUE_INFO')}
                            </h2>
                        </div>
                        <p className="text-sky-500/70 font-mono text-xs font-black tracking-widest pl-12">{tech?.id || 'TXXXX.XXX'}</p>
                    </div>

                    <button onClick={onClose} className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all relative z-10 border border-white/5 bg-white/2">
                        <X size={20} />
                    </button>
                </div>

                {/* Content body scroll area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scroll-smooth pb-32">
                    {isLoading ? (
                        <div className="animate-pulse space-y-8">
                            <div className="h-6 bg-white/5 rounded-lg w-1/3" />
                            <div className="space-y-3">
                                <div className="h-3 bg-white/5 rounded-full w-full" />
                                <div className="h-3 bg-white/5 rounded-full w-full" />
                                <div className="h-3 bg-white/5 rounded-full w-2/3" />
                            </div>
                            <div className="h-40 bg-white/5 rounded-2xl w-full" />
                        </div>
                    ) : tech ? (
                        <>
                            {/* Intelligence Badges */}
                            <div className="flex flex-wrap gap-3">
                                <div className={`badge flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${tech.frequency_score >= 8 ? 'bg-red-500/15 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                                    tech.frequency_score >= 4 ? 'bg-amber-400/15 text-amber-500 border-amber-400/30' :
                                        tech.frequency_score >= 1 ? 'bg-sky-400/15 text-sky-400 border-sky-400/30' :
                                            'bg-[#1a2236] text-slate-500 border-white/5'
                                    }`}>
                                    <Terminal size={12} /> Frequency_Index: {tech.frequency_score}
                                </div>

                                {tech.linked_cve_count > 0 && (
                                    <div className="badge flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black bg-red-600/10 text-red-400 border border-red-600/30 uppercase tracking-wider">
                                        <ShieldAlert size={12} /> {tech.linked_cve_count} ACTIVE_VULNS
                                    </div>
                                )}

                                <div className="badge flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest leading-none">
                                    PLATFORM: {tech.is_subtechnique ? 'SUB-TECHNIQUE' : 'PRIMARY'}
                                </div>
                            </div>

                            {/* Section: Context Description */}
                            <section className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                                    <FileText size={12} className="text-sky-500" /> Technique_Abstract
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line tracking-tight px-1 drop-shadow-sm font-medium">
                                    {tech.description || 'Global dataset does not contain descriptive metadata for this indicator at this time.'}
                                </p>
                            </section>

                            {/* Section: Operational Tactics */}
                            <section className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                                    <Layers size={12} className="text-sky-500" /> Mapped_Tactics
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {tech.tactics.map(t => (
                                        <span key={t.id} className="bg-[#111827] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-sky-400 font-mono flex items-center gap-2 group hover:border-sky-500/30 transition-all cursor-default">
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {t.name}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            {/* Section: Threat Actors */}
                            <section className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                                    <Activity size={12} className="text-red-500" /> Verified_Threat_Groups
                                </div>
                                {tech.groups?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {tech.groups.sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                                            <Link to={`/dashboard/threat-actors/${g.id}`} key={g.id} className="block group">
                                                <div className="bg-[#111827]/60 hover:bg-[#111827] border border-white/5 group-hover:border-red-500/30 p-3.5 rounded-2xl flex items-center justify-between transition-all duration-300">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><Shield size={14} /></div>
                                                        <div className="min-w-0 flex flex-col"><span className="text-[11px] font-black text-white group-hover:text-sky-400 transition-colors uppercase truncate">{g.name}</span><span className="text-[10px] text-slate-600 font-mono font-bold tracking-tighter">{g.id}</span></div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl border border-dashed border-white/5 bg-white/2 text-center py-8">
                                        <Activity size={24} className="mx-auto mb-2 opacity-10" />
                                        <p className="text-xs text-slate-600 italic">No direct group attribution in current telemetry.</p>
                                    </div>
                                )}
                            </section>

                            {/* Section: Telemetry & Detection */}
                            <div className="grid grid-cols-1 gap-6">
                                <section className="space-y-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                                        <Database size={12} className="text-emerald-500" /> Detection_Telemetry
                                    </div>
                                    <div className="bg-[#0b1120] p-6 rounded-2xl border border-emerald-500/10 text-xs py-5 text-emerald-400 font-mono leading-relaxed relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Activity size={40} /></div>
                                        <span className="text-emerald-900 block mb-2 font-black select-none opacity-40">:: RUNTIME_RECON_INSTRUCTIONS ::</span>
                                        {tech.detection || 'Baseline detection signature profile pending creation.'}
                                    </div>
                                </section>

                                <section className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                                        <Shield size={12} className="text-sky-500" /> Mitigation_Framework
                                    </div>
                                    <div className="bg-[#0b1120] p-6 rounded-2xl border border-sky-500/10 text-xs py-5 text-sky-400/90 font-mono leading-relaxed relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:translate-x-2 transition-transform"><Shield size={40} /></div>
                                        <span className="text-sky-900 block mb-2 font-black select-none opacity-40">:: DEFENSE_POSTURE_CONFIG ::</span>
                                        {tech.mitigation || 'Global mitigation strategy remains unassigned for this node.'}
                                    </div>
                                </section>
                            </div>

                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-3">
                            <Info size={32} className="opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">Technique_Not_Found</p>
                        </div>
                    )}
                </div>

                {/* Sticky footer for external actions */}
                <div className="p-7 border-t border-white/5 bg-[#0a0f1c]/90 backdrop-blur-xl absolute bottom-0 inset-x-0">
                    <button
                        onClick={() => window.open(`https://attack.mitre.org/techniques/${tech?.id?.replace('.', '/')}`, '_blank')}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-600/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Intel Source: MITRE ATT&CK <ExternalLink size={14} />
                    </button>
                    <p className="text-[9px] text-center text-slate-600 mt-4 font-mono font-bold uppercase tracking-[0.3em]">ThreatLens_Intelligence_Subsystem v1.0.4</p>
                </div>
            </div>
        </>
    );
}
