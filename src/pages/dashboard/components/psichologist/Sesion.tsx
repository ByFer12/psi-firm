import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { 
  Calendar, Clock, User, FileText, 
  Save, ListTodo, ClipboardList, Play, CalendarDays 
} from 'lucide-react';
import { toast } from 'react-toastify';

// 1. CORRECCIÓN DE LA INTERFAZ (Según tu JSON real)
interface Appointment {
  appointmentId: number; // Antes era id
  date: string;          // Antes era appointmentDate
  statusId: number;
  notes: string;
  hour: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
  };
}

// ... Interface SessionForm se mantiene igual ...
interface SessionForm {
  attended: boolean;
  absenceReason?: string;
  topicsDiscussed: string;
  interventions: string;
  patientResponse: string;
  observations: string;
  nextSessionDate?: string;
  tasks: { description: string; dueDate: string }[];
}

export const Sesion = ({ onNavigateToOpening, initialAppointment }: { onNavigateToOpening?: (patient: any) => void, initialAppointment?: any }) => {
  const [view, setView] = useState<'agenda' | 'form'>('agenda');
  const [loading, setLoading] = useState(false);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);
  
  // Agenda Separada
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]); // Cambiado a "Próximas"
  
  
  // Sesión Activa
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [clinicalRecordId, setClinicalRecordId] = useState<number | null>(null);

  const [formData, setFormData] = useState<SessionForm>({
    attended: true,
    topicsDiscussed: '',
    interventions: '',
    patientResponse: '',
    observations: '',
    tasks: []
  });
  const [newTask, setNewTask] = useState({ description: '', dueDate: '' });

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (initialAppointment && appointmentsLoaded) {
       handleStartSession(initialAppointment);
    }
  }, [initialAppointment, appointmentsLoaded]);

  // 2. CORRECCIÓN DE LA LÓGICA DE CARGA
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/citas/agenda'); 
      console.log("Datos recibidos:", res.data); // Para depuración

      // Filtramos solo las confirmadas (statusId 2)
      const all: Appointment[] = res.data.filter((a: any) => a.statusId === 2);
      
      const today = new Date();
      // Normalizamos 'today' a inicio del día para comparar bien
      today.setHours(0, 0, 0, 0);

      const todayList: Appointment[] = [];
      const upcomingList: Appointment[] = [];

      all.forEach(appt => {
        // Convertimos la fecha que viene de la API
        const apptDate = new Date(appt.date);
        apptDate.setHours(0, 0, 0, 0); // Normalizamos para comparar solo fechas

        if (apptDate.getTime() === today.getTime()) {
            todayList.push(appt);
        } else if (apptDate.getTime() > today.getTime()) {
            upcomingList.push(appt);
        }
        // Las pasadas las ignoramos aquí
      });

      setTodayAppts(todayList);
      setUpcomingAppts(upcomingList);
      setAppointmentsLoaded(true);

    } catch (error) {
      console.error("Error cargando agenda", error);
      toast.error("Error al cargar la agenda");
    } finally {
      setLoading(false);
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
        // Reset form...
        setFormData({
            attended: true,
            topicsDiscussed: '',
            interventions: '',
            patientResponse: '',
            observations: '',
            tasks: []
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.warning("Paciente sin expediente. Redirigiendo a apertura...");
        if(onNavigateToOpening) onNavigateToOpening(appt); 
      } else {
        toast.error("Error al verificar expediente");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ... (Funciones addTask, removeTask, handleSubmit se mantienen IGUALES) ...
const addTask = () => {
    if (!newTask.description) return;
    if (!newTask.dueDate) return toast.warning("La tarea debe tener fecha límite"); // Validación
    
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
    setNewTask({ description: '', dueDate: '' });
};
  const removeTask = (idx: number) => {
    const updated = [...formData.tasks];
    updated.splice(idx, 1);
    setFormData({...formData, tasks: updated});
  };

  const handleSubmit = async () => {
    if (!clinicalRecordId || !currentAppointment) return;
    
    if (formData.attended && (!formData.topicsDiscussed || !formData.interventions)) {
        return toast.error("Debe completar los campos clínicos si el paciente asistió.");
    }

    setLoading(true);
    try {
        // --- LIMPIEZA DE DATOS AQUÍ ---
        const payload = {
            clinicalRecordId: clinicalRecordId,
            appointmentId: currentAppointment.appointmentId,
            attended: formData.attended,
            absenceReason: formData.attended ? null : formData.absenceReason,
            topicsDiscussed: formData.topicsDiscussed,
            interventions: formData.interventions,
            patientResponse: formData.patientResponse,
            observations: formData.observations,
            
            // 1. Si el string está vacío, enviamos null
            nextSessionDate: formData.nextSessionDate ? formData.nextSessionDate : null,
            
            // 2. Limpiamos también las fechas de las tareas
            tasks: formData.tasks.map(t => ({
                description: t.description,
                dueDate: t.dueDate ? t.dueDate : null // Convertir "" a null
            }))
        };
         console.log("Lo que se va a enviar ", payload)
        const res=await api.post('/sessions', payload);
        console.log("repuesta de envio e datos: ", res.data)
        toast.success("Sesión registrada exitosamente");
        
        setView('agenda');
        setCurrentAppointment(null);
        loadAppointments(); 

    } catch (error: any) {
        console.error("Error saving session:", error);
        toast.error(error.response?.data?.message || "Error al guardar");
    } finally {
        setLoading(false);
    }
  };

  // --- VISTA FORMULARIO ---
  if (view === 'form' && currentAppointment) {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
             <div className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        {currentAppointment.patient.firstName.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {currentAppointment.patient.firstName} {currentAppointment.patient.lastName}
                        </h2>
                        <p className="text-sm text-slate-500">Sesión del {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setView('agenda')}>Cancelar</Button>
             </div>

             <div className="grid md:grid-cols-3 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={20}/> Asistencia</h3>
                        <div className="flex gap-2 mb-4">
                            <button className={`flex-1 py-2 rounded-lg border text-sm font-medium ${formData.attended ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white'}`} onClick={() => setFormData({...formData, attended: true})}>Sí</button>
                            <button className={`flex-1 py-2 rounded-lg border text-sm font-medium ${!formData.attended ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white'}`} onClick={() => setFormData({...formData, attended: false})}>No</button>
                        </div>
                    </div>
                     <div className="space-y-2 pt-2 border-t border-gray-100">
                            <input 
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                                placeholder="Descripción de la tarea..." 
                                value={newTask.description} 
                                onChange={e=>setNewTask({...newTask, description: e.target.value})}
                            />
                            
                            <div className="flex gap-2">
                                <input 
                                    type="date"
                                    className="flex-1 p-2 border rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={newTask.dueDate}
                                    min={new Date().toISOString().split('T')[0]} // Evita fechas pasadas
                                    onChange={e=>setNewTask({...newTask, dueDate: e.target.value})}
                                />
                                <Button size="sm" onClick={addTask} type="button">
                                    Agregar
                                </Button>
                            </div>
                        </div>
                   
                </div>

                {/* Columna Derecha - Notas */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex gap-2"><ClipboardList/> Nota Clínica (SOAP)</h3>
                    <textarea placeholder="Temas Abordados (Subjetivo)..." className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-teal-500 outline-none" 
                        value={formData.topicsDiscussed} onChange={e=>setFormData({...formData, topicsDiscussed: e.target.value})}/>
                    <textarea placeholder="Intervenciones Terapéuticas (Objetivo)..." className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-teal-500 outline-none" 
                        value={formData.interventions} onChange={e=>setFormData({...formData, interventions: e.target.value})}/>
                    <textarea placeholder="Respuesta del Paciente (Análisis)..." className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-teal-500 outline-none" 
                        value={formData.patientResponse} onChange={e=>setFormData({...formData, patientResponse: e.target.value})}/>
                    
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSubmit} disabled={loading} className="px-8"><Save className="mr-2" size={18}/> Guardar Sesión</Button>
                    </div>
                </div>
             </div>
        </div>
    );
  }

  // --- VISTA AGENDA ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b pb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Agenda Clínica</h2>
                <p className="text-slate-500">Gestione sus sesiones programadas.</p>
            </div>
            <Button variant="outline" onClick={loadAppointments}>Actualizar Lista</Button>
        </div>

        {loading && !appointmentsLoaded ? (
            <div className="text-center py-20 text-slate-400">Cargando agenda...</div>
        ) : (
            <>
                {/* SECCIÓN HOY */}
                <section>
                    <h3 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                        Citas de Hoy ({todayAppts.length})
                    </h3>
                    
                    {todayAppts.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-slate-400">
                            No hay citas pendientes para hoy.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {todayAppts.map((appt) => (
                                <AppointmentCard key={appt.appointmentId} appt={appt} onStart={() => handleStartSession(appt)} />
                            ))}
                        </div>
                    )}
                </section>

                {/* SECCIÓN PRÓXIMAS (Incluye mañana y posteriores) */}
                <section>
                    <h3 className="text-lg font-bold text-slate-600 mb-4 flex items-center gap-2 mt-8">
                        <CalendarDays size={18}/> Próximas Sesiones ({upcomingAppts.length})
                    </h3>
                    
                    {upcomingAppts.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">No hay citas futuras programadas.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                            {upcomingAppts.map((appt) => (
                                <AppointmentCard key={appt.appointmentId} appt={appt} onStart={() => handleStartSession(appt)} isFuture />
                            ))}
                        </div>
                    )}
                </section>
            </>
        )}
    </div>
  );
};

