import { 
  Users, Stethoscope, Clock, CalendarCheck, Activity, TrendingUp 
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { useEffect } from 'react';

export const PsychologistHome = ({ 
  user, 
  stats, 
  onNavigate 
}: { 
  user: any, 
  stats: { todayCount: number, activePatients: number },
  onNavigate: (tab: string) => void
}) => {


  useEffect(() => {
    prueba()
  });
    
  const prueba=()=>{
    console.log("Holaaaaaaa homeeee de psychologist",user);
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Hola, Dr. {user?.firstName} 👋</h1>
          <p className="text-slate-200 max-w-xl text-lg opacity-90">
            Tienes <strong className="text-teal-300">{stats.todayCount} sesiones</strong> programadas para hoy. 
            Recuerda revisar los expedientes antes de cada consulta.
          </p>
          <div className="mt-8 flex gap-3">
            <Button 
              className="bg-white text-teal-800 hover:bg-slate-100 font-bold border-none"
              onClick={() => onNavigate('agenda')}
            >
              <CalendarCheck size={18} className="mr-2"/> Ver mi Agenda
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
              onClick={() => onNavigate('apertura')}
            >
              <Activity size={18} className="mr-2"/> Aperturar Expediente
            </Button>
          </div>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-12"></div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardStat 
            icon={<Stethoscope size={24} />} 
            color="bg-teal-100 text-teal-600"
            label="Citas Hoy"
            value={stats.todayCount.toString()}
            sub="Pacientes agendados"
        />
        <CardStat 
            icon={<Users size={24} />} 
            color="bg-blue-100 text-blue-600"
            label="Pacientes Activos"
            value={stats.activePatients.toString()}
            sub="Total en tratamiento"
        />
         <CardStat 
            icon={<TrendingUp size={24} />} 
            color="bg-purple-100 text-purple-600"
            label="Eficacia"
            value="95%" 
            sub="Asistencia de pacientes"
        />
      </div>

      {/* Sección de accesos rápidos o noticias internas 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-teal-500"/> Actividad Reciente
            </h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm p-3 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-slate-600 flex-1">Se finalizó la sesión con <strong>Maria Garcia</strong>.</p>
                    <span className="text-slate-400 text-xs">Hace 2h</span>
                </div>
                <div className="flex items-center gap-4 text-sm p-3 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <p className="text-slate-600 flex-1">Nuevo expediente creado para <strong>Juan Perez</strong>.</p>
                    <span className="text-slate-400 text-xs">Hace 4h</span>
                </div>
            </div>
        </div>
      </div>
      */}
    </div>
  );
};

const CardStat = ({ icon, color, label, value, sub }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                {icon}
            </div>
        </div>
        <div>
            <h4 className="text-slate-500 text-sm font-medium">{label}</h4>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
    </div>
);