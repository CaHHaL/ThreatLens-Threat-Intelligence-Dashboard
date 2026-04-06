import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    FileText, Download, Clock, Shield, Calendar,
    CheckCircle, Loader2, Zap, Database, Activity,
    ChevronRight
} from 'lucide-react';
import api from '../api/axios';

export default function Reports() {
    const [period, setPeriod] = useState('7d');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = useMutation({
        mutationFn: async (periodStr) => {
            setIsGenerating(true);
            const response = await api.post('/reports/generate', { period: periodStr }, { responseType: 'blob' });
            return response.data;
        },
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ThreatLens_Global_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setIsGenerating(false);
        },
        onError: () => {
            alert('PDF Generation Engine Critical Error');
            setIsGenerating(false);
        }
    });

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[#030712] relative overflow-hidden">

            {/* Header / HUD Deck */}
            <div className="page-header py-10 px-10 border-b border-white/5 bg-[#0a0f1c]/80 backdrop-blur-3xl sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-end md:items-center gap-10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-2xl shadow-indigo-500/10">
                                <FileText size={26} />
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Strategic Intelligence Export</h1>
                        </div>
                        <p className="page-subtitle pl-16">High-fidelity situational awareness reports for executive review and operational briefing</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            <Shield size={14} className="text-emerald-500" /> Cryptographic_Signing: ACTIVE
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar">
                <div className="max-w-[1200px] mx-auto stagger-children">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] px-1">Report_Parameter_Space</span>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Intelligence Synthesis</h2>
                                <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed max-w-md">
                                    Select the temporal observation window for the automated PDF situational overview.
                                    Data includes global IOC trends, critical CVE analysis, and threat actor movement.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: '24h', label: 'Last 24 Hours', desc: 'Detailed micro-tactical view of recent signal telemetry' },
                                    { id: '7d', label: 'Last 7 Days', desc: 'Standard weekly operational summary for SOC briefing' },
                                    { id: '30d', label: 'Last 30 Days', desc: 'Strategic trend analysis and monthly posture verification' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setPeriod(opt.id)}
                                        className={`p-6 text-left glass-card border border-white/5 transition-all relative overflow-hidden group ${period === opt.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'hover:bg-white/3'}`}
                                    >
                                        {period === opt.id && (
                                            <div className="absolute top-0 right-0 p-3 text-indigo-500 animate-pulse">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}
                                        <h4 className={`text-sm font-black uppercase tracking-wider mb-1 ${period === opt.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{opt.label}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => generateReport.mutate(period)}
                                disabled={isGenerating}
                                className="w-full h-16 bg-white hover:bg-white/90 disabled:bg-slate-800 disabled:opacity-50 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Assembling_Data_Packets...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={20} />
                                        <span>Compile_Strategic_Report</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <div className="relative">
                                {/* Visual Mock of a Report */}
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
                                <div className="relative glass-card border-white/10 p-1 bg-[#0a0f1c]/80 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] angle-gradient">
                                    <div className="bg-[#030712] rounded-xl p-8 aspect-[3/4] flex flex-col space-y-6">
                                        <div className="flex justify-between items-start border-b border-white/5 pb-6">
                                            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-500">
                                                <Shield size={20} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">ThreatLens_Report</p>
                                                <p className="text-[8px] font-mono text-slate-600 mt-1 uppercase">CLASS: UNRESTRICTED</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-2 bg-white/5 rounded-full w-full" />
                                            <div className="h-2 bg-white/5 rounded-full w-3/4" />
                                            <div className="h-2 bg-white/5 rounded-full w-1/2" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-10">
                                            <div className="h-20 bg-white/2 rounded-xl border border-white/5" />
                                            <div className="h-20 bg-white/2 rounded-xl border border-white/5" />
                                        </div>
                                        <div className="flex-1" />
                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <div className="w-4 h-4 rounded bg-slate-800" />
                                                <div className="w-12 h-4 rounded bg-slate-800" />
                                            </div>
                                            <div className="w-20 h-4 rounded bg-slate-800" />
                                        </div>
                                    </div>
                                    {/* HUD Scan Line animation on report mock */}
                                    <div className="absolute left-0 right-0 h-1 bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-scan" style={{ top: '0%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom HUD bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="HUD-pill flex items-center gap-6 pointer-events-auto bg-[#0d1117]/80 backdrop-blur-3xl border border-white/10 rounded-full px-7 py-3 text-[10px] font-black text-slate-500 shadow-2xl">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)]" /> PDF_POST_PROCESS_READY</div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-[0.2em]"><Database size={12} className="text-slate-600" /> EXPORT_SIZE: <span className="text-white">OPTIMIZED</span></div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 uppercase tracking-[0.2em]"><Activity size={12} className="text-slate-600" /> SYNC: <span className="text-indigo-500 font-mono tracking-tighter">RENDER_v2.0.1</span></div>
                </div>
            </div>

            <style>{`
              @keyframes scan {
                0% { top: 0%; }
                100% { top: 100%; }
              }
              .animate-scan {
                animation: scan 4s linear infinite;
              }
            `}</style>
        </div>
    );
}


