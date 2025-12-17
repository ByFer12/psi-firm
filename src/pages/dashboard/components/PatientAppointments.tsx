import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Button } from '../../../components/UI/Button';
import { Input } from '../../../components/UI/Input';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Plus, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

// Tipos basados en tu AppointmentService
interface Appointment {
  id: number;
  appointmentDate: string;
  statusId: number; // 1: Pendiente, 2: Confirmada, 5: Cancelada
  areaId: number;
  notes: string;
  psychologist?: {
    employee: {
        firstName: string;
        lastName: string;
    }
  };
}

export const PatientAppointments = ({ onRequestProfileRedirect }: { onRequestProfileRedirect: () => void }) => {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  // Estado para nueva solicitud
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    areaId: 1, // Por defecto Psicología Clínica
    notes: ''
  });

  // Cargar citas
  useEffect(() => {
    fetchAppointments();
  }, []);

useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      await api.get('/profile/me ');
      setHasProfile(true);
      fetchAppointments(); // Solo cargamos citas si tiene perfil
    } catch (error) {
      setHasProfile(false);
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/citas'); // Tu endpoint GET /citas filtra por usuario en backend
      setAppointments(res.data);
    } catch (error) {
      console.error("Error cargando citas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combinar fecha y hora para enviar al backend
      const fullDate = `${formData.date}T${formData.time}:00`;
      
      await api.post('/citas/request', {
        date: fullDate,
        areaId: Number(formData.areaId),
        notes: formData.notes,
        // userId se obtiene del token/session en backend, pero si lo pide el body:
        // userId: user.id 
      });

      toast.success('Solicitud enviada. Un administrativo la confirmará pronto.');
      setView('list');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar cita');
    }
  };

  // Renderizado de estado (Color badges)
  const getStatusBadge = (statusId: number) => {
    switch(statusId) {
      case 1: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Pendiente de Asignación</span>;
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
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Para poder agendar citas y asignarle un especialista, necesitamos que complete su ficha clínica con sus datos personales y de contacto.
        </p>
        <Button onClick={onRequestProfileRedirect} className="px-8">
          Completar Mi Perfil Ahora
        </Button>
      </div>
    );
  }
   if (hasProfile === null || loading) return <div className="p-10 text-center">Cargando información...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestión de Citas</h2>
          <p className="text-sm text-slate-500">Historial y nuevas solicitudes</p>
        </div>
        {view === 'list' ? (
           <Button onClick={() => setView('new')} className="flex items-center gap-2">
             <Plus size={18} /> Nueva Solicitud
           </Button>
        ) : (
           <Button variant="outline" onClick={() => setView('list')}>
             Ver Historial
           </Button>
        )}
      </div>

      {view === 'list' ? (
        <div className="overflow-x-auto">
          {loading ? (
             <p className="text-center py-10 text-slate-500">Cargando citas...</p>
          ) : appointments.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 rounded-lg">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-600">No tienes citas registradas.</p>
                <button onClick={() => setView('new')} className="text-teal-600 font-medium hover:underline mt-2">Solicita tu primera cita</button>
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-slate-600 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Área / Especialista</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {new Date(appt.appointmentDate).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {appt.psychologist 
                        ? `Dr. ${appt.psychologist.employee.firstName} ${appt.psychologist.employee.lastName}`
                        : <span className="text-slate-400 italic">Por asignar</span>
                      }
                      <div className="text-xs text-slate-500 mt-1">
                        {appt.areaId === 1 ? 'Psicología' : 'Psiquiatría'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(appt.statusId)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {appt.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                 <p className="font-semibold">Información Importante</p>
                 <p>Estás solicitando un espacio. Un administrativo revisará la disponibilidad y te asignará el especialista más adecuado para tu caso. Recibirás una confirmación por correo.</p>
              </div>
           </div>

           <form onSubmit={handleRequestSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Fecha Preferida" 
                    type="date" 
                    id="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                  <Input 
                    label="Hora Preferida" 
                    type="time" 
                    id="time"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                  />
              </div>

              <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Área de Atención</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    value={formData.areaId}
                    onChange={e => setFormData({...formData, areaId: Number(e.target.value)})}
                  >
                    <option value={1}>Psicología Clínica</option>
                    <option value={2}>Psiquiatría</option>
                    <option value={3}>Terapia de Pareja</option>
                    <option value={4}>Psicología Infantil</option>
                  </select>
              </div>

              <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Motivo de consulta / Notas</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                    placeholder="Describe brevemente el motivo de tu solicitud..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
              </div>

              <div className="flex gap-3 pt-2">
                 <Button type="button" variant="outline" onClick={() => setView('list')} className="w-1/3">Cancelar</Button>
                 <Button type="submit" className="w-2/3">Enviar Solicitud</Button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};