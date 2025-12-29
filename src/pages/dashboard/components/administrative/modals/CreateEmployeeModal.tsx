import { useState, useEffect } from 'react';
import { api } from '../../../../../lib/api';
import { X, User, Shield, Briefcase, Stethoscope, Mail, Info } from 'lucide-react';
import { Button } from '../../../../../components/UI/Button';
import { toast } from 'react-toastify';

export const CreateEmployeeModal = ({ onClose, onSuccess, employeeData }: any) => {
    const [specialties, setSpecialties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const isEdit = !!employeeData;

    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        identification: '', 
        birthDate: '', 
        phone: '', 
        address: '', 
        hireDate: new Date().toISOString().split('T')[0], 
        genderId: 1, 
        baseSalary: '',
        email: '', 
        username: '',
        roleId: 4,
        professionalLicense: '', 
        specialtyId: '',
        sessionRate: ''
    });

    useEffect(() => {
        const initModal = async () => {
            // Cargar especialidades
            try {
                const res = await api.get('/specialties/');
                setSpecialties(res.data);
            } catch (err) { console.log("Error especialidades"); }

            // Si es edición, cargar datos del empleado
            if (isEdit) {
                setFormData({
                    ...formData,
                    ...employeeData,
                    // Formatear fechas para los inputs tipo date (YYYY-MM-DD)
                    birthDate: employeeData.birthDate ? employeeData.birthDate.split('T')[0] : '',
                    hireDate: employeeData.hireDate ? employeeData.hireDate.split('T')[0] : '',
                    // Datos clínicos si existen
                    professionalLicense: employeeData.clinicalData?.professionalLicense || '',
                    specialtyId: employeeData.clinicalData?.specialtyId || '',
                    sessionRate: employeeData.clinicalData?.sessionRate || ''
                });
            }
        };
        initModal();
    }, [employeeData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isClinicalRole = Number(formData.roleId) === 2 || Number(formData.roleId) === 3;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.patch(`/auth/employees/${employeeData.id}`, formData);
                toast.success("Datos actualizados correctamente.");
            } else {
                await api.post('/auth/employees', formData);
                toast.success("Empleado creado y credenciales enviadas.");
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al procesar solicitud.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-6 border-b bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">
                            {isEdit ? `Editar: ${employeeData.firstName}` : 'Registrar Nuevo Colaborador'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {isEdit ? 'Actualiza la información laboral y personal.' : 'Crea el usuario y ficha de empleado en un solo paso.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X /></button>
                </div>
                
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <form id="employeeForm" onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* SECCIÓN 1: ROL Y ACCESO */}
                        <section>
                            <h4 className="flex items-center gap-2 font-bold text-teal-700 mb-4 border-b border-teal-100 pb-2">
                                <Shield size={18}/> 1. Rol y Acceso al Sistema
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Rol de Usuario</label>
                                    <select name="roleId" className="input bg-white disabled:bg-gray-100" 
                                        value={formData.roleId} onChange={handleChange} disabled={isEdit}>
                                        <option value="4">Administrativo</option>
                                        <option value="5">Mantenimiento</option>
                                        <option value="2">Psicólogo Clínico</option>
                                        <option value="3">Psiquiatra</option>
                                        <option value="1">Administrador Total</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Nombre de Usuario</label>
                                    <input required name="username" className="input disabled:bg-gray-100" 
                                        value={formData.username} onChange={handleChange} disabled={isEdit} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input required type="email" name="email" className="input pl-10 disabled:bg-gray-100" 
                                            value={formData.email} onChange={handleChange} disabled={isEdit} />
                                    </div>
                                    {isEdit && (
                                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                            <Info size={12}/> Los datos de acceso no pueden modificarse por seguridad.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 2: DATOS PERSONALES */}
                        <section>
                            <h4 className="flex items-center gap-2 font-bold text-teal-700 mb-4 border-b border-teal-100 pb-2">
                                <User size={18}/> 2. Información Personal
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div>
                                    <label className="label">Nombres</label>
                                    <input required name="firstName" value={formData.firstName} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Apellidos</label>
                                    <input required name="lastName" value={formData.lastName} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">DPI / CUI</label>
                                    <input required name="identification" value={formData.identification} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Fecha Nacimiento</label>
                                    <input required type="date" name="birthDate" value={formData.birthDate} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input required name="phone" value={formData.phone} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Género</label>
                                    <select name="genderId" value={formData.genderId} className="input bg-white" onChange={handleChange}>
                                        <option value="1">Masculino</option>
                                        <option value="2">Femenino</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="label">Dirección</label>
                                    <input name="address" value={formData.address} className="input" onChange={handleChange}/>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 3: CONTRATACIÓN */}
                        <section>
                            <h4 className="flex items-center gap-2 font-bold text-teal-700 mb-4 border-b border-teal-100 pb-2">
                                <Briefcase size={18}/> 3. Datos de Contratación
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Fecha de Contratación</label>
                                    <input required type="date" name="hireDate" value={formData.hireDate} className="input" onChange={handleChange}/>
                                </div>
                                <div>
                                    <label className="label">Salario Base (Q.)</label>
                                    <div className="relative">
                                        
                                        <input required type="number" name="baseSalary" value={formData.baseSalary} className="input pl-8" onChange={handleChange}/>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 4: DATOS CLÍNICOS */}
                        {isClinicalRole && (
                            <section className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                                <h4 className="flex items-center gap-2 font-bold text-purple-700 mb-4">
                                    <Stethoscope size={20}/> 4. Credenciales Clínicas
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="label text-purple-900">No. Colegiado</label>
                                        <input required={isClinicalRole} name="professionalLicense" value={formData.professionalLicense} className="input border-purple-200" onChange={handleChange}/>
                                    </div>
                                    <div>
                                        <label className="label text-purple-900">Especialidad</label>
                                        <select required={isClinicalRole} name="specialtyId" value={formData.specialtyId} className="input border-purple-200 bg-white" onChange={handleChange}>
                                            <option value="">-- Seleccionar --</option>
                                            {specialties.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label text-purple-900">Tarifa por Sesión</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-bold">Q.</span>
                                            <input type="number" name="sessionRate" value={formData.sessionRate} className="input pl-8 border-purple-200" onChange={handleChange}/>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="employeeForm" disabled={loading} className="px-8">
                        {loading ? 'Procesando...' : isEdit ? 'Guardar Cambios' : 'Registrar Empleado'}
                    </Button>
                </div>

                <style>{`
                    .label { display: block; font-size: 0.875rem; font-weight: 500; color: #475569; margin-bottom: 0.375rem; }
                    .input { width: 100%; padding: 0.625rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; outline: none; transition: all; font-size: 0.875rem; }
                    .input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1); }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                `}</style>
            </div>
        </div>
    );
};