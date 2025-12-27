import { useAuth } from '../../context/AuthContext';
import { AdministrativeDashboard } from './AdministrativeDashboard';
import { PsychologistDashboard } from './PsychologistDashboard';
// import { PsychologistDashboard } from './PsychologistDashboard'; // Futuro
// import { MaintenanceDashboard } from './MaintenanceDashboard'; // Futuro

export const EmployeeDashboard = () => {
  const { user } = useAuth();

  // Redirección interna según rol
  // Roles: 1=ADMIN, 2=PSYCHOLOGIST, 3=PSYCHIATRIST, 4=ADMINISTRATIVE, 5=MAINTENANCE
  
  if (user?.roleId === 4 || user?.roleId === 1) { 
    // Admin y Administrativo comparten muchas vistas, por ahora usaremos el mismo dashboard
    return <AdministrativeDashboard />;
  }
  if (user?.roleId === 2 || user?.roleId === 3) {
    return <PsychologistDashboard />;
  }

  // Si es otro rol (ej. Psicólogo) y aún no tiene dashboard, mostramos aviso temporal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Panel en Construcción</h1>
        <p className="text-slate-600">El dashboard para el rol {user?.roleId} está en desarrollo.</p>
        <button onClick={() => window.location.href='/'} className="mt-4 text-teal-600 underline">Volver</button>
      </div>
    </div>
  );
};