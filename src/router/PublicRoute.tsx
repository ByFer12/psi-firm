import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    if (user.role === 'PATIENT') return <Navigate to="/dashboard/paciente" replace />;
    return <Navigate to="/dashboard/empleado" replace />;
  }

  return <Outlet />;
};