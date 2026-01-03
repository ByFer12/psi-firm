import { Activity, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, Calendar, ShoppingCart, 
  DollarSign, FileText, ClipboardList, LogOut, Menu, X, Bell 
} from 'lucide-react';

// IMPORTACIÓN DE COMPONENTES
import { AdminAppointments } from './components/administrative/AdminAppointments';
import { AdminInventory } from './components/administrative/AdminInventory';
import { AdminBilling } from './components/administrative/AdminBilling';
import { AdminPayroll } from './components/administrative/AdminPayroll';
import { AdminEmployees } from './components/administrative/AdminEmployees';
import { AdminReports } from './components/administrative/AdminReports';
import { api } from '../../lib/api';
import { AdminClinicalAreas } from './components/administrative/AdminClinicalAreas';

// Interfaz para tipar los datos que vienen de /profile/me
interface EmployeeProfile {
  firstName: string;
  lastName: string;
  identification: string;
  profileType: string;
  status: string;
  // Puedes agregar más campos según el JSON que recibes
}

export const AdministrativeDashboard = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  
  // Estado para el perfil del empleado
  const [usser, setUsser] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect con [] para ejecutarse SOLO UNA VEZ al cargar el componente
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/me");
      setUsser(res.data); // Guardamos la data del JSON
      console.log("Perfil cargado correctamente");
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'inicio', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'pacientes', label: 'Gestión Empleados', icon: Users }, 
    { id: 'areas', label: 'Áreas Clínicas', icon: Activity },
    { id: 'citas', label: 'Control de Citas', icon: Calendar }, 
    { id: 'inventario', label: 'Inventario y Farmacia', icon: ShoppingCart }, 
    { id: 'facturacion', label: 'Caja y Facturación', icon: DollarSign }, 
    { id: 'nomina', label: 'Recursos Humanos', icon: ClipboardList }, 
    { id: 'reportes', label: 'Reportes y Auditoría', icon: FileText }, 
  ];

  const renderContent = () => {
    // Si está cargando el perfil, mostrar un spinner simple
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    switch (activeTab) {
      case 'citas':
        return <AdminAppointments />; 
      case 'pacientes':
        return <AdminEmployees />;
      case 'areas':
        return <AdminClinicalAreas />;
      case 'inventario':
        return <AdminInventory />;
      case 'facturacion':
        return <AdminBilling />;
      case 'nomina':
        return <AdminPayroll />;
      case 'reportes':
        return <AdminReports />;
      case 'inicio':
      default:
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Hola, {usser?.firstName || 'Usuario'}
                        </h1>
                        <p className="text-slate-500">Aquí tienes el resumen de hoy.</p>
                    </div>
                    <div className="text-sm text-slate-400 bg-white px-4 py-2 rounded-lg border border-gray-200">
                        {new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-teal-500">
                        <span className="text-slate-500 text-sm font-medium">Citas Pendientes</span>
                        <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                        <span className="text-slate-500 text-sm font-medium">Pacientes Nuevos</span>
                        <p className="text-3xl font-bold text-slate-800 mt-2">5</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-orange-500">
                        <span className="text-slate-500 text-sm font-medium">Caja del Día</span>
                        <p className="text-3xl font-bold text-slate-800 mt-2">Q. 2,450</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-500">
                        <span className="text-slate-500 text-sm font-medium">Alertas Stock</span>
                        <p className="text-3xl font-bold text-slate-800 mt-2">3</p>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-xl`}>
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
            <span className="font-bold text-xl tracking-wider flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                PsiFirm
            </span>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X /></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === item.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <item.icon size={18} />
                    {item.label}
                </button>
            ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
            <button onClick={logout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 px-4 py-3 rounded-lg text-sm font-medium w-full transition-colors">
                <LogOut size={18} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500"><Menu /></button>
            <div className="flex items-center gap-4 ml-auto">
                <button className="relative p-2 text-slate-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                
                {/* Datos dinámicos del perfil cargado */}
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">
                        {usser ? `${usser.firstName} ${usser.lastName}` : 'Cargando...'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                        {usser?.profileType || 'Administrador'}
                    </p>
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {usser?.firstName?.charAt(0).toUpperCase() || 'A'}
                </div>
            </div>
        </header>

        {/* Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};