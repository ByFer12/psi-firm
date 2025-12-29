import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../../lib/api';
import { X, Calendar, User, Search, Check } from 'lucide-react';
import { Button } from '../../../../../components/UI/Button';
import { toast } from 'react-toastify';

export const GeneratePayrollModal = ({ onClose, onSuccess }: any) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    
    // Estados de Búsqueda y Selección
    const [searchTerm, setSearchTerm] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Formulario
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/auth/employees');
                setEmployees(res.data);
            } catch (error) {
                toast.error("Error cargando lista de empleados");
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, []);

    // Lógica de filtrado por nombre o ID
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toString().includes(searchTerm)
        );
    }, [employees, searchTerm]);

    // Encontrar el empleado seleccionado para mostrar su nombre en el input
    const selectedEmployee = employees.find(emp => emp.id.toString() === employeeId);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!employeeId) return toast.warning("Seleccione un empleado");

        try {
            setGenerating(true);
            const res = await api.post('/payroll/generate', {
                employeeId: Number(employeeId),
                period: period
            });
            
            toast.success(res.data.message || "Nómina generada correctamente");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error generando nómina");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-lg text-slate-800">Generar Nómina Mensual</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Buscador de Empleados Custom */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <User size={16} className="text-teal-600"/> Empleado
                        </label>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Buscar por nombre o ID..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                                value={showDropdown ? searchTerm : (selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : searchTerm)}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                            />
                        </div>

                        {/* Dropdown de resultados */}
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto border-slate-200 animate-in slide-in-from-top-2">
                                {loadingEmployees ? (
                                    <div className="p-3 text-sm text-slate-500">Cargando...</div>
                                ) : filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(emp => (
                                        <div 
                                            key={emp.id}
                                            className={`flex items-center justify-between p-3 hover:bg-teal-50 cursor-pointer transition-colors ${employeeId === emp.id.toString() ? 'bg-teal-50' : ''}`}
                                            onClick={() => {
                                                setEmployeeId(emp.id.toString());
                                                setSearchTerm(''); // Limpia busqueda para mostrar el nombre
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    #{emp.id} - {emp.firstName} {emp.lastName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 uppercase">{emp.position}</span>
                                            </div>
                                            {employeeId === emp.id.toString() && <Check size={16} className="text-teal-600" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-sm text-slate-500 italic">No se encontraron empleados.</div>
                                )}
                            </div>
                        )}
                        
                        {/* Overlay invisible para cerrar el dropdown al hacer clic fuera */}
                        {showDropdown && (
                            <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)}></div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Calendar size={16} className="text-teal-600"/> Periodo (Mes)
                        </label>
                        <input 
                            type="month" 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            required
                        />
                    </div>

                    <div className="pt-4 flex gap-3 relative z-10">
                        <Button type="button" variant="outline" fullWidth onClick={onClose}>Cancelar</Button>
                        <Button type="submit" fullWidth disabled={generating || !employeeId}>
                            {generating ? 'Calculando...' : 'Calcular y Generar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};