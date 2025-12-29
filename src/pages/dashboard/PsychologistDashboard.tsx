import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, Users, ClipboardPlus, Calendar, 
  LogOut, Calendar as  XCircle, 
  FileText, Eye, CalendarClock, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/UI/Button'; 
import { toast } from 'react-toastify';

// Componentes Hijos
import { ClinicalOpening } from './components/psichologist/ClinicalOpening';
import { Patients } from './components/psichologist/Patients';
import { Sesion } from './components/psichologist/Sesion';
import { PsychologistHome } from './components/psichologist/PsychologistHome'; 
import { PsychologistAgenda } from './components/psichologist/PsychologistAgenda'; 

export const PsychologistDashboard = () => {
  const { user, logout } = useAuth();
  // Casting para evitar errores de propiedades inexistentes en el tipo User base
  const currentUser = user as any;

  // Navegación principal
  const [activeTab, setActiveTab] = useState<'inicio' | 'pacientes' |'sesion' | 'apertura' | 'agenda'>('inicio');
  
  // Estado para controlar si vemos la TABLA o el FORMULARIO en la pestaña "Apertura"
  const [aperturaView, setAperturaView] = useState<'list' | 'form'>('list');

  // Datos
  const [appointments, setAppointments] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS DE MODALES ---
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'reschedule' | null>(null);
  
  // Formulario de reprogramación
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [busyHours, setBusyHours] = useState<number[]>([]); 
  const [userr, setUserr] = useState<any>({});
  const [actives, setActives] = useState(0);
  const [citesClosed, setCitesClosed] = useState<any[]>([]);

  // Estado para auto-iniciar sesión
  const [autoStartSessionAppt, setAutoStartSessionAppt] = useState<any>(null);
  const [patientsList, setPatientsList] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    profile();
    loadMyPatients();
    citesCloseClinicalRecord();
  }, []);

  const citesCloseClinicalRecord = async () => {
    try {
      const res = await api.get("/citas/close");
      setCitesClosed(res.data);
    } catch (error) {
      console.error("Error al cargar citas cerradas", error);
    }
  };

  const loadMyPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clinical/psychologists/my-patients'); 
      const listaDPacientes = res.data;
      // Corregido error TS7006 agregando tipo (p: any)
      const totalActivos: number = listaDPacientes.filter((p: any) => p.status === "ACTIVE").length;
      setActives(totalActivos);
      setPatientsList(res.data);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setLoading(false);
    }
  };

  const profile = async () => {
    try {
      const res = await api.get("/profile/me");
      setUserr(res.data);
    } catch (error) {
      console.error("Error al cargar perfil", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/citas"); 
      setAppointments(res.data);
    } catch (error) {
      console.error("Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  const calculateBusyHours = () => {
    if (!rescheduleForm.date) return;
    const selectedDateObj = new Date(rescheduleForm.date);
    selectedDateObj.setMinutes(selectedDateObj.getMinutes() + selectedDateObj.getTimezoneOffset());

    const occupied = appointments
        .filter((appt: any) => {
            if (appt.statusId === 5) return false; 
            if (appt.id === selectedAppt?.id) return false; 
            
            const apptDate = new Date(appt.appointmentDate);
            return (
                apptDate.getFullYear() === selectedDateObj.getFullYear() &&
                apptDate.getMonth() === selectedDateObj.getMonth() &&
                apptDate.getDate() === selectedDateObj.getDate()
            );
        })
        .map((appt: any) => new Date(appt.appointmentDate).getHours());

    setBusyHours(occupied);
  };

  useEffect(() => {
    if (modalMode === 'reschedule' && rescheduleForm.date) {
        calculateBusyHours();
    }
  }, [rescheduleForm.date, appointments, modalMode]);


  const handleOpenDetails = (appt: any) => {
      setSelectedAppt(appt);
      setModalMode('details');
  };

  const handleOpenReschedule = (appt: any) => {
      setSelectedAppt(appt);
      setModalMode('reschedule');
      const d = new Date(appt.appointmentDate);
      const dateStr = d.toISOString().split('T')[0];
      setRescheduleForm({ date: dateStr, time: '' });
  };

  const handleRescheduleSubmit = async () => {
      if (!selectedAppt || !rescheduleForm.date || !rescheduleForm.time) return;
      try {
          const finalDateTime = `${rescheduleForm.date}T${rescheduleForm.time}:00`;
          await api.patch(`/citas/${selectedAppt.id}/reschedule`, {
              newDate: finalDateTime
          });
          toast.success("Cita reprogramada con éxito");
          closeModal();
          loadData();
      } catch (error: any) {
          toast.error(error.response?.data?.message || "Error al reprogramar");
      }
  };

  const handleGoToApertura = (appt: any) => {
      setSelectedAppt(appt);
      setAperturaView('form');
      if (activeTab !== 'apertura') setActiveTab('apertura');
  };

  const closeModal = () => {
      setModalMode(null);
      if (aperturaView !== 'form') {
         setSelectedAppt(null);
      }
      setRescheduleForm({ date: '', time: '' });
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'inicio':
        const todayCount = appointments.filter((a: any) => {
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
        if (aperturaView === 'form' && selectedAppt) {
            return (
              <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Button variant="ghost" onClick={() => { setAperturaView('list'); setSelectedAppt(null); }}>
                    ← Volver a la lista
                </Button>
                <ClinicalOpening
                  patientId={selectedAppt.patient.id}
                  psychologistId={currentUser?.employeeId || 1}
                  patientName={`${selectedAppt.patient.firstName} ${selectedAppt.patient.lastName}`}
                  onSuccess={() => {
                    setAperturaView('list');
                    setSelectedAppt(null);
                    setActiveTab('sesion');
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
                       ) : citesClosed.length === 0 ? (
                           <tr><td colSpan={5} className="p-10 text-center text-slate-400">No se encontraron citas pendientes.</td></tr>
                       ) : (
                           citesClosed.map((app: any) => (
                             <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4">
                                 <div className="font-medium flex items-center gap-2">
                                     <Calendar size={14} className="text-teal-600"/>
                                     {new Date(app.appointmentDate).toLocaleDateString()}
                                 </div>
                               </td>
                               <td className="p-4">
                                 <div className="font-bold text-slate-800">{app.patient?.firstName} {app.patient?.lastName}</div>
                               </td>
                               <td className="p-4">
                                 <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                     {app.notes || "General"}
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
                                   <button onClick={() => handleOpenDetails(app)} className="p-2 text-slate-400 hover:text-blue-600"><Eye size={18}/></button>
                                   <button onClick={() => handleOpenReschedule(app)} className="p-2 text-slate-400 hover:text-amber-600"><Calendar size={18}/></button>
                                   <Button size="sm" onClick={() => handleGoToApertura(app)}>
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
                  setAperturaView('list');
                  setSelectedAppt(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-teal-600 text-white shadow-lg' 
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

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-10 px-6 md:px-8 flex items-center justify-between shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
               {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-slate-700">Dr. {userr?.firstName}</p>
                   <p className="text-[10px] uppercase text-teal-600 font-bold tracking-wider">Especialista</p>
               </div>
               <div className="w-9 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold">
                 {currentUser?.username?.substring(0,2).toUpperCase()}
               </div>
            </div>
        </header>

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
             {renderContent()}
        </main>
      </div>

      {/* MODAL DETALLES */}
      {modalMode === 'details' && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600"/> Detalles de la Cita
                    </h3>
                    <button onClick={closeModal}><XCircle size={22} className="text-slate-400 hover:text-red-500"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl">
                            {selectedAppt.patient.firstName[0]}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{selectedAppt.patient.firstName} {selectedAppt.patient.lastName}</h2>
                            <p className="text-slate-500 text-sm">ID: {selectedAppt.patient.identification}</p>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button className="w-full" onClick={closeModal}>Cerrar</Button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* MODAL REPROGRAMAR */}
      {modalMode === 'reschedule' && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5 pb-3 border-b">
                    <h3 className="text-lg font-bold text-slate-800">Reprogramar Cita</h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><XCircle size={24}/></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Seleccione Nueva Fecha</label>
                        <input 
                            type="date" 
                            className="w-full border p-3 rounded-xl bg-slate-50"
                            min={new Date().toISOString().split('T')[0]}
                            value={rescheduleForm.date}
                            onChange={(e) => setRescheduleForm({...rescheduleForm, date: e.target.value, time: ''})}
                        />
                    </div>
                    
                    {rescheduleForm.date && (
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => {
                                const isBusy = busyHours.includes(hour);
                                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                const isSelected = rescheduleForm.time === timeStr;
                                return (
                                    <button
                                        key={hour}
                                        disabled={isBusy}
                                        onClick={() => setRescheduleForm({...rescheduleForm, time: timeStr})}
                                        className={`py-2 rounded-lg text-sm font-bold border ${
                                            isSelected ? 'bg-slate-800 text-white' : isBusy ? 'bg-red-50 text-red-200' : 'bg-white'
                                        }`}
                                    >
                                        {timeStr}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    <div className="flex gap-3 pt-6 border-t mt-4">
                        <Button variant="outline" className="flex-1" onClick={closeModal}>Cancelar</Button>
                        <Button 
                            className="flex-1" 
                            onClick={handleRescheduleSubmit}
                            disabled={!rescheduleForm.date || !rescheduleForm.time}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};