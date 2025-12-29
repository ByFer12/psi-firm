import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { 
  FileText, 
  Activity, 
  Download, 
  CheckCircle, 
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Brain,
  Pill,
  Loader2
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { toast } from 'react-toastify';

interface RecordSummary {
  id: number;
  recordNumber: string;
  openingDate: string;
  status: 'ACTIVE' | 'CLOSED';
}

export const PatientHistory = () => {
  // Estados de navegación
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [loadingList, setLoadingList] = useState(true);
  
  // --- CORRECCIÓN: Se agrega el estado que faltaba ---
  const [loadingDetail, setLoadingDetail] = useState(false);
  // ---------------------------------------------------
  
  // Datos
  const [recordsList, setRecordsList] = useState<RecordSummary[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Cargar lista al inicio
  useEffect(() => {
    fetchMyList();
  }, []);

  const fetchMyList = async () => {
    try {
      setLoadingList(true);
      const res = await api.get('/clinical-records/me/list');
      setRecordsList(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando tus expedientes");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchRecordDetail = async (recordId: number) => {
    try {
      setLoadingDetail(true); // Ahora setLoadingDetail ya existe
      const res = await api.get(`/clinical-records/me/detail/${recordId}`);
      setSelectedRecord(res.data);
      setView('detail');
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el detalle del expediente");
    } finally {
      setLoadingDetail(false); // Ahora setLoadingDetail ya existe
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedRecord) return;
    try {
      setDownloading(true);
      const response = await api.get(`/clinical-records/${selectedRecord.id}/pdf`, {
        responseType: 'blob', 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Historia_${selectedRecord.recordNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF descargado correctamente");
    } catch (error) {
      toast.error("Error generando PDF");
    } finally {
      setDownloading(false);
    }
  };

  // --- VISTA: LISTA DE EXPEDIENTES ---
  if (view === 'list') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-8 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Mi Historial Clínico</h1>
          <p className="text-teal-100">Consulta tus diagnósticos, planes de tratamiento y progreso de sesiones.</p>
        </div>

        {loadingList ? (
           <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-dashed">
              <Loader2 className="animate-spin text-teal-600 mb-2" size={32}/>
              <p className="text-slate-500">Cargando expedientes...</p>
           </div>
        ) : recordsList.length === 0 ? (
           <div className="bg-white p-10 rounded-xl text-center shadow-sm border border-gray-100">
              <FileText size={48} className="mx-auto text-slate-300 mb-4"/>
              <h3 className="text-lg font-bold text-slate-700">Sin historial disponible</h3>
              <p className="text-slate-500">Aún no tienes expedientes clínicos registrados en el sistema.</p>
           </div>
        ) : (
          <div className="grid gap-4">
             {recordsList.map((rec) => (
               <div key={rec.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        rec.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                     }`}>
                        {rec.status === 'ACTIVE' ? 'A' : 'C'}
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-slate-800">Expediente #{rec.recordNumber || rec.id}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                           <Calendar size={14}/> Apertura: {new Date(rec.openingDate).toLocaleDateString()}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        rec.status === 'ACTIVE' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                     }`}>
                        {rec.status === 'ACTIVE' ? 'ACTIVO' : 'CERRADO'}
                     </span>
                     <Button onClick={() => fetchRecordDetail(rec.id)} className="flex items-center gap-2">
                        Ver Detalles <ArrowRight size={16}/>
                     </Button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    );
  }

  // --- VISTA: CARGANDO DETALLE ---
  if (loadingDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-40">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={48}/>
        <p className="text-slate-500 font-medium">Obteniendo detalles clínicos...</p>
      </div>
    );
  }

  // --- VISTA: DETALLE (EXPEDIENTE COMPLETO) ---
  if (view === 'detail' && selectedRecord) {
     return (
        <div className="space-y-6 animate-fade-in">
           {/* Header de Navegación */}
           <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
              <Button variant="ghost" onClick={() => setView('list')} className="text-slate-600 hover:text-teal-600 gap-2">
                 <ArrowLeft size={18}/> Volver a la lista
              </Button>
              
              <div className="flex items-center gap-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                     selectedRecord.status === 'ACTIVE' 
                     ? 'bg-green-50 text-green-700 border-green-200' 
                     : 'bg-gray-50 text-gray-600 border-gray-200'
                 }`}>
                    {selectedRecord.status === 'ACTIVE' ? 'EXPEDIENTE ACTIVO' : 'EXPEDIENTE CERRADO'}
                 </span>
                 <Button 
                    variant="outline" 
                    onClick={handleDownloadPdf} 
                    disabled={downloading}
                    className="gap-2"
                 >
                    {downloading ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                    Descargar PDF
                 </Button>
              </div>
           </div>

           <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Columna Principal: Diagnósticos y Plan */}
              <div className="lg:col-span-2 space-y-6">
                 
                 {/* Diagnósticos */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                       <Brain className="text-teal-600"/> Diagnósticos
                    </h3>
                    {selectedRecord.diagnoses?.length > 0 ? (
                       <div className="space-y-4">
                          {selectedRecord.diagnoses.map((diag: any, idx: number) => (
                             <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-800">{diag.cie11Catalog?.name}</h4>
                                   <span className="bg-white px-2 py-1 rounded text-xs font-mono border text-slate-500">
                                      {diag.cie11Catalog?.code}
                                   </span>
                                </div>
                                <p className="text-sm text-slate-600 italic">"{diag.description}"</p>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <p className="text-slate-400 italic">Sin diagnósticos registrados.</p>
                    )}
                 </div>

                 {/* Plan de Tratamiento */}
                 {selectedRecord.treatmentPlan && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                       <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                          <Activity className="text-purple-600"/> Plan de Tratamiento
                       </h3>
                       <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                          <span className="text-xs font-bold text-purple-600 uppercase block mb-1">Objetivo Actual</span>
                          <p className="text-slate-800">{selectedRecord.treatmentPlan.shortTermObjective || 'No definido'}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 bg-gray-50 rounded border border-gray-100">
                              <span className="text-xs text-slate-500 uppercase">Frecuencia</span>
                              <p className="font-bold text-slate-700">{selectedRecord.treatmentPlan.sessionsPerWeek} sesiones/semana</p>
                           </div>
                           <div className="p-3 bg-gray-50 rounded border border-gray-100">
                              <span className="text-xs text-slate-500 uppercase">Modalidad</span>
                              <p className="font-bold text-slate-700">
                                 {selectedRecord.treatmentPlan.modalityId === 1 ? 'Individual' : 'Grupal/Pareja'}
                              </p>
                           </div>
                       </div>
                    </div>
                 )}
              </div>

              {/* Columna Lateral: Resumen */}
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Resumen</h3>
                    
                    <div className="flex justify-between py-3 border-b border-gray-50">
                       <span className="text-slate-600 flex items-center gap-2"><CheckCircle size={16} className="text-teal-500"/> Sesiones</span>
                       <span className="font-bold text-slate-800">{selectedRecord.sessions?.length || 0}</span>
                    </div>
                    
                    <div className="flex justify-between py-3 border-b border-gray-50">
                       <span className="text-slate-600 flex items-center gap-2"><Pill size={16} className="text-purple-500"/> Recetas</span>
                       <span className="font-bold text-slate-800">{selectedRecord.prescriptions?.length || 0}</span>
                    </div>

                    <div className="flex justify-between py-3">
                       <span className="text-slate-600 flex items-center gap-2"><Clock size={16} className="text-blue-500"/> Inicio</span>
                       <span className="font-bold text-slate-800">{new Date(selectedRecord.openingDate).toLocaleDateString()}</span>
                    </div>
                 </div>

                 {/* Última Receta (Si existe) */}
                 {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
                     <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-sm border border-purple-100">
                        <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                           <Pill size={18}/> Última Medicación
                        </h4>
                        <p className="font-bold text-slate-700">{selectedRecord.prescriptions[0].medication?.name}</p>
                        <p className="text-sm text-slate-500">{selectedRecord.prescriptions[0].dosage}</p>
                     </div>
                 )}
              </div>
           </div>
        </div>
     );
  }

  return null;
};