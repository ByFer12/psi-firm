import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { Search, Filter, CheckCircle, Clock, XCircle, UserPlus, Calendar as CalIcon } from 'lucide-react';
import { toast } from 'react-toastify';

// Tipos adaptados a tu backend
interface Appointment {
  id: number;
  appointmentDate: string;
  statusId: number;
  areaId: number;
  notes: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  psychologist?: {
    id: number;
    employee: {
        firstName: string;
        lastName: string;
    }
  };
}

interface Psychologist {
  id: number;
  employee: {
    firstName: string;
    lastName: string;
  };
  specialty?: string;
}

export const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<number | 'all'>('all'); // 1=Pendiente, 2=Confirmada
  
  // Estado para Modal de Asignación
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [selectedPsychologistId, setSelectedPsychologistId] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Citas (Backend debe permitir filtrar o traer todas si es admin)
      const resAppts = await api.get('/citas'); // Asumo que GET /citas trae todo para admin
      setAppointments(resAppts.data);

      // 2. Cargar Psicólogos para el select de asignación
      const resPsychs = await api.get('/clinical/psychologists'); 
      console.log("Psicologos ",resPsychs);
      setPsychologists(resPsychs.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedAppt || !selectedPsychologistId) return;
    try {
      // Endpoint: PATCH /citas/{id}/assign
      await api.patch(`/citas/${selectedAppt.id}/assign`, {
        psychologistId: Number(selectedPsychologistId)
      });
      toast.success("Especialista asignado correctamente");
      setSelectedAppt(null); // Cerrar modal
      fetchData(); // Recargar lista
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error en asignación");
    }
  };

  // Filtrado Frontend (o podrías pedirle al backend que filtre)
  const filteredAppts = appointments.filter(a => {
    if (filterStatus === 'all') return true;
    return a.statusId === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Control de Citas</h2>
        <div className="flex gap-2">
           <select 
             className="border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-teal-500"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value === 'all' ? 'all' : Number(e.target.value))}
           >
             <option value="all">Todos los estados</option>
             <option value={1}>Pendientes de Asignar</option>
             <option value={2}>Confirmadas</option>
             <option value={5}>Canceladas</option>
           </select>
           <Button variant="outline"><Filter size={16} className="mr-2"/> Filtros</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-slate-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Fecha Solicitada</th>
                <th className="px-6 py-4">Área / Motivo</th>
                <th className="px-6 py-4">Especialista</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando...</td></tr>
              ) : filteredAppts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay citas en este filtro.</td></tr>
              ) : filteredAppts.map((appt) => (
                <tr key={appt.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{appt.patient?.firstName} {appt.patient?.lastName}</div>
                    <div className="text-xs text-slate-500">{appt.patient?.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                        <CalIcon size={14}/> {new Date(appt.appointmentDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Clock size={14}/> {new Date(appt.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold mb-1">
                        {appt.areaId === 1 ? 'Psicología' : 'Psiquiatría'}
                    </span>
                    <p className="text-slate-500 text-xs truncate max-w-[150px]" title={appt.notes}>{appt.notes || "Sin notas"}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {appt.psychologist ? (
                        <span className="text-teal-700 font-medium">Dr. {appt.psychologist.employee.lastName}</span>
                    ) : (
                        <span className="text-slate-400 italic">-- Sin asignar --</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                     {appt.statusId === 1 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pendiente</span>}
                     {appt.statusId === 2 && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Confirmada</span>}
                     {appt.statusId === 5 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Cancelada</span>}
                  </td>
                  <td className="px-6 py-4">
                    {appt.statusId === 1 && (
                        <Button 
                            size="sm" 
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1 h-auto"
                            onClick={() => setSelectedAppt(appt)}
                        >
                            <UserPlus size={14} className="mr-1 inline"/> Asignar
                        </Button>
                    )}
                    {/* Más botones: Cancelar, Ver Detalle, etc. */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ASIGNACIÓN (Simple) */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Asignar Especialista</h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                        <p><strong>Paciente:</strong> {selectedAppt.patient?.firstName} {selectedAppt.patient?.lastName}</p>
                        <p><strong>Fecha:</strong> {new Date(selectedAppt.appointmentDate).toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Psicólogo/a</label>
                        <select 
                            className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
                            value={selectedPsychologistId}
                            onChange={(e) => setSelectedPsychologistId(Number(e.target.value))}
                        >
                            <option value="">-- Seleccione --</option>
                            {psychologists.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.employee.firstName} {p.employee.lastName} {p.specialty ? `(${p.specialty})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setSelectedAppt(null)}>Cancelar</Button>
                        <Button onClick={handleAssignSubmit} disabled={!selectedPsychologistId}>Confirmar Asignación</Button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};