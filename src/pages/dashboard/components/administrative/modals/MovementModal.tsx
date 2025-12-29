import { useState } from 'react';
import { api } from '../../../../../lib/api';
import { X, ArrowUpCircle, ArrowDownCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../../../components/UI/Button';
import { toast } from 'react-toastify';

export const MovementModal = ({ product, onClose, onSuccess }: any) => {
    const [formData, setFormData] = useState({
        typeId: 1, 
        quantity: 1,
        reason: ''
    });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await api.post('/inventory/movements', { productId: product.id, ...formData });
            toast.success("Movimiento registrado");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Ajustar Stock</h3>
                        <p className="text-xs text-slate-500 font-mono">{product.name} • Stock: {product.stock}</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3"> {/* Cambiado a 2 columnas para que el texto quepa mejor */}
                        {[
                            { id: 1, label: 'Entrada', desc: 'Compra o ingreso', icon: ArrowUpCircle, color: 'emerald' },
                            { id: 2, label: 'Salida', desc: 'Venta o uso', icon: ArrowDownCircle, color: 'blue' },
                            { id: 4, label: 'Merma', desc: 'Daño o vencido', icon: AlertTriangle, color: 'red' },
                            { id: 3, label: 'Ajuste', desc: 'Corrección manual', icon: RefreshCw, color: 'orange' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, typeId: type.id })}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${formData.typeId === type.id
                                        ? `bg-${type.color}-50 border-${type.color}-500 ring-1 ring-${type.color}-500`
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <type.icon size={24} className={formData.typeId === type.id ? `text-${type.color}-600` : 'text-slate-400'} />
                                <div>
                                    <span className={`block text-xs font-bold uppercase ${formData.typeId === type.id ? `text-${type.color}-700` : 'text-slate-600'}`}>
                                        {type.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 leading-none">{type.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad a Mover</label>
                        <input required type="number" min="1" className="w-full p-2 border rounded-lg text-lg font-bold text-center"
                            value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Justificación</label>
                        <textarea required rows={2} className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Compra, Venta mostrador, Caducidad..."
                            value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                    </div>

                    <div className="pt-2">
                         <Button type="submit" fullWidth>Confirmar Movimiento</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};