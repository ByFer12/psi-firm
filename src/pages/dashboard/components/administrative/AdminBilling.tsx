import { useState } from 'react';
import { Search, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
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

interface Patient {
    name: string;
    dpi: string;
    phone: string;
}

export const AdminBilling = () => {
    const [dpi, setDpi] = useState('');
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // AÑADIDO: Estado para facturas pendientes
    const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
    
    const [patient, setPatient] = useState<Patient | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);

    const [paymentMethodId, setPaymentMethodId] = useState(1);
    const [tax, setTax] = useState(0);
    const [paymentReference, setPaymentReference] = useState('');
    const [notes, setNotes] = useState('');

    const handleSearch = async () => {
        if (!dpi) return;

        setLoading(true);
        try {
            const res = await api.get(`/bilding/pending-by-dpi/${dpi}`);

            const invoices: PendingInvoice[] = res.data.pendingInvoices || [];

            setPatient(res.data.patient ?? null);
            setPendingInvoices(invoices);

            if (invoices.length === 0) {
                toast.info('Este paciente no tiene facturas pendientes');
                setSelectedInvoice(null);
            } else {
                setSelectedInvoice(invoices[0]);
                setTax(0);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Paciente no encontrado');
            setPatient(null);
            setPendingInvoices([]);
            setSelectedInvoice(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayment = async () => {
        if (!selectedInvoice) return;

        setProcessing(true);
        try {
            await api.patch(
                `/bilding/invoice/${selectedInvoice.id}/complete-payment`,
                {
                    paymentMethodId,
                    tax: Number(tax),
                    paymentReference,
                    notes
                }
            );

            toast.success('Pago registrado correctamente');

            setDpi('');
            setPatient(null);
            setPendingInvoices([]);
            setSelectedInvoice(null);
            setTax(0);
            setPaymentReference('');
            setNotes('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al procesar pago');
        } finally {
            setProcessing(false);
        }
    };

    const totalWithTax =
        selectedInvoice ? Number(selectedInvoice.subtotal) + Number(tax) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Search size={20} className="text-blue-600" />
                    Cobrar Factura
                </h2>

                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Ingrese DPI del paciente"
                        className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={dpi}
                        onChange={(e) => setDpi(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading || !dpi}>
                        {loading ? (
                            <Loader2 className="animate-spin size-4" />
                        ) : (
                            'Buscar'
                        )}
                    </Button>
                </div>
            </div>

            {patient && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 animate-in fade-in">
                    <h3 className="font-bold text-blue-900 mb-2">
                        Paciente Encontrado
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600 block text-xs font-bold uppercase">
                                Nombre:
                            </span>
                            <p className="font-bold">{patient.name}</p>
                        </div>
                        <div>
                            <span className="text-blue-600 block text-xs font-bold uppercase">
                                DPI:
                            </span>
                            <p className="font-bold">{patient.dpi}</p>
                        </div>
                        <div>
                            <span className="text-blue-600 block text-xs font-bold uppercase">
                                Teléfono:
                            </span>
                            <p className="font-bold">{patient.phone}</p>
                        </div>
                    </div>
                </div>
            )}

            {pendingInvoices.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-slate-800 mb-3">
                        Facturas Pendientes ({pendingInvoices.length})
                    </h3>
                    <div className="space-y-2">
                        {pendingInvoices.map((invoice) => (
                            <button
                                key={invoice.id}
                                onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setTax(0);
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    selectedInvoice?.id === invoice.id
                                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                                        : 'hover:bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800">
                                            {invoice.invoiceNumber}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">
                                            Q {Number(invoice.total).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Pendiente
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedInvoice && (
                <div className="grid lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <h3 className="font-bold text-lg border-b pb-2">
                            Factura: {selectedInvoice.invoiceNumber}
                        </h3>

                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left p-3 uppercase text-[10px] text-slate-500">
                                        Concepto
                                    </th>
                                    <th className="text-right p-3 uppercase text-[10px] text-slate-500">
                                        Precio
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedInvoice.details.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-slate-50"
                                    >
                                        <td className="p-3">
                                            {item.itemDescription}
                                        </td>
                                        <td className="p-3 text-right font-bold">
                                            Q{' '}
                                            {Number(
                                                item.unitPrice
                                            ).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal:</span>
                                <span className="font-bold">
                                    Q{' '}
                                    {Number(
                                        selectedInvoice.subtotal
                                    ).toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span>Impuestos / Recargos:</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-32 border rounded-lg px-2 py-1 text-right outline-none focus:ring-2 focus:ring-blue-500"
                                    value={tax}
                                    onChange={(e) =>
                                        setTax(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div className="flex justify-between text-xl font-bold text-teal-700 pt-3 border-t-2">
                                <span>TOTAL:</span>
                                <span>Q {totalWithTax.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-5 h-fit">
                        <h3 className="font-bold flex items-center gap-2">
                            <DollarSign
                                className="text-green-600"
                                size={20}
                            />
                            Registrar Pago
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                                    Método
                                </label>
                                <select
                                    className="w-full border rounded-lg p-2.5 text-sm bg-slate-50"
                                    value={paymentMethodId}
                                    onChange={(e) =>
                                        setPaymentMethodId(
                                            Number(e.target.value)
                                        )
                                    }
                                >
                                    <option value={1}>Efectivo</option>
                                    <option value={2}>Tarjeta de Crédito</option>
                                    <option value={3}>Tarjeta de Débito</option>
                                    <option value={4}>Transferencia</option>
                                </select>
                            </div>

                            {paymentMethodId !== 1 && (
                                <div className="animate-in fade-in">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                                        Referencia
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2.5 text-sm"
                                        value={paymentReference}
                                        onChange={(e) =>
                                            setPaymentReference(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                                    Notas
                                </label>
                                <textarea
                                    className="w-full border rounded-lg p-2.5 text-sm resize-none"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) =>
                                        setNotes(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <Button
                            fullWidth
                            onClick={handleCompletePayment}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 shadow-lg"
                        >
                            {processing ? (
                                <Loader2 className="animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="mr-2" />
                            )}
                            Completar Pago
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};