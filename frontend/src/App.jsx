import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import api from './api/axios';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FeedStatus from './pages/FeedStatus';
import CVEExplorer from './pages/CVEExplorer';
import IOCWorkbench from './pages/IOCWorkbench';
import AttackMap from './pages/AttackMap';
import ATTACKMatrix from './pages/ATTACKMatrix';
import ThreatActors from './pages/ThreatActors';
import ThreatActorProfile from './pages/ThreatActorProfile';
import Alerts from './pages/Alerts';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
        },
    },
});

function App() {
    const { setAuth, logout, setLoading } = useAuthStore();

    // Silently verify auth on page load via refresh token cookie
    useEffect(() => {
        const verifyAuthStatus = async () => {
            try {
                setLoading(true);
                const refreshRes = await api.post('/auth/refresh');
                const token = refreshRes.data.access_token;
                useAuthStore.setState({ accessToken: token });
                const meRes = await api.get('/auth/me');
                setAuth(meRes.data, token);
            } catch {
                // No valid session — user must log in
                logout();
            } finally {
                setLoading(false);
            }
        };
        verifyAuthStatus();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected layout + nested routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    >
                        {/* Sub-routes rendered in Dashboard's <Outlet /> */}
                        <Route path="feeds" element={<FeedStatus />} />
                        <Route path="cves" element={<CVEExplorer />} />
                        <Route path="attack-map" element={<AttackMap />} />
                        <Route path="workbench" element={<IOCWorkbench />} />
                        <Route path="mitre-matrix" element={<ATTACKMatrix />} />
                        <Route path="threat-actors" element={<ThreatActors />} />
                        <Route path="threat-actors/:id" element={<ThreatActorProfile />} />
                        <Route path="alerts" element={<Alerts />} />
                        <Route path="audit" element={<AuditLog />} />
                        <Route path="reports" element={<Reports />} />
                    </Route>

                    {/* 403 page */}
                    <Route
                        path="/unauthorized"
                        element={
                            <div className="min-h-screen bg-[#030712] flex items-center justify-center flex-col gap-4">
                                <p className="text-5xl font-black text-red-500">403</p>
                                <p className="text-white font-semibold">Insufficient Role Clearance</p>
                                <p className="text-slate-500 text-sm">You do not have permission to view this resource.</p>
                                <a href="/dashboard" className="btn-primary px-5 py-2 text-sm mt-2">Return to Dashboard</a>
                            </div>
                        }
                    />

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
