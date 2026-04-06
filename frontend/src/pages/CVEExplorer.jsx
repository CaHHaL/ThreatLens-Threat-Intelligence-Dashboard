import React, { useState, useEffect } from 'react';
import { useCVEs } from '../hooks/useIOCs';
import { Search, ShieldAlert, Filter, Download, Info, AlertTriangle, ExternalLink, Calendar, Database } from 'lucide-react';

function SeverityBadge({ severity }) {
    const s = severity?.toUpperCase();
    if (s === 'CRITICAL') return <span className="badge-critical">Critical</span>;
    if (s === 'HIGH') return <span className="badge-high">High</span>;
    if (s === 'MEDIUM') return <span className="badge-medium">Medium</span>;
    if (s === 'LOW') return <span className="badge-low">Low</span>;
    return <span className="badge-info">Unknown</span>;
}

function CVSSBar({ score }) {
    if (!score) return <span className="text-slate-600 italic">N/A</span>;
    const color = score >= 9 ? 'bg-red-500' : score >= 7 ? 'bg-orange-500' : score >= 4 ? 'bg-amber-500' : 'bg-green-500';
    return (
        <div className="flex items-center gap-3 min-w-[120px]">
            <span className="font-mono font-bold text-slate-200 w-6">{score.toFixed(1)}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${(score / 10) * 100}%` }} />
            </div>
        </div>
    );
}

export default function CVEExplorer() {
    const [search, setSearch] = useState('');
    const [minCvss, setMinCvss] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Simple debounce for search input to prevent excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: cveData, isLoading, isPlaceholderData } = useCVEs({
        search: debouncedSearch || undefined,
        min_cvss: minCvss ? parseFloat(minCvss) : undefined
    });

    const cveList = cveData?.items || [];
    const totalCount = cveData?.total || 0;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="page-header bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <ShieldAlert size={20} className="text-red-500" />
                        </div>
                        CVE Explorer
                    </h1>
                    <p className="page-subtitle">Real-time vulnerability intelligence from NVD and CISA KEV feeds</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Stats summary */}
                    <div className="hidden lg:flex items-center gap-6 px-4 py-2 rounded-xl bg-white/3 border border-white/5">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Tracked</p>
                            <p className="text-lg font-mono font-bold text-white leading-none">{totalCount}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">KEV Active</p>
                            <p className="text-lg font-mono font-bold text-red-400 leading-none">{cveList.filter(c => c.is_kev).length || 0}</p>
                        </div>
                    </div>
                    <button className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="field-icon">
                            <Search className="icon" size={16} />
                            <input
                                className="field"
                                placeholder="Search by CVE ID, vendor, or product string..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="field-icon">
                            <Filter className="icon" size={16} />
                            <input
                                type="number"
                                className="field"
                                placeholder="Min CVSS Score"
                                value={minCvss}
                                onChange={(e) => setMinCvss(e.target.value)}
                                step="0.1" min="0" max="10"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex-1 h-11 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium flex items-center justify-center gap-2">
                            <Calendar size={14} /> Last 30 Days
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 px-8 pb-8 overflow-x-auto">
                <div className="glass-card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-40">Vulnerability ID</th>
                                <th>System Description</th>
                                <th className="w-32">Severity</th>
                                <th className="w-48">CVSS v3.1</th>
                                <th className="w-32 text-center">Status</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className={isLoading ? 'opacity-50' : 'animate-fade-in'}>
                            {isLoading && !cves ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-32" /></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-16 mx-auto" /></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-6" /></td>
                                    </tr>
                                ))
                            ) : cveList.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-600">
                                            <Database size={48} className="opacity-20" />
                                            <p className="text-sm font-medium">No vulnerability records match your current filters.</p>
                                            <button onClick={() => { setSearch(''); setMinCvss('') }} className="text-sky-500 hover:text-sky-400 text-xs font-bold underline">Clear all filters</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                cveList.map(cve => (
                                    <tr key={cve.cve_id} className="group">
                                        <td className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-sky-400 group-hover:text-sky-300 transition-colors uppercase">{cve.cve_id}</span>
                                                {cve.is_kev && (
                                                    <div className="relative group/kev">
                                                        <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover/kev:block bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap z-20">KNOWN EXPLOITED</div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="max-w-md">
                                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed" title={cve.description}>
                                                {cve.description}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">PUBLISHED: {new Date(cve.published_date || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <SeverityBadge severity={cve.cvss_severity} />
                                        </td>
                                        <td>
                                            <CVSSBar score={cve.cvss_v3_score} />
                                        </td>
                                        <td className="text-center">
                                            <div className="flex flex-col items-center">
                                                {cve.is_kev ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="badge bg-red-600 text-white border-none animate-pulse px-1.5">KEV</span>
                                                        {cve.kev_date_added && <span className="text-[8px] text-red-800 font-black">{new Date(cve.kev_date_added).getFullYear()}</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest border border-slate-800 px-1.5 py-0.5 rounded">NVD-ONLY</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="p-1.5 text-slate-600 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                                                <ExternalLink size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-medium px-2">
                    <p>Showing <span className="text-white">{cveList.length}</span> of <span className="text-white">{totalCount}</span> vulnerability records</p>
                    <div className="flex items-center gap-2">
                        <button disabled className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/3 opacity-50 cursor-not-allowed">Previous</button>
                        <button disabled className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/3 opacity-50 cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
