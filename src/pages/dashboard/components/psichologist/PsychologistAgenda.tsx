import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Calendar as CalIcon } from 'lucide-react';

interface AgendaProps {
  appointments: any[];
  onSelectAppointment: (appt: any) => void;
}

export const PsychologistAgenda = ({ appointments, onSelectAppointment }: AgendaProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- LÓGICA DE CALENDARIO ---
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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // --- LÓGICA DE HORAS ---
  // Filtramos citas para el día seleccionado
  const dayAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.appointmentDate);
    // Ajuste de zona horaria simple si viene en UTC
    apptDate.setMinutes(apptDate.getMinutes() + apptDate.getTimezoneOffset());
    
    return (
        apptDate.getDate() === selectedDate.getDate() &&
        apptDate.getMonth() === selectedDate.getMonth() &&
        apptDate.getFullYear() === selectedDate.getFullYear() &&
        (appt.statusId === 1 || appt.statusId === 2) // Solo pendientes o confirmadas
    );
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 a 18:00

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      
      {/* COLUMNA IZQUIERDA: CALENDARIO */}
      <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg capitalize">
                {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
            </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">
            {['D','L','M','M','J','V','S'].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
            {daysArray.map(day => {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                
                // Verificar si hay citas ese día (para poner un puntito)
                const hasAppt = appointments.some(a => {
                    const d = new Date(a.appointmentDate);
                    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
                    return d.toDateString() === date.toDateString() && a.statusId !== 5;
                });

                return (
                    <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`
                            h-10 w-10 mx-auto rounded-full flex flex-col items-center justify-center text-sm transition-all relative
                            ${isSelected ? 'bg-slate-800 text-white shadow-lg scale-105' : 'hover:bg-slate-50 text-slate-700'}
                            ${isToday && !isSelected ? 'text-teal-600 font-bold border border-teal-200' : ''}
                        `}
                    >
                        {day}
                        {hasAppt && !isSelected && (
                            <span className="absolute bottom-1.5 w-1 h-1 bg-teal-500 rounded-full"></span>
                        )}
                    </button>
                );
            })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
             <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-2"><CalIcon size={16}/> Resumen del día</h4>
             <p className="text-sm text-blue-600">
                 {selectedDate.toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long'})}
             </p>
             <p className="text-2xl font-bold text-slate-800 mt-2">{dayAppointments.length} Citas</p>
        </div>
      </div>

      {/* COLUMNA DERECHA: TIMELINE DE HORAS */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-slate-50 font-semibold text-slate-700">
            Horario Detallado
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {hours.map(hour => {
                // Buscar si hay cita en esta hora
                const foundAppt = dayAppointments.find(a => {
                    const d = new Date(a.appointmentDate);
                    d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Ajuste UTC
                    return d.getHours() === hour;
                });

                const isLunch = hour === 13; // Ejemplo de hora de comida

                return (
                    <div key={hour} className="flex gap-4 group">
                        <div className="w-16 text-right text-sm text-slate-400 font-medium pt-2">
                            {hour}:00
                        </div>
                        <div className="flex-1 min-h-[60px] relative">
                            {/* Línea de guía */}
                            <div className="absolute top-3 left-0 w-full h-px bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
                            
                            {foundAppt ? (
                                <button 
                                    onClick={() => onSelectAppointment(foundAppt)}
                                    className={`
                                        absolute top-0 left-0 w-full h-[90%] rounded-lg border-l-4 p-2 text-left transition-all hover:scale-[1.01] hover:shadow-md
                                        ${foundAppt.statusId === 2 
                                            ? 'bg-green-50 border-green-500 text-green-800' 
                                            : 'bg-yellow-50 border-yellow-400 text-yellow-800'}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm">
                                            {foundAppt.patient.firstName} {foundAppt.patient.lastName}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                                            {foundAppt.statusId === 2 ? 'Confirmada' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="text-xs mt-1 opacity-80 flex items-center gap-1">
                                        <Clock size={12}/> {foundAppt.durationMinutes || 60} min
                                        <span className="mx-1">•</span>
                                        <User size={12}/> {foundAppt.patient.phone}
                                    </div>
                                </button>
                            ) : isLunch ? (
                                <div className="absolute top-0 left-0 w-full h-[90%] rounded-lg bg-slate-100/50 border border-slate-100 flex items-center justify-center">
                                    <span className="text-xs text-slate-400 italic">Posible hora de almuerzo</span>
                                </div>
                            ) : (
                                <div className="h-full pt-2 pl-4 text-xs text-slate-300 group-hover:text-teal-400 transition-colors cursor-default">
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