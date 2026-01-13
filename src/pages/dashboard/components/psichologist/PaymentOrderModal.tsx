import { useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import html2canvas from 'html2canvas';

import { jsPDF } from 'jspdf';

interface PaymentOrderProps {
    paymentOrder: {
        sessionId: number;
        patientName: string;
        patientDPI: string;
        sessionNumber: number;
        sessionDate: string;
        sessionPrice: number;
        medications: Array<{
            medicationName: string;
            dosage: string;
            frequency: string;
            price: number;
        }>;
        totalMedications: number;
        total: number;
    };
    onClose: () => void;
}

export const PaymentOrderModal = ({ paymentOrder, onClose }: PaymentOrderProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;

        const canvas = await html2canvas(contentRef.current, {
            scale: 2,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Orden-Pago-${paymentOrder.patientDPI}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                
                {/* Header con acciones */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-slate-800">Orden de Pago Generada</h2>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleDownloadPDF} variant="outline">
                            <Download size={16} className="mr-2"/> Descargar PDF
                        </Button>
                        <Button size="sm" onClick={handlePrint} variant="outline" className="hidden md:flex">
                            <Printer size={16} className="mr-2"/> Imprimir
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* Contenido para PDF */}
                <div ref={contentRef} className="p-8 bg-white">
                    
                    {/* Header del documento */}
                    <div className="text-center mb-8 border-b-2 border-teal-600 pb-4">
                        <h1 className="text-2xl font-bold text-teal-700">CLÍNICA PSICOLÓGICA</h1>
                        <p className="text-sm text-slate-600 mt-1">Orden de Pago - Sesión #{paymentOrder.sessionNumber}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Fecha: {new Date(paymentOrder.sessionDate).toLocaleDateString('es-GT', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>

                    {/* Datos del Paciente */}
                    <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-600 mb-2">DATOS DEL PACIENTE</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-slate-500">Nombre:</span>
                                <p className="font-bold text-slate-800">{paymentOrder.patientName}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">DPI:</span>
                                <p className="font-bold text-slate-800">{paymentOrder.patientDPI}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detalle de Servicios */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase">Detalle de Servicios</h3>
                        
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 border-b-2 border-slate-300">
                                <tr>
                                    <th className="text-left p-2 font-bold">Concepto</th>
                                    <th className="text-right p-2 font-bold">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Sesión */}
                                <tr className="border-b border-slate-200">
                                    <td className="p-2">
                                        <span className="font-semibold text-slate-800">
                                            Sesión #{paymentOrder.sessionNumber}
                                        </span>
                                        <br/>
                                        <span className="text-xs text-slate-500">Consulta Psicológica</span>
                                    </td>
                                    <td className="p-2 text-right font-bold text-slate-800">
                                        Q {Number(paymentOrder.sessionPrice).toFixed(2)}
                                    </td>
                                </tr>

                                {/* Medicamentos */}
                                {paymentOrder.medications.length > 0 && (
                                    <>
                                        <tr className="bg-slate-50">
                                            <td colSpan={2} className="p-2 font-bold text-slate-700 text-xs uppercase">
                                                Medicamentos Recetados
                                            </td>
                                        </tr>
                                        {paymentOrder.medications.map((med, idx) => (
                                            <tr key={idx} className="border-b border-slate-200">
                                                <td className="p-2">
                                                    <span className="font-semibold text-slate-800">{med.medicationName}</span>
                                                    <br/>
                                                    <span className="text-xs text-slate-500">
                                                        {med.dosage} • {med.frequency}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-right font-bold text-slate-800">
                                                    Q {Number(med.price).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Total */}
                    <div className="border-t-2 border-slate-800 pt-4 mt-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-slate-800">TOTAL A PAGAR:</span>
                            <span className="text-3xl font-bold text-teal-700">
                                Q {Number(paymentOrder.total).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-dashed border-slate-300 text-center">
                        <p className="text-xs text-slate-500 italic">
                            Presente este documento en secretaría para realizar el pago.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            Válido únicamente para esta sesión. Los precios incluyen servicios prestados.
                        </p>
                    </div>
                </div>

                {/* Footer del modal */}
                <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                    <Button onClick={handleDownloadPDF} className="bg-teal-600 hover:bg-teal-700">
                        <Download size={16} className="mr-2"/> Descargar PDF
                    </Button>
                </div>
            </div>
        </div>
    );
};