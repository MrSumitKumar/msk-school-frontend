import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user, accessToken } = useAuthStore();
    const location = useLocation();

    // Check if authenticated
    if (!isAuthenticated || !accessToken) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-based protection
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
