import React from 'react';
import { ShieldAlert, Activity, Database } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function LiveFeed({ maxItems = 20, className = '' }) {
    const { events, connectionStatus } = useWebSocket();

    const displayEvents = events.slice(0, maxItems);

    return (
        <div className={`bg-slate-800 border border-slate-700 rounded-xl flex flex-col ${className}`}>
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80 rounded-t-xl shrink-0">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Activity size={16} className="text-brand-500" /> Live Intel Feed
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{connectionStatus}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'Live' ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]' :
                            connectionStatus.includes('Re') ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                        }`}></div>
                </div>
            </div>

            <style>
                {`
                @keyframes slideInFromTop {
                    0% { transform: translateY(-10px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slideInFeed {
                    animation: slideInFromTop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}
            </style>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
                {displayEvents.map((ev, i) => (
                    <div key={i} className="animate-slideInFeed bg-slate-900 border border-slate-700 p-3 rounded-lg hover:border-brand-500/50 transition-colors cursor-pointer group shadow-md">
                        <div className="flex items-center justify-between mb-1.5 border-b border-slate-700/50 pb-1.5">
                            <span className="text-[11px] font-black text-white flex items-center gap-1.5 tracking-wider">
                                {ev.type === 'new_ioc' && <Database size={12} className="text-brand-400" />}
                                {ev.type === 'new_cve' && <ShieldAlert size={12} className="text-red-400" />}
                                {ev.type === 'new_alert' && <Activity size={12} className="text-amber-400" />}
                                {ev.type === 'new_ioc' ? 'NEW IOC DETECTED' : ev.type.toUpperCase().replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">JUST NOW</span>
                        </div>
                        <p className="text-sm text-brand-300 font-mono truncate font-medium">{ev.data?.value || ev.data?.id || 'Unknown indicator signature'}</p>
                        {ev.data?.geo?.country_code && (
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded inline-flex">
                                <span className="font-bold">Origin: {ev.data.geo.country_code}</span>
                                {ev.data.geo.attack_type && <> <span className="opacity-50">•</span> <span className="font-mono text-[10px] text-slate-300">{ev.data.geo.attack_type}</span> </>}
                            </p>
                        )}
                    </div>
                ))}
                {displayEvents.length === 0 && (
                    <div className="text-center text-slate-500 italic text-sm mt-8 border-dashed border-2 border-slate-700 p-6 rounded-xl">
                        Awaiting persistent real-time pipeline events from Celery ingestors...
                    </div>
                )}
            </div>
        </div>
    );
}
