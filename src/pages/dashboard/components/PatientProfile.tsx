import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/UI/Button';
import { Input } from '../../../components/UI/Input';
import { 
  User, Phone, MapPin, HeartPulse, Save, Edit2, 
  Camera, Lock, Key, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';

export const PatientProfile = ({ onProfileComplete }: { onProfileComplete?: () => void }) => {
  const { user } = useAuth(); // Obtenemos info básica del usuario (email, username)
  
  // Estados de Control
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [profileExists, setProfileExists] = useState(false);

  // Estado del Formulario de Datos
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identification: '', 
    birthDate: '',
    genderId: 1,
    maritalStatusId: 1,
    occupation: '',
    educationLevelId: 3,
    address: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactRelationshipId: 1,
    emergencyContactPhone: '',
    referralSourceId: 1,
    referralOther: '',
    consultationReason: ''
  });

  // Estado del Formulario de Contraseña
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cargar perfil al iniciar
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      if (res.data) {
        setProfileExists(true);
        // Formatear fecha para el input type="date" (YYYY-MM-DD)
        const date = res.data.birthDate ? new Date(res.data.birthDate).toISOString().split('T')[0] : '';
        
        setFormData({
            ...res.data,
            birthDate: date,
            // Asegurarnos que los selects tengan valor numérico
            genderId: res.data.genderId || 1,
            maritalStatusId: res.data.maritalStatusId || 1,
            educationLevelId: res.data.educationLevelId || 1,
            emergencyContactRelationshipId: res.data.emergencyContactRelationshipId || 1,
            referralSourceId: res.data.referralSourceId || 1
        });
      }
    } catch (error) {
      setProfileExists(false); // No tiene perfil, debe crearlo
      setIsEditing(true); // Activar edición automáticamente
    } finally {
      setLoading(false);
    }
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar Datos (Crear o Actualizar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        genderId: Number(formData.genderId),
        maritalStatusId: Number(formData.maritalStatusId),
        educationLevelId: Number(formData.educationLevelId),
        emergencyContactRelationshipId: Number(formData.emergencyContactRelationshipId),
        referralSourceId: Number(formData.referralSourceId)
      };

      if (profileExists) {
        // ACTUALIZAR (PUT)
        await api.put('/profile/patient', payload);
        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
      } else {
        // CREAR (POST)
        await api.post('/profile/patient', payload);
        toast.success('Perfil creado exitosamente');
        setProfileExists(true);
        setIsEditing(false);
        if (onProfileComplete) onProfileComplete();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  // Cambiar Contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("Las nuevas contraseñas no coinciden");
    }
    if (passData.newPassword.length < 6) {
        return toast.error("La contraseña debe tener al menos 6 caracteres");
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      toast.success("Contraseña actualizada. Por favor inicia sesión nuevamente.");
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  const handlePhotoUpload = () => {
    // Aquí iría la lógica de subida de imagen al backend
    toast.info("Funcionalidad de subida de foto próximamente.");
  };

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* 1. CABECERA DE PERFIL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-3xl font-bold border-4 border-white shadow-sm overflow-hidden">
                {/* Si tuvieras avatarUrl úsalo aquí, si no, iniciales */}
                {user?.username.substring(0,2).toUpperCase()}
            </div>
            {/* Botón flotante para cambiar foto */}
            <button 
                onClick={handlePhotoUpload}
                className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full hover:bg-teal-600 transition shadow-sm"
                title="Cambiar foto"
            >
                <Camera size={16} />
            </button>
        </div>
        
        <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
                {formData.firstName ? `${formData.firstName} ${formData.lastName}` : user?.username}
            </h1>
            <p className="text-slate-500">{user?.email}</p>
            {!profileExists && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    <AlertTriangle size={12}/> Perfil Incompleto
                </span>
            )}
            {profileExists && (
                 <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    <CheckCircle size={12}/> Paciente Activo
                </span>
            )}
        </div>

        {/* Botones de Acción Global */}
        <div className="flex gap-2">
            {profileExists && !isEditing && (
                <Button variant="outline" onClick={() => { setIsEditing(true); setActiveTab('info'); }}>
                    <Edit2 size={16} className="mr-2"/> Editar Datos
                </Button>
            )}
        </div>
      </div>

      {/* 2. PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4">
        <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info' 
                ? 'border-teal-600 text-teal-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
            <span className="flex items-center gap-2"><User size={18}/> Información Personal</span>
        </button>
        {profileExists && (
            <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <span className="flex items-center gap-2"><Lock size={18}/> Seguridad</span>
            </button>
        )}
      </div>

      {/* 3. CONTENIDO DE PESTAÑAS */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 md:p-8">
        
        {/* --- PESTAÑA: INFORMACIÓN PERSONAL --- */}
        {activeTab === 'info' && (
            <form onSubmit={handleSaveProfile} className="space-y-8">
                 {/* BLOQUE 1: Datos Personales */}
                 <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="text-teal-600" size={20}/> Datos Básicos
                    </h3>
                    <div className="grid md:grid-cols-2 gap-5">
                        <Input disabled={!isEditing} name="firstName" label="Nombres" value={formData.firstName} onChange={handleInfoChange} required />
                        <Input disabled={!isEditing} name="lastName" label="Apellidos" value={formData.lastName} onChange={handleInfoChange} required />
                        {/* Identificación y Fecha Nacimiento bloqueados en edición por seguridad, o permitidos según política */}
                        <Input disabled={profileExists} name="identification" label="DPI / CUI" value={formData.identification} onChange={handleInfoChange} required />
                        <Input disabled={profileExists} type="date" name="birthDate" label="Fecha Nacimiento" value={formData.birthDate} onChange={handleInfoChange} required />
                        
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Género</label>
                            <select disabled={!isEditing} name="genderId" value={formData.genderId} onChange={handleInfoChange} className="w-full border p-2 rounded-lg disabled:bg-gray-100">
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                                <option value={3}>Otro</option>
                            </select>
                        </div>
                         <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Estado Civil</label>
                            <select disabled={!isEditing} name="maritalStatusId" value={formData.maritalStatusId} onChange={handleInfoChange} className="w-full border p-2 rounded-lg disabled:bg-gray-100">
                                <option value={1}>Soltero/a</option>
                                <option value={2}>Casado/a</option>
                                <option value={3}>Divorciado/a</option>
                            </select>
                        </div>
                    </div>
                 </div>

                 {/* BLOQUE 2: Contacto */}
                 <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Phone className="text-teal-600" size={20}/> Contacto
                    </h3>
                    <div className="grid md:grid-cols-2 gap-5">
                        <Input disabled={!isEditing} name="phone" label="Teléfono" value={formData.phone} onChange={handleInfoChange} required />
                        <Input disabled={!isEditing} name="address" label="Dirección" value={formData.address} onChange={handleInfoChange} required />
                        <Input disabled={!isEditing} name="occupation" label="Ocupación" value={formData.occupation} onChange={handleInfoChange} required />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Nivel Educativo</label>
                            <select disabled={!isEditing} name="educationLevelId" value={formData.educationLevelId} onChange={handleInfoChange} className="w-full border p-2 rounded-lg disabled:bg-gray-100">
                                <option value={1}>Primaria</option>
                                <option value={3}>Diversificado</option>
                                <option value={4}>Universitario</option>
                            </select>
                        </div>
                    </div>
                 </div>

                 {/* BLOQUE 3: Emergencia (Solo visible en edición o creación para ahorrar espacio, o siempre visible) */}
                 <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <HeartPulse className="text-teal-600" size={20}/> Contacto de Emergencia
                    </h3>
                    <div className="grid md:grid-cols-3 gap-5">
                        <Input disabled={!isEditing} name="emergencyContactName" label="Nombre" value={formData.emergencyContactName} onChange={handleInfoChange} required />
                        <Input disabled={!isEditing} name="emergencyContactPhone" label="Teléfono" value={formData.emergencyContactPhone} onChange={handleInfoChange} required />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Parentesco</label>
                            <select disabled={!isEditing} name="emergencyContactRelationshipId" value={formData.emergencyContactRelationshipId} onChange={handleInfoChange} className="w-full border p-2 rounded-lg disabled:bg-gray-100">
                                <option value={1}>Padre/Madre</option>
                                <option value={3}>Cónyuge</option>
                                <option value={5}>Otro</option>
                            </select>
                        </div>
                    </div>
                 </div>

                 {!profileExists && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Motivo Inicial</h3>
                        <Input name="consultationReason" label="Motivo de Consulta" value={formData.consultationReason} onChange={handleInfoChange} required />
                     </div>
                 )}

                 {/* Botones del Formulario Info */}
                 {isEditing && (
                     <div className="flex gap-4 pt-4 border-t">
                        <Button type="submit" className="px-8">
                            <Save size={18} className="mr-2"/> Guardar Cambios
                        </Button>
                        {profileExists && (
                            <Button type="button" variant="outline" onClick={() => { setIsEditing(false); loadProfile(); }}>
                                Cancelar
                            </Button>
                        )}
                     </div>
                 )}
            </form>
        )}

        {/* --- PESTAÑA: SEGURIDAD --- */}
        {activeTab === 'security' && (
            <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Cambiar Contraseña</h3>
                <p className="text-slate-500 text-sm mb-6">Asegúrate de usar una contraseña segura que no uses en otros sitios.</p>
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="relative">
                        <Key className="absolute left-3 top-9 text-slate-400 w-4 h-4" />
                        <Input 
                            type="password" 
                            name="currentPassword" 
                            label="Contraseña Actual" 
                            className="pl-9"
                            value={passData.currentPassword} 
                            onChange={handlePassChange} 
                            required 
                        />
                    </div>
                    <hr className="border-gray-100 my-2"/>
                    <Input 
                        type="password" 
                        name="newPassword" 
                        label="Nueva Contraseña" 
                        value={passData.newPassword} 
                        onChange={handlePassChange} 
                        required 
                    />
                    <Input 
                        type="password" 
                        name="confirmPassword" 
                        label="Confirmar Nueva Contraseña" 
                        value={passData.confirmPassword} 
                        onChange={handlePassChange} 
                        required 
                    />

                    <div className="pt-4">
                        <Button type="submit" fullWidth>
                            Actualizar Contraseña
                        </Button>
                    </div>
                </form>
            </div>
        )}

      </div>
    </div>
  );
};