import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, Calendar, ShoppingCart, 
  DollarSign, FileText, ClipboardList, LogOut, Menu, X, Bell 
} from 'lucide-react';
import { AdminAppointments } from './components/administrative/AdminAppointments';

// Componentes Placeholder para lo que aún no está en backend
const PlaceholderModule = ({ title }: { title: string }) => (
  <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
    <h2 className="text-xl font-bold text-slate-400">{title}</h2>
    <p className="text-slate-500">Módulo en desarrollo (Funcionalidad Visual)</p>
  </div>
);

export const AdministrativeDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  const menuItems = [
    { id: 'inicio', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'pacientes', label: 'Gestión Pacientes', icon: Users }, // Admisión
    { id: 'citas', label: 'Control de Citas', icon: Calendar }, // Asignación y Agenda
    { id: 'inventario', label: 'Inventario y Farmacia', icon: ShoppingCart }, // Stock
    { id: 'facturacion', label: 'Caja y Facturación', icon: DollarSign }, // Pagos
    { id: 'nomina', label: 'Recursos Humanos', icon: ClipboardList }, // Nómina
    { id: 'reportes', label: 'Reportes y Auditoría', icon: FileText }, // CIE-11, Caja
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'citas':
        return <AdminAppointments />; // ¡Conectado al Backend!
      case 'pacientes':
        return <PlaceholderModule title="Módulo de Admisión de Pacientes" />;
      case 'inventario':
        return <PlaceholderModule title="Gestión de Inventario y Medicamentos" />;
      case 'facturacion':
        return <PlaceholderModule title="Facturación Electrónica y Pagos" />;
      case 'nomina':
        return <PlaceholderModule title="Gestión de Nómina y Planillas" />;
      case 'reportes':
        return <PlaceholderModule title="Reportes Gerenciales" />;
      case 'inicio':
      default:
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-800">Panel Administrativo</h1>
                {/* Stats Cards (Quemadas por ahora) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-teal-500">
                        <span className="text-slate-500 text-sm">Citas Pendientes</span>
                        <p className="text-2xl font-bold text-slate-800 mt-1">12</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                        <span className="text-slate-500 text-sm">Pacientes Nuevos</span>
                        <p className="text-2xl font-bold text-slate-800 mt-1">5</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-orange-500">
                        <span className="text-slate-500 text-sm">Caja del Día</span>
                        <p className="text-2xl font-bold text-slate-800 mt-1">Q. 2,450.00</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-500">
                        <span className="text-slate-500 text-sm">Stock Bajo</span>
                        <p className="text-2xl font-bold text-slate-800 mt-1">3 Ítems</p>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
            <span className="font-bold text-xl tracking-wider">PsiFirm <span className="text-teal-400">Admin</span></span>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X /></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === item.id ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <item.icon size={18} />
                    {item.label}
                </button>
            ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
            <button onClick={logout} className="flex items-center gap-3 text-red-400 hover:text-red-300 text-sm font-medium w-full">
                <LogOut size={18} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500"><Menu /></button>
            <div className="flex items-center gap-4 ml-auto">
                <button className="relative p-2 text-slate-500 hover:bg-gray-100 rounded-full">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{user?.username}</p>
                    <p className="text-xs text-slate-500">Administrativo</p>
                </div>
            </div>
        </header>

        {/* Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};