import { useState } from 'react';
import { api } from '../../../../../lib/api';
import { X } from 'lucide-react';
import { Button } from '../../../../../components/UI/Button';
import { toast } from 'react-toastify';

export const CreateProductModal = ({ onClose, onSuccess }: any) => {
    const [formData, setFormData] = useState({
        name: '', categoryId: 1, price: '', minStock: 5, unitId: 1
    });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await api.post('/inventory/products', formData);
            toast.success("Producto creado exitosamente");
            onSuccess();
        } catch (error: any) {
            toast.error("Error al crear producto");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg text-slate-800">Nuevo Producto</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                        <input required autoFocus type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio (Q.)</label>
                            <input required type="number" step="0.01" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
                            <input required type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                             <select className="w-full p-2 border rounded-lg bg-white" 
                                value={formData.categoryId} 
                                onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}>
                                <option value={1}>General</option>
                                <option value={2}>Medicamentos</option>
                                <option value={3}>Insumos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                            <select className="w-full p-2 border rounded-lg bg-white" 
                                value={formData.unitId} 
                                onChange={e => setFormData({...formData, unitId: Number(e.target.value)})}>
                                <option value={1}>Unidad (U)</option>
                                <option value={2}>Caja</option>
                                <option value={3}>Frasco</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" fullWidth onClick={onClose}>Cancelar</Button>
                        <Button type="submit" fullWidth>Guardar</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};