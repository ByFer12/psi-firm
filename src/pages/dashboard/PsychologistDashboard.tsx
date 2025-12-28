import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, Users, ClipboardPlus, Calendar, 
  LogOut, Clock, Calendar as CalIcon, UserPlus, XCircle, 
  FileText, Eye, CalendarClock, AlertCircle, RefreshCw, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/UI/Button'; // Ajusta tu ruta
import { toast } from 'react-toastify';

// Componentes Hijos
import { ClinicalOpening } from './components/psichologist/ClinicalOpening';
import { Patients } from './components/psichologist/Patients';
import { Sesion } from './components/psichologist/Sesion';
import { PsychologistHome } from './components/psichologist/PsychologistHome'; 
import { PsychologistAgenda } from './components/psichologist/PsychologistAgenda'; 

export const PsychologistDashboard = () => {
  const { user, logout } = useAuth();
  
  // Navegación principal
  const [activeTab, setActiveTab] = useState<'inicio' | 'pacientes' |'sesion' | 'apertura' | 'agenda'>('inicio');
  
  // Estado para controlar si vemos la TABLA o el FORMULARIO en la pestaña "Apertura"
  // 'list' = Tabla de pacientes, 'form' = Formulario de ClinicalOpening
  const [aperturaView, setAperturaView] = useState<'list' | 'form'>('list');

  // Datos
  const [appointments, setAppointments] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS DE MODALES (Popups) ---
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'reschedule' | null>(null);
  
  // Formulario de reprogramación
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [busyHours, setBusyHours] = useState<number[]>([]); 
  const [userr,setUserr]= useState({});
  const [actives,setActives]= useState(Number);

  // Estado para auto-iniciar sesión (cuando vienes de apertura)
  const [autoStartSessionAppt, setAutoStartSessionAppt] = useState<any>(null);
const [patientsList, setPatientsList] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    profile();
    loadMyPatients()
    activos()
  }, []);



    const loadMyPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clinical/psychologists/my-patients'); 
      const listaDPacientes= res.data
      const totalActivos:number= listaDPacientes.filter(p=>p.status==="ACTIVE").length;
      setActives(totalActivos)
      console.log("Resultado de pacienteeees: ",listaDPacientes)
      setPatientsList(res.data);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setLoading(false);
    }
  };
    const activos=()=>{
    
     const totalActivos:number= patientsList.filter(patient=>patient.status==="ACTIVE").length;
     console.log("PACIENTES ACTIVOS: ", totalActivos);
     
    }
  // Calcular horas ocupadas cuando cambia la fecha en el modal de reprogramación
  useEffect(() => {
    if (modalMode === 'reschedule' && rescheduleForm.date) {
        calculateBusyHours();
    }
  }, [rescheduleForm.date, appointments, modalMode]);


  const profile=async()=>{
    const res = await api.get("/profile/me");
    console.log("Perfillllllllllllllllllllllllllllll: ", res.data.firstName);
    setUserr(res.data)

  }

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar citas (ajusta el endpoint si necesitas filtrar por ID de doctor en el backend)
      const res = await api.get("/citas"); 
      console.log("Citaaaaaaaaaaaaas: ",res.data)
      setAppointments(res.data);
    } catch (error) {
      console.error("Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica del Modal de Reprogramación (Grid de Horas) ---
  const calculateBusyHours = () => {
    const selectedDateObj = new Date(rescheduleForm.date);
    // Ajuste zona horaria simple
    selectedDateObj.setMinutes(selectedDateObj.getMinutes() + selectedDateObj.getTimezoneOffset());

    const occupied = appointments
        .filter(appt => {
            // Solo considerar citas confirmadas o pendientes, y que NO sean la cita que estamos editando
            if (appt.statusId === 5) return false; // Ignorar canceladas
            if (appt.id === selectedAppt?.id) return false; // Ignorar la cita actual (porque la vamos a mover)
            
            // Verificar si es del mismo doctor (asumiendo que user.employeeId es el doctor)
            // Si el endpoint trae todas las citas, filtra por doctor aquí:
            // if (appt.psychologistId !== user.employeeId) return false;

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

  const isWeekend = (dateString: string) => {
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    const day = d.getDay();
    return day === 6 || day === 0; 
  };

  // --- ACCIONES ---

  // 1. Abrir Modal Detalles
  const handleOpenDetails = (appt: any) => {
      setSelectedAppt(appt);
      setModalMode('details');
  };

  // 2. Abrir Modal Reprogramar
  const handleOpenReschedule = (appt: any) => {
      setSelectedAppt(appt);
      setModalMode('reschedule');
      // Pre-llenar fecha actual
      const d = new Date(appt.appointmentDate);
      const dateStr = d.toISOString().split('T')[0];
      setRescheduleForm({ date: dateStr, time: '' });
  };

  // 3. Enviar Reprogramación
  const handleRescheduleSubmit = async () => {
      if (!selectedAppt || !rescheduleForm.date || !rescheduleForm.time) return;
      try {
          const finalDateTime = `${rescheduleForm.date}T${rescheduleForm.time}:00`;
          await api.patch(`/citas/${selectedAppt.id}/reschedule`, {
              newDate: finalDateTime
          });
          toast.success("Cita reprogramada con éxito");
          closeModal(); // Cierra el modal y se queda en la vista actual
          loadData();   // Recarga datos
      } catch (error: any) {
          toast.error(error.response?.data?.message || "Error al reprogramar");
      }
  };

  // 4. Ir a Aperturar Expediente
  const handleGoToApertura = (appt: any) => {
      setSelectedAppt(appt);
      setAperturaView('form'); // Cambiamos la vista interna a Formulario
      // Nota: activeTab sigue siendo 'apertura' si ya estábamos ahí, o cambiamos:
      if (activeTab !== 'apertura') setActiveTab('apertura');
  };

  const closeModal = () => {
      setModalMode(null);
      // No reseteamos selectedAppt aquí si estamos en view 'form', 
      // pero si es solo modal, podemos limpiar:
      if (aperturaView !== 'form') {
         setSelectedAppt(null);
      }
      setRescheduleForm({ date: '', time: '' });
  };

  // Filtrado de citas para la tabla (Solo pendientes o confirmadas)
  const filteredAppointments = appointments.filter((app: any) => 
       (app.statusId === 1 || app.statusId === 2) &&
       (app.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.patient?.identification?.includes(searchTerm))
    );

  // --- RENDERIZADO DE CONTENIDO ---
  const renderContent = () => {
    switch(activeTab) {
      case 'inicio':
        const todayCount = appointments.filter(a => {
            const d = new Date(a.appointmentDate);
            const today = new Date();
            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && a.statusId !== 5;
        }).length;
        
        return (
            <div className="max-w-6xl mx-auto">
                <PsychologistHome 
                    user={userr} 
                    stats={{ todayCount, activePatients: actives }}
                    onNavigate={(tab: any) => setActiveTab(tab)}
                />
            </div>
        );

      case 'agenda':
        return (
             <div className="max-w-6xl mx-auto h-[calc(100vh-140px)]">
                <PsychologistAgenda 
                    appointments={appointments}
                    onSelectAppointment={handleOpenDetails}
                />
             </div>
        );

      case 'apertura':
        // VISTA A: Formulario de Apertura
        if (aperturaView === 'form' && selectedAppt) {
            return (
              <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Button variant="ghost" onClick={() => { setAperturaView('list'); setSelectedAppt(null); }}>
                    ← Volver a la lista
                </Button>
                <ClinicalOpening
                  patientId={selectedAppt.patient.id}
                  psychologistId={user?.employeeId || 1}
                  patientName={`${selectedAppt.patient.firstName} ${selectedAppt.patient.lastName}`}
                  onSuccess={() => {
                    setAperturaView('list');
                    setSelectedAppt(null);
                    setActiveTab('sesion'); // Ir a sesiones al terminar
                  }}
                  onStartNow={() => {
                    setAutoStartSessionAppt(selectedAppt);
                    setAperturaView('list');
                    setSelectedAppt(null);
                    setActiveTab('sesion');
                  }}
                />
              </div>
            );
        }

        // VISTA B: Tabla de Pacientes (Por defecto)
        return (
          <div className="max-w-6xl mx-auto space-y-6">
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Expedientes Pendientes</h2>
                    <p className="text-sm text-slate-500">Pacientes agendados sin historial clínico activo.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      className="px-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline" onClick={loadData}><RefreshCw size={16}/></Button>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-slate-600 font-semibold border-b">
                       <tr>
                         <th className="p-4">Fecha Cita</th>
                         <th className="p-4">Paciente</th>
                         <th className="p-4">Motivo</th>
                         <th className="p-4 text-center">Estado</th>
                         <th className="p-4 text-center">Acciones</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {loading ? (
                           <tr><td colSpan={5} className="p-10 text-center text-slate-500">Cargando datos...</td></tr>
                       ) : filteredAppointments.length === 0 ? (
                           <tr><td colSpan={5} className="p-10 text-center text-slate-400">No se encontraron citas pendientes.</td></tr>
                       ) : (
                           filteredAppointments.map((app: any) => (
                             <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4">
                                 <div className="font-medium flex items-center gap-2">
                                     <Calendar size={14} className="text-teal-600"/>
                                     {new Date(app.appointmentDate).toLocaleDateString()}
                                 </div>
                                 <div className="text-xs text-slate-400 mt-1 pl-6">
                                     {new Date(app.appointmentDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 </div>
                               </td>
                               <td className="p-4">
                                 <div className="font-bold text-slate-800">{app.patient?.firstName} {app.patient?.lastName}</div>
                                 <div className="text-xs text-slate-500">{app.patient?.identification}</div>
                               </td>
                               <td className="p-4">
                                 <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                     {app.patient?.consultationReason || "General"}
                                 </span>
                               </td>
                               <td className="p-4 text-center">
                                   {app.statusId === 1 
                                     ? <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Pendiente</span>
                                     : <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Confirmada</span>
                                   }
                               </td>
                               <td className="p-4">
                                 <div className="flex justify-center gap-2">
                                   <button 
                                     onClick={() => handleOpenDetails(app)} 
                                     className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                     title="Ver Detalles"
                                   >
                                     <Eye size={18}/>
                                   </button>
                                   <button 
                                     onClick={() => handleOpenReschedule(app)}
                                     className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                                     title="Reprogramar"
                                   >
                                     <Calendar size={18}/>
                                   </button>
                                   <Button 
                                     size="sm" 
                                     className="bg-teal-600 hover:bg-teal-700 text-xs px-3 h-9"
                                     onClick={() => handleGoToApertura(app)}
                                   >
                                     <ClipboardPlus size={14} className="mr-1"/> Aperturar
                                   </Button>
                                 </div>
                               </td>
                             </tr>
                           ))
                       )}
                     </tbody>
                   </table>
               </div>
             </div>
          </div>
        );

      case 'pacientes':
        return <div className="max-w-6xl mx-auto"><Patients patientsList={patientsList} /></div>;

      case 'sesion':
        return (
          <div className="max-w-6xl mx-auto">
            <Sesion 
               initialAppointment={autoStartSessionAppt}
               onNavigateToOpening={(appt) => handleGoToApertura(appt)} 
            />
          </div>
        );

      default: return null;
    }
  };

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'agenda', label: 'Mi Agenda', icon: Calendar },
    { id: 'apertura', label: 'Aperturas', icon: ClipboardPlus },
    { id: 'sesion', label: 'Sesiones', icon: CalendarClock },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-slate-600">
      {/* Sidebar fijo (ancho fijo) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-full z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <span className="text-xl font-bold text-teal-400 tracking-tight flex items-center gap-2">
            PsiFirm <span className="text-[10px] bg-slate-800 text-teal-400 px-2 py-1 rounded-full border border-teal-900/50">PRO</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                  setActiveTab(item.id as any); 
                  setAperturaView('list'); // Reset view al cambiar tab
                  setSelectedAppt(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/10 rounded-xl transition-colors">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-10 px-6 md:px-8 flex items-center justify-between shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-slate-700">Dr. {userr?.firstName}</p>
                   <p className="text-[10px] uppercase text-teal-600 font-bold tracking-wider">Especialista</p>
               </div>
               <div className="w-9 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold">
                 {user?.username?.substring(0,2).toUpperCase()}
               </div>
            </div>
        </header>

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
             {renderContent()}
        </main>
      </div>

      {/* ================= MODAL DETALLES ================= */}
      {modalMode === 'details' && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600"/> Detalles de la Cita
                    </h3>
                    <button onClick={closeModal}><XCircle className="text-slate-400 hover:text-red-500 transition-colors" size={22}/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl">
                            {selectedAppt.patient.firstName[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{selectedAppt.patient.firstName} {selectedAppt.patient.lastName}</h2>
                            <p className="text-slate-500 text-sm flex items-center gap-1"><span className="text-xs bg-slate-100 px-1 rounded">ID</span> {selectedAppt.patient.identification}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                            <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Fecha Programada</p>
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                                <CalIcon size={16} className="text-blue-500"/>
                                {new Date(selectedAppt.appointmentDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                            <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Hora</p>
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                                <Clock size={16} className="text-blue-500"/>
                                {new Date(selectedAppt.appointmentDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-2">Motivo / Notas</p>
                        <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm border border-slate-100">
                            "{selectedAppt.notes || selectedAppt.patient.consultationReason || "Sin notas adicionales"}"
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button className="bg-slate-800 hover:bg-slate-900 text-white w-full" onClick={closeModal}>Cerrar</Button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* ================= MODAL REPROGRAMAR (Estilo Admin Grid) ================= */}
      {modalMode === 'reschedule' && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5 pb-3 border-b">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Reprogramar Cita</h3>
                        <p className="text-xs text-slate-400">Seleccione nueva fecha y horario disponible</p>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><XCircle size={24}/></button>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-5 flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18}/>
                    <div className="text-xs text-amber-800">
                        Está moviendo la cita de <strong>{selectedAppt.patient.firstName}</strong>.<br/> 
                        Fecha actual: {new Date(selectedAppt.appointmentDate).toLocaleString()}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Selector de Fecha */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Seleccione Nueva Fecha</label>
                        <input 
                            type="date" 
                            className="w-full border p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-700"
                            min={new Date().toISOString().split('T')[0]}
                            value={rescheduleForm.date}
                            onChange={(e) => {
                                setRescheduleForm({...rescheduleForm, date: e.target.value, time: ''});
                                if (isWeekend(e.target.value)) toast.warning("Has seleccionado fin de semana.");
                            }}
                        />
                    </div>

                    {/* Grid de Horarios */}
                    {rescheduleForm.date && !isWeekend(rescheduleForm.date) && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-slate-700 mb-3 flex justify-between">
                                Horarios Disponibles
                                <span className="text-xs font-normal text-slate-400">(07:00 - 18:00)</span>
                            </label>
                            
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => {
                                    const isBusy = busyHours.includes(hour);
                                    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                    const isSelected = rescheduleForm.time === timeStr;
                                    const isBreak = [8, 10, 13, 15].includes(hour);

                                    return (
                                        <button
                                            key={hour}
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => setRescheduleForm({...rescheduleForm, time: timeStr})}
                                            className={`
                                                relative py-2.5 px-1 rounded-lg text-sm font-bold transition-all border
                                                ${isBusy 
                                                    ? 'bg-red-50 border-red-100 text-red-300 cursor-not-allowed opacity-60 decoration-dashed'
                                                    : isSelected
                                                        ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-105 z-10'
                                                        : isBreak
                                                            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            {timeStr}
                                            {/* Indicador de break */}
                                            {isBreak && !isBusy && !isSelected && (
                                                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                            )}
                                             {/* Icono de Check si seleccionado */}
                                            {isSelected && <CheckCircle2 size={12} className="absolute top-1 right-1 text-teal-400"/>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Leyenda */}
                            <div className="flex gap-3 mt-3 text-[10px] text-slate-500 justify-center">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 border rounded bg-white"></div> Libre</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 border border-amber-200 rounded bg-amber-50"></div> Comida/Refa</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 border border-red-100 rounded bg-red-50"></div> Ocupado</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Botones de Acción */}
                    <div className="flex gap-3 pt-6 border-t mt-4">
                        <Button variant="outline" className="flex-1" onClick={closeModal}>Cancelar</Button>
                        <Button 
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={handleRescheduleSubmit}
                            disabled={!rescheduleForm.date || !rescheduleForm.time}
                        >
                            Confirmar Cambio
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};