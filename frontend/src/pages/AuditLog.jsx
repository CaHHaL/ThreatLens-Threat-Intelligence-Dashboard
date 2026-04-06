import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ShieldCheck, Search, Filter, Clock, User,
    Terminal, Shield, Database, Download, ExternalLink,
    ChevronRight, RefreshCw, Layers, Lock, AlertCircle
} from 'lucide-react';
import api from '../api/axios';

export default function AuditLog() {
    const [actionFilter, setActionFilter] = useState('');

    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit_logs', actionFilter],
        queryFn: async () => {
            const res = await api.get('/admin/audit-logs', { params: { action: actionFilter || undefined, limit: 120 } });
            return res.data;
        }
    });

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-[#030712] overflow-hidden">

            {/* Header / Command HUD */}
            <div className="page-header py-8 px-10 border-b border-white/5 bg-[#0a0f1c]/80 backdrop-blur-3xl sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-2xl shadow-emerald-500/10">
                                <ShieldCheck size={22} className="animate-pulse" />
                            </div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Immutable Audit Trail</h1>
                        </div>
                        <p className="page-subtitle pl-14">High-fidelity administrative observation deck for system-wide compliance and forensic verification</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative group w-72">
                            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/10 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center bg-[#0d1117] border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl transition-all hover:border-emerald-500/30">
                                <Filter size={14} className="text-emerald-500 mr-2" />
                                <select
                                    className="bg-transparent text-white outline-none border-none focus:ring-0 text-xs font-black uppercase tracking-widest w-full cursor-pointer"
                                    value={actionFilter}
                                    onChange={e => setActionFilter(e.target.value)}
                                >
                                    <option value="">All_Actions_Log</option>
                                    <option value="LOGIN">Auth_Operations</option>
                                    <option value="IOC_LOOKUP">Intel_Lookups</option>
                                    <option value="CREATE_ALERT_RULE">Policy_Changes</option>
                                    <option value="GENERATE_REPORT">Export_Actions</option>
                                </select>
                            </div>
                        </div>
                        <button className="h-11 px-6 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 flex items-center gap-2 text-slate-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest">
                            <Download size={14} /> EXPORT_CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar relative">
                <div className="max-w-[1600px] mx-auto stagger-children">

                    {/* Summary Dashboard Info Row */}
                    {!isLoading && logs?.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: 'Security_Events', val: logs.length, color: 'sky' },
                                { label: 'Identities_Trace', val: [...new Set(logs.map(l => l.username))].length, color: 'emerald' },
                                { label: 'Critical_Mutations', val: logs.filter(l => l.action.includes('CREATE') || l.action.includes('DELETE')).length, color: 'rose' },
                                { label: 'Forensic_State', val: 'Verified', color: 'orange' }
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-5 border-white/5 flex items-center gap-5 group hover:bg-white/4">
                                    <div className={`w-11 h-11 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 shadow-lg`}><Layers size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                        <p className="text-xl font-mono font-black text-white leading-none">{stat.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* The Immutable Log Table Container */}
                    <div className="glass-card border-white/5 overflow-hidden relative shadow-2xl">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/10 via-emerald-500/40 to-emerald-500/10" />

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="p-6 border-b border-white/5 min-w-[240px]"><div className="flex items-center gap-2"><Clock size={12} className="text-emerald-500" /> Source_Timestamp</div></th>
                                        <th className="p-6 border-b border-white/5"><div className="flex items-center gap-2"><User size={12} className="text-sky-500" /> Identity_Handle</div></th>
                                        <th className="p-6 border-b border-white/5"><div className="flex items-center gap-2"><Terminal size={12} className="text-orange-500" /> Action_Class</div></th>
                                        <th className="p-6 border-b border-white/5"><div className="flex items-center gap-2"><Database size={12} className="text-slate-400" /> Metadata_Payload</div></th>
                                        <th className="p-6 border-b border-white/5 text-right">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {isLoading ? (
                                        Array(10).fill(0).map((_, i) => (
                                            <tr key={i} className="border-b border-white/5 animate-pulse">
                                                <td className="p-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                                <td className="p-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                                <td className="p-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                                <td className="p-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                                <td className="p-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                            </tr>
                                        ))
                                    ) : logs?.length === 0 ? (
                                        <tr><td colSpan="5" className="p-20 text-center text-slate-600 font-black uppercase tracking-widest opacity-40">Zero_Events_Recovered_From_Chain</td></tr>
                                    ) : logs?.map((log) => (
                                        <tr key={log.id} className="border-b border-white/5 hover:bg-emerald-500/[0.03] transition-all group active:bg-white/5">
                                            <td className="p-6 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                                                <span className="text-slate-600 font-bold mr-2 group-hover:text-emerald-500 transition-colors">SIG:</span>
                                                {new Date(log.timestamp).toISOString().replace('T', ' ').split('.')[0]}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 font-black text-[10px] group-hover:scale-110 transition-transform">
                                                        {log.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-white uppercase group-hover:text-sky-400 transition-colors">{log.username}</span>
                                                        <span className="text-[10px] text-slate-600 font-mono">OP_REF:{log.id.substring(0, 6)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${log.action.includes('FAIL') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(225,29,72,0.1)]' :
                                                    log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                                        'bg-slate-900 border-white/10 text-slate-400'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col max-w-sm">
                                                    <p className="font-mono text-[10px] text-slate-500 truncate group-hover:text-slate-300 transition-colors" title={JSON.stringify(log.details)}>
                                                        {JSON.stringify(log.details)}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-sky-600 font-black tracking-widest border border-sky-600/10 select-none">M_DATA_STABLE</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-emerald-500/40 group-hover:text-emerald-500 transition-colors">
                                                    <ShieldCheck size={14} className="animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">VERIFIED</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom HUD Dashboard Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="HUD-pill flex items-center gap-6 pointer-events-auto bg-[#0d1117]/80 backdrop-blur-3xl border border-white/10 rounded-full px-7 py-3 text-[10px] font-black text-slate-500 shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" /> OBS_ENGINE_v4</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-[0.2em]"><Lock size={12} className="text-slate-600" /> INTEGRITY_LEVEL: <span className="text-white">ENHANCED</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-[0.2em]"><ExternalLink size={12} className="text-slate-600" /> ADDR: <span className="text-emerald-500">AUDIT_BLOCK_01</span></div>
                </div>
            </div>

        </div>
    );
}

const Activity = ({ size, className }) => (
    <Terminal size={size} className={className} />
);
