import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Search, Flag, User, ChevronRight, Activity, Globe, Database, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const useThreatGroups = (search) => {
    return useQuery({
        queryKey: ['threat_groups', search],
        queryFn: async () => {
            const res = await api.get('/mitre/groups', { params: { name: search || undefined, limit: 120 } });
            return res.data;
        }
    });
};

function GroupCard({ group, onClick }) {
    return (
        <div
            onClick={onClick}
            className="glass-card p-6 cursor-pointer hover:border-sky-500/30 transition-all group relative overflow-hidden flex flex-col h-full active:scale-[0.98]"
        >
            {/* Decorative identity ring */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors pointer-events-none" />

            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                <div className="min-w-0">
                    <h3 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors uppercase truncate tracking-tight">{group.name}</h3>
                    <p className="text-[10px] text-sky-500 font-mono font-black mt-1 tracking-widest">{group.id}</p>
                </div>
                {group.country_of_origin && (
                    <div className="shrink-0 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 flex items-center gap-2 font-black uppercase tracking-widest leading-none">
                        <Globe size={11} className="text-slate-500" /> {group.country_of_origin}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-4">
                {group.aliases?.length > 0 && (
                    <div>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] mb-1.5 flex items-center gap-1.5"><User size={10} /> Identity_Aliases</p>
                        <div className="flex flex-wrap gap-1.5">
                            {group.aliases.slice(0, 3).map((alias, i) => (
                                <span key={i} className="text-[10px] bg-sky-500/5 text-sky-400/80 px-2 py-0.5 rounded border border-sky-500/10 font-bold uppercase truncate max-w-full">{alias}</span>
                            ))}
                            {group.aliases.length > 3 && <span className="text-[10px] text-slate-600 font-black">+ {group.aliases.length - 3}</span>}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-1.5"><Activity size={10} /> Threat_Capability</p>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-sky-500/40 rounded-full" style={{ width: `${Math.min((group.technique_count || 0) / 40 * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold uppercase">Mapped_Techniques</span>
                        <span className="text-white font-mono font-black">{group.technique_count || 0}</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-[10px] group-hover:translate-x-1 transition-transform">
                <span className="text-sky-500 font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">View_Profile <ChevronRight size={12} /></span>
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Database size={14} className="text-slate-700" />
                </div>
            </div>
        </div>
    );
}

export default function ThreatActors() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: groups, isLoading } = useThreatGroups(debouncedSearch);

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-[#030712] overflow-hidden">

            {/* Header Area */}
            <div className="page-header py-8 px-10 border-b border-white/5 bg-[#0a0f1c]/80 backdrop-blur-3xl sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-2xl shadow-orange-500/10 animate-pulse-glow">
                                <ShieldAlert size={22} />
                            </div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Threat Actor Repository</h1>
                        </div>
                        <p className="page-subtitle pl-14">Advanced Persistent Threat (APT) profiles and operational infrastructure mapping</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative group w-full md:w-96 shadow-2xl">
                            <div className="absolute -inset-1 rounded-2xl bg-sky-500/10 blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative field-icon">
                                <Search className="icon text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="IDENT_G# Actor_Alias, ID, or Entity..."
                                    className="field !px-10 font-mono !bg-[#0d1117] !border-white/10 focus:!border-sky-500/50 text-xs"
                                />
                            </div>
                        </div>
                        <button className="h-11 w-11 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 flex items-center justify-center text-slate-500 transition-all group shrink-0">
                            <Filter size={18} className="group-hover:rotate-180 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Scroll Grid */}
            <div className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar relative">
                <div className="max-w-[1600px] mx-auto stagger-children">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {[...Array(15)].map((_, i) => <div key={i} className="h-72 glass-card border-none bg-white/3 animate-pulse rounded-2xl" />)}
                        </div>
                    ) : groups?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 text-center opacity-40">
                            <Globe size={80} className="mb-6 text-slate-500 animate-pulse" />
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">No_Entities_Recovered</h3>
                            <p className="text-xs font-mono font-bold text-slate-600 mt-2 tracking-tighter cursor-pointer underline hover:text-slate-400" onClick={() => setSearch('')}>RESET_QUERY_STACK</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {groups?.map(g => (
                                <GroupCard
                                    key={g.id}
                                    group={g}
                                    onClick={() => navigate(`/dashboard/threat-actors/${g.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overlay Bottom */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="HUD-pill flex items-center gap-6 pointer-events-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2.5 text-[10px] font-black text-slate-500 shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.6)]" /> AGENT_ACTIVE</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-widest"><User size={12} /> ENTITIES_TOTAL: <span className="text-white">{groups?.length || 0}</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-widest"><Database size={12} /> SYNC: <span className="text-sky-500">MITRE_v14.1</span></div>
                </div>
            </div>

        </div>
    );
}
