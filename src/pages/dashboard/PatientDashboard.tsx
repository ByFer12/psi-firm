import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CreditCard, 
  User, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Search,
  ListTodo,
  FolderOpen
} from 'lucide-react';
import { PatientProfile } from './components/patient/PatientProfile';
import { Button } from '../../components/UI/Button';
import { PatientAppointments } from './components/patient/PatientAppointments';
import { Notifications } from './components/patient/Notification';
import { PatientInvoices } from './components/patient/PatientInvoices';
import { PatientHistory } from './components/patient/PatientHistory';
import { PatientTasks } from './components/patient/PatientTasks';
import { PatientFiles } from './components/patient/PatientFiles';

export const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inicio' | 'citas' | 'historial' | 'pagos' | 'perfil' | 'notificaciones'|'archivos'|'tareas'>('inicio');
  
  // --- Estado Global del Perfil ---
  const [profileData, setProfileData] = useState<any>(null);
  const [noti,setNoti]= useState([]);
  const [notiR,setRNoti]= useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get('/profile/me');
      console.log("Perfil Encontrado: ",res.data)
      if (res.data) {
        setProfileData(res.data);
      }
    } catch (error) {
      console.log("Perfil no encontrado o pendiente de crear");
      setProfileData(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadNotifications= async()=>{
    try{
      const res = await api.get("/notifications/getNoti");
      setNoti(res.data)
      console.log("Respuesta de Noti: ", res.data);
    }catch(error){
       console.log("Notificaciones no encontrados");
      
    }
    }

const loadNotificationsLeidas= async()=>{
    try{
      const res = await api.get("/notifications/getReadedNoti");
      setRNoti(res.data)
      console.log("Noti Leidas: ", res.data);
    }catch(error){
       console.log("Notificaciones no encontrados");
      
    }
    }


  useEffect(() => {
    loadProfile();
    loadNotifications();
    loadNotificationsLeidas();
    fetchProfileImage()
  }, []);
  const fetchProfileImage = async () => {
    try {
      const res = await api.get('/files/my-files');
      if (res.data && res.data.profileImage) {
        setAvatarUrl(res.data.profileImage.fileUrl);
      }
    } catch (error) {
      console.error("Error cargando imagen de perfil", error);
    }
  };
  // Menú lateral
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'citas', label: 'Mis Citas', icon: Calendar },
    { id: 'archivos', label: 'Mis Archivos', icon: FolderOpen },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, text:noti.length },
    { id: 'historial', label: 'Historial Clínico', icon: FileText },
    { id: 'pagos', label: 'Pagos y Facturas', icon: CreditCard },
    { id: 'tareas', label: 'Tareas Asignadas', icon: ListTodo },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'citas':
        return <PatientAppointments onRequestProfileRedirect={() => setActiveTab('perfil')} />;


      case 'archivos': // <--- NUEVO CASE
      return <PatientFiles />;
      
      case 'notificaciones':
        return <Notifications
                  notiUnread={noti}
                  notiReaded={notiR}
                  viewNoti={()=>{
                    loadNotifications();
                  }

                  }

                  />;

      case 'perfil':
        return (
          <PatientProfile 
            initialData={profileData} 
            onProfileComplete={() => {
              loadProfile(); // Recarga datos en el dashboard
              setActiveTab('citas');
            }} 
          />
        );

        case 'pagos':
          return <PatientInvoices />;

        case 'historial':
          return <PatientHistory />;

              case 'tareas':
          return <PatientTasks />;

      case 'inicio':
      default:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 text-white shadow-lg">
              <h1 className="text-3xl font-bold mb-2">
                Hola, {profileData?.firstName || user?.username}
              </h1>
              <p className="text-teal-100 max-w-xl">Bienvenido a tu panel de salud. Aquí puedes gestionar tus citas, revisar tu progreso y mantenerte en contacto con tus especialistas.</p>
              <div className="mt-6 flex gap-3">
                <Button className="bg-white text-teal-700 hover:bg-gray-100 border-none" onClick={() => setActiveTab('citas')}>
                  Agendar Cita Nueva
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer" onClick={() => setActiveTab('citas')}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Calendar size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Próxima Cita</h3>
                <p className="text-slate-500 text-sm">No tienes citas programadas</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer" onClick={() => setActiveTab('historial')}>
                 <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Diagnóstico</h3>
                <p className="text-slate-500 text-sm">Ver resumen clínico</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Estado de Cuenta</h3>
                <p className="text-slate-500 text-sm">Todo al día</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <span className="text-2xl font-bold text-teal-600 tracking-tight flex items-center gap-2">
            PsiFirm <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">Paciente</span>
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-teal-50 text-teal-700' 
                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
              }`}
            > 
             <div className="relative">
              <item.icon size={20}/>
              
              {/* Solo mostramos el badge si es la pestaña de notificaciones y hay más de 0 */}
              {item.id === "notificaciones" && noti.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {noti.length}
                </span>
              )}
            </div>
              
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-xl text-teal-600">Menú</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
             </div>
             {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-gray-50 rounded-lg"
                >
                  <item.icon size={20} /> {item.label}
                </button>
             ))}
             <button onClick={logout} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-600">
                <LogOut size={20} /> Salir
             </button>
          </div>
        </div>
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize hidden sm:block">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64" />
            </div>
            <button 
              className="relative p-2 text-slate-600 hover:bg-gray-100 rounded-full transition"
              onClick={() => setActiveTab('notificaciones')}
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {avatarUrl ? (
                    <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                    (profileData?.firstName || user?.username)?.substring(0,2).toUpperCase()
                )}
               
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 overflow-y-auto flex-1">
          <div className="max-w-6xl mx-auto">
             {loadingProfile && activeTab === 'inicio' ? (
               <div className="text-center p-10">Cargando datos...</div>
             ) : renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};