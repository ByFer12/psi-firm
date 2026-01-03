import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Pill, DollarSign, ClipboardList, 
  FileText, Download, Activity,
  AlertCircle, BarChart3, CalendarDays
} from 'lucide-react';
import { DateRangePicker } from '../../../../components/UI/DateRangePicker';
import { api } from '../../../../lib/api';

// --- 1. INTERFACES ---
interface DashboardStats {
  activePatients: number;
  appointmentsToday: number;
  monthlyRevenue: number;
}

interface IncomeReport {
  period: string;
  totalIncome: number;
  transactions: number;
}

interface SalesReport {
  period: string;
  products: Array<{
    product: string;
    quantity: number;
    revenue: number;
  }>;
}

interface ClinicalStats {
  area: string;
  patientsAttended: number;
}

interface TopDiagnosis {
  code: string;
  name: string;
  count: string;
}

interface ProductivityReport {
  firstName: string;
  lastName: string;
  sessionsCount: string;
}

interface PayrollReport {
  period: string;
  summary: {
    totalSalariesPaid: number;
    totalIgssRetained: number;
  };
  details: Array<{
    employee: string;
    amount: number;
    date: string;
  }>;
}

interface LowStockItem {
  name: string;
  stock: number;
  minStock: number;
}

// --- 2. COMPONENTE PRINCIPAL ---
export const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<string>('dashboard');
  
  // Rango de fechas por defecto (Primer día del mes actual hasta hoy)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  
  // Periodo Mensual (Para nómina) - Formato YYYY-MM
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));

  // --- ESTADOS DE DATOS ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incomeReport, setIncomeReport] = useState<IncomeReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [clinicalStats, setClinicalStats] = useState<ClinicalStats[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<TopDiagnosis[]>([]);
  const [productivityReport, setProductivityReport] = useState<ProductivityReport[]>([]);
  const [payrollReport, setPayrollReport] = useState<PayrollReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

  // Configuración de Pestañas
  const reportTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'income', label: 'Ingresos', icon: DollarSign },
    { id: 'sales', label: 'Ventas', icon: TrendingUp },
    { id: 'clinical', label: 'Clínico', icon: Users },
    { id: 'productivity', label: 'Productividad', icon: BarChart3 },
    { id: 'payroll', label: 'Nómina', icon: ClipboardList },
    { id: 'inventory', label: 'Inventario', icon: Pill },
    { id: 'diagnoses', label: 'Diagnósticos', icon: FileText },
  ];

  // --- EFECTO DE CARGA DE DATOS ---
  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateRange, period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Formatear fechas para el backend (YYYY-MM-DD)
      const params = {
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0]
      };

      switch (activeReport) {
        case 'dashboard':
            const dashRes = await api.get('/reports/dashboard');
            setStats(dashRes.data);
            break;
        case 'income':
            const incomeRes = await api.get('/reports/income', { params });
            setIncomeReport(incomeRes.data);
            break;
        case 'sales':
            const salesRes = await api.get('/reports/sales', { params });
            setSalesReport(salesRes.data);
            break;
        case 'clinical':
            const clinicalRes = await api.get('/reports/clinical', { params });
            setClinicalStats(clinicalRes.data);
            break;
        case 'productivity':
            const prodRes = await api.get('/reports/clinical/productivity', { params });
            setProductivityReport(prodRes.data);
            break;
        case 'payroll':
            const payRes = await api.get('/reports/payroll', { params: { period } });
            setPayrollReport(payRes.data);
            break;
        case 'inventory':
            const invRes = await api.get('/reports/inventory/low-stock');
            setLowStock(invRes.data);
            break;
        case 'diagnoses':
            const diagRes = await api.get('/reports/clinical/top-diagnoses');
            setTopDiagnoses(diagRes.data);
            break;
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- EXPORTAR A CSV ---
  const exportToCSV = (data: any, filename: string) => {
    if(!data || (Array.isArray(data) && data.length === 0)) return;
    
    // Si data es objeto único, lo metemos en array
    const arrayData = Array.isArray(data) ? data : [data];

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(arrayData[0]).join(",") + "\n"
      + arrayData.map((row: any) => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERIZADO DEL CONTENIDO ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p>Generando reporte...</p>
        </div>
      );
    }

    switch (activeReport) {
      // 1. DASHBOARD GENERAL
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-teal-500">
                <span className="text-slate-500 text-sm font-bold uppercase">Pacientes Activos</span>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.activePatients || 0}</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                <span className="text-slate-500 text-sm font-bold uppercase">Citas Hoy</span>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.appointmentsToday || 0}</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
                <span className="text-slate-500 text-sm font-bold uppercase">Ingresos Mes Actual</span>
                <p className="text-3xl font-bold text-slate-800 mt-2">Q. {(stats?.monthlyRevenue || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
             </div>
          </div>
        );

      // 2. REPORTE DE INGRESOS
      case 'income':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Ingresos Financieros</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                            <CalendarDays size={14}/> {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={() => exportToCSV(incomeReport, 'ingresos')} className="text-teal-600 hover:bg-teal-50 px-3 py-2 rounded-lg flex gap-2 font-medium border border-teal-100">
                        <Download size={18}/> CSV
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                        <p className="text-green-700 font-medium">Total Ingresos</p>
                        <p className="text-3xl font-bold text-green-800">Q. {(incomeReport?.totalIncome || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                        <p className="text-blue-700 font-medium">Facturas Pagadas</p>
                        <p className="text-3xl font-bold text-blue-800">{incomeReport?.transactions || 0}</p>
                    </div>
                </div>
            </div>
        );

      // 3. REPORTE DE VENTAS (PRODUCTOS)
      case 'sales':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-teal-600" size={20}/> Ventas por Producto
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <CalendarDays size={14}/> 
                            Desde: {dateRange.start.toLocaleDateString()} - Hasta: {dateRange.end.toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={() => exportToCSV(salesReport?.products, 'ventas')} className="text-teal-600 hover:bg-teal-50 px-3 py-2 rounded-lg flex gap-2 font-medium border border-teal-100">
                        <Download size={18}/> CSV
                    </button>
                </div>
                
                {!salesReport?.products.length ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-slate-400">No hay ventas registradas en este periodo.</p>
                        <p className="text-xs text-slate-400 mt-1">Intenta seleccionar un rango de fechas más amplio.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600">Producto / Servicio</th>
                                    <th className="p-3 font-semibold text-center text-slate-600">Cantidad Vendida</th>
                                    <th className="p-3 font-semibold text-right text-slate-600">Ingresos Totales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {salesReport.products.map((p, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-3 text-slate-800 font-medium">{p.product}</td>
                                        <td className="p-3 text-center font-mono text-slate-600">{p.quantity}</td>
                                        <td className="p-3 text-right font-bold text-teal-700">Q. {p.revenue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold text-slate-800">
                                <tr>
                                    <td className="p-3 text-right" colSpan={2}>TOTAL PERIODO:</td>
                                    <td className="p-3 text-right">
                                        Q. {salesReport.products.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        );

      // 4. REPORTE CLÍNICO (ÁREAS)
      case 'clinical':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Pacientes por Área Clínica</h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <CalendarDays size={14}/> {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={() => exportToCSV(clinicalStats, 'clinical_areas')} className="text-teal-600 hover:bg-teal-50 px-3 py-2 rounded-lg border border-teal-100"><Download size={18}/></button>
                </div>
                
                {clinicalStats.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-slate-400">No hay atenciones registradas en estas fechas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clinicalStats.map((stat, i) => (
                            <div key={i} className="flex items-center justify-between p-5 border rounded-xl hover:shadow-md transition bg-gray-50">
                                <div>
                                    <p className="font-bold text-slate-700 text-lg">{stat.area}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Especialidad</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-bold text-teal-600">{stat.patientsAttended}</span>
                                    <p className="text-[10px] text-slate-400">Pacientes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );

      // 5. PRODUCTIVIDAD PSICÓLOGOS
      case 'productivity':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Productividad: Sesiones Atendidas</h3>
                <div className="space-y-3">
                    {productivityReport.length === 0 ? (
                        <p className="text-center text-slate-400 py-6">Sin registros en este periodo.</p>
                    ) : (
                        productivityReport.map((psy, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold">
                                        {psy.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{psy.firstName} {psy.lastName}</p>
                                        <p className="text-xs text-slate-500">Psicólogo</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-slate-800">{psy.sessionsCount}</p>
                                    <p className="text-xs text-slate-500">Sesiones</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );

      // 6. NÓMINA (Por Mes)
      case 'payroll':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Reporte de Nómina</h3>
                        <p className="text-sm text-slate-500">Resumen de pagos realizados</p>
                    </div>
                    <div className="flex gap-3">
                        <input 
                            type="month" 
                            className="border rounded-lg px-3 py-2 text-sm"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        />
                        <button onClick={() => exportToCSV(payrollReport?.details, 'nomina')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 flex gap-2 items-center">
                            <Download size={16}/> Exportar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800 text-white p-5 rounded-lg">
                        <p className="text-slate-400 text-sm">Total Salarios Pagados</p>
                        <p className="text-3xl font-bold">Q. {(payrollReport?.summary.totalSalariesPaid || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-purple-600 text-white p-5 rounded-lg">
                        <p className="text-purple-200 text-sm">IGSS Retenido Total</p>
                        <p className="text-3xl font-bold">Q. {(payrollReport?.summary.totalIgssRetained || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 font-semibold">Colaborador</th>
                            <th className="p-3 font-semibold text-right">Monto Neto</th>
                            <th className="p-3 font-semibold text-right">Fecha Pago</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {payrollReport?.details.map((d, i) => (
                            <tr key={i}>
                                <td className="p-3 font-medium">{d.employee}</td>
                                <td className="p-3 text-right font-mono">Q. {d.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-right text-slate-500">{new Date(d.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

      // 7. INVENTARIO (Stock Bajo)
      case 'inventory':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle className="text-orange-500"/> Alertas de Stock Bajo
                    </h3>
                    <button onClick={() => exportToCSV(lowStock, 'stock_bajo')} className="text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg font-medium"><Download size={18}/></button>
                </div>
                <div className="space-y-3">
                    {lowStock.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 border border-orange-100 bg-orange-50 rounded-lg">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <div className="text-right">
                                <span className="text-red-600 font-bold text-lg">{item.stock} un.</span>
                                <p className="text-xs text-orange-600">Mínimo: {item.minStock}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

      // 8. DIAGNÓSTICOS CIE-11
      case 'diagnoses':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Top 10 Diagnósticos (CIE-11)</h3>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 w-24">Código</th>
                            <th className="p-3">Diagnóstico</th>
                            <th className="p-3 text-right">Frecuencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {topDiagnoses.map((d, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-slate-600 bg-slate-50 text-center rounded">{d.code}</td>
                                <td className="p-3 font-medium text-slate-800">{d.name}</td>
                                <td className="p-3 text-right font-bold text-teal-600">{d.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Centro de Reportes</h1>
            <p className="text-slate-500 text-sm">Análisis estratégico y rendimiento operativo.</p>
        </div>
        
        {/* Selector de Fechas (Solo visible para reportes que lo usan) */}
        {['income', 'sales', 'clinical', 'productivity'].includes(activeReport) && (
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {reportTabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeReport === tab.id 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
                <tab.icon size={16}/> {tab.label}
            </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="min-h-[400px]">
          {renderContent()}
      </div>
    </div>
  );
};