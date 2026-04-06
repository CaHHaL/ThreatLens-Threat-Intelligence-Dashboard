import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, Mail, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

function GridBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 dot-grid opacity-40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
                style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.06) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
        </div>
    );
}

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (form.password !== form.confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        if (form.password.length < 8) {
            setErrorMsg('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                username: form.username,
                email: form.email,
                password: form.password,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            if (!err?.response) {
                setErrorMsg('Network error — is the backend reachable?');
            } else if (err.response?.status === 400) {
                setErrorMsg(err.response.data?.detail || 'Username or email already exists.');
            } else {
                setErrorMsg('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        const p = form.password;
        if (!p) return null;
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        if (score <= 1) return { label: 'Weak', color: 'bg-red-500', w: 'w-1/4' };
        if (score === 2) return { label: 'Fair', color: 'bg-amber-500', w: 'w-2/4' };
        if (score === 3) return { label: 'Good', color: 'bg-sky-500', w: 'w-3/4' };
        return { label: 'Strong', color: 'bg-green-500', w: 'w-full' };
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 relative">
            <GridBackground />

            <div className="relative w-full max-w-md z-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="absolute -inset-1 rounded-2xl opacity-25"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(56,189,248,0.2), transparent)', filter: 'blur(12px)' }} />

                <div className="relative glass-card p-8 rounded-2xl">
                    {/* Brand */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-indigo-500/30"
                                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(56,189,248,0.1))' }}>
                                <ShieldCheck size={28} className="text-indigo-400" style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))' }} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Request Access</h1>
                        <p className="text-sm text-slate-500 mt-1">Create your ThreatLens analyst account</p>
                    </div>

                    {success ? (
                        <div className="success-box animate-fade-in flex-col items-center text-center py-6">
                            <CheckCircle2 size={32} className="text-green-400 mb-3" />
                            <p className="font-semibold text-green-300">Account Created!</p>
                            <p className="text-sm text-slate-400 mt-1">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                                <div className="field-icon">
                                    <User size={15} className="icon" />
                                    <input name="username" type="text" required className="field" placeholder="Choose a username"
                                        value={form.username} onChange={handleChange} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                                <div className="field-icon">
                                    <Mail size={15} className="icon" />
                                    <input name="email" type="email" required className="field" placeholder="analyst@company.com"
                                        value={form.email} onChange={handleChange} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                                <div className="field-icon">
                                    <Lock size={15} className="icon" />
                                    <input name="password" type={showPassword ? 'text' : 'password'} required className="field pr-11"
                                        placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {strength && (
                                    <div className="mt-2">
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.w}`} />
                                        </div>
                                        <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                <div className="field-icon">
                                    <Lock size={15} className="icon" />
                                    <input name="confirmPassword" type="password" required className="field" placeholder="Repeat your password"
                                        value={form.confirmPassword} onChange={handleChange} />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="error-box animate-fade-in">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <p className="text-xs text-slate-600 bg-white/3 p-3 rounded-lg border border-white/5">
                                ℹ️ New accounts are granted <span className="text-slate-400 font-semibold">VIEWER</span> role by default. Contact an Admin to elevate permissions.
                            </p>

                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /><span>Creating Account...</span></>
                                ) : (
                                    <><ShieldCheck size={16} /><span>Create Account</span></>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-5 pt-5 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-600">
                            Already have access?{' '}
                            <Link to="/login" className="text-sky-500 hover:text-sky-400 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
