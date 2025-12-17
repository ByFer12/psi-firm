import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Mientras verificamos la sesión (checkAuth), mostramos un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // 1. Si no está autenticado, lo mandamos al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si hay roles permitidos, verificamos el roleId del usuario
  // Cambiamos user.role por user.roleId
  if (allowedRoles && user && !allowedRoles.includes(user.roleId)) {
    
    // Redirección inteligente basada en los IDs de tu SQL
    switch (user.roleId) {
      case 6: // PATIENT
        return <Navigate to="/patient/dashboard" replace />;
      case 1: // ADMIN
      case 2: // PSYCHOLOGIST
      case 3: // PSYCHIATRIST
      case 4: // ADMINISTRATIVE
        return <Navigate to="/dashboard/empleado" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // 3. Si todo está bien, renderiza la ruta hija
  return <Outlet />;
};