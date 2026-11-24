import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
        <img
          src="/mw-logo.png"
          alt="MEQ Wheels"
          className="h-16 w-16 rounded-full animate-pulse border border-neutral-800"
        />
        <div className="flex items-center gap-2 text-neutral-400 text-xs tracking-wider">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
          <span>VERIFYING ADMIN SESSION...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
