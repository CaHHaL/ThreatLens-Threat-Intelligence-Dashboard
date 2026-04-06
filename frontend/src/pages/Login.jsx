import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, Loader2, AlertCircle, Eye, EyeOff, Wifi } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

// Animated background grid dots
function GridBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Dot grid */}
            <div className="absolute inset-0 dot-grid opacity-40" />
            {/* Radial glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
                style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.06) 0%, transparent 70%)' }} />
            {/* Radial glow bottom-right */}
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
            {/* Animated scan line */}
            <div className="absolute inset-x-0 h-px opacity-20"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)',
                    animation: 'scanLine 4s linear infinite',
                    top: '30%'
                }} />
            <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 100px)); opacity: 0; }
        }
      `}</style>
        </div>
    );
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const setAuth = useAuthStore(state => state.setAuth);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(t);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { username, password });
            const { access_token } = res.data;
            useAuthStore.setState({ accessToken: access_token });
            const meRes = await api.get('/auth/me');
            setAuth(meRes.data, access_token);
            navigate(from, { replace: true });
        } catch (err) {
            if (!err?.response) {
                setErrorMsg('Network error — is the backend reachable?');
            } else if (err.response?.status === 401) {
                setErrorMsg('Invalid credentials. Check username and password.');
            } else if (err.response?.status === 400) {
                setErrorMsg('Account is inactive. Contact an administrator.');
            } else {
                setErrorMsg('Login failed. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 relative">
            <GridBackground />

            {/* Form Card */}
            <div
                className="relative w-full max-w-md z-10 animate-fade-in"
                style={{ animationDelay: '100ms' }}
            >
                {/* Outer glow */}
                <div className="absolute -inset-1 rounded-2xl opacity-30"
                    style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(99,102,241,0.2), transparent)', filter: 'blur(12px)' }} />

                <div className="relative glass-card p-8 rounded-2xl">
                    {/* Top status bar */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <Wifi size={11} />
                            <span>SECURE_CONN</span>
                            <span className="text-green-500 animate-blink">█</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">TL-AUTH v1</span>
                    </div>

                    {/* Brand */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-5">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full animate-pulse-glow"
                                    style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.15), transparent)' }} />
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center border border-sky-500/30"
                                    style={{ background: 'linear-gradient(135deg, rgba(2,132,199,0.3), rgba(14,165,233,0.1))' }}>
                                    <ShieldCheck size={32} className="text-sky-400" style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' }} />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight text-glow">ThreatLens</h1>
                        <p className="text-sm text-slate-500 mt-1.5 font-mono">Threat Intelligence Platform</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Username
                            </label>
                            <div className="field-icon">
                                <User size={15} className="icon" />
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    className="field"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="field-icon">
                                <Lock size={15} className="icon" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    className="field pr-11"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {errorMsg && (
                            <div className="error-box animate-fade-in">
                                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-2 py-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    <span>Access Platform</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-5 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-sky-500 hover:text-sky-400 font-medium transition-colors">
                                Register access
                            </Link>
                        </p>
                    </div>

                    {/* Security note */}
                    <p className="text-center text-[10px] text-slate-700 mt-4 font-mono">
                        🔒 JWT · HttpOnly Cookies · bcrypt · RBAC
                    </p>
                </div>
            </div>
        </div>
    );
}
