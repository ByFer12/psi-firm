import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { Button } from '../../../../components/UI/Button';
import { Input } from '../../../../components/UI/Input';
import { 
  User, Phone, HeartPulse, Save, Edit2, 
  Camera, Lock,AlertTriangle, CheckCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';

interface PatientProfileProps {
  onProfileComplete?: () => void;
  initialData?: any;
}

export const PatientProfile = ({ onProfileComplete, initialData }: PatientProfileProps) => {
  const { user } = useAuth();
  
  // Estados de Control
  const [isEditing, setIsEditing] = useState(!initialData);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [profileExists, setProfileExists] = useState(!!initialData);

  // Estado del Formulario sincronizado con initialData
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    identification: initialData?.identification || '', 
    birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    genderId: initialData?.genderId || 1,
    maritalStatusId: initialData?.maritalStatusId || 1,
    occupation: initialData?.occupation || '',
    educationLevelId: initialData?.educationLevelId || 3,
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    emergencyContactName: initialData?.emergencyContactName || '',
    emergencyContactRelationshipId: initialData?.emergencyContactRelationshipId || 1,
    emergencyContactPhone: initialData?.emergencyContactPhone || '',
    referralSourceId: initialData?.referralSourceId || 1,
    referralOther: initialData?.referralOther || '',
    consultationReason: initialData?.consultationReason || ''
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Si los datos en el Dashboard cambian, actualizamos el formulario local
  useEffect(() => {
    if (initialData) {
      setProfileExists(true);
      setFormData(prev => ({
        ...prev,
        ...initialData,
        birthDate: initialData.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : ''
      }));
    }
  }, [initialData]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassData(prev => ({ ...prev, [name]: value }));
  };

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
        await api.put('/profile/patient', payload);
        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
        if (onProfileComplete) onProfileComplete();
      } else {
        await api.post('/profile/patient', payload);
        toast.success('Perfil creado exitosamente');
        if (onProfileComplete) onProfileComplete();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) return toast.error("Las contraseñas no coinciden");
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      toast.success("Contraseña actualizada");
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-3xl font-bold border-4 border-white shadow-sm overflow-hidden">
                {(formData.firstName || user?.username)?.substring(0,2).toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full hover:bg-teal-600 transition shadow-sm">
                <Camera size={16} />
            </button>
        </div>
        
        <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
                {formData.firstName ? `${formData.firstName} ${formData.lastName}` : user?.username}
            </h1>
            <p className="text-slate-500">{user?.email}</p>
            {!profileExists ? (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    <AlertTriangle size={12}/> Perfil Incompleto
                </span>
            ) : (
                 <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    <CheckCircle size={12}/> Paciente Activo
                </span>
            )}
        </div>

        <div className="flex gap-2">
            {profileExists && !isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 size={16} className="mr-2"/> Editar Datos
                </Button>
            )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4">
        <button onClick={() => setActiveTab('info')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500'}`}>
            <span className="flex items-center gap-2"><User size={18}/> Información Personal</span>
        </button>
        {profileExists && (
            <button onClick={() => setActiveTab('security')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'security' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500'}`}>
                <span className="flex items-center gap-2"><Lock size={18}/> Seguridad</span>
            </button>
        )}
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 md:p-8">
        {activeTab === 'info' && (
            <form onSubmit={handleSaveProfile} className="space-y-8">
                 <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="text-teal-600" size={20}/> Datos Básicos
                    </h3>
                    <div className="grid md:grid-cols-2 gap-5">
                        <Input disabled={!isEditing} name="firstName" label="Nombres" value={formData.firstName} onChange={handleInfoChange} required />
                        <Input disabled={!isEditing} name="lastName" label="Apellidos" value={formData.lastName} onChange={handleInfoChange} required />
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

                 {isEditing && (
                     <div className="flex gap-4 pt-4 border-t">
                        <Button type="submit" className="px-8">
                            <Save size={18} className="mr-2"/> Guardar Cambios
                        </Button>
                        {profileExists && (
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                Cancelar
                            </Button>
                        )}
                     </div>
                 )}
            </form>
        )}

        {activeTab === 'security' && (
            <div className="max-w-md mx-auto">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input type="password" name="currentPassword" label="Contraseña Actual" value={passData.currentPassword} onChange={handlePassChange} required />
                    <Input type="password" name="newPassword" label="Nueva Contraseña" value={passData.newPassword} onChange={handlePassChange} required />
                    <Input type="password" name="confirmPassword" label="Confirmar Nueva Contraseña" value={passData.confirmPassword} onChange={handlePassChange} required />
                    <Button type="submit" fullWidth>Actualizar Contraseña</Button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};