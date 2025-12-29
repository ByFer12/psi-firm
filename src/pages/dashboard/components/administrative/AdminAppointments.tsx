import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { 
   Clock, Calendar as CalIcon, UserPlus, 
  AlertCircle, FileText, XCircle, Trash2, Eye, Calendar, RefreshCw 
} from 'lucide-react';
import { toast } from 'react-toastify';

// Tipos
interface Appointment {
  id: number;
  appointmentDate: string;
  statusId: number;
  areaId: number;
  notes: string;
  durationMinutes?: number; // Agregado para el modal detalle
  createdAt: string;       // Agregado para el modal detalle
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  psychologist?: {
    id: number;
    professionalLicense: string; // Agregado
    employee: {
        firstName: string;
        lastName: string;
        phone: string;
    }
  };
}

interface Psychologist {
  id: number;
  employee: {
    firstName: string;
    lastName: string;
  };
  specialty?: { name: string };
}

export const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<number | 'all'>('all');
  
  // --- ESTADOS DE MODALES ---
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [modalMode, setModalMode] = useState<'assign' | 'reschedule' | 'details' | null>(null);
  
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  
  // Formulario de asignación/reprogramación
  const [assignForm, setAssignForm] = useState({
      psychologistId: '' as string | number,
      date: '', 
      time: ''  
  });
  
  const [busyHours, setBusyHours] = useState<number[]>([]); 

  useEffect(() => {
    fetchData();
  }, []);

  // Lógica de disponibilidad local
  useEffect(() => {
    if (assignForm.psychologistId && assignForm.date) {
        calculateBusyHours();
    } else {
        setBusyHours([]);
    }
  }, [assignForm.psychologistId, assignForm.date, appointments]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resAppts = await api.get('/citas');
     setAppointments(resAppts.data);
      const resPsychs = await api.get('/clinical/psychologists'); 
  setPsychologists(resPsychs.data);
    } catch (error) {
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  const calculateBusyHours = () => {
    const selectedDateObj = new Date(assignForm.date);
    selectedDateObj.setMinutes(selectedDateObj.getMinutes() + selectedDateObj.getTimezoneOffset());

    const occupied = appointments
        .filter(appt => {
            if (appt.statusId !== 2 && appt.statusId !== 4) return false;
            if (appt.psychologist?.id !== Number(assignForm.psychologistId)) return false;
            
            const apptDate = new Date(appt.appointmentDate);
            return (
                apptDate.getFullYear() === selectedDateObj.getFullYear() &&
                apptDate.getMonth() === selectedDateObj.getMonth() &&
                apptDate.getDate() === selectedDateObj.getDate()
            );
        })
        .map(appt => new Date(appt.appointmentDate).getHours());

    setBusyHours(occupied);
  };

  // --- ACCIONES ---

  // 1. Asignar (PATCH /assign)
  const handleAssignSubmit = async () => {
    if (!selectedAppt) return;
    try {
      const finalDateTime = `${assignForm.date}T${assignForm.time}:00`;
      await api.patch(`/citas/${selectedAppt.id}/assign`, {
        psychologistId: Number(assignForm.psychologistId),
        date: finalDateTime 
      });
      toast.success("Cita asignada correctamente");
      closeModal();
      fetchData(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error en asignación");
    }
  };

  // 2. Reprogramar (PATCH /reschedule)
  const handleRescheduleSubmit = async () => {
    if (!selectedAppt) return;
    try {
      const finalDateTime = `${assignForm.date}T${assignForm.time}:00`;
      // Endpoint solicitado
      await api.patch(`/citas/${selectedAppt.id}/reschedule`, {
        newDate: finalDateTime
      });
      toast.success("Cita reprogramada correctamente");
      closeModal();
      fetchData(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al reprogramar");
    }
  };

  // 3. Cancelar (PATCH /cancel)
  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    try {
      await api.patch(`/citas/${id}/cancel`);
      toast.success('Cita cancelada');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    }
  };

  const closeModal = () => {
      setSelectedAppt(null);
      setModalMode(null);
      setAssignForm({ psychologistId: '', date: '', time: '' });
  };

  // --- HELPERS ---
  const isWeekend = (dateString: string) => {
      const d = new Date(dateString);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      const day = d.getDay();
      return day === 6 || day === 0; 
  };

  const getStatusBadge = (statusId: number) => {
    switch(statusId) {
        case 1: return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Pendiente</span>;
        case 2: return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Confirmada</span>;
        case 5: return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Cancelada</span>;
        default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">Estado {statusId}</span>;
    }
  };

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
             <option value={1}>Pendientes</option>
             <option value={2}>Confirmadas</option>
             <option value={5}>Canceladas</option>
           </select>
           <Button variant="outline" onClick={fetchData}><RefreshCw size={16}/></Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-slate-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Área / Motivo</th>
                <th className="px-6 py-4">Especialista</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando...</td></tr>
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
                    {appt.statusId !== 1 && (
                        <div className="flex items-center gap-2 mt-1 font-medium text-teal-700">
                            <Clock size={14}/> {new Date(appt.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold mb-1">
                        {appt.areaId === 1 ? 'Psicología' : 'Psiquiatría'}
                    </span>
                    <p className="text-slate-500 text-xs truncate max-w-[150px]" title={appt.notes}>{appt.notes || "Sin notas"}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {appt.psychologist ? `Dr. ${appt.psychologist.employee.lastName}` : <span className="text-slate-400 italic">--</span>}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(appt.statusId)}</td>
                  
                  {/* ACCIONES */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                        {/* Ver Detalle */}
                        <button 
                            onClick={() => { setSelectedAppt(appt); setModalMode('details'); }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" 
                            title="Ver Detalles"
                        >
                            <Eye size={18}/>
                        </button>

                        {/* Acciones para PENDIENTE */}
                        {appt.statusId === 1 && (
                            <Button 
                                size="sm" 
                                className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 h-8"
                                onClick={() => {
                                    setSelectedAppt(appt);
                                    setModalMode('assign');
                                    // Pre-llenar fecha
                                    const defaultDate = new Date().toISOString().split('T')[0];
                                    setAssignForm({ psychologistId: '', date: defaultDate, time: '' });
                                }}
                            >
                                <UserPlus size={14} className="mr-1 inline"/> Asignar
                            </Button>
                        )}

                        {/* Acciones para CONFIRMADA */}
                        {appt.statusId === 2 && (
                            <button 
                                onClick={() => {
                                    setSelectedAppt(appt);
                                    setModalMode('reschedule');
                                    // Pre-llenar datos actuales para que sea fácil editar
                                    const dateStr = new Date(appt.appointmentDate).toISOString().split('T')[0];
                                    setAssignForm({ 
                                        psychologistId: appt.psychologist?.id || '', // Mantenemos el doctor
                                        date: dateStr, 
                                        time: '' 
                                    });
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" 
                                title="Reprogramar"
                            >
                                <Calendar size={18}/>
                            </button>
                        )}

                        {/* Cancelar (Si no está cancelada ya) */}
                        {appt.statusId !== 5 && (
                            <button 
                                onClick={() => handleCancelAppointment(appt.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" 
                                title="Cancelar Cita"
                            >
                                <Trash2 size={18}/>
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DETALLES (TU CÓDIGO INTEGRADO) ================= */}
      {modalMode === 'details' && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            
            <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="text-blue-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Detalles de la Cita</h3>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full">
                    <XCircle size={22} />
                </button>
            </div>

            <div className="p-6 space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={80} /></div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.15em] mb-2">Fecha y Hora</p>
                    <p className="text-xl font-semibold text-slate-900 capitalize">
                        {new Date(selectedAppt.appointmentDate).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-slate-600 font-medium mt-1 flex items-center gap-1.5">
                        <Clock size={16} className="text-slate-400" />
                        {new Date(selectedAppt.appointmentDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                </div>

                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Profesional Asignado</p>
                    {selectedAppt.psychologist ? (
                        <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 flex items-center gap-4">
                        <div className="h-11 w-11 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                            {selectedAppt.psychologist.employee.firstName[0]}
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-900 font-bold leading-none mb-1.5">
                                Dr. {selectedAppt.psychologist.employee.firstName} {selectedAppt.psychologist.employee.lastName}
                            </p>
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-semibold text-blue-700">
                                    {selectedAppt.areaId === 1 ? 'Psicología Clínica' : 'Psiquiatría'}
                                    <span className="mx-2 text-blue-200">|</span> Lic. {selectedAppt.psychologist.professionalLicense}
                                </p>
                                <p className="text-[11px] text-slate-500">📞 {selectedAppt.psychologist.employee.phone}</p>
                            </div>
                        </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                            <AlertCircle className="text-amber-500" size={18} />
                            <p className="text-sm text-amber-700 font-medium">Pendiente de asignación</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6 px-1">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado</p>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(selectedAppt.statusId)}
                            <span className="text-slate-300">|</span>
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                <Clock size={14} className="text-slate-400"/> {selectedAppt.durationMinutes || 60} min
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Solicitado el</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {selectedAppt.createdAt ? new Date(selectedAppt.createdAt).toLocaleDateString('es-ES') : '--'}
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Notas</p>
                    <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-100 italic">
                        {selectedAppt.notes ? `"${selectedAppt.notes}"` : "No hay notas adicionales."}
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button onClick={closeModal} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 px-8 rounded-xl transition-all shadow-sm">
                    Cerrar Detalles
                </button>
            </div>
            </div>
        </div>
      )}

      {/* ================= MODAL DE ASIGNACIÓN Y REPROGRAMACIÓN ================= */}
      {(modalMode === 'assign' || modalMode === 'reschedule') && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-slate-800">
                        {modalMode === 'assign' ? 'Agendar y Asignar' : 'Reprogramar Cita'}
                    </h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="space-y-5">
                    <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                        <UserPlus className="text-blue-600 shrink-0 mt-0.5" size={18}/>
                        <div className="text-sm text-blue-900">
                            <p><strong>Paciente:</strong> {selectedAppt.patient.firstName} {selectedAppt.patient.lastName}</p>
                            <p className="mt-1">Cita original: {selectedAppt.appointmentDate ? new Date(selectedAppt.appointmentDate).toLocaleString() : "Por asignar"}</p>
                        </div>
                    </div>

                    {/* Selector de Especialista (Bloqueado en modo reprogramar si deseas forzar el mismo doctor) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Especialista</label>
                        <select 
                            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            value={assignForm.psychologistId}
                            // Si es reprogramación, podrías deshabilitarlo si quieres mantener el doctor: disabled={modalMode === 'reschedule'}
                            onChange={(e) => setAssignForm({...assignForm, psychologistId: e.target.value, time: ''})}
                        >
                            <option value="">-- Seleccione Psicólogo --</option>
                            {psychologists.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.employee.firstName} {p.employee.lastName} {p.specialty ? `(${p.specialty.name})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nueva Fecha</label>
                        <input 
                            type="date" 
                            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            min={new Date().toISOString().split('T')[0]} 
                            value={assignForm.date}
                            onChange={(e) => {
                                setAssignForm({...assignForm, date: e.target.value, time: ''});
                                if (isWeekend(e.target.value)) toast.warning("Fin de semana seleccionado.");
                            }}
                        />
                    </div>

                    {/* Grid de Horarios */}
                    {assignForm.psychologistId && assignForm.date && !isWeekend(assignForm.date) && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Horario Disponible (7:00 - 18:00)</label>
                            
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => {
                                    const isBusy = busyHours.includes(hour);
                                    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                    const isSelected = assignForm.time === timeStr;
                                    
                                    const isBreak = [8, 10, 13, 15].includes(hour);
                                    
                                    return (
                                        <button
                                            key={hour}
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => setAssignForm({...assignForm, time: timeStr})}
                                            className={`
                                                relative py-2 px-1 rounded-lg text-sm font-medium transition-all border
                                                ${isBusy 
                                                    ? 'bg-red-50 border-red-100 text-red-300 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-md transform scale-105 z-10'
                                                        : isBreak
                                                            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                                                            : 'bg-white border-gray-200 text-slate-600 hover:border-teal-500 hover:text-teal-600'
                                                }
                                            `}
                                        >
                                            {timeStr}
                                            {isBreak && !isBusy && !isSelected && (
                                                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 mt-3 text-[10px] text-slate-500 justify-end flex-wrap">
                                <span className="flex items-center gap-1"><div className="w-3 h-3 border rounded bg-white"></div> Libre</span>
                                <span className="flex items-center gap-1"><div className="w-3 h-3 border border-amber-200 rounded bg-amber-50"></div> Comida/Refa</span>
                                <span className="flex items-center gap-1"><div className="w-3 h-3 border border-red-100 rounded bg-red-50"></div> Ocupado</span>
                            </div>

                            {assignForm.time && [8, 10, 13, 15].includes(parseInt(assignForm.time.split(':')[0])) && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                                    <Clock size={16} className="shrink-0 mt-0.5"/>
                                    <div>
                                        <strong>Horario de Comida:</strong> Seleccionó hora de {parseInt(assignForm.time) === 13 ? "Almuerzo" : "Refacción"}.
                                        <br/>Podría haber tiempo de espera.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t mt-2">
                        <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                        <Button 
                            onClick={modalMode === 'assign' ? handleAssignSubmit : handleRescheduleSubmit}
                            disabled={!assignForm.psychologistId || !assignForm.date || !assignForm.time}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            {modalMode === 'assign' ? 'Confirmar Asignación' : 'Confirmar Reprogramación'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};