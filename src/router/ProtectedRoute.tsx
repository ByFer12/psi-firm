import { Navigate, Outlet, useLocation } from 'react-router-dom';
import  { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  // 1. No está logueado -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Está logueado pero no tiene el rol permitido -> Dashboard por defecto según su rol
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirigir al dashboard correspondiente a su rol real
    if (user.role === 'PATIENT') return <Navigate to="/dashboard/paciente" replace />;
    return <Navigate to="/dashboard/empleado" replace />;
  }

  return <Outlet />;
};