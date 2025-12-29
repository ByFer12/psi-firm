import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Plus, FileText, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Appointment {
  id: number;
  appointmentDate: string;
  statusId: number; 
  areaId: number;
  notes: string;
  durationMinutes: number;
  createdAt: string;
  psychologist?: {
    professionalLicense: string;
    employee: {
        firstName: string;
        lastName: string;
        phone: string;
    }
  };
}

export const PatientAppointments = ({ onRequestProfileRedirect }: { onRequestProfileRedirect: () => void }) => {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Estados de formularios
  const [formData, setFormData] = useState({ date: '', areaId: 1, notes: '' });

  useEffect(() => { checkProfileStatus(); }, []);

  const checkProfileStatus = async () => {
    try {
      await api.get('/profile/me');
      setHasProfile(true);
      fetchAppointments();
    } catch (error) {
      setHasProfile(false);
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/citas');
      setAppointments(res.data);
    } catch (error) {
      toast.error("Error cargando citas");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      //const fullDate = `${formData.date}T`;
      await api.post('/citas/request', {
       // date: fullDate,
        areaId: Number(formData.areaId),
        notes: formData.notes,
      });
      toast.success('Solicitud enviada correctamente');
      setView('list');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar cita');
    }
  };
  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    try {
      await api.patch(`/citas/${id}/cancel`);
      toast.success('Cita cancelada');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    }
  };

  const getStatusBadge = (statusId: number) => {
    switch(statusId) {
      case 1: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Pendiente</span>;
      case 2: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Confirmada</span>;
      case 5: return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><XCircle size={12}/> Cancelada</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Desconocido</span>;
    }
  };

  if (hasProfile === false) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Perfil Incompleto</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">Necesita completar su ficha clínica para agendar citas. [cite: 33]</p>
        <Button onClick={onRequestProfileRedirect} className="px-8">Completar Perfil</Button>
      </div>
    );
  }

  if (hasProfile === null || loading) return <div className="p-10 text-center">Cargando información...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Gestión de Citas [cite: 39]</h2>
        <Button onClick={() => setView(view === 'list' ? 'new' : 'list')}>
          {view === 'list' ? <><Plus size={18} className="mr-2"/> Nueva Solicitud</> : 'Ver Historial'}
        </Button>
      </div>

      {view === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-slate-600 border-b">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Especialista</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-gray-50 transition">
                 <td className="px-4 py-3 font-medium">{appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString() : "Pendiente"}</td>
                  <td className="px-4 py-3">
                    {appt.psychologist ? `Dr. ${appt.psychologist.employee.firstName}` : 'Por asignar'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(appt.statusId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedAppt(appt); setIsModalOpen(true); }} className="p-2 text-slate-600 hover:text-blue-600" title='Ver detalles'><FileText size={18}/></button>
                      {appt.statusId !== 5 && (
                        <>
                          <button onClick={() => handleCancelAppointment(appt.id)} className="p-2 text-slate-600 hover:text-red-600" title='Cancelar cita'><Trash2 size={18}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleRequestSubmit} className="max-w-2xl mx-auto space-y-4">
          <textarea className="w-full p-3 border rounded-lg h-24" placeholder="Notas adicionales..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setView('list')} className="w-full">Cancelar</Button>
            <Button type="submit" className="w-full">Enviar Solicitud</Button>
          </div>
        </form>
      )}

      {/* Modal Detalles */}
{isModalOpen && selectedAppt && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
      
      {/* Cabecera Profesional */}
      <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            Detalles de la Cita
          </h3>
        </div>
        <button 
          onClick={() => setIsModalOpen(false)}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all"
        >
          <XCircle size={22} />
        </button>
      </div>

      {/* Contenido Organizado */}
      <div className="p-6 space-y-6">
        
        {/* Bloque de Fecha y Hora con Estilo de Tarjeta */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar size={80} />
          </div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.15em] mb-2">
            Fecha y Hora de Atención
          </p>
          <p className="text-xl font-semibold text-slate-900 capitalize">
            {new Date(selectedAppt.appointmentDate).toLocaleString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric'
            })}
          </p>
          <p className="text-slate-600 font-medium mt-1 flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" />
            {new Date(selectedAppt.appointmentDate).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
               {/* Sección del Profesional y Área */}
        <div className="">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Profesional Asignado
          </p>
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
                    <span className="mx-2 text-blue-200">|</span>
                    Lic. {selectedAppt.psychologist.professionalLicense}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 flex items-center justify-center bg-slate-200 rounded-full">
                       <span className="scale-75">📞</span> 
                    </div>
                    {selectedAppt.psychologist.employee.phone}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={18} />
              <p className="text-sm text-amber-700 font-medium">
                Pendiente de asignación de especialista
              </p>
            </div>
          )}
        </div>

        {/* Grid de Metadatos: Estado, Duración y Registro */}
        <div className="grid grid-cols-2 gap-6 px-1">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Estado de Cita
              </p>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedAppt.statusId)}
                <span className="text-slate-300">|</span>
                <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <Clock size={14} className="text-slate-400"/> {selectedAppt.durationMinutes} min
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Solicitado el
            </p>
            <p className="text-sm font-semibold text-slate-700">
              {new Date(selectedAppt.createdAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>


        {/* Notas con diseño limpio */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Motivo de consulta y notas
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-100 italic">
            {selectedAppt.notes ? `"${selectedAppt.notes}"` : "No hay notas adicionales registradas."}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-6 py-4 flex justify-end">
        <button 
          onClick={() => setIsModalOpen(false)}
          className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2.5 px-8 rounded-xl transition-all shadow-sm active:scale-95"
        >
          Cerrar Detalles
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};