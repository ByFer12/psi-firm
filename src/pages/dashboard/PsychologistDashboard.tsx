import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardPlus, 
  Calendar, 
  BookOpen, 
  LogOut, 
  Stethoscope,
  Search,
  CalendarClock
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ClinicalOpening } from './components/psichologist/ClinicalOpening';
import { Patients } from './components/psichologist/Patients';
import { Sesion } from './components/psichologist/Sesion';

export const PsychologistDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'inicio' | 'pacientes' |'sesion' | 'apertura' | 'agenda'>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [psychologistInfo, setPsychologistInfo] = useState<any>(null);
  const [patients, setPatient]=useState([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [autoStartSessionAppt, setAutoStartSessionAppt] = useState<any>(null);

const [searchTerm, setSearchTerm] = useState('');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

// Lógica de filtrado y ordenamiento
const filteredAppointments = patients
  .filter((app: any) => 
    app.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.patient?.identification?.includes(searchTerm)
  )
  .sort((a: any, b: any) => {
    const dateA = new Date(a.appointmentDate).getTime();
    const dateB = new Date(b.appointmentDate).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  useEffect(() => {
    const loadPsychologistData = async () => {
      try {
        const res = await api.get('/auth/me'); // Ajusta según tu ruta
        console.log("Employees me ",res.data);
        setPsychologistInfo(res.data);
      } catch (error) {
        console.error("Error cargando info del especialista");
      }
    };
    loadPsychologistData();
    loadCites();
    loadHistoryRecord()
    myProfile()
  }, []);
   
  const loadHistoryRecord=async ()=>{
    try {
      const res =await api.get(`/clinical-records/patient/${1}`)
      console.log("Cargando HIstorial clico", res.data)
    } catch (error) {
      
    }
  }

  const myProfile=async()=>{
    const res=await api.get('/profile/me');
      console.log("Perfil Encontrado: ",res.data)
  }
  const loadCites=async ()=>{

    try {
      const res =await api.get("/citas");
      setPatient(res.data);
      console.log("Citas obtenidos: ",res.data)
    } catch (error) {
      
    }
  }
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'agenda', label: 'Mi Agenda', icon: Calendar },
    { id: 'pacientes', label: 'Mis Pacientes', icon: Users },
    { id: 'sesion', label: 'Seiones', icon:CalendarClock },
    { id: 'apertura', label: 'Apertura Clínica', icon: ClipboardPlus },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'apertura':
  // Si hay una cita seleccionada, mostramos el formulario de ClinicalOpening
 if (selectedAppointment) {
            return (
              <div className="space-y-4">
                <Button variant="ghost" onClick={() => setSelectedAppointment(null)}>← Cancelar</Button>
                
                <ClinicalOpening
                  patientId={selectedAppointment.patient.id}
                  psychologistId={user?.employeeId || 1} // Ajusta según tu contexto
                  patientName={`${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`}
                  
                  // OPCIÓN A: Volver a agenda normal
                  onSuccess={() => {
                    setSelectedAppointment(null);
                    setActiveTab('sesion'); // Vuelve a la lista
                  }}
                  
                  // OPCIÓN B: Ir a agenda pero con AUTO-START
                  onStartNow={() => {
                    // Guardamos la cita actual en un estado temporal
                    setAutoStartSessionAppt(selectedAppointment);
                    // Limpiamos la selección de apertura
                    setSelectedAppointment(null);
                    // Cambiamos tab a sesión
                    setActiveTab('sesion');
                  }}
                />
              </div>
            );
        }
       
  // Si no hay seleccionada, mostramos la tabla
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Citas Pendientes</h1>
        <p className="text-slate-300">Gestione las aperturas de expedientes para sus pacientes asignados.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {/* Buscador y Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -reverse-y-1/2 text-gray-400 -translate-y-1/2" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o identificación..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Ordenar por fecha:</span>
            <select 
              className="border rounded-lg px-3 py-2 text-sm outline-none"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Más antiguas primero</option>
              <option value="desc">Más recientes primero</option>
            </select>
          </div>
        </div>

        {/* Tabla de Citas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-slate-500 text-sm">
                <th className="py-4 px-4 font-semibold">Fecha y Hora</th>
                <th className="py-4 px-4 font-semibold">Paciente</th>
                <th className="py-4 px-4 font-semibold">Identificación</th>
                <th className="py-4 px-4 font-semibold">Motivo</th>
                <th className="py-4 px-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app: any) => (
                  
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-700">
                        {new Date(app.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        {/* Cambiado '2-numeric' por '2-digit' */}
                        {new Date(app.appointmentDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {app.patient?.firstName} {app.patient?.lastName}
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-sm">
                      {app.patient?.identification}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {app.patient?.consultationReason || 'Consulta General'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          title="Ver Detalles"
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <BookOpen size={18} />
                        </button>
                        <button 
                          title="Reprogramar"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Calendar size={18} />
                        </button>
                        <Button 
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 h-8 px-3 text-xs"
                          onClick={() => setSelectedAppointment(app)}
                        >
                          Aperturar Historial
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No se encontraron citas pendientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
      case 'pacientes':
       return( <Patients/>);

        case 'sesion':
 return (
          <Sesion 
             // Le pasamos la cita que queremos iniciar automáticamente (si existe)
             initialAppointment={autoStartSessionAppt}
             
             onNavigateToOpening={(appt) => {
                setSelectedAppointment(appt);
                setActiveTab('apertura');
             }} 
          />
        );
      case 'inicio':
      default:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-8 text-white shadow-lg">
              <h1 className="text-3xl font-bold mb-2">Bienvenido, Dr. {user?.username}</h1>
              <p className="text-slate-300">Panel de control clínico. Gestione sus expedientes y sesiones programadas.</p>
              <div className="mt-6 flex gap-3">
                <Button className="bg-teal-600 hover:bg-teal-700 border-none" onClick={() => setActiveTab('apertura')}>
                  Nueva Apertura de Expediente
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                  <Stethoscope size={24} />lllll
                </div>
                <h3 className="text-lg font-semibold">Citas de Hoy</h3>
                <p className="text-3xl font-bold text-slate-800">0</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-semibold">Pacientes Activos</h3>
                <p className="text-3xl font-bold text-slate-800">0</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Similar al de paciente pero con colores de Employee */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <span className="text-2xl font-bold text-teal-400 tracking-tight flex items-center gap-2">
            PsiFirm <span className="text-[10px] bg-slate-800 text-teal-400 px-2 py-1 rounded-full border border-teal-900/50">CLÍNICO</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-lg">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-20 px-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-3">
               <span className="text-sm text-slate-500">Especialista</span>
               <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-teal-400 font-bold">
                 {user?.username?.substring(0,2).toUpperCase()}
               </div>
            </div>
        </header>
        <main className="p-8 overflow-y-auto flex-1">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};