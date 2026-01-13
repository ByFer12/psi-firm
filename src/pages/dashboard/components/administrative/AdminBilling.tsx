import { useState } from 'react';
import { Search, DollarSign, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../lib/api';
import { toast } from 'react-toastify';
import { Button } from '../../../../components/UI/Button';
interface PendingInvoice {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    subtotal: number;
    tax: number;
    total: number;
    details: Array<{
        itemDescription: string;
        unitPrice: number;
    }>;
}

export const AdminBilling = () => {
    const [dpi, setDpi] = useState('');
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    const [patient, setPatient] = useState<any>(null);
    const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);
    
    // Datos del pago
    const [paymentMethodId, setPaymentMethodId] = useState(1); // 1=Efectivo
    const [tax, setTax] = useState(0);
    const [paymentReference, setPaymentReference] = useState('');
    const [notes, setNotes] = useState('');

    const handleSearch = async () => {
        if (!dpi) return;
        
        setLoading(true);
        try {
            const res = await api.get(`/bilding/pending-by-dpi/${dpi}`);
            console.log("Factira",res.data);
            setPatient(res.data.patient);
            setPendingInvoices(res.data.pendingInvoices);
            
            if (res.data.pendingInvoices.length === 0) {
                toast.info("Este paciente no tiene facturas pendientes");
            } else {
                setSelectedInvoice(res.data.pendingInvoices[0]);
                setTax(0);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Paciente no encontrado");
            setPatient(null);
            setPendingInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayment = async () => {
        if (!selectedInvoice) return;
        
        setProcessing(true);
        try {
            await api.patch(`/bilding/invoice/${selectedInvoice.id}/complete-payment`, {
                paymentMethodId,
                tax: Number(tax),
                paymentReference,
                notes
            });

            toast.success("Pago registrado correctamente");
            
            // Resetear
            setDpi('');
            setPatient(null);
            setPendingInvoices([]);
            setSelectedInvoice(null);
            setTax(0);
            setPaymentReference('');
            setNotes('');
            
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al procesar pago");
        } finally {
            setProcessing(false);
        }
    };

    const totalWithTax = selectedInvoice ? Number(selectedInvoice.subtotal) + Number(tax) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Buscador */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Search size={20} className="text-blue-600"/> Cobrar Factura
                </h2>
                <div className="flex gap-3">
                    <input 
                        type="text"
                        placeholder="Ingrese DPI del paciente"
                        className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={dpi}
                        onChange={e => setDpi(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading || !dpi}>
                        {loading ? <Loader2 className="animate-spin"/> : 'Buscar'}
                    </Button>
                </div>
            </div>

            {/* Datos del Paciente */}
            {patient && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-2">Paciente Encontrado</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600">Nombre:</span>
                            <p className="font-bold">{patient.name}</p>
                        </div>
                        <div>
                            <span className="text-blue-600">DPI:</span>
                            <p className="font-bold">{patient.dpi}</p>
                        </div>
                        <div>
                            <span className="text-blue-600">Teléfono:</span>
                            <p className="font-bold">{patient.phone}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Factura Seleccionada */}
            {selectedInvoice && (
                <div className="grid lg:grid-cols-3 gap-6">
                    
                    {/* Detalles */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <h3 className="font-bold text-lg border-b pb-2">
                            Factura: {selectedInvoice.invoiceNumber}
                        </h3>
                        
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="text-left p-2">Concepto</th>
                                    <th className="text-right p-2">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedInvoice.details.map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-2">{item.itemDescription}</td>
                                        <td className="p-2 text-right font-bold">
                                            Q {Number(item.unitPrice).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totales */}
                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span className="font-bold">Q {Number(selectedInvoice.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span>Impuestos:</span>
                                <input 
                                    type="number"
                                    step="0.01"
                                    className="w-32 border rounded px-2 py-1 text-right"
                                    value={tax}
                                    onChange={e => setTax(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-between text-xl font-bold text-teal-700 pt-2 border-t-2">
                                <span>TOTAL:</span>
                                <span>Q {totalWithTax.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de Pago */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <DollarSign className="text-green-600"/> Registrar Pago
                        </h3>

                        <div>
                            <label className="block text-sm font-medium mb-2">Método de Pago</label>
                            <select 
                                className="w-full border rounded-lg p-2"
                                value={paymentMethodId}
                                onChange={e => setPaymentMethodId(Number(e.target.value))}
                            >
                                <option value={1}>Efectivo</option>
                                <option value={2}>Tarjeta de Crédito</option>
                                <option value={3}>Tarjeta de Débito</option>
                                <option value={4}>Transferencia</option>
                            </select>
                        </div>

                        {paymentMethodId !== 1 && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Referencia/Voucher</label>
                                <input 
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Ej: Auth 123456"
                                    value={paymentReference}
                                    onChange={e => setPaymentReference(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Notas (Opcional)</label>
                            <textarea 
                                className="w-full border rounded-lg p-2 text-sm resize-none"
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        <Button 
                            fullWidth
                            onClick={handleCompletePayment}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processing ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>}
                            Registrar Pago
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};