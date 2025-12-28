import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { 
  Calendar, Clock, User, Save, ClipboardList, Play, 
  CalendarDays, Pill, Plus, Trash2, Search, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

interface Appointment {
  appointmentId: number;
  date: string;
  statusId: number;
  notes: string;
  hour: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  psychologistId?: number; // Necesario para agendar la siguiente
}

interface Medication {
  id: number;
  name: string;
  presentation: string;
}

interface PrescriptionItem {
  medicationId: number;
  name: string;
  dosage: string;      // ej: 1 tableta
  frequency: string;   // ej: cada 8 horas
  duration: string;    // ej: por 5 días
  instructions: string; // ej: tomar con alimentos
}

interface SessionForm {
  attended: boolean;
  absenceReason?: string;
  topicsDiscussed: string;
  interventions: string;
  patientResponse: string;
  observations: string;
  // Próxima cita
  nextSessionDate: string;
  nextSessionTime: string;
  tasks: { description: string; dueDate: string }[];
}

export const Sesion = ({ onNavigateToOpening, initialAppointment }: { onNavigateToOpening?: (patient: any) => void, initialAppointment?: any }) => {
  const [view, setView] = useState<'agenda' | 'form'>('agenda');
  const [loading, setLoading] = useState(false);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);
  
  // Agenda
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  
  // Sesión Activa
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [clinicalRecordId, setClinicalRecordId] = useState<number | null>(null);

  // Estados Formulario
  const [formData, setFormData] = useState<SessionForm>({
    attended: true,
    topicsDiscussed: '',
    interventions: '',
    patientResponse: '',
    observations: '',
    nextSessionDate: '',
    nextSessionTime: '',
    tasks: []
  });
  const [newTask, setNewTask] = useState({ description: '', dueDate: '' });

  // Estados Receta Médica
  const [medSearch, setMedSearch] = useState('');
  const [medSearchResults, setMedSearchResults] = useState<Medication[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [selectedMedToAdd, setSelectedMedToAdd] = useState<Medication | null>(null);
  const [tempPrescription, setTempPrescription] = useState({ dosage: '', frequency: '', duration: '', instructions: '' });

  // Estados Próxima Cita (Disponibilidad)
  const [busyHours, setBusyHours] = useState<number[]>([]);

  // Estados Modal Reprogramación
  const [reprogramAppt, setReprogramAppt] = useState<Appointment | null>(null);
  const [reprogramForm, setReprogramForm] = useState({ date: '', time: '' });
  const [reprogramBusyHours, setReprogramBusyHours] = useState<number[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (initialAppointment && appointmentsLoaded) {
       handleStartSession(initialAppointment);
    }
  }, [initialAppointment, appointmentsLoaded]);

  // Efecto para buscar medicamentos (Debounce simple)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (medSearch.length > 2) searchMedications();
        else setMedSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [medSearch]);

  // Efecto para disponibilidad de PRÓXIMA CITA en el formulario
  useEffect(() => {
    if (formData.nextSessionDate && currentAppointment) {
        fetchBusyHours(formData.nextSessionDate, currentAppointment.psychologistId || 1, setBusyHours);
    }
  }, [formData.nextSessionDate]);

  // Efecto para disponibilidad en REPROGRAMACIÓN
  useEffect(() => {
    if (reprogramForm.date && reprogramAppt) {
        // Asumimos ID 1 si no viene, o ajusta según tu lógica de usuario logueado
        fetchBusyHours(reprogramForm.date, reprogramAppt.psychologistId || 1, setReprogramBusyHours);
    }
  }, [reprogramForm.date]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/citas/agenda'); 
      const all: Appointment[] = res.data.filter((a: any) => a.statusId === 2); // Solo confirmadas
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayList: Appointment[] = [];
      const upcomingList: Appointment[] = [];

      all.forEach(appt => {
        const apptDate = new Date(appt.date);
        apptDate.setHours(0, 0, 0, 0);

        if (apptDate.getTime() === today.getTime()) todayList.push(appt);
        else if (apptDate.getTime() > today.getTime()) upcomingList.push(appt);
      });

      setTodayAppts(todayList);
      setUpcomingAppts(upcomingList);
      setAppointmentsLoaded(true);
    } catch (error) {
      toast.error("Error cargando agenda");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusyHours = async (date: string, doctorId: number, setState: (h: number[]) => void) => {
    try {
        // Lógica simulada basada en tu dashboard (puedes llamar a tu API real de citas si tienes filtro)
        // Aquí hacemos una llamada general y filtramos en front, idealmente el backend debe filtrar
        const res = await api.get('/citas'); 
        const dateObj = new Date(date);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());

        const occupied = res.data
            .filter((a: any) => {
                if (a.statusId === 5) return false;
                const d = new Date(a.appointmentDate);
                return d.getDate() === dateObj.getDate() && 
                       d.getMonth() === dateObj.getMonth() && 
                       d.getFullYear() === dateObj.getFullYear();
            })
            .map((a: any) => new Date(a.appointmentDate).getHours());
        
        setState(occupied);
    } catch (error) {
        console.error("Error fetch slots");
    }
  };

  const searchMedications = async () => {
    try {
        // Ajusta la ruta a tu endpoint real
        const res = await api.get(`/medications/search?q=${medSearch}`); 
        // Si no tienes endpoint aún, usa datos dummy o el endpoint inventory
        // const res = await api.get('/inventory/products'); y filtra
        setMedSearchResults(res.data || []);
    } catch (error) {
        console.error("Error buscando medicamentos");
    }
  };

  const handleStartSession = async (appt: Appointment) => {
    setLoading(true);
    try {
      const check = await api.get(`/clinical-records/check-status/${appt.patient.id}`);
      if (check.data.hasRecord) {
        setClinicalRecordId(check.data.recordId);
        setCurrentAppointment(appt);
        setView('form');
        setFormData({
            attended: true,
            topicsDiscussed: '',
            interventions: '',
            patientResponse: '',
            observations: '',
            nextSessionDate: '',
            nextSessionTime: '',
            tasks: []
        });
        setPrescriptionItems([]);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.warning("Paciente sin expediente.");
        if(onNavigateToOpening) onNavigateToOpening(appt); 
      } else {
        toast.error("Error al verificar expediente");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE TAREAS ---
  const addTask = () => {
    if (!newTask.description || !newTask.dueDate) return;
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
    setNewTask({ description: '', dueDate: '' });
  };
  const removeTask = (idx: number) => {
    const updated = [...formData.tasks];
    updated.splice(idx, 1);
    setFormData({...formData, tasks: updated});
  };

  // --- LÓGICA DE RECETAS ---
  const addMedication = () => {
      if (!selectedMedToAdd) return;
      const newItem: PrescriptionItem = {
          medicationId: selectedMedToAdd.id,
          name: selectedMedToAdd.name + ' ' + selectedMedToAdd.presentation,
          ...tempPrescription
      };
      setPrescriptionItems([...prescriptionItems, newItem]);
      setSelectedMedToAdd(null);
      setTempPrescription({ dosage: '', frequency: '', duration: '', instructions: '' });
      setMedSearch('');
  };

  const removeMedication = (idx: number) => {
      const updated = [...prescriptionItems];
      updated.splice(idx, 1);
      setPrescriptionItems(updated);
  };

  // --- REPROGRAMACIÓN ---
  const handleReprogramSubmit = async () => {
      if (!reprogramAppt || !reprogramForm.date || !reprogramForm.time) return;
      try {
          const finalDateTime = `${reprogramForm.date}T${reprogramForm.time}:00`;
          await api.patch(`/citas/${reprogramAppt.appointmentId}/reschedule`, { newDate: finalDateTime });
          toast.success("Cita reprogramada");
          setReprogramAppt(null);
          loadAppointments();
      } catch (error) {
          toast.error("Error al reprogramar");
      }
  };

  // --- GUARDAR SESIÓN FINAL ---
  const handleSubmit = async () => {
    if (!clinicalRecordId || !currentAppointment) return;
    
    if (formData.attended && (!formData.topicsDiscussed || !formData.interventions)) {
        return toast.error("Complete los campos clínicos (SOAP) si asistió.");
    }

    setLoading(true);
    try {
        const payload = {
            clinicalRecordId: clinicalRecordId,
            appointmentId: currentAppointment.appointmentId,
            psychologistId: currentAppointment.psychologistId || 1, // Importante para la próxima cita
            attended: formData.attended,
            absenceReason: formData.attended ? null : formData.absenceReason,
            topicsDiscussed: formData.topicsDiscussed,
            interventions: formData.interventions,
            patientResponse: formData.patientResponse,
            observations: formData.observations,
            
            // Próxima Cita Automática
            nextSessionDate: formData.nextSessionDate || null,
            nextSessionTime: formData.nextSessionTime || null,
            
            tasks: formData.tasks,
            
            // Receta Médica
            prescriptionItems: prescriptionItems
        };
        
        await api.post('/sessions', payload);
        toast.success("Sesión, receta y próxima cita registradas.");
        
        setView('agenda');
        setCurrentAppointment(null);
        loadAppointments(); 

    } catch (error: any) {
        toast.error(error.response?.data?.message || "Error al guardar");
    } finally {
        setLoading(false);
    }
  };

  // --- VISTA FORMULARIO ---
  if (view === 'form' && currentAppointment) {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right duration-300 pb-10">
             {/* Header del Paciente */}
             <div className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-200">
                        {currentAppointment.patient.firstName.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {currentAppointment.patient.firstName} {currentAppointment.patient.lastName}
                        </h2>
                        <div className="flex gap-2 text-xs">
                             <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">Sesión en Curso</span>
                             <span className="text-slate-400">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setView('agenda')}>Cancelar</Button>
             </div>

             <div className="grid lg:grid-cols-3 gap-6">
                
                {/* COLUMNA IZQUIERDA: Asistencia + Tareas + Próxima Cita */}
                <div className="space-y-6">
                    {/* Asistencia */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm"><User size={18}/> Asistencia</h3>
                        <div className="flex gap-2">
                            <button className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${formData.attended ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-slate-500 hover:bg-gray-50'}`} onClick={() => setFormData({...formData, attended: true})}>Presente</button>
                            <button className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${!formData.attended ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-500 hover:bg-gray-50'}`} onClick={() => setFormData({...formData, attended: false})}>Ausente</button>
                        </div>
                    </div>

                    {/* Próxima Cita (NUEVO) */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm"><Calendar size={18}/> Agendar Siguiente</h3>
                        <div className="space-y-3">
                            <input 
                                type="date"
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.nextSessionDate}
                                onChange={(e) => setFormData({...formData, nextSessionDate: e.target.value, nextSessionTime: ''})}
                            />
                            {/* Grid Horario */}
                            {formData.nextSessionDate && (
                                <div className="grid grid-cols-4 gap-1.5 pt-2">
                                    {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => {
                                        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                        const isBusy = busyHours.includes(hour);
                                        const isSelected = formData.nextSessionTime === timeStr;
                                        return (
                                            <button
                                                key={hour}
                                                disabled={isBusy}
                                                onClick={() => setFormData({...formData, nextSessionTime: timeStr})}
                                                className={`text-xs py-1.5 rounded border transition-all
                                                    ${isBusy ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-100' : 
                                                      isSelected ? 'bg-teal-600 text-white border-teal-600 font-bold' : 
                                                      'bg-white hover:border-teal-400 text-slate-600'}
                                                `}
                                            >
                                                {timeStr}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tareas */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm"><CheckCircle2 size={18}/> Tareas / Compromisos</h3>
                        <div className="space-y-2 mb-3">
                             {formData.tasks.map((t, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border">
                                     <span>{t.description} ({new Date(t.dueDate).toLocaleDateString()})</span>
                                     <button onClick={() => removeTask(idx)} className="text-red-400 hover:text-red-600"><XCircle size={14}/></button>
                                 </div>
                             ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <input className="p-2 border rounded text-xs outline-none focus:border-teal-500" placeholder="Tarea..." value={newTask.description} onChange={e=>setNewTask({...newTask, description: e.target.value})}/>
                            <div className="flex gap-2">
                                <input type="date" className="flex-1 p-2 border rounded text-xs outline-none" value={newTask.dueDate} onChange={e=>setNewTask({...newTask, dueDate: e.target.value})}/>
                                <Button size="sm" onClick={addTask} className="h-full py-0">Add</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA CENTRAL: Nota Clínica */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 h-fit">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2"><ClipboardList/> Nota Clínica (SOAP)</h3>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">S (Subjetivo) - Temas</label>
                        <textarea className="w-full p-3 border rounded-lg h-24 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" 
                            value={formData.topicsDiscussed} onChange={e=>setFormData({...formData, topicsDiscussed: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">O (Objetivo) - Intervenciones</label>
                        <textarea className="w-full p-3 border rounded-lg h-24 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" 
                            value={formData.interventions} onChange={e=>setFormData({...formData, interventions: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">A (Análisis) - Respuesta</label>
                        <textarea className="w-full p-3 border rounded-lg h-24 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" 
                            value={formData.patientResponse} onChange={e=>setFormData({...formData, patientResponse: e.target.value})}/>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Recetario (NUEVO) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 h-fit">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2"><Pill/> Receta Médica</h3>
                    
                    {/* Buscador */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Buscar medicamento..."
                            className="w-full pl-9 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={medSearch}
                            onChange={(e) => setMedSearch(e.target.value)}
                        />
                        {/* Resultados Flotantes */}
                        {medSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border shadow-lg rounded-b-lg z-20 max-h-40 overflow-y-auto">
                                {medSearchResults.map(med => (
                                    <button 
                                        key={med.id}
                                        className="w-full text-left p-2 hover:bg-blue-50 text-xs border-b"
                                        onClick={() => { setSelectedMedToAdd(med); setMedSearchResults([]); }}
                                    >
                                        <span className="font-bold">{med.name}</span> <span className="text-gray-500">{med.presentation}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Formulario de Medicamento Seleccionado */}
                    {selectedMedToAdd && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm space-y-2 animate-in fade-in">
                            <p className="font-bold text-blue-800">{selectedMedToAdd.name}</p>
                            <input placeholder="Dosis (ej: 1 tab)" className="w-full p-1.5 border rounded text-xs" value={tempPrescription.dosage} onChange={e=>setTempPrescription({...tempPrescription, dosage: e.target.value})}/>
                            <div className="flex gap-2">
                                <input placeholder="Frecuencia" className="w-1/2 p-1.5 border rounded text-xs" value={tempPrescription.frequency} onChange={e=>setTempPrescription({...tempPrescription, frequency: e.target.value})}/>
                                <input placeholder="Duración" className="w-1/2 p-1.5 border rounded text-xs" value={tempPrescription.duration} onChange={e=>setTempPrescription({...tempPrescription, duration: e.target.value})}/>
                            </div>
                            <input placeholder="Instrucciones (ej: con comida)" className="w-full p-1.5 border rounded text-xs" value={tempPrescription.instructions} onChange={e=>setTempPrescription({...tempPrescription, instructions: e.target.value})}/>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => setSelectedMedToAdd(null)} variant="outline" className="flex-1 bg-white">Cancelar</Button>
                                <Button size="sm" onClick={addMedication} className="flex-1">Agregar</Button>
                            </div>
                        </div>
                    )}

                    {/* Lista de Recetados */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {prescriptionItems.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">No se han recetado medicamentos.</p>
                        ) : (
                            prescriptionItems.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded border flex justify-between group">
                                    <div className="text-xs">
                                        <p className="font-bold text-slate-700">{item.name}</p>
                                        <p className="text-slate-500">{item.dosage} • {item.frequency} • {item.duration}</p>
                                        {item.instructions && <p className="text-slate-400 italic">"{item.instructions}"</p>}
                                    </div>
                                    <button onClick={() => removeMedication(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
             </div>

             {/* Footer Botón Guardar */}
             <div className="flex justify-end pt-4 border-t">
                 <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transform hover:-translate-y-0.5 transition-all"
                 >
                    <Save className="mr-2" size={18}/> Finalizar Sesión
                 </Button>
             </div>
        </div>
    );
  }

  // --- VISTA AGENDA ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Agenda Clínica</h2>
                <p className="text-slate-500">Gestione sus sesiones y pacientes asignados.</p>
            </div>
            <Button variant="outline" onClick={loadAppointments}>Actualizar</Button>
        </div>

        {loading && !appointmentsLoaded ? (
            <div className="text-center py-20 text-slate-400">Cargando agenda...</div>
        ) : (
            <>
                {/* HOY */}
                <section>
                    <h3 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse shadow-teal-200 shadow-lg"></div>
                        Citas de Hoy ({todayAppts.length})
                    </h3>
                    
                    {todayAppts.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200 text-slate-400">
                            No hay pacientes programados para hoy.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {todayAppts.map((appt) => (
                                <AppointmentCard 
                                    key={appt.appointmentId} 
                                    appt={appt} 
                                    onStart={() => handleStartSession(appt)} 
                                    onReprogram={() => { setReprogramAppt(appt); setReprogramForm({ date: '', time: '' }); }}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* PRÓXIMAS */}
                <section className="pt-8">
                    <h3 className="text-lg font-bold text-slate-600 mb-4 flex items-center gap-2">
                        <CalendarDays size={18}/> Próximas Sesiones ({upcomingAppts.length})
                    </h3>
                    
                    {upcomingAppts.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">No hay citas futuras.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                            {upcomingAppts.map((appt) => (
                                <AppointmentCard 
                                    key={appt.appointmentId} 
                                    appt={appt} 
                                    onStart={() => handleStartSession(appt)} 
                                    onReprogram={() => { setReprogramAppt(appt); setReprogramForm({ date: '', time: '' }); }}
                                    isFuture 
                                />
                            ))}
                        </div>
                    )}
                </section>
            </>
        )}

        {/* MODAL REPROGRAMACIÓN */}
        {reprogramAppt && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">Reprogramar Cita</h3>
                        <button onClick={() => setReprogramAppt(null)}><XCircle className="text-slate-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <input 
                            type="date" 
                            className="w-full p-2 border rounded-lg" 
                            min={new Date().toISOString().split('T')[0]}
                            value={reprogramForm.date}
                            onChange={e => setReprogramForm({...reprogramForm, date: e.target.value, time: ''})}
                        />
                         {reprogramForm.date && (
                             <div>
                                 <p className="text-xs font-bold text-slate-500 mb-2">Horarios Disponibles (07:00 - 18:00)</p>
                                 <div className="grid grid-cols-4 gap-2">
                                     {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => {
                                         const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                         const isBusy = reprogramBusyHours.includes(hour);
                                         return (
                                             <button
                                                 key={hour}
                                                 disabled={isBusy}
                                                 onClick={() => setReprogramForm({...reprogramForm, time: timeStr})}
                                                 className={`text-xs py-2 rounded border ${isBusy ? 'bg-red-50 text-red-300' : reprogramForm.time === timeStr ? 'bg-slate-800 text-white' : 'hover:border-teal-500'}`}
                                             >
                                                 {timeStr}
                                             </button>
                                         )
                                     })}
                                 </div>
                             </div>
                         )}
                         <Button fullWidth onClick={handleReprogramSubmit} disabled={!reprogramForm.time}>Confirmar Cambio</Button>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

const AppointmentCard = ({ appt, onStart, onReprogram, isFuture }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isFuture ? 'bg-indigo-400' : 'bg-teal-500'}`}></div>
        
        <div className="flex justify-between items-start mb-3 pl-2">
            <div>
                <h4 className="font-bold text-slate-800 text-lg">{appt.patient.firstName} {appt.patient.lastName}</h4>
                <p className="text-xs text-slate-500 truncate max-w-[180px]">{appt.patient.email}</p>
            </div>
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <Clock size={12}/> {appt.hour || new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
        
        {isFuture && (
             <div className="pl-2 mb-2 text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Calendar size={12}/> {new Date(appt.date).toLocaleDateString()}
             </div>
        )}

        <div className="pl-2 mb-4 h-10">
             <p className="text-sm text-slate-500 line-clamp-2 bg-gray-50/50 p-1.5 rounded italic">
                "{appt.notes || 'Sin notas adicionales'}"
             </p>
        </div>
        
        <div className="pl-2 flex gap-2">
             <Button fullWidth onClick={onStart} className={isFuture ? 'bg-slate-700 hover:bg-slate-800' : 'bg-teal-600 hover:bg-teal-700'}>
                <Play size={16} className="mr-2"/> {isFuture ? 'Adelantar' : 'Iniciar'}
             </Button>
             <button 
                onClick={onReprogram}
                className="px-3 border border-gray-200 rounded-lg hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 text-slate-400 transition-colors" 
                title="Reprogramar"
             >
                <Calendar size={18}/>
             </button>
        </div>
    </div>
);