import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { 
  Users, UserPlus, Search, Briefcase, 
  Stethoscope, Power, Edit2, Loader2 
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { toast } from 'react-toastify';
import { CreateEmployeeModal } from './modals/CreateEmployeeModal';

export const AdminEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
 
  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

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
    const action = currentStatus === 'ACTIVE' ? 'dar de baja' : 'dar de alta';
    if(!confirm(`¿Desea ${action} a este empleado?`)) return;
    
    try {
        await api.patch(`/auth/employees/${id}/status`);
        toast.success("Estado actualizado con éxito");
        loadEmployees();
    } catch (error) {
        toast.error("Error al cambiar el estado del empleado");
    }
  };

  const handleEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setShowModal(true);
  };

  const filtered = employees.filter(emp => {
    // Evitar que el administrador se edite o borre a sí mismo desde aquí por seguridad
    const isCurrentUser = emp.userId === user?.id || emp.email === user?.email;
    if (isCurrentUser) return false;

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
              <p className="text-slate-500 text-sm">Administra los roles y estados de los empleados del sistema.</p>
          </div>
          <Button onClick={() => { setSelectedEmployee(null); setShowModal(true); }} className="gap-2">
              <UserPlus size={18}/> Nuevo Empleado
          </Button>
       </div>

       {/* Buscador */}
       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
            placeholder="Buscar por nombre, DPI o correo electrónico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
       </div>

       {/* Grid de Empleados */}
       {loading ? (
         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <Loader2 className="animate-spin text-teal-600 mb-2" size={40} />
            <p className="text-slate-500 font-medium">Sincronizando base de datos...</p>
         </div>
       ) : filtered.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-slate-400">No se encontraron empleados que coincidan con la búsqueda.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(emp => (
                <div 
                  key={emp.id} 
                  className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${
                    emp.status === 'INACTIVE' ? 'opacity-70 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            [2, 3].includes(emp.roleId) ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                            {emp.firstName.charAt(0)}
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                            emp.status === 'ACTIVE' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {emp.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg truncate">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-sm text-slate-500 mb-4 truncate">{emp.email}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-gray-100 text-slate-600 border border-gray-200">
                            <Briefcase size={12}/> 
                            {emp.roleId === 1 && "Administrador"}
                            {emp.roleId === 2 && "Psicólogo"}
                            {emp.roleId === 3 && "Psiquiatra"}
                            {emp.roleId === 4 && "Administrativo"}
                            {emp.roleId === 5 && "Mantenimiento"}
                        </span>
                        {emp.clinicalData?.specialty && (
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-100">
                                <Stethoscope size={12}/> {emp.clinicalData.specialty.name}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          fullWidth 
                          size="sm" 
                          onClick={() => handleToggleStatus(emp.id, emp.status)}
                          className={emp.status === 'ACTIVE' ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}
                        >
                            <Power size={14} className="mr-2"/> 
                            {emp.status === 'ACTIVE' ? 'Baja' : 'Alta'}
                        </Button>
                        <Button variant="primary" fullWidth size="sm" onClick={() => handleEdit(emp)}>
                            <Edit2 size={14} className="mr-2"/> Editar
                        </Button>
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