import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalIcon } from 'lucide-react';

interface AgendaProps {
  appointments: any[];
  onSelectAppointment: (appt: any) => void;
}

export const PsychologistAgenda = ({ appointments, onSelectAppointment }: AgendaProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- LÓGICA CALENDARIO ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // --- HELPERS DE FECHA (Para evitar problemas de zona horaria) ---
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // --- LÓGICA HORAS ---
  // 1. Filtramos las citas que pertenecen al DÍA seleccionado
  const dayAppointments = appointments.filter(appt => {
    // new Date() convierte automáticamente la fecha UTC del backend a tu Hora Local
    const apptDate = new Date(appt.appointmentDate);
    
    // Verificamos si coinciden día, mes y año sin alterar la hora
    return isSameDay(apptDate, selectedDate) && (appt.statusId === 1 || appt.statusId === 2);
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 a 18:00

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-6">
      
      {/* IZQUIERDA: CALENDARIO */}
      <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col shrink-0 h-fit">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 capitalize">
                {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronLeft size={16}/></button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronRight size={16}/></button>
            </div>
        </div>

        {/* CORRECCIÓN 1: Usamos el índice (i) como key para evitar duplicados en 'M' */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">
            {['D','L','M','M','J','V','S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-6">
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
            {daysArray.map(day => {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                
                // Verificar si hay cita este día
                const hasAppt = appointments.some(a => {
                    const d = new Date(a.appointmentDate);
                    return isSameDay(d, date) && a.statusId !== 5;
                });

                return (
                    <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`
                            h-9 w-9 mx-auto rounded-full flex flex-col items-center justify-center text-sm transition-all relative
                            ${isSelected ? 'bg-slate-800 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}
                            ${isToday && !isSelected ? 'text-teal-600 font-bold bg-teal-50' : ''}
                        `}
                    >
                        {day}
                        {hasAppt && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 bg-teal-500 rounded-full"></span>
                        )}
                    </button>
                );
            })}
        </div>

        <div className="pt-6 border-t border-slate-100">
             <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CalIcon size={18}/></div>
                 <div className="text-sm font-bold text-slate-700">Resumen</div>
             </div>
             <p className="text-xs text-slate-500 mb-1 capitalize">
                 {selectedDate.toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long'})}
             </p>
             <p className="text-2xl font-bold text-slate-800">{dayAppointments.length} <span className="text-sm font-normal text-slate-400">Pacientes</span></p>
        </div>
      </div>

      {/* DERECHA: TIMELINE */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <span className="font-bold text-slate-700 text-sm">Horario Diario</span>
            <div className="text-xs text-slate-400 flex gap-3">
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Confirmada</span>
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Pendiente</span>
            </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
            {hours.map(hour => {
                // CORRECCIÓN 2: Buscamos la cita usando getHours() directamente sobre la fecha local
                const foundAppt = dayAppointments.find(a => {
                    const d = new Date(a.appointmentDate);
                    return d.getHours() === hour;
                });
                
                const isLunch = hour === 13; 

                return (
                    <div key={hour} className="flex gap-4 group min-h-[70px]">
                        <div className="w-14 text-right text-xs text-slate-400 font-bold pt-3">
                            {hour}:00
                        </div>
                        <div className="flex-1 relative">
                            {/* Linea divisoria */}
                            <div className="absolute top-4 left-0 w-full h-px bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
                            
                            {foundAppt ? (
                                <button 
                                    onClick={() => onSelectAppointment(foundAppt)}
                                    className={`
                                        relative z-10 w-full h-full rounded-xl border-l-4 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                                        ${foundAppt.statusId === 2 
                                            ? 'bg-green-50 border-green-500' 
                                            : 'bg-yellow-50 border-yellow-400'}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-bold text-sm ${foundAppt.statusId === 2 ? 'text-green-800' : 'text-yellow-800'}`}>
                                                {foundAppt.patient.firstName} {foundAppt.patient.lastName}
                                            </p>
                                            <p className="text-xs opacity-80 mt-1 flex items-center gap-2">
                                                <Clock size={12}/> {foundAppt.durationMinutes || 60} min
                                                <span className="w-1 h-1 bg-current rounded-full"></span>
                                                <MapPin size={12}/> Consultorio 1
                                            </p>
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/50
                                            ${foundAppt.statusId === 2 ? 'text-green-700' : 'text-yellow-700'}`}>
                                            {foundAppt.statusId === 2 ? 'CONFIRMADA' : 'PENDIENTE'}
                                        </div>
                                    </div>
                                </button>
                            ) : isLunch ? (
                                <div className="w-full h-full rounded-xl bg-slate-50 border border-slate-100 border-dashed flex items-center justify-center relative z-10">
                                    <span className="text-xs text-slate-400 italic font-medium">Hora de Almuerzo</span>
                                </div>
                            ) : (
                                <div className="h-full pt-2 pl-4 text-xs text-slate-300 group-hover:text-teal-500 transition-colors cursor-default select-none">
                                    Disponible
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};