// 3. ACTUALIZACIÓN DEL CARD PARA USAR LOS CAMPOS CORRECTOS
const AppointmentCard = ({ appt, onStart, isFuture }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1 h-full ${isFuture ? 'bg-indigo-400' : 'bg-teal-500'}`}></div>
        
        <div className="flex justify-between items-start mb-3 pl-2">
            <div>
                <h4 className="font-bold text-slate-800 text-lg">{appt.patient.firstName} {appt.patient.lastName}</h4>
                <p className="text-xs text-slate-500 truncate max-w-[180px]">{appt.patient.email}</p>
            </div>
            {/* Usamos appt.hour si viene formateada, o formateamos appt.date */}
            <span className="bg-gray-100 text-slate-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                <Clock size={12}/> {appt.hour || new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
        
        {/* Mostrar fecha si es futura */}
        {isFuture && (
             <div className="pl-2 mb-2 text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Calendar size={12}/> {new Date(appt.date).toLocaleDateString()}
             </div>
        )}

        <div className="pl-2 mb-4 h-12">
             <p className="text-sm text-slate-600 line-clamp-2 bg-gray-50 p-2 rounded italic h-full">
                "{appt.notes || 'Sin notas'}"
             </p>
        </div>
        
        <div className="pl-2 flex gap-2">
             <Button fullWidth onClick={onStart} className={isFuture ? 'bg-slate-700 hover:bg-slate-800' : 'bg-teal-600 hover:bg-teal-700'}>
                <Play size={16} className="mr-2"/> {isFuture ? 'Adelantar' : 'Iniciar'}
             </Button>
             <button className="px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-500" title="Reprogramar">
                <Calendar size={16}/>
             </button>
        </div>
    </div>
);