import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
    LogOut, Shield, Activity, ShieldAlert, Link as LinkIcon,
    Database, Users, AlertTriangle, BellRing, Globe, LayoutDashboard,
    FileText, Menu, X, ChevronRight
} from 'lucide-react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import LiveFeed from '../components/LiveFeed';
import { useWebSocket } from '../hooks/useWebSocket';

// ── Nav config ───────────────────────────────────────────────────
const NAV_ITEMS = [
    {
        label: 'Overview',
        icon: LayoutDashboard,
        path: '/dashboard',
        exact: true,
        roles: ['ADMIN', 'ANALYST', 'VIEWER'],
    },
    {
        label: 'Live Attack Map',
        icon: Globe,
        path: '/dashboard/attack-map',
        roles: ['ADMIN', 'ANALYST'],
        color: 'text-red-400',
    },
    {
        label: 'IOC Workbench',
        icon: Database,
        path: '/dashboard/workbench',
        roles: ['ADMIN', 'ANALYST'],
    },
    {
        label: 'CVE Database',
        icon: ShieldAlert,
        path: '/dashboard/cves',
        roles: ['ADMIN', 'ANALYST', 'VIEWER'],
    },
    {
        label: 'ATT&CK Matrix',
        icon: Activity,
        path: '/dashboard/mitre-matrix',
        roles: ['ADMIN', 'ANALYST'],
    },
    {
        label: 'Threat Actors',
        icon: Users,
        path: '/dashboard/threat-actors',
        roles: ['ADMIN', 'ANALYST'],
    },
    {
        label: 'Alert Rules',
        icon: BellRing,
        path: '/dashboard/alerts',
        roles: ['ADMIN', 'ANALYST'],
        accent: true,
    },
    {
        label: 'Strategic Reports',
        icon: FileText,
        path: '/dashboard/reports',
        roles: ['ADMIN', 'ANALYST'],
    },
];

const ADMIN_NAV = [
    { label: 'Data Feeds', icon: LinkIcon, path: '/dashboard/feeds' },
    { label: 'Audit Logs', icon: FileText, path: '/dashboard/audit' },
];

// ── Metric Cards ─────────────────────────────────────────────────
const METRIC_CONFIGS = [
    { key: 'iocs', label: 'IOCs Tracked', color: 'sky', icon: Database },
    { key: 'cves', label: 'Critical CVEs', color: 'red', icon: ShieldAlert },
    { key: 'alerts', label: 'Active Alerts', color: 'amber', icon: AlertTriangle },
    { key: 'actors', label: 'Threat Groups', color: 'emerald', icon: Users },
];

