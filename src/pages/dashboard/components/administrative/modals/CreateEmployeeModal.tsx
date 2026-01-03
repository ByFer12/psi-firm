import { useState, useEffect } from 'react';
import { api } from '../../../../../lib/api';
import { X, User, Shield, Briefcase, Stethoscope, Mail, Info, Activity } from 'lucide-react';
import { Button } from '../../../../../components/UI/Button';
import { toast } from 'react-toastify';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    employeeData?: any;
}

export const CreateEmployeeModal = ({ onClose, onSuccess, employeeData }: Props) => {
    const [specialties, setSpecialties] = useState<any[]>([]);
    const [activeAreas, setActiveAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const isEdit = !!employeeData;

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', identification: '', birthDate: '', 
        phone: '', address: '', hireDate: new Date().toISOString().split('T')[0], 
        genderId: 1, baseSalary: '', email: '', username: '',
        roleId: 4, // 4 = Administrativo por defecto
        
        // Datos Clínicos
        professionalLicense: '', specialtyId: '', sessionRate: '',
        areaId: '' // Un solo ID de área
    });

    useEffect(() => {
        const initData = async () => {
            try {
                // Cargar catálogos
                const [specRes, areaRes] = await Promise.all([
                    api.get('/specialties/'),
                    api.get('/clinical-areas?active=true') 
                ]);
                setSpecialties(specRes.data);
                setActiveAreas(areaRes.data);
            } catch (err) { console.error("Error cargando catálogos", err); }

            // Lógica de carga para EDICIÓN
            if (isEdit && employeeData) {
                
                // 1. Obtener Rol (puede venir en .roleId o .user.roleId)
                const roleIdValue = employeeData.roleId || employeeData.user?.roleId || 4;

                // 2. Obtener Datos Clínicos
                const clinical = employeeData.clinicalData || {};

                setFormData(prev => ({
                    ...prev,
                    firstName: employeeData.firstName || '',
                    lastName: employeeData.lastName || '',
                    identification: employeeData.identification || '',
                    phone: employeeData.phone || '',
                    address: employeeData.address || '',
                    baseSalary: employeeData.baseSalary || '',
                    genderId: employeeData.genderId || 1,
                    email: employeeData.email || employeeData.user?.email || '',
                    username: employeeData.username || employeeData.user?.username || '',
                    
                    // Fechas formateadas YYYY-MM-DD
                    birthDate: employeeData.birthDate ? new Date(employeeData.birthDate).toISOString().split('T')[0] : '',
                    hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toISOString().split('T')[0] : '',
                    
                    // ROL CRÍTICO
                    roleId: roleIdValue,

                    // DATOS CLÍNICOS
                    professionalLicense: clinical.professionalLicense || '',
                    specialtyId: clinical.specialtyId || '',
                    sessionRate: clinical.sessionRate || '',
                    areaId: clinical.areaId || '' // Cargar el ID del área única
                }));
            }
        };
        initData();
    }, [employeeData, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Determinar si mostrar campos clínicos
    const isClinicalRole = Number(formData.roleId) === 2 || Number(formData.roleId) === 3;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = { ...formData };
            
            if (isEdit) {
                await api.patch(`/auth/employees/${employeeData.id}`, payload);
                toast.success("Empleado actualizado correctamente.");
            } else {
                await api.post('/auth/employees', payload);
                toast.success("Empleado creado exitosamente.");
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al procesar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">
                            {isEdit ? `Editando: ${employeeData.firstName} ${employeeData.lastName}` : 'Nuevo Colaborador'}
                        </h3>
                        <p className="text-sm text-slate-500">Gestión de personal y roles.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X /></button>
                </div>
                
                {/* Body */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <form id="employeeForm" onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* 1. ROL Y ACCESO */}
                        <section>
                            <h4 className="flex items-center gap-2 font-bold text-teal-700 mb-4 border-b border-teal-100 pb-2">
                                <Shield size={18}/> 1. Rol y Acceso
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Rol en el Sistema</label>
                                    <select name="roleId" className="input bg-white font-medium text-slate-700" 
                                        value={formData.roleId} onChange={handleChange}>
                                        <option value="4">Administrativo / RRHH</option>
                                        <option value="5">Mantenimiento</option>
                                        <option value="2">Psicólogo Clínico</option>
                                        <option value="3">Psiquiatra</option>
                                        <option value="1">Administrador Total</option>
                                    </select>
                                    {isEdit && <p className="text-xs text-blue-500 mt-1">Nota: Cambiar el rol ajustará los permisos inmediatamente.</p>}
                                </div>
                                <div className="md:col-span-2 grid md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="label">Email Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                            <input required type="email" name="email" className="input pl-9 disabled:bg-gray-100" 
                                                value={formData.email} onChange={handleChange} disabled={isEdit} />
                                        </div>
                                    </div>
                                    {!isEdit && (
                                        <div>
                                            <label className="label">Nombre de Usuario</label>
                                            <input required name="username" className="input" 
                                                value={formData.username} onChange={handleChange} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 2. DATOS PERSONALES */}
                        <section>
                            <h4 className="flex items-center gap-2 font-bold text-teal-700 mb-4 border-b border-teal-100 pb-2">
                                <User size={18}/> 2. Datos Personales
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="label">Nombres</label>
                                    <input required name="firstName" value={formData.firstName} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Apellidos</label>
                                    <input required name="lastName" value={formData.lastName} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">DPI</label>
                                    <input required name="identification" value={formData.identification} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">F. Nacimiento</label>
                                    <input required type="date" name="birthDate" value={formData.birthDate} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input required name="phone" value={formData.phone} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Salario Base (Q.)</label>
                                    <input required type="number" name="baseSalary" value={formData.baseSalary} className="input" onChange={handleChange}/>
                                </div>
                            </div>
                        </section>

                        {/* 3. FICHA CLÍNICA (Solo si es clínico) */}
                        {isClinicalRole && (
                            <section className="bg-purple-50 p-6 rounded-xl border border-purple-100 animate-in slide-in-from-top-4">
                                <h4 className="flex items-center gap-2 font-bold text-purple-700 mb-4">
                                    <Stethoscope size={20}/> 3. Asignación Clínica (Requerido)
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div>
                                        <label className="label text-purple-900">No. Colegiado</label>
                                        <input required name="professionalLicense" value={formData.professionalLicense} className="input border-purple-200" onChange={handleChange}/>
                                    </div>
                                    <div>
                                        <label className="label text-purple-900">Tarifa Consulta (Q.)</label>
                                        <input type="number" name="sessionRate" value={formData.sessionRate} className="input border-purple-200" onChange={handleChange}/>
                                    </div>
                                    <div>
                                        <label className="label text-purple-900">Especialidad Principal</label>
                                        <select required name="specialtyId" value={formData.specialtyId} className="input border-purple-200 bg-white" onChange={handleChange}>
                                            <option value="">-- Seleccionar --</option>
                                            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    {/* ÁREA ÚNICA - SELECT */}
                                    <div>
                                        <label className="label text-purple-900 flex items-center gap-2">
                                            <Activity size={14}/> Área de Atención
                                        </label>
                                        <select required name="areaId" value={formData.areaId} className="input border-purple-200 bg-white font-medium" onChange={handleChange}>
                                            <option value="">-- Asignar Área --</option>
                                            {activeAreas.map(area => (
                                                <option key={area.id} value={area.id}>{area.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-purple-600 mt-1">El profesional solo puede pertenecer a un área clínica principal.</p>
                                    </div>
                                </div>
                            </section>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" form="employeeForm" disabled={loading} className="px-8 shadow-lg shadow-teal-900/10">
                        {loading ? 'Procesando...' : 'Guardar Información'}
                    </Button>
                </div>

                <style>{`
                    .label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.3rem; }
                    .input { width: 100%; padding: 0.6rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; transition: border-color 0.2s; }
                    .input:focus { border-color: #0d9488; ring: 1px; }
                `}</style>
            </div>
        </div>
    );
};