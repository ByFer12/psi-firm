import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../lib/api';
import { 
  Users, CheckCircle, Clock, Plus, Search,
  ChevronLeft, ChevronRight, FileText, Download // <--- Importamos Download
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { toast } from 'react-toastify';
import { GeneratePayrollModal } from './modals/GeneratePayrollModal';

// --- Importaciones para PDF ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Ajustamos la interfaz para asegurar que tenga todos los campos matemáticos
interface PayrollRecord {
  id: number;
  period: string;
  baseSalary: string | number;
  sessionBonus: string | number; // Necesario para el detalle
  totalBonuses: string | number;
  igssDeduction: string | number;
  otherDeductions: string | number;
  netSalary: string | number;
  statusId: number;
  paidAt?: string;
  employee: {
    firstName: string;
    lastName: string;
    identification?: string; // Para mostrar DPI en el voucher
    position?: string;       // Cargo
  };
}

const ITEMS_PER_PAGE = 7;

export const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll');
      setPayrolls(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando historial de nómina");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- FUNCIÓN PARA GENERAR VOUCHER INDIVIDUAL ---
  const generateIndividualVoucher = (record: PayrollRecord) => {
    const doc = new jsPDF();
    
    // Configuración de Colores y Fuentes
   // const tealColor = [13, 148, 136]; // Color corporativo (Teal-600)
   // const grayColor = [100, 116, 139];

    // --- ENCABEZADO ---
    doc.setFillColor(13, 148, 136); // Teal header
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PsiFirm', 15, 18);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de Pago de Nómina', 15, 25);

    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 195, 25, { align: 'right' });

    // --- DATOS DEL EMPLEADO ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Colaborador:', 15, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    // Datos izquierdo
    doc.text(`Nombre: ${record.employee.firstName} ${record.employee.lastName}`, 15, 52);
    doc.text(`Identificación: ${record.employee.identification || 'N/A'}`, 15, 58);
    
    // Datos derecho
    doc.text(`Periodo Liquidado: ${record.period}`, 120, 52);
    doc.text(`Fecha de Pago: ${record.paidAt ? new Date(record.paidAt).toLocaleDateString() : 'N/A'}`, 120, 58);

    // --- CÁLCULOS PARA DESGLOSE ---
    const base = Number(record.baseSalary);
    const totalBonos = Number(record.totalBonuses);
    const bonoDecreto = 250.00; // Constante de ley
    const bonoSesiones = Number(record.sessionBonus);
    
    // El "Otro" es lo que resta (Incentivos manuales, aguinaldo, etc)
    const otrosBonos = totalBonos - bonoDecreto - bonoSesiones; 
    
    const igss = Number(record.igssDeduction);
    const otrasDed = Number(record.otherDeductions);
    const neto = Number(record.netSalary);

    // --- TABLA DE DETALLES ---
    autoTable(doc, {
      startY: 70,
      head: [['Concepto', 'Ingresos (+)', 'Descuentos (-)']],
      body: [
        ['Salario Base Ordinario', `Q. ${base.toFixed(2)}`, ''],
        ['Bonificación Incentivo (Ley)', `Q. ${bonoDecreto.toFixed(2)}`, ''],
        ['Bonificación por Productividad', `Q. ${bonoSesiones.toFixed(2)}`, ''],
        [otrosBonos > 0 ? 'Otros Incentivos / Ajustes' : '', otrosBonos > 0 ? `Q. ${otrosBonos.toFixed(2)}` : '', ''],
        ['IGSS (4.83%)', '', `Q. ${igss.toFixed(2)}`],
        [otrasDed > 0 ? 'Otras Deducciones' : '', '', otrasDed > 0 ? `Q. ${otrasDed.toFixed(2)}` : ''],
        // Fila vacía para separar
        ['', '', ''], 
        [{ content: 'TOTAL A RECIBIR', styles: { fontStyle: 'bold', fillColor: [240, 253, 250] } }, 
         { content: `Q. ${neto.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [13, 148, 136], fillColor: [240, 253, 250] } }, 
         { content: '', styles: { fillColor: [240, 253, 250] } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [55, 65, 81], textColor: 255 }, // Dark Gray Header
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
      },
    });

    // --- PIE DE PÁGINA / FIRMAS ---
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.setLineWidth(0.5);
    doc.line(30, finalY + 40, 90, finalY + 40); // Firma Empleador
    doc.line(120, finalY + 40, 180, finalY + 40); // Firma Empleado

    doc.setFontSize(9);
    doc.text('Firma Autorizada PsiFirm', 40, finalY + 45);
    doc.text('Recibí Conforme', 135, finalY + 45);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este documento es un comprobante interno de pago generado por el sistema PsiFirm.', 105, 280, { align: 'center' });

    // Descargar
    doc.save(`Voucher_${record.employee.lastName}_${record.period}.pdf`);
    toast.success("Voucher descargado correctamente");
  };

  const processedList = useMemo(() => {
    let result = payrolls.filter(p => 
      `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (sortOrder === 'desc') {
        result.sort((a, b) => Number(b.netSalary) - Number(a.netSalary));
    } else if (sortOrder === 'asc') {
        result.sort((a, b) => Number(a.netSalary) - Number(b.netSalary));
    }
    return result;
  }, [payrolls, searchTerm, sortOrder]);

  const totalPages = Math.ceil(processedList.length / ITEMS_PER_PAGE);
  const paginatedList = processedList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder]);

  // Exportar reporte general (TABLA COMPLETA)
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte General de Nómina', 14, 20);
    const tableRows = processedList.map(p => [
      `${p.employee.firstName} ${p.employee.lastName}`,
      p.period,
      `Q${Number(p.baseSalary).toFixed(2)}`,
      `Q${Number(p.totalBonuses).toFixed(2)}`,
      `Q${Number(p.igssDeduction).toFixed(2)}`,
      `Q${Number(p.netSalary).toFixed(2)}`,
      p.statusId === 3 ? 'PAGADO' : 'PENDIENTE'
    ]);
    autoTable(doc, {
      head: [["Empleado", "Periodo", "Base", "Bonos", "IGSS", "Neto", "Estado"]],
      body: tableRows,
      startY: 30,
    });
    doc.save(`Reporte_Nomina_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handlePay = async (id: number) => {
    if (!confirm("¿Confirmar pago y cerrar nómina para este empleado?")) return;
    try {
      await api.patch(`/payroll/${id}/pay`);
      toast.success("Pago registrado");
      loadData();
    } catch (error) { toast.error("Error al pagar"); }
  };

  const totalPending = payrolls.filter(p => p.statusId === 1).reduce((acc, curr) => acc + Number(curr.netSalary), 0);
  const totalPaid = payrolls.filter(p => p.statusId === 3).reduce((acc, curr) => acc + Number(curr.netSalary), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Clock} color="orange" label="Nómina Pendiente" value={`Q. ${totalPending.toLocaleString()}`} />
        <StatCard icon={CheckCircle} color="green" label="Total Pagado" value={`Q. ${totalPaid.toLocaleString()}`} />
        <StatCard icon={Users} color="blue" label="Empleados" value={new Set(payrolls.map(p => p.employee.firstName)).size} />
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
         <div className="flex flex-1 gap-2">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar empleado..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
            >
                <option value="none">Sin orden</option>
                <option value="desc">Sueldo: Mayor a Menor</option>
                <option value="asc">Sueldo: Menor a Mayor</option>
            </select>
         </div>

         <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={exportToPDF}
                className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
                <FileText size={18}/> Reporte General
            </Button>
            <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <Plus size={18}/> Generar Nómina
            </Button>
         </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-slate-500 border-b border-gray-200 font-bold uppercase text-[10px] tracking-wider">
               <tr>
                 <th className="px-6 py-4">Empleado</th>
                 <th className="px-6 py-4">Periodo</th>
                 <th className="px-6 py-4 text-right">Base</th>
                 <th className="px-6 py-4 text-right text-green-600">Bonos</th>
                 <th className="px-6 py-4 text-right text-red-600">IGSS</th>
                 <th className="px-6 py-4 text-right font-bold text-slate-800">Neto</th>
                 <th className="px-6 py-4 text-center">Estado</th>
                 <th className="px-6 py-4 text-right">Acciones</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={8} className="p-8 text-center text-slate-400">Cargando...</td></tr>
               ) : paginatedList.length === 0 ? (
                 <tr><td colSpan={8} className="p-8 text-center text-slate-400">No hay registros de nómina.</td></tr>
               ) : (
                 paginatedList.map((record) => (
                   <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-700">{record.employee.firstName} {record.employee.lastName}</td>
                     <td className="px-6 py-4 font-mono text-slate-500">{record.period}</td>
                     <td className="px-6 py-4 text-right">Q.{Number(record.baseSalary).toFixed(2)}</td>
                     <td className="px-6 py-4 text-right text-green-700">+Q.{Number(record.totalBonuses).toFixed(2)}</td>
                     <td className="px-6 py-4 text-right text-red-600">-Q.{Number(record.igssDeduction).toFixed(2)}</td>
                     <td className="px-6 py-4 text-right font-bold">Q.{Number(record.netSalary).toFixed(2)}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black ${
                          record.statusId === 3 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {record.statusId === 3 ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                        {record.statusId !== 3 ? (
                          <Button size="sm" onClick={() => handlePay(record.id)}>Pagar</Button>
                        ) : (
                          <>
                             <span className="text-[10px] text-slate-400 mr-2">
                                {record.paidAt ? new Date(record.paidAt).toLocaleDateString() : 'Pagado'}
                             </span>
                             <button 
                                onClick={() => generateIndividualVoucher(record)}
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                title="Descargar Voucher"
                             >
                                <Download size={18} />
                             </button>
                          </>
                        )}
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>

        {/* Paginación */}
        {!loading && processedList.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-slate-500">Mostrando {paginatedList.length} de {processedList.length}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18}/></Button>
              <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={18}/></Button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <GeneratePayrollModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => { setShowModal(false); loadData(); }} 
        />
      )}
    </div>
  );
};

// Componente simple de Tarjetas
const StatCard = ({ icon: Icon, color, label, value }: any) => {
    const colors: any = { 
        orange: 'bg-orange-100 text-orange-600', 
        green: 'bg-green-100 text-green-600', 
        blue: 'bg-blue-100 text-blue-600' 
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
           <div className={`p-3 rounded-full ${colors[color]}`}><Icon size={24}/></div>
           <div><p className="text-slate-500 text-sm">{label}</p><h3 className="text-2xl font-bold">{value}</h3></div>
        </div>
    );
};