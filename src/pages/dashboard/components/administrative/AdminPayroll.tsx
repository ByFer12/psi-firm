import { useState } from 'react';
import { ClipboardList, Play, Check } from 'lucide-react';
// import api from '../../../../services/api';

export const AdminPayroll = () => {
  const [period, setPeriod] = useState('2024-06');
  const [generating, setGenerating] = useState(false);
  
  // Lista simulada de empleados para procesar
  const employees = [
    { id: 1, name: 'Dr. Gregory House', role: 'Psicólogo' },
    { id: 2, name: 'Dra. Lisa Cuddy', role: 'Psiquiatra' },
    { id: 3, name: 'James Wilson', role: 'Oncología (Test)' },
  ];

  const handleGenerate = async (employeeId: number) => {
    setGenerating(true);
    try {
        // await api.post('/payroll/generate', { employeeId, period });
        alert(`Nómina generada para empleado ID: ${employeeId}`);
    } catch (error) {
        alert("Error generando nómina");
    } finally {
        setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-purple-600" /> Gestión de Nómina
            </h2>
            <p className="text-slate-500 text-sm">Selecciona el periodo para procesar pagos</p>
         </div>
         <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Periodo:</label>
            <input 
                type="month" 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg p-2"
            />
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600">Empleado</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Rol</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Estado Nómina</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Acción</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-slate-800">{emp.name}</td>
                        <td className="p-4 text-slate-500">{emp.role}</td>
                        <td className="p-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Pendiente de Cálculo</span>
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => handleGenerate(emp.id)}
                                disabled={generating}
                                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium disabled:text-gray-400"
                            >
                                <Play size={16} /> Procesar
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
       </div>
    </div>
  );
};