import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { toast } from 'react-toastify';
import { 
    FileText, 
    Download, 
    CheckCircle2, 
    Clock, 
    XCircle,
    Loader2,
    Eye,
    Calendar,
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';

interface Invoice {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    subtotal: number;
    tax: number;
    total: number;
    statusId: number;
    status: {
        id: number;
        name: string;
    };
    paymentMethod: {
        id: number;
        name: string;
    };
    details: Array<{
        id: number;
        itemDescription: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }>;
    paidAt?: string;
    paymentReference?: string;
    notes?: string;
}

export const PatientInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bilding/my-invoices');
            setInvoices(res.data);
        } catch (error: any) {
            toast.error('Error al cargar facturas');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (statusId: number) => {
        switch (statusId) {
            case 1:
                return (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                        <Clock size={12} /> Pendiente
                    </span>
                );
            case 2:
                return (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle2 size={12} /> Pagada
                    </span>
                );
            case 3:
                return (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        <Clock size={12} /> Parcial
                    </span>
                );
            case 4:
                return (
                    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                        <XCircle size={12} /> Cancelada
                    </span>
                );
            default:
                return null;
        }
    };

    const handleDownloadPDF = async (invoice: Invoice) => {
        setDownloadingPDF(true);
        try {
            const response = await api.get(`/bilding/invoice/${invoice.id}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Factura descargada correctamente');
        } catch (error) {
            toast.error('Error al descargar factura');
        } finally {
            setDownloadingPDF(false);
        }
    };

    const viewInvoiceDetail = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Mis Facturas</h2>
                    <p className="text-slate-500">Historial de pagos y servicios</p>
                </div>
                <Button onClick={loadInvoices} variant="outline" size="sm">
                    Actualizar
                </Button>
            </div>

            {/* Lista de Facturas */}
            {invoices.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        No tienes facturas registradas
                    </h3>
                    <p className="text-slate-500 text-sm">
                        Tus facturas aparecerán aquí después de cada sesión o compra.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {invoices.map((invoice) => (
                        <div 
                            key={invoice.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-slate-800">
                                            {invoice.invoiceNumber}
                                        </h3>
                                        {getStatusBadge(invoice.statusId)}
                                    </div>
                                    
                                    <div className="flex gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(invoice.invoiceDate).toLocaleDateString('es-GT', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        
                                        {invoice.paidAt && (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle2 size={14} />
                                                Pagado el {new Date(invoice.paidAt).toLocaleDateString('es-GT')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-slate-500 mb-1">Total</p>
                                    <p className="text-2xl font-bold text-teal-700">
                                        Q {Number(invoice.total).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Resumen de items */}
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs font-medium text-slate-600 mb-2">Servicios/Productos:</p>
                                <div className="space-y-1">
                                    {invoice?.details?.slice(0, 2).map((detail, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-slate-700">{detail.itemDescription}</span>
                                            <span className="font-medium">Q {Number(detail.unitPrice).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {invoice?.details?.length > 2 && (
                                        <p className="text-xs text-slate-500 italic">
                                            +{invoice.details.length - 2} más...
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Método de pago */}
                            {invoice.statusId === 2 && (
                                <div className="mb-4 text-sm">
                                    <span className="text-slate-500">Método de pago: </span>
                                    <span className="font-medium text-slate-800">
                                        {invoice?.paymentMethod?.name}
                                    </span>
                                    {invoice.paymentReference && (
                                        <span className="text-slate-400 ml-2">
                                            (Ref: {invoice.paymentReference})
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="flex gap-2 pt-3 border-t">
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => viewInvoiceDetail(invoice)}
                                    className="flex-1"
                                >
                                    <Eye size={16} className="mr-2" />
                                    Ver Detalle
                                </Button>
                                
                                {invoice.statusId === 2 && (
                                    <Button 
                                        size="sm"
                                        onClick={() => handleDownloadPDF(invoice)}
                                        disabled={downloadingPDF}
                                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                                    >
                                        {downloadingPDF ? (
                                            <Loader2 className="animate-spin mr-2" size={16} />
                                        ) : (
                                            <Download size={16} className="mr-2" />
                                        )}
                                        Descargar PDF
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Detalle */}
            {showModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    Detalle de Factura
                                </h3>
                                <p className="text-sm text-slate-500">{selectedInvoice.invoiceNumber}</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="p-6 space-y-6">
                            
                            {/* Estado */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium text-slate-600">Estado:</span>
                                {getStatusBadge(selectedInvoice.statusId)}
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Fecha de emisión</p>
                                    <p className="font-medium text-slate-800">
                                        {new Date(selectedInvoice.invoiceDate).toLocaleDateString('es-GT')}
                                    </p>
                                </div>
                                {selectedInvoice.paidAt && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Fecha de pago</p>
                                        <p className="font-medium text-green-700">
                                            {new Date(selectedInvoice.paidAt).toLocaleDateString('es-GT')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Detalles */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3">Detalle de Servicios/Productos</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 border-b-2 border-slate-300">
                                        <tr>
                                            <th className="text-left p-2 font-semibold">Descripción</th>
                                            <th className="text-center p-2 font-semibold">Cant.</th>
                                            <th className="text-right p-2 font-semibold">Precio Unit.</th>
                                            <th className="text-right p-2 font-semibold">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice?.details?.map((detail, idx) => (
                                            <tr key={idx} className="border-b border-slate-200">
                                                <td className="p-2">{detail.itemDescription}</td>
                                                <td className="p-2 text-center">{detail.quantity}</td>
                                                <td className="p-2 text-right">Q {Number(detail.unitPrice).toFixed(2)}</td>
                                                <td className="p-2 text-right font-medium">
                                                    Q {Number(detail.subtotal).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totales */}
                            <div className="space-y-2 pt-4 border-t-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span className="font-medium">Q {Number(selectedInvoice.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Impuestos:</span>
                                    <span className="font-medium">Q {Number(selectedInvoice.tax).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-teal-700 pt-2 border-t">
                                    <span>TOTAL:</span>
                                    <span>Q {Number(selectedInvoice.total).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Info de pago */}
                            {selectedInvoice?.statusId === 2 && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 mb-2">
                                        Información de Pago
                                    </p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-green-700">
                                            <span className="font-medium">Método:</span> {selectedInvoice?.paymentMethod?.name}
                                        </p>
                                        {selectedInvoice?.paymentReference && (
                                            <p className="text-green-700">
                                                <span className="font-medium">Referencia:</span> {selectedInvoice?.paymentReference}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notas */}
                            {selectedInvoice?.notes && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-medium text-blue-800 mb-1">Notas:</p>
                                    <p className="text-sm text-blue-700 italic">{selectedInvoice.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                Cerrar
                            </Button>
                            {selectedInvoice.statusId === 2 && (
                                <Button 
                                    onClick={() => handleDownloadPDF(selectedInvoice)}
                                    disabled={downloadingPDF}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    {downloadingPDF ? (
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                    ) : (
                                        <Download size={16} className="mr-2" />
                                    )}
                                    Descargar PDF
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};