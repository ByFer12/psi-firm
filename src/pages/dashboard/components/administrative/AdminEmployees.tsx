import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { 
  Users, UserPlus, Search, Briefcase, 
  Stethoscope, Edit2, Loader2, 
  UserCheck, UserX, RefreshCw
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { toast } from 'react-toastify';
import { CreateEmployeeModal } from './modals/CreateEmployeeModal';

export const AdminEmployees = () => {
  const { user } = useAuth();
  
  // --- ESTADOS ---
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  
  // Estado para las pestañas (active | inactive)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/employees'); 
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando empleados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const isCurrentlyActive = currentStatus === 'ACTIVE';
    //const actionText = isCurrentlyActive ? 'dar de baja' : 'rehabilitar';
    const confirmMessage = isCurrentlyActive 
        ? `¿Estás seguro de DAR DE BAJA a este empleado? Perderá acceso al sistema inmediatamente.`
        : `¿Deseas REHABILITAR a este empleado? Recuperará su acceso al sistema.`;

    if(!confirm(confirmMessage)) return;
    
    try {
        await api.patch(`/auth/employees/${id}/status`);
        toast.success(isCurrentlyActive ? "Empleado dado de baja" : "Empleado rehabilitado exitosamente");
        loadEmployees(); // Recargar lista
    } catch (error) {
        toast.error("Error al cambiar el estado del empleado");
    }
  };

  const handleEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setShowModal(true);
  };

  // --- LÓGICA DE FILTRADO ---
  const filtered = employees.filter(emp => {
    // 1. Filtro de Seguridad: No mostrar al usuario logueado
    const isCurrentUser = emp.userId === user?.id || emp.email === user?.email;
    if (isCurrentUser) return false;

    // 2. Filtro por Pestaña (Status)
    const matchesTab = activeTab === 'active' 
        ? emp.status === 'ACTIVE' 
        : emp.status !== 'ACTIVE'; // Incluye INACTIVE, SUSPENDED, etc.

    if (!matchesTab) return false;

    // 3. Filtro por Buscador
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      fullName.includes(search) || 
      emp.identification.includes(searchTerm) ||
      emp.email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Encabezado */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="text-teal-600"/> Gestión de Personal
              </h1>
              <p className="text-slate-500 text-sm">Administra altas, bajas y perfiles de colaboradores.</p>
          </div>
          <Button onClick={() => { setSelectedEmployee(null); setShowModal(true); }} className="gap-2">
              <UserPlus size={18}/> Nuevo Empleado
          </Button>
       </div>

       {/* Controles: Pestañas y Buscador */}
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center">
            
            {/* Tabs */}
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'active' 
                        ? 'bg-white text-teal-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <UserCheck size={16}/> Activos
                </button>
                <button 
                    onClick={() => setActiveTab('inactive')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'inactive' 
                        ? 'bg-white text-slate-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <UserX size={16}/> Inactivos / Bajas
                </button>
            </div>

            {/* Buscador */}
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
       </div>

       {/* Grid de Empleados */}
       {loading ? (
         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <Loader2 className="animate-spin text-teal-600 mb-2" size={40} />
            <p className="text-slate-500 font-medium">Cargando datos...</p>
         </div>
       ) : filtered.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                {activeTab === 'active' ? <Users size={30}/> : <UserX size={30}/>}
            </div>
            <p className="text-slate-500 font-medium">No hay empleados {activeTab === 'active' ? 'activos' : 'inactivos'} encontrados.</p>
            <p className="text-sm text-slate-400">Intenta cambiar el filtro de búsqueda.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(emp => (
                <div 
                  key={emp.id} 
                  className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md flex flex-col justify-between ${
                    emp.status !== 'ACTIVE' ? 'bg-gray-50 border-gray-200 opacity-90' : 'border-gray-100'
                  }`}
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${
                                [2, 3].includes(emp.roleId) ? 'bg-purple-100 text-purple-600' : 'bg-teal-50 text-teal-600'
                            }`}>
                                {emp.firstName.charAt(0)}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                emp.status === 'ACTIVE' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {emp.status === 'ACTIVE' ? 'Activo' : 'Baja'}
                            </span>
                        </div>

                        <h3 className="font-bold text-slate-800 text-lg truncate">{emp.firstName} {emp.lastName}</h3>
                        <p className="text-sm text-slate-500 mb-4 truncate flex items-center gap-1">
                            {emp.email}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                <Briefcase size={12}/> {emp.position}
                            </span>
                            {emp.clinicalData?.specialty && (
                                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-100">
                                    <Stethoscope size={12}/> {emp.clinicalData.specialty.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-auto">
                        {/* Botón de Edición (Siempre visible para ver datos, opcional) */}
                        <Button variant="outline" size="sm" onClick={() => handleEdit(emp)}>
                            <Edit2 size={14} className="mr-2"/> Editar
                        </Button>

                        {/* Botón de Acción Dinámico */}
                        {emp.status === 'ACTIVE' ? (
                            <Button 
                              variant="danger" // Asumiendo que tienes variante danger, si no usa className bg-red-xxx
                              size="sm" 
                              onClick={() => handleToggleStatus(emp.id, emp.status)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                            >
                                <UserX size={14} className="mr-2"/> Dar Baja
                            </Button>
                        ) : (
                            <Button 
                              variant="primary" // O success
                              size="sm" 
                              onClick={() => handleToggleStatus(emp.id, emp.status)}
                              className="bg-green-600 hover:bg-green-700 text-white border-none"
                            >
                                <RefreshCw size={14} className="mr-2"/> Reactivar
                            </Button>
                        )}
                    </div>
                </div>
            ))}
         </div>
       )}

       {/* Modales */}
       {showModal && (
           <CreateEmployeeModal 
              employeeData={selectedEmployee}
              onClose={() => { setShowModal(false); setSelectedEmployee(null); }}
              onSuccess={() => { setShowModal(false); setSelectedEmployee(null); loadEmployees(); }}
           />
       )}
    </div>
  );
};