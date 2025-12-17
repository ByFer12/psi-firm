import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null; 

  if (isAuthenticated && user) {
    if (user.roleId === 6) {
      return <Navigate to="/dashboard/paciente" replace />;
    }
    
    // Para los roles 1, 2, 3, 4
    return <Navigate to="/dashboard/empleado" replace />;
  }

  return <Outlet />;
};