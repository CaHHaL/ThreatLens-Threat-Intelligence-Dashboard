import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ShieldAlert, BellRing, Settings, Plus, CheckCircle,
    XCircle, Filter, Zap, Terminal, Activity, Bell,
    Clock, Check, Trash2, Cpu, AlertTriangle, ShieldCheck
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Alerts() {
    const [activeTab, setActiveTab] = useState('events');
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // Data Fetching
    const { data: eventData, isLoading: evLoading } = useQuery({
        queryKey: ['alert_events'],
        queryFn: async () => (await api.get('/alerts/events')).data
    });

    const eventList = eventData?.items || [];
    const totalEvents = eventData?.total || 0;

    const { data: rules, isLoading: rulesLoading } = useQuery({
        queryKey: ['alert_rules'],
        queryFn: async () => (await api.get('/alerts/rules')).data
    });

    // Mutations
    const actOnEvent = useMutation({
        mutationFn: async ({ id, action }) => await api.patch(`/alerts/events/${id}/${action}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert_events'] })
    });

    const createRule = useMutation({
        mutationFn: async (dataObj) => await api.post('/alerts/rules', dataObj),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert_rules'] });
            setActiveTab('rules');
            setForm({ name: '', rule_type: 'CVE_SEVERITY', cooldown_minutes: 60, notify_telegram: false, notify_email: false, conditions: '{}' });
        }
    });

    const toggleRule = useMutation({
        mutationFn: async ({ id, is_active }) => await api.put(`/alerts/rules/${id}`, { is_active }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert_rules'] })
    });

    const deleteRule = useMutation({
        mutationFn: async (id) => await api.delete(`/alerts/rules/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert_rules'] })
    });

    // Rule Form State
    const [form, setForm] = useState({
        name: '',
        rule_type: 'CVE_SEVERITY',
        cooldown_minutes: 60,
        notify_telegram: false,
        notify_email: false,
        conditions: '{\n  "min_cvss": 9.0\n}'
    });

    const stats = useMemo(() => {
        const total = totalEvents;
        const critical = eventList.filter(e => e.status === 'NEW').length || 0;
        return { total, critical };
    }, [eventList, totalEvents]);

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-[#030712] overflow-hidden">

            {/* Header / Brand HUD */}
            <div className="page-header py-8 px-10 border-b border-white/5 bg-[#0a0f1c]/80 backdrop-blur-3xl sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-2xl shadow-rose-500/10">
                                <Bell size={22} className="animate-pulse" />
                            </div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Alert Engineering</h1>
                        </div>
                        <p className="page-subtitle pl-14 leading-tight">Advanced sentinel engine for automated event processing and multi-channel notification</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-6 px-5 py-2.5 rounded-2xl bg-white/3 border border-white/5">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">PENDING_ACK</p>
                                <p className="text-lg font-mono font-black text-rose-500 leading-none">{stats.critical}</p>
                            </div>
                            <div className="w-px h-8 bg-white/8" />
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">SENTINELS</p>
                                <p className="text-lg font-mono font-black text-white leading-none">{rules?.length || 0}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('create')}
                            className="btn-primary flex items-center gap-2 group px-6 h-11"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            <span>NEW_SENTINEL</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="px-10 py-5 bg-[#0a0f1c]/40 backdrop-blur-sm border-b border-white/5 flex items-center gap-8">
                {[
                    { id: 'events', label: 'Active_Signals', icon: Activity },
                    { id: 'rules', label: 'Sentinel_Fleet', icon: Cpu },
                    { id: 'create', label: 'Rule_Builder', icon: Terminal },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 pb-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                        <tab.icon size={13} className={activeTab === tab.id ? 'text-sky-500' : ''} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute -bottom-5 inset-x-0 h-1 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] rounded-full" />
                        )}
                        {tab.id === 'events' && stats.critical > 0 && (
                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[8px] flex items-center justify-center -translate-y-1">{stats.critical}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-10 pb-32 relative custom-scrollbar">
                <div className="max-w-[1600px] mx-auto stagger-children">

                    {/* Tab: Events Visualization */}
                    {activeTab === 'events' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {evLoading ? (
                                    Array(6).fill(0).map((_, i) => <div key={i} className="h-28 glass-card border-none bg-white/3 animate-pulse rounded-2xl" />)
                                ) : eventList.length > 0 ? (
                                    eventList.map(ev => (
                                        <div key={ev.id} className="p-6 glass-card border-white/5 relative group transition-all hover:bg-white/4">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ev.status === 'NEW' ? 'bg-rose-600' : 'bg-slate-800'} rounded-l-2xl shadow-lg`} />

                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-5">
                                                    <div className={`mt-1 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${ev.status === 'NEW' ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-slate-900 text-slate-600'}`}>
                                                        <ShieldAlert size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-lg font-black text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight leading-none">{ev.rule_name}</h3>
                                                            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded font-black text-slate-600 border border-white/5 uppercase tracking-widest">{ev.status}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-400 font-medium font-mono tracking-tight mb-4 leading-relaxed max-w-2xl">{ev.message}</p>
                                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(ev.triggered_at).toLocaleString()}</span>
                                                            <span className="text-slate-800">|</span>
                                                            <span className="text-sky-800 font-mono">TRACE_ID: {ev.id.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {ev.status === 'NEW' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => actOnEvent.mutate({ id: ev.id, action: 'acknowledge' })}
                                                            className="h-10 px-6 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-black uppercase transition-all flex items-center gap-2 group-active:scale-95"
                                                        >
                                                            <CheckCircle size={14} /> ACK_SIGNAL
                                                        </button>
                                                        <button
                                                            onClick={() => actOnEvent.mutate({ id: ev.id, action: 'dismiss' })}
                                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-slate-600 hover:text-white hover:bg-rose-900/50 border border-white/5 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 text-center glass-card border-dashed border-slate-800 bg-transparent flex flex-col items-center justify-center opacity-40">
                                        <Zap size={40} className="mb-4 text-slate-700" />
                                        <p className="text-xs font-black uppercase tracking-widest">No_Active_Signals_Detected</p>
                                    </div>
                                )}
                            </div>

                            {/* Event Sidebar Metrics */}
                            <div className="space-y-6">
                                <div className="glass-card p-6 border-white/5 bg-sky-500/5 shadow-2xl">
                                    <h4 className="text-xs font-black text-sky-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Terminal size={14} /> Sentinel_Status
                                    </h4>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Detection_Node</span>
                                            <span className="text-[11px] font-mono font-black text-white">X-RAY_PRIMARY</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Latency_Offset</span>
                                            <span className="text-[11px] font-mono font-black text-emerald-500">14.2ms</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Encryption_State</span>
                                            <span className="text-[11px] font-mono font-black text-sky-500 uppercase flex items-center gap-1.5"><ShieldCheck size={12} /> SECURE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Sentinel Rules Fleet */}
                    {activeTab === 'rules' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {rulesLoading ? (
                                Array(6).fill(0).map((_, i) => <div key={i} className="h-44 glass-card border-none bg-white/3 animate-pulse rounded-2xl" />)
                            ) : rules?.map(r => (
                                <div key={r.id} className={`p-6 glass-card border-white/5 group transition-all relative overflow-hidden ${!r.is_active ? 'opacity-50' : 'hover:border-sky-500/30 shadow-2xl'}`}>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors uppercase truncate tracking-tight">{r.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded font-black border border-sky-500/20 uppercase tracking-widest">{r.rule_type}</span>
                                                <span className="text-[9px] font-mono font-bold text-slate-700">{r.id.substring(0, 8)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={r.is_active}
                                                    onChange={(e) => toggleRule.mutate({ id: r.id, is_active: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                            </label>
                                            <button onClick={() => deleteRule.mutate(r.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 overflow-hidden">
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 shadow-sm">CONDITION_LOGIC</p>
                                            <p className="text-[11px] font-mono text-white/80 truncate">{JSON.stringify(r.conditions)}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-slate-600 uppercase font-black">Intercepts</span>
                                                    <span className="text-xs font-mono font-bold text-white">{r.event_count || 0}</span>
                                                </div>
                                                <div className="w-px h-6 bg-white/5" />
                                                <div className="flex gap-1.5">
                                                    {r.notify_telegram && <div className="p-1 px-1.5 rounded bg-sky-500/10 text-sky-400 text-[8px] font-black border border-sky-500/20">TG</div>}
                                                    {r.notify_email && <div className="p-1 px-1.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black border border-emerald-500/20">SMTP</div>}
                                                </div>
                                            </div>
                                            <button className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors bg-white/2 hover:bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 select-none">CONFIGURE</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {rules?.length === 0 && (
                                <p className="text-slate-500 italic text-center col-span-full py-20 uppercase tracking-[0.3em] font-black opacity-20">Fleet_Infrastructure_Offline</p>
                            )}
                        </div>
                    )}

                    {/* Tab: Rule Builder Pipeline */}
                    {activeTab === 'create' && (
                        <div className="max-w-4xl mx-auto">
                            <form
                                onSubmit={e => { e.preventDefault(); createRule.mutate({ ...form, conditions: JSON.parse(form.conditions || '{}') }); }}
                                className="glass-card p-10 border-white/5 bg-[#0d1117] relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                                    <Terminal size={200} className="text-white" />
                                </div>

                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <header className="col-span-full border-b border-white/5 pb-6 mb-2">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                            <Terminal size={20} className="text-sky-500" />
                                            Pipeline Deployment Builder
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 px-1">Define new sentinel logic for automated threat processing</p>
                                    </header>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Sentinel_Identifier</label>
                                            <input
                                                required
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                className="field !bg-[#030712] !border-white/10 !rounded-xl !py-4 font-mono font-bold tracking-tight text-sm focus:!border-sky-500/50"
                                                placeholder="e.g. THREAT_SCAN_LEVEL_01"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Trigger_Topology</label>
                                            <select
                                                value={form.rule_type}
                                                onChange={e => setForm({ ...form, rule_type: e.target.value })}
                                                className="field !bg-[#030712] !border-white/10 !rounded-xl !py-3.5 text-xs font-bold appearance-none cursor-pointer hover:bg-slate-900 transition-colors"
                                            >
                                                <option value="CVE_SEVERITY">CVE Severity Threshold</option>
                                                <option value="IP_ABUSE_SCORE">IP Abuse Score</option>
                                                <option value="KEYWORD_MATCH">Pattern Keyword Match</option>
                                                <option value="TTP_DETECTED">MITRE TTP Mapped</option>
                                                <option value="KEV_ADDED">CISA KEV Addition</option>
                                            </select>
                                        </div>

                                        <div className="pt-2 space-y-4">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Notification_Outbound</p>
                                            <div className="flex items-center gap-8 px-2">
                                                <label className="relative inline-flex items-center cursor-pointer group">
                                                    <input type="checkbox" className="sr-only peer" checked={form.notify_telegram} onChange={e => setForm({ ...form, notify_telegram: e.target.checked })} />
                                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600 after:border-none"></div>
                                                    <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-200 transition-colors">Telegram</span>
                                                </label>
                                                <label className="relative inline-flex items-center cursor-pointer group">
                                                    <input type="checkbox" className="sr-only peer" checked={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.checked })} />
                                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 after:border-none"></div>
                                                    <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-200 transition-colors">Email_SMTP</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex flex-col">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Boolean_Condition_JSON</label>
                                        <div className="flex-1 relative group mt-1">
                                            <textarea
                                                required
                                                value={form.conditions}
                                                onChange={e => setForm({ ...form, conditions: e.target.value })}
                                                className="w-full h-full min-h-[220px] bg-[#030712] border border-white/10 rounded-2xl p-5 text-sky-400 font-mono text-xs outline-none focus:border-sky-500/40 custom-scrollbar resize-none"
                                            />
                                            <div className="absolute top-4 right-4 pointer-events-none opacity-20">
                                                <Zap size={14} className="text-sky-500" />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-2 font-mono italic">{"Example: {\"min_cvss\": 9.0} or {\"keywords\": [\"cobalt strike\"]}"}</p>
                                    </div>

                                    <footer className="col-span-full pt-8 flex items-center justify-between border-t border-white/5">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Clock size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Status: Ready_For_Deployment</span>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={createRule.isPending}
                                            className="px-10 h-14 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-sky-600/10 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
                                        >
                                            {createRule.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                                            <span>Deploy_Sentinel_Node</span>
                                        </button>
                                    </footer>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="HUD-pill flex items-center gap-6 pointer-events-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2.5 text-[10px] font-black text-slate-500 shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" /> ENGINE_v1.2.0</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-widest"><Cpu size={12} /> THREADS: <span className="text-white">OPTIMIZED</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-widest"><Settings size={12} /> CONFIG: <span className="text-sky-500">DYNAMIC</span></div>
                </div>
            </div>

        </div>
    );
}

const RefreshCw = ({ size, className }) => (
    <Activity size={size} className={className} />
);