const COLOR_MAP = {
    sky: { border: 'border-sky-500/60', glow: 'shadow-[0_0_20px_rgba(14,165,233,0.15)]', text: 'text-sky-400', bg: 'bg-sky-500/10' },
    red: { border: 'border-red-500/60', glow: 'shadow-[0_0_20px_rgba(248,113,113,0.15)]', text: 'text-red-400', bg: 'bg-red-500/10' },
    amber: { border: 'border-amber-500/60', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    emerald: { border: 'border-emerald-500/60', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

function MetricCard({ label, value, icon: Icon, color, live = 0 }) {
    const c = COLOR_MAP[color];
    return (
        <div className={`metric-card border-l-2 ${c.border} ${c.glow} animate-fade-in`}>
            <div className={`absolute top-4 right-4 w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <Icon size={18} className={c.text} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white font-mono">
                    {value !== null ? value.toLocaleString() : '—'}
                </span>
                {live > 0 && (
                    <span className={`text-xs font-bold ${c.text} animate-fade-in`}>+{live} live</span>
                )}
            </div>
        </div>
    );
}

function NavLink({ item, isActive }) {
    const Icon = item.icon;
    return (
        <Link
            to={item.path}
            className={`nav-link ${isActive ? 'active' : ''} ${item.accent && !isActive ? 'text-sky-500/70 hover:text-sky-400' : ''}`}
        >
            <Icon size={17} className={item.color || ''} />
            <span>{item.label}</span>
            {item.accent && <span className="ml-auto w-2 h-2 bg-sky-500 rounded-full animate-pulse" />}
        </Link>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { events } = useWebSocket();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [metrics, setMetrics] = useState({ iocs: null, cves: null, alerts: null, actors: null });

    const isOverview = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

    // Compute live deltas from websocket events
    const liveDeltas = {
        iocs: events.filter(e => e.type === 'new_ioc').length,
        cves: events.filter(e => e.type === 'new_cve' && e.data?.cvss_v3_score >= 9.0).length,
        alerts: events.filter(e => e.type === 'new_alert').length,
        actors: 0,
    };

    // Fetch real metric data from API
    useEffect(() => {
        if (!isOverview) return;
        const fetchMetrics = async () => {
            try {
                const [iocRes, cveRes, alertRes, actorRes] = await Promise.allSettled([
                    api.get('/iocs?limit=1'),
                    api.get('/cves?min_cvss=9&limit=1'),
                    api.get('/alerts/events?limit=1'),
                    api.get('/mitre/groups?limit=1'),
                ]);
                setMetrics({
                    iocs: iocRes.status === 'fulfilled' ? (iocRes.value.data?.total || 0) : 0,
                    cves: cveRes.status === 'fulfilled' ? (cveRes.value.data?.total || 0) : 0,
                    alerts: alertRes.status === 'fulfilled' ? (alertRes.value.data?.total || 0) : 0,
                    actors: actorRes.status === 'fulfilled' ? (actorRes.value.data?.length || 0) : 0,
                });
            } catch {
                setMetrics({ iocs: 0, cves: 0, alerts: 0, actors: 0 });
            }
        };
        fetchMetrics();
    }, [isOverview]);

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch { /* ignored */ }
        logout();
        navigate('/login');
    };

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path || location.pathname === item.path + '/';
        return location.pathname.startsWith(item.path);
    };

    const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

    // Build breadcrumb label
    const activeItem = [...NAV_ITEMS, ...ADMIN_NAV].find(i => !i.exact && location.pathname.startsWith(i.path) && i.path !== '/dashboard');
    const breadcrumb = activeItem?.label || 'Overview';

    return (
        <div className="min-h-screen bg-[#030712] flex">

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside className={`
        fixed md:sticky top-0 h-screen w-[220px] flex-shrink-0 flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
                style={{ background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(99,179,237,0.07)' }}>

                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', boxShadow: '0 0 16px rgba(14,165,233,0.4)' }}>
                        <Shield size={16} className="text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-white">ThreatLens</span>
                        <p className="text-[10px] text-slate-600 font-mono leading-none">INTEL-PLATFORM</p>
                    </div>
                    {/* Mobile close */}
                    <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-slate-500 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {visibleNav.map(item => (
                        <NavLink key={item.path} item={item} isActive={isActive(item)} />
                    ))}

                    {user?.role === 'ADMIN' && (
                        <>
                            <div className="px-3 pt-5 pb-2">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Administration</p>
                            </div>
                            {ADMIN_NAV.map(item => (
                                <NavLink key={item.path} item={item} isActive={location.pathname.startsWith(item.path)} />
                            ))}
                        </>
                    )}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-white/5">
                    <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                            <p className="text-[10px] text-sky-500 font-mono">{user?.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-danger w-full text-xs py-2 rounded-lg">
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">

                {/* Top bar */}
                <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5"
                    style={{ background: 'rgba(10,15,28,0.8)', backdropFilter: 'blur(12px)' }}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white">
                            <Menu size={20} />
                        </button>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-slate-600">Console</span>
                            <ChevronRight size={13} className="text-slate-700" />
                            <span className="text-slate-300 font-medium">{breadcrumb}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            LIVE
                        </div>

                        <div className="h-6 w-px bg-white/8" />

                        {/* Bell */}
                        <button onClick={() => navigate('/dashboard/alerts')}
                            className="relative p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                            <BellRing size={18} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#030712]" />
                        </button>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', boxShadow: '0 0 12px rgba(14,165,233,0.3)' }}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">

                    {/* ── Overview Dashboard ── */}
                    {isOverview && (
                        <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
                            {/* Header */}
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
                                    <span className="text-sky-400">{user?.username}</span>
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Threat intelligence pipeline is active · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* Metric cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
                                {METRIC_CONFIGS.map(({ key, label, color, icon }) => (
                                    <MetricCard
                                        key={key}
                                        label={label}
                                        value={metrics[key]}
                                        icon={icon}
                                        color={color}
                                        live={liveDeltas[key]}
                                    />
                                ))}
                            </div>

                            {/* Quick access grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Live Feed */}
                                <div className="glass-card overflow-hidden animate-fade-in" style={{ minHeight: 320 }}>
                                    <LiveFeed maxItems={8} className="h-80" />
                                </div>

                                {/* Quick Links */}
                                <div className="glass-card p-5 animate-fade-in">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Activity size={15} className="text-sky-400" />
                                        Quick Access
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {visibleNav.filter(i => !i.exact).slice(0, 6).map(item => {
                                            const Icon = item.icon;
                                            return (
                                                <Link key={item.path} to={item.path}
                                                    className="flex flex-col gap-2 p-3.5 rounded-xl border border-white/5 hover:border-sky-500/20 hover:bg-sky-500/5 transition-all group">
                                                    <Icon size={18} className={item.color || 'text-slate-400 group-hover:text-sky-400'} style={{ transition: 'all 0.15s' }} />
                                                    <span className="text-xs text-slate-400 group-hover:text-white font-medium transition-colors">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-route outlet */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
