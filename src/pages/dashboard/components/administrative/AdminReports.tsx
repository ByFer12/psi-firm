// src/pages/dashboard/components/administrative/AdminReports.tsx
import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Pill, DollarSign, ClipboardList, 
  FileText, Calendar, Download, Filter, Activity,
  AlertCircle, BarChart3, PieChart, CalendarRange
} from 'lucide-react';
import { DateRangePicker } from '../../../../components/UI/DateRangePicker';
import { api } from '../../../../lib/api';

// Interfaces basadas en tu backend
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

export const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeReport, setActiveReport] = useState<string>('dashboard');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  const [period, setPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Estados para cada reporte
  const [incomeReport, setIncomeReport] = useState<IncomeReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [clinicalStats, setClinicalStats] = useState<ClinicalStats[]>([]);
  const [topDiagnoses, setTopDiagnoses] = useState<TopDiagnosis[]>([]);
  const [productivityReport, setProductivityReport] = useState<ProductivityReport[]>([]);
  const [payrollReport, setPayrollReport] = useState<PayrollReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

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

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await api.get('/reports/dashboard');
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchReport = async (reportType: string) => {
    setLoading(true);
    try {
      switch (reportType) {
        case 'income':
            const incomeData = await api.get('/reports/income', {
            params: {
                startDate: dateRange.start.toISOString().split('T')[0],
                endDate: dateRange.end.toISOString().split('T')[0]
            }
            });
            console.log("income reports: ", incomeData.data)
            setIncomeReport(incomeData.data);
          break;

        case 'sales':
            const salesData = await api.get('/reports/sales', {
            params: {
                startDate: dateRange.start.toISOString().split('T')[0],
                endDate: dateRange.end.toISOString().split('T')[0]
            }
            });
            console.log("ventas reports: ", dateRange)
            setSalesReport(salesData.data);
          break;

        case 'clinical':
            const clinicalRes = await api.get('/reports/clinical', {
                params: {
                startDate: dateRange.start.toISOString().split('T')[0],
                endDate: dateRange.end.toISOString().split('T')[0]
                }
            });
            console.log("income reports: ", clinicalRes.data)
            setClinicalStats(clinicalRes.data);
          break;

        case 'productivity':
            const productivityRes = await api.get('/reports/clinical/productivity', {
                params: {
                startDate: dateRange.start.toISOString().split('T')[0],
                endDate: dateRange.end.toISOString().split('T')[0]
                }
            });
            console.log("income reports: ", productivityRes.data)
            setProductivityReport(productivityRes.data);
          break;

          case 'payroll':
              const payrollRes = await api.get('/reports/payroll', {
                  params: { period: period }
              });

              console.log("income reports: ", payrollRes)
              setPayrollReport(payrollRes.data);
            break;

        case 'inventory':
            const lowStockRes = await api.get('/reports/inventory/low-stock');
            console.log("income reports: ", lowStockRes.data)
            setLowStock(lowStockRes.data);
          break;

        case 'diagnoses':
            const diagnosesRes = await api.get('/reports/clinical/top-diagnoses', {
                params: { limit: 10 }
            });
            console.log("income reports: ", diagnosesRes.data)
            setTopDiagnoses(diagnosesRes.data);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${reportType} report:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (reportId: string) => {
    setActiveReport(reportId);
    if (reportId !== 'dashboard') {
      fetchReport(reportId);
    }
  };

  const handleDateRangeChange = (dates: { start: Date; end: Date }) => {
    setDateRange(dates);
    if (['income', 'sales', 'clinical', 'productivity'].includes(activeReport)) {
      fetchReport(activeReport);
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPeriod(e.target.value);
    if (activeReport === 'payroll') {
      fetchReport('payroll');
    }
  };

  const exportToCSV = (data: any, filename: string) => {
    // Implementación básica de exportación CSV
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map((row: any) => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      );
    }

    switch (activeReport) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-teal-500">
                <span className="text-slate-500 text-sm">Pacientes Activos</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats?.activePatients || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                <span className="text-slate-500 text-sm">Citas Hoy</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats?.appointmentsToday || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
                <span className="text-slate-500 text-sm">Ingresos del Mes</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  Q. {(stats?.monthlyRevenue || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen Rápido</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleReportChange('income')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-teal-600" size={20} />
                    <div>
                      <p className="font-medium text-slate-800">Reporte de Ingresos</p>
                      <p className="text-sm text-slate-500">Vista detallada de ingresos</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleReportChange('inventory')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-orange-600" size={20} />
                    <div>
                      <p className="font-medium text-slate-800">Stock Bajo</p>
                      <p className="text-sm text-slate-500">Productos críticos</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'income':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Reporte de Ingresos</h3>
                <p className="text-sm text-slate-500">{incomeReport?.period}</p>
              </div>
              <button
                onClick={() => exportToCSV([incomeReport], 'ingresos')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download size={16} />
                Exportar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-teal-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-teal-600" size={24} />
                  <span className="text-sm text-slate-600">Ingresos Totales</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  Q. {(incomeReport?.totalIncome || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="text-blue-600" size={24} />
                  <span className="text-sm text-slate-600">Transacciones</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  {incomeReport?.transactions || 0}
                </p>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Reporte de Ventas</h3>
                <p className="text-sm text-slate-500">{salesReport?.period}</p>
              </div>
              <button
                onClick={() => salesReport && exportToCSV(salesReport.products, 'ventas')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download size={16} />
                Exportar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Producto</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Cantidad</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesReport?.products.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-slate-800">{item.product}</td>
                      <td className="py-3 px-4 text-slate-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        Q. {item.revenue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'clinical':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Pacientes por Área Clínica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinicalStats.map((stat, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{stat.area}</span>
                    <Users size={18} className="text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stat.patientsAttended}</p>
                  <p className="text-sm text-slate-500">pacientes atendidos</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'productivity':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Productividad de Psicólogos</h3>
            <div className="space-y-4">
              {productivityReport.map((psy, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">
                      {psy.firstName} {psy.lastName}
                    </p>
                    <p className="text-sm text-slate-500">Psicólogo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal-600">{psy.sessionsCount}</p>
                    <p className="text-sm text-slate-500">sesiones atendidas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payroll':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Reporte de Nómina</h3>
                <p className="text-sm text-slate-500">Periodo: {payrollReport?.period}</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={period}
                  onChange={handlePeriodChange}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => payrollReport && exportToCSV(payrollReport.details, 'nomina')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-green-600" size={24} />
                  <span className="text-sm text-slate-600">Total Pagado</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  Q. {(payrollReport?.summary.totalSalariesPaid || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <ClipboardList className="text-purple-600" size={24} />
                  <span className="text-sm text-slate-600">IGGS Retenido</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  Q. {(payrollReport?.summary.totalIgssRetained || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-slate-700 mb-4">Detalle por Empleado</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Empleado</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Monto</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payrollReport?.details.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-slate-800">{detail.employee}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          Q. {detail.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {new Date(detail.date).toLocaleDateString('es-GT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Productos con Stock Bajo</h3>
                <p className="text-sm text-slate-500">Alerta de inventario crítico</p>
              </div>
              <button
                onClick={() => exportToCSV(lowStock, 'stock_bajo')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Download size={16} />
                Exportar
              </button>
            </div>

            <div className="space-y-4">
              {lowStock.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">Stock mínimo: {item.minStock}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${item.stock <= item.minStock * 0.5 ? 'text-red-600' : 'text-orange-600'}`}>
                      {item.stock} unidades
                    </p>
                    <p className="text-sm text-slate-500">disponibles</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'diagnoses':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Diagnósticos Más Frecuentes (CIE-11)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Código</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Diagnóstico</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Frecuencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topDiagnoses.map((diagnosis, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-slate-800 bg-gray-50">
                        {diagnosis.code}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{diagnosis.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{diagnosis.count}</span>
                          <span className="text-sm text-slate-500">casos</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes Gerenciales</h1>
          <p className="text-slate-500">Análisis y estadísticas del sistema</p>
        </div>
        
        {['income', 'sales', 'clinical', 'productivity'].includes(activeReport) && (
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        )}
      </div>

      {/* Tabs de reportes */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleReportChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
                activeReport === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-gray-100 border'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del reporte */}
      {renderReportContent()}
    </div>
  );
};