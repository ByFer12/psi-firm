import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

interface Task {
  id: number;
  taskDescription: string;
  dueDate: string;
  taskStatusId: number; // 1: Pendiente, 2: Completada
  sessionId: number;
  session: {
    sessionNumber: number;
    sessionDate: string;
  };
}

export const PatientTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/me');
      setTasks(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleTask = async (task: Task) => {
    try {
      // Si es 1 (Pendiente) pasa a 2 (Completada), y viceversa
      const newStatus = task.taskStatusId === 1 ? 2 : 1;
      
      // Optimistic UI update (actualizamos la UI antes de que responda el server para que se sienta rápido)
      const updatedList = tasks.map(t => 
        t.id === task.id ? { ...t, taskStatusId: newStatus } : t
      );
      setTasks(updatedList);

      await api.patch(`/tasks/${task.id}/status`, { statusId: newStatus });
      
      if(newStatus === 2) toast.success("¡Tarea completada!");
      
    } catch (error) {
      toast.error("No se pudo actualizar la tarea");
      fetchTasks(); // Revertir cambios si falla
    }
  };

  // Filtrado
  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.taskStatusId === 1;
    if (filter === 'completed') return t.taskStatusId === 2;
    return true;
  });

  // Helpers de fecha
  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Cargando tareas...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ListTodo className="text-teal-600"/> Tareas Terapéuticas
           </h1>
           <p className="text-slate-500 text-sm">Actividades asignadas por tu especialista para reforzar tu proceso.</p>
        </div>

        {/* Filtros */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
           <button 
             onClick={() => setFilter('pending')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'pending' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Pendientes
           </button>
           <button 
             onClick={() => setFilter('completed')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'completed' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Completadas
           </button>
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Todas
           </button>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-3">
         {filteredTasks.length === 0 ? (
           <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-slate-400">No hay tareas en esta sección.</p>
           </div>
         ) : (
           filteredTasks.map((task) => {
             const overdue = isOverdue(task.dueDate) && task.taskStatusId === 1;
             
             return (
               <div 
                 key={task.id} 
                 className={`group flex items-start gap-4 p-5 rounded-xl border transition-all hover:shadow-md ${
                    task.taskStatusId === 2 
                    ? 'bg-gray-50 border-gray-100 opacity-75' 
                    : 'bg-white border-gray-200'
                 }`}
               >
                 {/* Checkbox Button */}
                 <button 
                   onClick={() => handleToggleTask(task)}
                   className={`mt-1 transition-colors ${
                      task.taskStatusId === 2 
                      ? 'text-green-500' 
                      : 'text-gray-300 hover:text-teal-500'
                   }`}
                 >
                   {task.taskStatusId === 2 ? <CheckCircle size={24} className="fill-green-100" /> : <Circle size={24} />}
                 </button>

                 <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <h3 className={`font-medium text-lg ${task.taskStatusId === 2 ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {task.taskDescription}
                       </h3>
                       {overdue && (
                         <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            <AlertCircle size={12}/> Vencida
                         </span>
                       )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                       {task.dueDate && (
                         <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                            <Clock size={14}/> Vence: {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                       )}
                       <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                          <Calendar size={12}/> Asignada en sesión #{task.session?.sessionNumber}
                       </span>
                    </div>
                 </div>
               </div>
             );
           })
         )}
      </div>
    </div>
  );
};