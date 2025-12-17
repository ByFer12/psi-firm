import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/UI/Button';
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Activity, 
  DollarSign 
} from 'lucide-react';

export const EmployeeDashboard = () => {
  const { user, logout } = useAuth();

  // Mapeo simple de roles a nombres legibles en español
  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    PSYCHOLOGIST: 'Psicólogo',
    PSYCHIATRIST: 'Psiquiatra',
    ADMINISTRATIVE: 'Administrativo',
    MAINTENANCE: 'Mantenimiento'
  };

  const userRoleDisplay = user ? roleNames[user.role] || user.role : 'Empleado';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Superior Dashboard */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-teal-600" />
              <div>
                <span className="block font-bold text-slate-800 leading-none">PsiFirm</span>
                <span className="text-xs text-slate-500 font-medium">Panel Profesional</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.sub || 'Usuario'}</p>
                <p className="text-xs text-teal-600 font-semibold">{userRoleDisplay}</p>
              </div>
              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
              <Button 
                variant="outline" 
                onClick={logout} 
                className="flex items-center gap-2 border-gray-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Header de Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Bienvenido, {user?.sub}
          </h1>
          <p className="mt-2 text-slate-600">
            Tienes acceso completo al módulo de <span className="font-semibold text-teal-700">{userRoleDisplay}</span>.
          </p>
        </div>

        {/* Grid de Acciones Rápidas (Accesos directos según futuro desarrollo) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card: Gestión de Pacientes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-600">Gestión</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">Pacientes</h3>
            <p className="text-sm text-slate-500">Registrar nuevos pacientes, ver expedientes y actualizar datos de contacto.</p>
          </div>

          {/* Card: Agenda y Citas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-xs font-medium bg-green-100 px-2 py-1 rounded-full text-green-700 text-nowrap">Hoy: 4 Citas</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-teal-600 transition-colors">Agenda Clínica</h3>
            <p className="text-sm text-slate-500">Visualizar calendario, programar sesiones y gestionar disponibilidad.</p>
          </div>

          {/* Card: Historiales Clínicos (Solo visible si es clínico, lógica visual) */}
          {(user?.role === 'PSYCHOLOGIST' || user?.role === 'PSYCHIATRIST' || user?.role === 'ADMIN') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors">Historias Clínicas</h3>
              <p className="text-sm text-slate-500">Acceder a notas de progreso, diagnósticos y planes de tratamiento.</p>
            </div>
          )}

          {/* Card: Facturación (Admin/Administrativo) */}
          {(user?.role === 'ADMIN' || user?.role === 'ADMINISTRATIVE') && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">Facturación</h3>
              <p className="text-sm text-slate-500">Gestión de pagos, cobros pendientes y reportes financieros.</p>
            </div>
          )}

          {/* Card: Configuración */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group opacity-75 hover:opacity-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                <Settings className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Configuración</h3>
            <p className="text-sm text-slate-500">Ajustes de perfil, seguridad y preferencias del sistema.</p>
          </div>

        </div>
      </main>
    </div>
  );
};