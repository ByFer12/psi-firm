import { useState, useEffect } from 'react';
import { api } from '../../../../../lib/api'; // Ajusta la ruta
import { X, Activity, FileText } from 'lucide-react';
import { Button } from '../../../../../components/UI/Button';
import { toast } from 'react-toastify';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    areaData?: any; // Si viene data, es EDICIÓN
}

export const CreateAreaModal = ({ onClose, onSuccess, areaData }: Props) => {
    const [loading, setLoading] = useState(false);
    const isEdit = !!areaData;
    console.log("Areaaa dataaaa: ", areaData)

    const [formData, setFormData] = useState({
        name: '', 
        description: ''
    });

    useEffect(() => {
        if (isEdit && areaData) {
            setFormData({
                name: areaData.name,
                description: areaData.description || ''
            });
        }
    }, [areaData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.patch(`/clinical-areas/${areaData.id}`, formData);
                toast.success("Área actualizada correctamente");
            } else {
                await api.post('/clinical-areas', formData);
                toast.success("Área creada correctamente");
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
                
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="font-bold text-lg text-slate-800">
                        {isEdit ? 'Editar Área Clínica' : 'Nueva Área Clínica'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <Activity size={14} className="inline mr-1"/> Nombre del Área
                        </label>
                        <input 
                            required 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Ej. Terapia Familiar, Neuropsicología..."
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <FileText size={14} className="inline mr-1"/> Descripción (Opcional)
                        </label>
                        <textarea 
                            rows={3}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                            placeholder="Breve descripción de los servicios..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};