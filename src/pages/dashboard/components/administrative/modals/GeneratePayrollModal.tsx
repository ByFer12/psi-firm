import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../../lib/api';
import { X, Calendar, User, Search, Check, DollarSign } from 'lucide-react';
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
    
    // --- ESTADOS PARA BONO MANUAL ---
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusConcept, setBonusConcept] = useState('');
    // --------------------------------

    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                // Traemos solo los activos para nómina
                const res = await api.get('/auth/employees');
                const activeEmployees = res.data.filter((e: any) => e.status === 'ACTIVE');
                setEmployees(activeEmployees);
            } catch (error) {
                toast.error("Error cargando lista de empleados");
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, []);

    // Filtrado
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toString().includes(searchTerm)
        );
    }, [employees, searchTerm]);

    const selectedEmployee = employees.find(emp => emp.id.toString() === employeeId);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!employeeId) return toast.warning("Seleccione un empleado");

        // Validación simple de bono manual
        if (Number(bonusAmount) > 0 && !bonusConcept.trim()) {
            return toast.warning("Si agregas un bono, debes indicar el motivo.");
        }

        try {
            setGenerating(true);
            const res = await api.post('/payroll/generate', {
                employeeId: Number(employeeId),
                period: period,
                // Enviamos los datos opcionales
                bonusAmount: Number(bonusAmount) || 0,
                bonusConcept: bonusConcept
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-lg text-slate-800">Generar Nómina</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    
                    {/* SELECCIONAR EMPLEADO */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <User size={16} className="text-teal-600"/> Empleado a Pagar
                        </label>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Buscar colaborador..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                                value={showDropdown ? searchTerm : (selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : searchTerm)}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                            />
                        </div>

                        {showDropdown && (
                            <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto border-slate-200">
                                {loadingEmployees ? (
                                    <div className="p-3 text-sm text-slate-500">Cargando...</div>
                                ) : filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(emp => (
                                        <div 
                                            key={emp.id}
                                            className={`flex items-center justify-between p-3 hover:bg-teal-50 cursor-pointer transition-colors ${employeeId === emp.id.toString() ? 'bg-teal-50' : ''}`}
                                            onClick={() => {
                                                setEmployeeId(emp.id.toString());
                                                setSearchTerm(''); 
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {emp.firstName} {emp.lastName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 uppercase">{emp.position}</span>
                                            </div>
                                            {employeeId === emp.id.toString() && <Check size={16} className="text-teal-600" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-sm text-slate-500 italic">No encontrado.</div>
                                )}
                            </div>
                        )}
                        {showDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>}
                    </div>

                    {/* PERIODO */}
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

                    {/* SECCIÓN BONO MANUAL */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="text-xs font-bold text-orange-800 uppercase mb-3 flex items-center gap-1">
                            <DollarSign size={12}/> Bonificaciones Adicionales (Opcional)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Monto (Q)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full p-2 border border-orange-200 rounded focus:ring-2 focus:ring-orange-400 outline-none text-sm bg-white"
                                    value={bonusAmount}
                                    onChange={(e) => setBonusAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Concepto / Razón</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. Puntualidad, Ventas..."
                                    className="w-full p-2 border border-orange-200 rounded focus:ring-2 focus:ring-orange-400 outline-none text-sm bg-white"
                                    value={bonusConcept}
                                    onChange={(e) => setBonusConcept(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="outline" fullWidth onClick={onClose}>Cancelar</Button>
                        <Button type="submit" fullWidth disabled={generating || !employeeId}>
                            {generating ? 'Calculando...' : 'Generar Nómina'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};