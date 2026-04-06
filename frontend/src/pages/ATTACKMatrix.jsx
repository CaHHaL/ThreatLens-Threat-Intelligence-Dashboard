import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Activity, Search, ShieldAlert, Crosshair, ChevronDown, DownloadCloud, Layers } from 'lucide-react';
import api from '../api/axios';
import TechniqueDrawer from '../components/TechniqueDrawer';

const useMatrix = () => {
    return useQuery({
        queryKey: ['mitre_matrix'],
        queryFn: async () => {
            const res = await api.get('/mitre/matrix');
            return res.data;
        }
    });
};

const getHeatmapColor = (score) => {
    if (score >= 8) return 'bg-red-500/10 text-red-400 border-red-500/30 font-bold';
    if (score >= 4) return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
    if (score >= 1) return 'bg-sky-400/10 text-sky-400 border-sky-400/20';
    return 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-500 transition-all';
};

export default function ATTACKMatrix() {
    const { data: matrix, isLoading } = useMatrix();
    const [selectedTactic, setSelectedTactic] = useState('');
    const [activeCVEsOnly, setActiveCVEsOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [drawerTechId, setDrawerTechId] = useState(null);

    const filteredMatrix = useMemo(() => {
        return matrix?.filter(tactic => {
            if (selectedTactic && tactic.id !== selectedTactic) return false;
            return true;
        })?.map(tactic => {
            let filteredTechs = [...tactic.techniques];

            if (activeCVEsOnly) {
                filteredTechs = filteredTechs.filter(t => t.linked_cve_count > 0);
            }

            if (searchQuery) {
                const lowSearch = searchQuery.toLowerCase();
                filteredTechs = filteredTechs.filter(t =>
                    t.name.toLowerCase().includes(lowSearch) ||
                    t.id.toLowerCase().includes(lowSearch)
                );
            }

            // Sort by frequency score descending
            filteredTechs.sort((a, b) => b.frequency_score - a.frequency_score);

            return { ...tactic, techniques: filteredTechs };
        }).filter(tactic => tactic.techniques.length > 0);
    }, [matrix, selectedTactic, activeCVEsOnly, searchQuery]);

    return (
        <div className="flex flex-col h-full animate-fade-in relative overflow-hidden">

            {/* Header / Toolbar */}
            <div className="page-header bg-[#0a0f1c]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5 py-5 px-8">
                <div className="flex flex-col gap-1">
                    <h1 className="page-title flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                            <Activity size={20} className="text-sky-500" />
                        </div>
                        Enterprise ATT&CK Matrix
                    </h1>
                    <p className="page-subtitle">Visual heatmap of adversary techniques based on active telemetry and CVE correlation</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-6 mr-6 px-5 py-2.5 rounded-2xl bg-white/3 border border-white/5">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">TACTICS</p>
                            <p className="text-lg font-mono font-black text-white leading-none">{matrix?.length || 0}</p>
                        </div>
                        <div className="w-px h-8 bg-white/8" />
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OBSERVED</p>
                            <p className="text-lg font-mono font-black text-red-500 leading-none">
                                {matrix?.reduce((acc, t) => acc + t.techniques.filter(item => item.frequency_score > 0).length, 0) || 0}
                            </p>
                        </div>
                    </div>
                    <button className="btn-primary !bg-slate-800 border border-white/10 text-xs px-4 h-10">
                        <DownloadCloud size={14} /> EXPORT_SVG
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-8 py-4 bg-[#0a0f1c]/40 backdrop-blur-sm border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="field-icon flex-1 max-w-sm">
                        <Search size={14} className="icon !left-3 text-slate-500" />
                        <input
                            className="field !py-2 !px-9 !text-xs !rounded-xl"
                            placeholder="Filter techniques..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <select
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-slate-300 outline-none focus:border-sky-500/30 transition-all hover:bg-white/8 cursor-pointer"
                            value={selectedTactic}
                            onChange={e => setSelectedTactic(e.target.value)}
                        >
                            <option value="">All Tactics ({matrix?.length || 0})</option>
                            {matrix?.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={activeCVEsOnly}
                            onChange={e => setActiveCVEsOnly(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600 peer-checked:after:bg-white"></div>
                        <span className="ml-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">Active CVEs only</span>
                    </label>
                    <div className="h-4 w-px bg-white/5" />
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-red-500/20 border border-red-500/40" /> HIGH_FREQ</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-amber-400/20 border border-amber-400/40" /> MED_FREQ</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-sky-500/20 border border-sky-500/40" /> LOW_FREQ</div>
                    </div>
                </div>
            </div>

            {/* Matrix Container */}
            <div className="flex-1 overflow-auto p-8 bg-[#030712] relative scanline-bg">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-4">
                        <RefreshCw className="animate-spin" size={32} />
                        <p className="text-sm font-mono tracking-widest animate-pulse">COMPUTING_MATRIX_GEOMETRY...</p>
                    </div>
                ) : (
                    <div
                        className="flex gap-4 min-h-full"
                        style={{ width: 'fit-content' }}
                    >
                        {filteredMatrix?.map(tactic => (
                            <div key={tactic.id} className="w-[200px] flex flex-col gap-3 group/tactic">
                                {/* Tactic Header */}
                                <div className="sticky top-0 bg-[#030712] z-10 pb-2">
                                    <div className="bg-[#0d1117] p-4 rounded-xl border border-white/5 group-hover/tactic:border-sky-500/20 transition-all shadow-sm">
                                        <p className="text-[10px] font-mono text-sky-500/70 font-black mb-1">{tactic.id}</p>
                                        <h3 className="text-white font-black text-xs leading-tight tracking-tight uppercase">{tactic.name}</h3>
                                        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-sky-500/40" style={{ width: `${(tactic.techniques.length / 80) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Techniques */}
                                <div className="flex flex-col gap-2.5 pb-20">
                                    {tactic.techniques.map(tech => (
                                        <div
                                            key={tech.id}
                                            onClick={() => setDrawerTechId(tech.id)}
                                            className={`
                                                relative p-3.5 rounded-xl border group-hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm flex flex-col gap-2
                                                ${getHeatmapColor(tech.frequency_score)}
                                            `}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="text-[11px] font-bold leading-tight group-hover:text-white transition-colors">{tech.name}</p>
                                                {tech.linked_cve_count > 0 && (
                                                    <div className="shrink-0 flex items-center justify-center bg-red-600 text-white text-[9px] font-black h-4 px-1.5 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                                                        {tech.linked_cve_count}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-mono font-bold tracking-tighter">{tech.id}</span>
                                                {tech.frequency_score > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Crosshair size={10} />
                                                        <span className="text-[9px] font-mono font-bold">{tech.frequency_score}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Glow overlay for active ones */}
                                            {tech.id === drawerTechId && (
                                                <div className="absolute inset-0 rounded-xl ring-2 ring-sky-500/50 ring-offset-2 ring-offset-[#030712] animate-pulse-glow" />
                                            )}
                                        </div>
                                    ))}

                                    {tactic.techniques.length === 0 && (
                                        <div className="py-4 text-center border border-dashed border-white/5 rounded-xl">
                                            <p className="text-[10px] text-slate-700 italic">No matches</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TechniqueDrawer
                techniqueId={drawerTechId}
                isOpen={!!drawerTechId}
                onClose={() => setDrawerTechId(null)}
            />

            {/* Float Action HUD */}
            <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
                <button className="h-12 w-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-2xl">
                    <Layers size={18} />
                </button>
            </div>

        </div>
    );
}

// Add CSS keyframes to the specific page if needed via style tag
const RefreshCw = ({ size, className }) => (
    <Activity size={size} className={className} />
);
