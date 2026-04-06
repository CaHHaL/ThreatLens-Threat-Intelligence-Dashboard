import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, MapPin, Activity, Download, List, Clock, Globe,
    DownloadCloud, ShieldAlert, AlertTriangle, ShieldCheck,
    ChevronRight, RefreshCw, Layers, Database, Lock, Terminal
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';

// Required for react-leaflet markers on Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Hook for History
const useEnrichmentHistory = () => {
    return useQuery({
        queryKey: ['enrich_history'],
        queryFn: async () => {
            const res = await api.get('/enrich/history');
            return res.data;
        }
    });
};

function StatusBadge({ verdict }) {
    const v = verdict?.toUpperCase();
    if (v === 'MALICIOUS') return <span className="badge-critical flex items-center gap-1"><ShieldAlert size={10} /> {v}</span>;
    if (v === 'SUSPICIOUS') return <span className="badge-warning flex items-center gap-1"><AlertTriangle size={10} /> {v}</span>;
    if (v === 'BENIGN' || v === 'CLEAN') return <span className="badge-low flex items-center gap-1"><ShieldCheck size={10} /> {v}</span>;
    return <span className="badge-info">{v || 'UNKNOWN'}</span>;
}

export default function IOCWorkbench() {
    const [inputValue, setInputValue] = useState("");
    const [activeResult, setActiveResult] = useState(null);
    const queryClient = useQueryClient();
    const { data: history, isLoading: historyLoading } = useEnrichmentHistory();

    const enrichMutation = useMutation({
        mutationFn: async (val) => {
            const res = await api.post('/enrich', { value: val });
            return res.data;
        },
        onSuccess: (data) => {
            setActiveResult(data);
            queryClient.invalidateQueries({ queryKey: ['enrich_history'] });
        }
    });

    const handleSearch = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || enrichMutation.isPending) return;
        enrichMutation.mutate(inputValue.trim());
    };

    const handleHistorySelect = (historicalItem) => {
        setActiveResult(historicalItem.full_result);
        setInputValue(historicalItem.ioc_value);
    };

    const exportJSON = () => {
        if (!activeResult) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeResult, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `TL_Enrich_${activeResult.ioc_value}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Calculate VT score percentage
    const vtScore = activeResult?.vt_data?.total_engines
        ? Math.round((activeResult.vt_data.malicious / activeResult.vt_data.total_engines) * 100)
        : 0;

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            <div className="flex-1 flex overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pb-24">

                    {/* Top Search Banner */}
                    <div className="max-w-4xl mx-auto mt-4">
                        <header className="mb-6">
                            <h1 className="page-title flex items-center gap-3">
                                <Terminal size={22} className="text-sky-500" />
                                IOC Enrichment Workbench
                            </h1>
                            <p className="page-subtitle">Real-time enrichment across VirusTotal, AbuseIPDB, and public geo-feeds</p>
                        </header>

                        <form onSubmit={handleSearch} className="relative group">
                            {/* Glow effect on hover */}
                            <div className="absolute -inset-1 rounded-2xl bg-sky-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />

                            <div className="relative field-icon shadow-2xl">
                                <Search className="icon !left-5 text-slate-500" size={22} />
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="field !px-16 !py-5 text-lg !rounded-2xl !bg-[#0d1117] !border-white/10 focus:!border-sky-500/50 font-mono tracking-tight"
                                    placeholder="IP Address, Domain, URL, or File Hash..."
                                />
                                <button
                                    type="submit"
                                    disabled={enrichMutation.isPending || !inputValue}
                                    className="absolute right-3 top-3 bottom-3 px-8 bg-sky-600 hover:bg-sky-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                                >
                                    {enrichMutation.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Terminal size={18} />}
                                    <span>{enrichMutation.isPending ? 'ENRICHING...' : 'SCRAPE'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Loading State */}
                    {enrichMutation.isPending && (
                        <div className="max-w-4xl mx-auto space-y-6 pt-10">
                            <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="h-40 glass-card animate-pulse" />
                                <div className="h-40 glass-card animate-pulse" />
                            </div>
                            <div className="h-80 glass-card animate-pulse" />
                        </div>
                    )}

                    {/* Active Result View */}
                    {activeResult && !enrichMutation.isPending && (
                        <div className="max-w-4xl mx-auto space-y-8 pb-12 stagger-children">

                            {/* Banner Info */}
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 glass-card border-none relative overflow-hidden bg-gradient-to-r from-slate-900/80 to-transparent">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Activity size={100} className="text-white" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusBadge verdict={activeResult.overall_verdict} />
                                        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-black tracking-widest uppercase">{activeResult.ioc_type}</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white font-mono tracking-tighter truncate max-w-lg mb-1">{activeResult.ioc_value}</h2>
                                    <p className="text-sm text-slate-400 max-w-xl">{activeResult.threat_summary}</p>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={exportJSON} className="btn-primary !bg-slate-800 !text-slate-300 hover:!text-white border border-white/5 px-4 h-11 text-xs">
                                        <DownloadCloud size={14} /> EXPORT_JSON
                                    </button>
                                </div>
                            </div>

                            {/* Data Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* AbuseIPDB */}
                                <div className="glass-card p-6 flex flex-col group">
                                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
                                            <ShieldAlert size={15} /> Abuse Intelligence
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    </div>
                                    {activeResult.abuse_data?.error ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-6">
                                            <Lock size={20} className="mb-2 opacity-20" />
                                            <p className="text-xs italic">Service limit or No data reported</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Confidence Score</p>
                                                    <p className={`text-4xl font-mono font-black ${activeResult.abuse_data?.abuseConfidenceScore > 80 ? 'text-red-500' : 'text-sky-400'}`}>
                                                        {activeResult.abuse_data?.abuseConfidenceScore || 0}%
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Reports</p>
                                                    <p className="text-xl font-mono font-black text-white">{activeResult.abuse_data?.totalReports || 0}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 p-4 bg-black/40 rounded-xl border border-white/5 text-[11px] font-mono">
                                                <div className="text-slate-500 uppercase">Country_Code</div><div className="text-right text-white">{activeResult.abuse_data?.countryCode || '??'}</div>
                                                <div className="text-slate-500 uppercase">Provider_ISP</div><div className="text-right text-sky-500 truncate">{activeResult.abuse_data?.isp || 'Unknown'}</div>
                                                <div className="text-slate-500 uppercase">Usage_Type</div><div className="text-right text-white truncate">{activeResult.abuse_data?.usageType || 'N/A'}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* VirusTotal */}
                                <div className="glass-card p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
                                            <Activity size={15} /> Detection Engine
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    </div>
                                    {activeResult.vt_data?.error ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-6">
                                            <Lock size={20} className="mb-2 opacity-20" />
                                            <p className="text-xs italic">VT scan unavailable or invalid hash</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-6">
                                                <div className="relative h-20 w-20 flex-shrink-0">
                                                    <svg className="h-full w-full" viewBox="0 0 36 36">
                                                        <path className="text-slate-800" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                        <path className={vtScore > 50 ? "text-red-500" : "text-sky-500"} strokeDasharray={`${vtScore}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black text-white leading-none">{activeResult.vt_data?.malicious || 0}</span>
                                                        <span className="text-[8px] font-black text-slate-500">FLAGS</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Detection Ratio</p>
                                                    <p className="text-xl font-mono text-white font-bold">{activeResult.vt_data?.malicious || 0} / {activeResult.vt_data?.total_engines || '?'}</p>
                                                    <p className="text-[10px] text-slate-600 font-medium">Standard Antivirus Vendor Cluster</p>
                                                </div>
                                            </div>

                                            <div className="flex-1 max-h-40 overflow-y-auto pr-2 space-y-1 scrollbar-thin">
                                                {(activeResult.vt_data?.detections || []).map((det, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/10 text-[10px] font-mono">
                                                        <span className="text-red-400 truncate pr-4">{det}</span>
                                                        <span className="text-[8px] bg-red-500 text-white font-black px-1 rounded">MATCH</span>
                                                    </div>
                                                ))}
                                                {!(activeResult.vt_data?.detections?.length > 0) && (
                                                    <div className="flex flex-col items-center justify-center text-slate-600 h-24 italic text-xs border border-dashed border-white/5 rounded-lg">
                                                        No positive vendor detections found.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Shodan & Geo Integrated */}
                                <div className="md:col-span-2 glass-card h-[460px] flex flex-col overflow-hidden relative">
                                    <div className="absolute top-0 inset-x-0 h-14 z-20 bg-slate-900/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
                                        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
                                            <MapPin size={15} /> Geographic Origin & Network Recon
                                        </div>
                                        {activeResult.geo_data?.city && (
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                                                <span className="bg-slate-800 px-2 py-0.5 rounded">{activeResult.geo_data.city}, {activeResult.geo_data.country}</span>
                                                <span className="bg-slate-800 px-2 py-0.5 rounded">LAT: {activeResult.geo_data.lat?.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Left: Map */}
                                        <div className="flex-[2] relative bg-slate-950 isolate">
                                            {activeResult.geo_data?.lat ? (
                                                <MapContainer
                                                    center={[activeResult.geo_data.lat, activeResult.geo_data.lon]}
                                                    zoom={4}
                                                    scrollWheelZoom={false}
                                                    style={{ height: '100%', width: '100%' }}
                                                    className="z-0"
                                                >
                                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                                    <Marker position={[activeResult.geo_data.lat, activeResult.geo_data.lon]}>
                                                        <Popup className="custom-popup">
                                                            <span className="text-slate-950 font-bold">{activeResult.ioc_value}</span>
                                                        </Popup>
                                                    </Marker>
                                                </MapContainer>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900/50">
                                                    <Globe size={40} className="mb-3 opacity-20" />
                                                    <p className="text-xs">No Geo-trace available for this identity</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Shodan Info */}
                                        <div className="flex-1 bg-[#0d1117]/80 backdrop-blur-sm border-l border-white/5 p-6 space-y-6 overflow-y-auto">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase border-b border-white/5 pb-2">
                                                <RefreshCw size={12} /> Network Stack
                                            </div>

                                            {activeResult.shodan_data?.error ? (
                                                <p className="text-[11px] text-slate-600 italic">No network reconnaissance data found for this host.</p>
                                            ) : (
                                                <div className="space-y-5">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Metadata</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">ORG</span><span className="text-white font-medium text-right">{activeResult.shodan_data?.org || 'Unknown'}</span></div>
                                                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">OS</span><span className="text-sky-500 font-medium text-right">{activeResult.shodan_data?.os || 'Cloud/N/A'}</span></div>
                                                            <div className="flex justify-between text-[11px]"><span className="text-slate-500">ASN</span><span className="text-white font-mono text-right">{activeResult.geo_data?.asn?.split(' ')[0] || 'N/A'}</span></div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Open Ports</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {activeResult.shodan_data?.open_ports?.map(p => (
                                                                <span key={p} className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-sky-500/20">{p}</span>
                                                            ))}
                                                            {!(activeResult.shodan_data?.open_ports?.length > 0) && <span className="text-[11px] text-slate-600 italic">No ports visible.</span>}
                                                        </div>
                                                    </div>

                                                    {activeResult.shodan_data?.vulns?.length > 0 && (
                                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                            <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Exposure</p>
                                                            <p className="text-[11px] text-red-400 font-bold">{activeResult.shodan_data.vulns.length} vulnerabilities found.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {!activeResult && !enrichMutation.isPending && (
                        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-white/3 border border-white/5 flex items-center justify-center mb-6">
                                <Layers size={40} className="text-slate-700" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Ready for analysis</h2>
                            <p className="text-slate-500 text-sm max-w-sm">Paste any network indicator above to start the automated cross-feed enrichment process.</p>

                            <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-lg">
                                <div className="p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors text-left flex items-center gap-4 cursor-default group">
                                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform"><Database size={20} /></div>
                                    <div className="min-w-0"><p className="text-xs font-bold text-white uppercase">IOC-Store</p><p className="text-[10px] text-slate-500">Persistent database correlation.</p></div>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors text-left flex items-center gap-4 cursor-default group">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div>
                                    <div className="min-w-0"><p className="text-xs font-bold text-white uppercase">Multifeed</p><p className="text-[10px] text-slate-500">Cross-verdict engine analysis.</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lookup History Sidebar */}
                <div className="w-80 bg-[#0d1117] border-l border-white/5 flex flex-col z-10 hidden xl:flex">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 italic uppercase tracking-widest">
                            <Clock size={16} className="text-slate-500" /> Analyst_logs
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {historyLoading ? (
                            Array(6).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)
                        ) : (history || []).length > 0 ? (
                            history.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleHistorySelect(item)}
                                    className={`p-3.5 rounded-xl border border-white/5 cursor-pointer transition-all group relative overflow-hidden ${activeResult?.ioc_value === item.ioc_value ? 'bg-sky-500/10 border-sky-500/40' : 'bg-[#111827]/50 hover:bg-[#111827] hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className={`font-mono text-xs font-bold truncate pr-3 ${activeResult?.ioc_value === item.ioc_value ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.ioc_value}</p>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.overall_verdict === 'MALICIOUS' ? 'bg-red-500' :
                                            item.overall_verdict === 'SUSPICIOUS' ? 'bg-amber-500' : 'bg-green-500'
                                            }`}></div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-black">{item.ioc_type}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600 text-center gap-3">
                                <RefreshCw size={24} className="opacity-20" />
                                <p className="text-[11px] font-medium uppercase tracking-widest">History is empty</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* HUD Status Bar bottom */}
            <footer className="absolute bottom-4 left-4 right-4 h-10 pointer-events-none flex items-center justify-center">
                <div className="HUD-pill bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-full px-4 py-1.5 text-[10px] font-mono text-slate-500 flex items-center gap-4 pointer-events-auto shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> PIPELINE_ACTIVE</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2"><Terminal size={12} /> SCANNER_ID: <span className="text-sky-500 font-bold">X-RAY-01</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="hover:text-white cursor-help transition-colors select-none">NODE: <span className="text-slate-400">AWS_US_EAST_1</span></div>
                </div>
            </footer>
        </div>
    );
}
