import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { 
   Clock, Calendar as CalIcon, UserPlus, 
  AlertCircle, FileText, XCircle, Trash2, Eye, Calendar, RefreshCw, CheckCircle2, 
  Search, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { toast } from 'react-toastify';

// Tipos
interface Appointment {
  id: number;
  appointmentDate: string;
  statusId: number;
  areaId: number;
  notes: string;
  durationMinutes?: number; 
  createdAt: string;       
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  psychologist?: {
    id: number;
    professionalLicense: string; 
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

const ITEMS_PER_PAGE = 7;

export const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para las pestañas (1=Pendiente, 2=Confirmada, 4=Completada, 5=Cancelada)
  const [activeTab, setActiveTab] = useState<number>(1); 
  
  // --- ESTADOS DE FILTRO Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // --- ESTADOS DE MODALES ---
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [modalMode, setModalMode] = useState<'assign' | 'reschedule' | 'details' | null>(null);
  
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  
  const [assignForm, setAssignForm] = useState({
      psychologistId: '' as string | number,
      date: '', 
      time: ''  
  });
  
  const [busyHours, setBusyHours] = useState<number[]>([]); 

  useEffect(() => {
    fetchData();
  }, []);

  // Resetear paginación y búsqueda al cambiar de pestaña
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [activeTab]);

  // Resetear paginación al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleRescheduleSubmit = async () => {
    if (!selectedAppt) return;
    try {
      const finalDateTime = `${assignForm.date}T${assignForm.time}:00`;
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

  const isWeekend = (dateString: string) => {
      const d = new Date(dateString);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      const day = d.getDay();
      return day === 6 || day === 0; 
  };

  // --- HELPERS VISUALES ---
  const getStatusBadge = (statusId: number) => {
    switch(statusId) {
        case 1: return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold border border-orange-200">Pendiente</span>;
        case 2: return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">Confirmada</span>;
        case 4: return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold border border-green-200">Completada</span>;
        case 5: return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold border border-red-200">Cancelada</span>;
        default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">Estado {statusId}</span>;
    }
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  
  // 1. Filtrar por Tab y Búsqueda
  const filteredAppts = appointments.filter(a => {
    // Filtro Tab
    if (activeTab !== 0 && a.statusId !== activeTab) return false;

    // Filtro Búsqueda
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase();
    const doctorName = a.psychologist ? `${a.psychologist.employee.firstName} ${a.psychologist.employee.lastName}`.toLowerCase() : '';
    const notes = a.notes ? a.notes.toLowerCase() : '';

    return (
        patientName.includes(searchLower) || 
        doctorName.includes(searchLower) ||
        notes.includes(searchLower)
    );
  });

  // 2. Paginar
  const totalPages = Math.ceil(filteredAppts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAppts = filteredAppts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Contadores
  const counts = {
      pending: appointments.filter(a => a.statusId === 1).length,
      confirmed: appointments.filter(a => a.statusId === 2).length,
      completed: appointments.filter(a => a.statusId === 4).length,
      cancelled: appointments.filter(a => a.statusId === 5).length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Control de Citas</h2>
        <Button variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw size={16}/> Actualizar
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
          <button onClick={() => setActiveTab(1)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${activeTab === 1 ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}>
            <Clock size={16}/> Pendientes <span className="bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full text-[10px]">{counts.pending}</span>
          </button>
          <button onClick={() => setActiveTab(2)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${activeTab === 2 ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}>
            <Calendar size={16}/> Confirmadas <span className="bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px]">{counts.confirmed}</span>
          </button>
          <button onClick={() => setActiveTab(4)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${activeTab === 4 ? 'border-green-500 text-green-700 bg-green-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}>
            <CheckCircle2 size={16}/> Completadas <span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full text-[10px]">{counts.completed}</span>
          </button>
          <button onClick={() => setActiveTab(5)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${activeTab === 5 ? 'border-red-500 text-red-700 bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}>
            <XCircle size={16}/> Canceladas <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full text-[10px]">{counts.cancelled}</span>
          </button>
      </div>

      {/* Buscador */}
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Buscar por paciente, especialista o notas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-slate-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Fecha Programada</th>
                <th className="px-6 py-4">Motivo / Área</th>
                <th className="px-6 py-4">Especialista</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando citas...</td></tr>
              ) : paginatedAppts.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No se encontraron citas.</td></tr>
              ) : (
                paginatedAppts.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{appt.patient?.firstName} {appt.patient?.lastName}</div>
                      <div className="text-xs text-slate-500">{appt.patient?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2 font-medium">
                          <CalIcon size={14} className="text-slate-400"/> {new Date(appt.appointmentDate).toLocaleDateString()}
                      </div>
                      {appt.statusId !== 1 && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full w-fit">
                              <Clock size={12}/> {new Date(appt.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-1 ${appt.areaId === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                          {appt.areaId === 1 ? 'Psicología' : 'Psiquiatría'}
                      </span>
                      <p className="text-slate-500 text-xs truncate max-w-[150px] italic">{appt.notes || "Sin notas"}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {appt.psychologist ? (
                          <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                  {appt.psychologist.employee.firstName[0]}
                              </div>
                              <span className="text-xs font-medium">Dr. {appt.psychologist.employee.lastName}</span>
                          </div>
                      ) : (
                          <span className="text-orange-400 text-xs italic bg-orange-50 px-2 py-1 rounded">Por asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(appt.statusId)}</td>
                    
                    {/* ACCIONES */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                          <button 
                              onClick={() => { setSelectedAppt(appt); setModalMode('details'); }}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition" 
                              title="Ver Detalles"
                          >
                              <Eye size={18}/>
                          </button>

                          {appt.statusId === 1 && (
                              <Button 
                                  size="sm" 
                                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 h-8 shadow-sm"
                                  onClick={() => {
                                      setSelectedAppt(appt);
                                      setModalMode('assign');
                                      const defaultDate = new Date().toISOString().split('T')[0];
                                      setAssignForm({ psychologistId: '', date: defaultDate, time: '' });
                                  }}
                              >
                                  <UserPlus size={14} className="mr-1 inline"/> Asignar
                              </Button>
                          )}

                          {appt.statusId === 2 && (
                              <button 
                                  onClick={() => {
                                      setSelectedAppt(appt);
                                      setModalMode('reschedule');
                                      const dateStr = new Date(appt.appointmentDate).toISOString().split('T')[0];
                                      setAssignForm({ 
                                          psychologistId: appt.psychologist?.id || '', 
                                          date: dateStr, 
                                          time: '' 
                                      });
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                  title="Reprogramar"
                              >
                                  <Calendar size={18}/>
                              </button>
                          )}

                          {appt.statusId !== 5 && appt.statusId !== 4 && (
                              <button 
                                  onClick={() => handleCancelAppointment(appt.id)}
                                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition" 
                                  title="Cancelar Cita"
                              >
                                  <Trash2 size={18}/>
                              </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Paginación */}
        {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                <span className="text-xs text-slate-500">
                    Mostrando {paginatedAppts.length} de {filteredAppts.length} citas
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 border rounded hover:bg-white disabled:opacity-50"
                    >
                        <ChevronLeft size={16}/>
                    </button>
                    <span className="text-sm text-slate-700">Página {currentPage} de {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 border rounded hover:bg-white disabled:opacity-50"
                    >
                        <ChevronRight size={16}/>
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* ================= MODALES (SE MANTIENEN IGUAL) ================= */}
      
      {/* 1. Detalles */}
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

      {/* 2. Asignación y Reprogramación */}
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

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Especialista</label>
                        <select 
                            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            value={assignForm.psychologistId}
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