import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        // Show empty or skeleton while doing initial auth check via /me
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-brand-500">Checking auth...</div>;
    }

    if (!isAuthenticated || !user) {
        // Redirect to login but save the attempted destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Basic fallback if role is mismatched
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
