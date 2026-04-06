import React, { useState, useEffect } from 'react';
import { useFeedsStatus } from '../hooks/useIOCs';
import {
    Activity, RefreshCcw, CheckCircle, XCircle,
    Terminal, Shield, Globe, Zap, Cpu, Database,
    Clock, AlertTriangle, Play, Check
} from 'lucide-react';
import api from '../api/axios';

export default function FeedStatus() {
    const { data: feeds, isLoading, refetch } = useFeedsStatus();
    const [triggering, setTriggering] = useState(false);
    const [lastSyncText, setLastSyncText] = useState('Sync_Idle');

    const triggerFetch = async () => {
        try {
            setTriggering(true);
            setLastSyncText('Pinging_Edge_Nodes...');
            await api.post('/admin/trigger-fetch');
            // Mocking a bit of the sequence for better UX feel
            setTimeout(() => setLastSyncText('Handshaking_Collectors...'), 1000);
            setTimeout(() => setLastSyncText('Ingestion_Sequence_Started'), 2500);
            setTimeout(() => {
                setTriggering(false);
                setLastSyncText('Sync_Idle');
                refetch();
            }, 5000);
        } catch (e) {
            setTriggering(false);
            setLastSyncText('Sync_Failure');
            alert('Failed to trigger collectors');
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[#030712] relative overflow-hidden">

            {/* Header Hero Section */}
            <div className="page-header py-10 px-10 border-b border-white/5 bg-[#0a0f1c]/80 backdrop-blur-3xl sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-end md:items-center gap-10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 shadow-2xl shadow-sky-500/10">
                                <Cpu size={26} className={triggering ? 'animate-spin' : ''} />
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Fleet Collectors</h1>
                        </div>
                        <p className="page-subtitle pl-16">Distributed intelligence ingestion layer for real-time normalization and threat actor correlation</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end pr-6 border-r border-white/5">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Status_Pipeline</p>
                            <p className="text-xs font-mono font-black text-white tracking-widest uppercase">{lastSyncText}</p>
                        </div>
                        <button
                            onClick={triggerFetch}
                            disabled={triggering}
                            className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest px-8 h-14 rounded-2xl transition-all shadow-2xl shadow-sky-600/15 flex items-center gap-3 relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <div className="relative z-10 flex items-center gap-3">
                                {triggering ? <RefreshCcw size={18} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                                <span>{triggering ? 'COMMAND_SENT' : 'Trigger_Global_Fetch'}</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            Array(6).fill(0).map((_, i) => <div key={i} className="h-64 glass-card border-none bg-white/3 animate-pulse rounded-2xl" />)
                        ) : feeds?.length === 0 ? (
                            <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30 text-center">
                                <Database size={60} className="mb-6" />
                                <p className="text-xl font-black uppercase tracking-widest">No_Active_Collectors_Identified</p>
                            </div>
                        ) : (
                            feeds?.map((feed) => (
                                <div key={feed.id} className="p-8 glass-card border-white/5 group hover:border-sky-500/30 transition-all flex flex-col h-full bg-[#0d1117] relative overflow-hidden">
                                    {/* Small background indicator */}
                                    <div className="absolute -right-4 -top-4 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                        <Globe size={120} />
                                    </div>

                                    <div className="flex justify-between items-start mb-10 relative z-10">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-xl font-black text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight leading-none">{feed.name}</h3>
                                            <p className="text-[10px] font-mono text-slate-600 font-bold tracking-widest">NODE_ID: {feed.id.toUpperCase()}</p>
                                        </div>
                                        <div className={`p-2 rounded-xl border ${feed.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                            {feed.status === 'SUCCESS' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6 relative z-10">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Database size={10} /> IOCs_LOADED</p>
                                                <p className="text-2xl font-mono font-black text-white">{feed.total_iocs.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Shield size={10} /> SEC_STATUS</p>
                                                <p className={`text-[11px] font-black uppercase tracking-tighter h-8 flex items-center ${feed.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {feed.status === 'SUCCESS' ? 'OPERATIONAL' : 'FAILURE_DETECTED'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                                <span>Last_Ingestion_Sync</span>
                                                <span className="text-white font-mono">{feed.last_fetched ? new Date(feed.last_fetched).toLocaleTimeString() : 'Never'}</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-sky-500 animate-shimmer" style={{ width: feed.status === 'SUCCESS' ? '100%' : '20%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-4 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-all">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            <Clock size={12} /> Sync_Interval: 24h
                                        </div>
                                        <ChevronRight size={16} className="text-slate-700 group-hover:text-white transition-opacity" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="HUD-pill flex items-center gap-6 pointer-events-auto bg-[#0d1117]/80 backdrop-blur-3xl border border-white/10 rounded-full px-7 py-3 text-[10px] font-black text-slate-500 shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.6)]" /> SYSTEM_NODES_UP</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-[0.2em]"><Shield size={12} className="text-slate-600" /> AUTH_TOKEN: <span className="text-white">VALID_JWT</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-[0.2em]"><Terminal size={12} className="text-slate-600" /> SCHEDULER: <span className="text-sky-500 tracking-tighter font-mono">CELERY_BEAT_ACTIVE_v1.2</span></div>
                </div>
            </div>

        </div>
    );
}

const ChevronRight = ({ size, className }) => (
    <Activity size={size} className={className} />
);
