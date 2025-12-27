import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/UI/Button';
import { 
  User, FileText, Search, Activity, Calendar, Pill, 
  Download, ArrowLeft, Brain, Stethoscope, HeartPulse, 
  Users, AlertCircle, ClipboardList, Clock,
  Phone,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';

// 1. DEFINICIÓN EXACTA DE TIPOS SEGÚN TU JSON
interface ClinicalHistory {
  id: number;
  recordNumber: string | null;
  openingDate: string;
  status: string;
  
  // Antecedentes
  familyStructure: string | null;
  familyRelationships: string | null;
  familyPsychiatricHistory: boolean;
  familyPsychiatricDetails: string | null;
  relevantFamilyEvents: string | null;
  developmentalHistory: string | null;
  academicWorkHistory: string | null;
  medicalHistory: string | null;
  currentMedication: string | null;
  alcoholConsumptionId: number;
  tobaccoConsumptionId: number;
  drugUseDetails: string | null;
  previousTreatments: boolean;
  previousTreatmentsDetails: string | null;
  
  // Evaluación
  moodState: number;
  anxietyLevel: number;
  sleepQuality: number;
  appetite: number;
  socialFunctioning: string | null;
  generalObservations: string | null;
  functioningLevel: number | null;

  // Relaciones
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    identification: string;
    birthDate: string;
    age: number;
    phone: string;
    address: string;
    occupation: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    consultationReason: string;
    user: { email: string };
  };
  
  diagnoses: Array<{
    id: number;
    diagnosisType: string; // PRIMARY, SECONDARY
    description: string;
    predisposingFactors: string | null;
    precipitatingFactors: string | null;
    maintainingFactors: string | null;
    cie11Catalog: {
      code: string;
      name: string;
    }
  }>;
  
  treatmentPlan: {
    shortTermObjective: string | null;
    mediumTermObjective: string | null;
    longTermObjective: string | null;
    sessionsPerWeek: number;
    sessionCost: string;
    modalityId: number;
    frequencyId: number;
  };
  
  sessions: any[];
  prescriptions: any[];
}

export const Patients = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'resumen' | 'antecedentes' | 'evaluacion' | 'sesiones'>('resumen');
  
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [record, setRecord] = useState<ClinicalHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState<number | null>(null);
  const [patientRecordsList, setPatientRecordsList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Helpers de visualización
  const getFrequencyLabel = (id: number) => {
    if (id === 1) return "Nunca";
    if (id === 2) return "Ocasional";
    if (id === 3) return "Frecuente";
    return "No esp.";
  };

  const getModalityLabel = (id: number) => {
    const map: any = { 1: 'Individual', 2: 'Pareja', 3: 'Familiar', 4: 'Grupal' };
    return map[id] || 'Individual';
  };

  const getScoreColor = (val: number) => {
    if (val <= 2) return "bg-red-100 text-red-700";
    if (val === 3) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadMyPatients();
  }, []);

  const loadMyPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clinical/psychologists/my-patients'); 
      console.log("Resultado de pacientes: ", res.data)
      setPatientsList(res.data);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setLoading(false);
    }
  };

    const handleExpandPatient = async (patientId: number) => {
    if (expandedPatientId === patientId) {
        setExpandedPatientId(null); // Cerrar si ya está abierto
        return;
    }
    
    setExpandedPatientId(patientId);
    setLoadingList(true);
    setPatientRecordsList([]); 

    try {
        const res = await api.get(`/clinical-records/patient/${patientId}/list`);
        setPatientRecordsList(res.data);
    } catch (error) {
        toast.error("Error consultando expedientes");
    } finally {
        setLoadingList(false);
    }
  };

    const loadFullHistory = async (recordId: number) => {
    try {
      setLoading(true);
      // Llama a la nueva ruta que busca por ID de expediente
      const res = await api.get(`/clinical-records/${recordId}/full`);
      setRecord(res.data);
      setView('detail');
      setActiveTab('resumen');
    } catch (error) {
      toast.error("Error cargando expediente");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if(!record) return;
    try {
        toast.info("Generando PDF...");
        const response = await api.get(`/clinical-records/patient/${record.patient.id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Historia_${record.patient.firstName}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Descarga iniciada");
    } catch (error) {
        toast.error("Error al descargar PDF");
    }
  };

  const handleToggleStatus = async () => {
    if (!record) return;
    
    const newStatus = record.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    const confirmMessage = newStatus === 'CLOSED' 
        ? "¿Está seguro de cerrar este expediente? No se podrán agregar nuevas sesiones."
        : "¿Desea reactivar este expediente?";

    if (!window.confirm(confirmMessage)) return;

    try {
        await api.patch(`/clinical-records/${record.id}/status`, { status: newStatus });
        toast.success(`Expediente ${newStatus === 'ACTIVE' ? 'activado' : 'cerrado'}`);
        
        // Recargar datos para ver el cambio reflejado
        loadFullHistory(record.patient.id);
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  // --- VISTA DETALLE (EXPEDIENTE COMPLETO) ---
  if (view === 'detail' && record) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col gap-6">
        
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView('list')} className="p-2 h-auto text-slate-400 hover:text-teal-600">
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-800">
                            {record.patient.firstName} {record.patient.lastName}
                        </h1>
                        {/* BADGE DE ESTADO */}
                        <span className={`text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${
                            record.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                            {record.status === 'ACTIVE' ? 'Activo' : 'Cerrado'}
                        </span>
                    </div>
                    
                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><User size={14}/> {record.patient.age} años</span>
                        <span className="flex items-center gap-1"><Phone size={14}/> {record.patient.phone}</span>
                        <span className="flex items-center gap-1 text-slate-400">Expediente #{record.id}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                {/* BOTÓN DE CAMBIO DE ESTADO */}
                <Button 
                    variant="outline" 
                    onClick={handleToggleStatus}
                    className={`border ${record.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                >
                    {record.status === 'ACTIVE' ? 'Cerrar Expediente' : 'Reactivar Expediente'}
                </Button>

                <Button variant="outline" onClick={handleDownloadPdf} className="flex items-center gap-2">
                    <Download size={18}/> PDF
                </Button>
            </div>
        </div>

        {/* 2. NAVEGACIÓN DE PESTAÑAS */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {[
                { id: 'resumen', label: 'Diagnóstico y Plan', icon: Brain },
                { id: 'antecedentes', label: 'Antecedentes', icon: FileText },
                { id: 'evaluacion', label: 'Examen Mental', icon: Activity },
                { id: 'sesiones', label: 'Sesiones y Recetas', icon: Calendar },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                        activeTab === tab.id 
                        ? 'border-teal-600 text-teal-700 bg-teal-50' 
                        : 'border-transparent text-slate-500 hover:bg-gray-50'
                    }`}
                >
                    <tab.icon size={18} /> {tab.label}
                </button>
            ))}
        </div>

        {/* 3. CONTENIDO DINÁMICO */}
        <div className="space-y-6">
            
            {/* --- TAB: RESUMEN (DIAGNÓSTICO Y PLAN) --- */}
            {activeTab === 'resumen' && (
                <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {/* Diagnósticos */}
                    <div className="lg:col-span-2 space-y-6">
                        <SectionTitle title="Impresión Diagnóstica" icon={Brain} />
                        {record.diagnoses.length > 0 ? record.diagnoses.map((diag, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-teal-300 transition-colors">
                                <div className="absolute top-0 right-0 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    {diag.cie11Catalog.code}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{diag.cie11Catalog.name}</h3>
                                <p className="text-slate-600 italic mb-4">"{diag.description}"</p>
                                
                                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase">Predisponente</span>
                                        <span className="text-slate-700">{diag.predisposingFactors || 'No detectado'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase">Precipitante</span>
                                        <span className="text-slate-700">{diag.precipitatingFactors || 'No detectado'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase">Mantenedor</span>
                                        <span className="text-slate-700">{diag.maintainingFactors || 'No detectado'}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <EmptyState message="No hay diagnósticos registrados" />
                        )}

                        <SectionTitle title="Plan de Tratamiento" icon={ClipboardList} />
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Objetivo a Corto Plazo</h4>
                                <p className="text-slate-800 bg-teal-50 p-4 rounded-lg border border-teal-100">
                                    {record.treatmentPlan?.shortTermObjective || "No especificado"}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InfoCard label="Modalidad" value={getModalityLabel(record.treatmentPlan.modalityId)} />
                                <InfoCard label="Frecuencia" value={record.treatmentPlan.frequencyId === 1 ? 'Semanal' : 'Mensual'} />
                                <InfoCard label="Sesiones/Sem" value={record.treatmentPlan.sessionsPerWeek} />
                                <InfoCard label="Costo" value={`Q.${record.treatmentPlan.sessionCost}`} highlight />
                            </div>
                        </div>
                    </div>

                    {/* Lateral: Datos Personales Rápidos */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Datos de Contacto</h3>
                            <ul className="space-y-4 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Identificación</span>
                                    <span className="font-medium">{record.patient.identification}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Dirección</span>
                                    <span className="font-medium text-right max-w-[150px]">{record.patient.address}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Email</span>
                                    <span className="font-medium">{record.patient.user.email}</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                            <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                <AlertCircle size={18}/> Emergencia
                            </h3>
                            <p className="text-sm text-red-900 font-bold">{record.patient.emergencyContactName}</p>
                            <p className="text-lg font-bold text-red-600">{record.patient.emergencyContactPhone}</p>
                        </div>

                         <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                            <h3 className="font-bold text-blue-800 mb-2">Motivo de Consulta</h3>
                            <p className="text-sm text-blue-900 italic">"{record.patient.consultationReason}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: ANTECEDENTES --- */}
            {activeTab === 'antecedentes' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                        <CardBlock title="Historia Familiar" icon={Users}>
                            <Field label="Estructura Familiar" value={record.familyStructure} />
                            <Field label="Dinámica/Relaciones" value={record.familyRelationships} />
                            <Field label="Eventos Relevantes" value={record.relevantFamilyEvents} />
                            {record.familyPsychiatricHistory && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <span className="text-xs font-bold text-red-500 uppercase">Antecedentes Psiquiátricos</span>
                                    <p className="text-red-800 font-medium">{record.familyPsychiatricDetails}</p>
                                </div>
                            )}
                        </CardBlock>

                        <CardBlock title="Historia Personal y Desarrollo" icon={User}>
                            <Field label="Historia del Desarrollo" value={record.developmentalHistory} />
                            <Field label="Historia Académica/Laboral" value={record.academicWorkHistory} />
                        </CardBlock>
                        
                        <CardBlock title="Historial Médico y Hábitos" icon={Stethoscope}>
                            <Field label="Historia Médica" value={record.medicalHistory} />
                            <Field label="Medicación Actual" value={record.currentMedication} />
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-gray-50 p-3 rounded text-center">
                                    <span className="block text-xs text-slate-400 uppercase">Alcohol</span>
                                    <span className="font-bold text-slate-700">{getFrequencyLabel(record.alcoholConsumptionId)}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded text-center">
                                    <span className="block text-xs text-slate-400 uppercase">Tabaco</span>
                                    <span className="font-bold text-slate-700">{getFrequencyLabel(record.tobaccoConsumptionId)}</span>
                                </div>
                            </div>
                        </CardBlock>
                        
                        <CardBlock title="Tratamientos Previos" icon={Clock}>
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`w-3 h-3 rounded-full ${record.previousTreatments ? 'bg-teal-500' : 'bg-gray-300'}`}></span>
                                <span className="text-sm font-medium">{record.previousTreatments ? 'Sí ha recibido tratamiento' : 'Sin tratamientos previos'}</span>
                             </div>
                             {record.previousTreatmentsDetails && (
                                <p className="text-sm text-slate-600 bg-gray-50 p-3 rounded">{record.previousTreatmentsDetails}</p>
                             )}
                        </CardBlock>
                    </div>
                </div>
            )}

            {/* --- TAB: EVALUACIÓN (EXAMEN MENTAL) --- */}
            {activeTab === 'evaluacion' && (
                <div className="animate-in fade-in duration-300 grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <SectionTitle title="Escalas de Evaluación" icon={Activity} />
                        <div className="space-y-6 mt-4">
                            <ScaleRow label="Estado de Ánimo" val={record.moodState} labels={['Depresivo', 'Maníaco']} />
                            <ScaleRow label="Nivel de Ansiedad" val={record.anxietyLevel} labels={['Nulo', 'Pánico']} />
                            <ScaleRow label="Calidad de Sueño" val={record.sleepQuality} labels={['Pésimo', 'Excelente']} />
                            <ScaleRow label="Apetito" val={record.appetite} labels={['Anorexia', 'Hiperfagia']} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-3">Observaciones Generales</h3>
                            <p className="text-slate-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {record.generalObservations || "Sin observaciones."}
                            </p>
                        </div>
                         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-3">Funcionamiento Social</h3>
                             <p className="text-slate-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {record.socialFunctioning || "No especificado."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- TAB: SESIONES Y RECETAS --- */}
             {activeTab === 'sesiones' && (
                <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
<div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <SectionTitle title="Bitácora de Sesiones" icon={Calendar} />

                        <div className="mt-4 space-y-4">
                            {record.sessions && record.sessions.length > 0 ? (
                                record.sessions.map((ses, idx) => (
                                    <div
                                        key={ses.id ?? idx}
                                        className="p-4 border rounded-lg hover:bg-gray-50 space-y-3"
                                    >
                                        {/* Encabezado */}
                                        <div className="flex gap-4 items-center">
                                            <div className="bg-teal-100 text-teal-700 w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl">
                                                {ses.sessionNumber ?? idx + 1}
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-slate-800">
                                                    {ses.sessionDate
                                                        ? new Date(ses.sessionDate).toLocaleDateString()
                                                        : "Fecha no disponible"}
                                                </h4>
                                                <p className="text-sm text-slate-600">
                                                    {ses.attended ? "Asistió a la sesión" : "No asistió"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contenido */}
                                        <div className="text-sm text-slate-700 space-y-1">
                                            <p><strong>Temas tratados:</strong> {ses.topicsDiscussed || "No especificado"}</p>
                                            <p><strong>Intervenciones:</strong> {ses.interventions || "No especificado"}</p>
                                            <p><strong>Respuesta del paciente:</strong> {ses.patientResponse || "No especificado"}</p>

                                            {ses.observations && (
                                                <p><strong>Observaciones:</strong> {ses.observations}</p>
                                            )}

                                            <p>
                                                <strong>Próxima sesión:</strong>{" "}
                                                {ses.nextSessionDate
                                                    ? new Date(ses.nextSessionDate).toLocaleDateString()
                                                    : "No hay próxima sesión programada"}
                                            </p>
                                        </div>

                                        {/* Tareas asignadas */}
                                        {ses.assignedTasks && ses.assignedTasks.length > 0 && (
                                            <div className="mt-3">
                                                <p className="font-semibold text-slate-800 mb-1">Tareas asignadas:</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                                    {ses.assignedTasks.map((task) => (
                                                        <li key={task.id}>
                                                            <span className="font-medium">{task.taskDescription}</span>{" "}
                                                            <span className="text-slate-500">
                                                                (vence:{" "}
                                                                {task.dueDate
                                                                    ? new Date(task.dueDate).toLocaleDateString()
                                                                    : "sin fecha"})
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No hay sesiones registradas" />
                            )}
                        </div>
                    </div>


                     <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm h-fit">
                        <div className="flex items-center gap-2 mb-4 text-purple-700">
                            <Pill size={20}/> <h3 className="font-bold">Historial Recetas</h3>
                        </div>
                         <div className="space-y-3">
                            {record.prescriptions && record.prescriptions.length > 0 ? record.prescriptions.map((pre, idx) => (
                                <div key={idx} className="bg-purple-50 p-3 rounded border border-purple-100">
                                    <span className="font-bold text-slate-700 block">{pre.medication}</span>
                                    <span className="text-xs text-slate-500">{pre.dosage}</span>
                                </div>
                            )) : <p className="text-sm text-slate-400 italic">Sin medicación prescrita.</p>}
                        </div>
                     </div>
                </div>
            )}

        </div>
      </div>
    );
  }

// --- VISTA LISTA ---
  return (
<div className="space-y-6">
         <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-800">Pacientes Asignados</h2>
             <div className="relative w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input 
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e)=>setSearchTerm(e.target.value)}
                 />
             </div>
         </div>
         
         {loading ? <div className="text-center py-20 text-slate-400">Cargando...</div> : (
             <div className="grid md:grid-cols-3 gap-6 align-start"> 
                 {patientsList.filter(p=> p.firstName.toLowerCase().includes(searchTerm.toLowerCase())).map(patient => (
                     <div key={patient.id} className={`bg-white rounded-xl border transition-all duration-300 ${expandedPatientId === patient.id ? 'border-teal-500 shadow-md row-span-2' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                         
                         {/* Tarjeta Principal */}
                         <div className="p-6">
                             <div className="flex justify-between items-start mb-4">
                                 <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg">
                                     {patient.firstName.charAt(0)}
                                 </div>
                                 <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Paciente</span>
                             </div>
                             
                             <h3 className="text-lg font-bold text-slate-800">{patient.firstName} {patient.lastName}</h3>
                             <p className="text-sm text-slate-500 mb-4 truncate">{patient.email}</p>
                             
                             <Button 
                                variant="outline" 
                                fullWidth 
                                onClick={() => handleExpandPatient(patient.id)}
                                className={`text-sm justify-between group ${expandedPatientId === patient.id ? 'bg-teal-50 border-teal-200 text-teal-700' : ''}`}
                             >
                                <span className="flex items-center gap-2"><FileText size={16}/> Gestionar Expedientes</span>
                                <ChevronRight size={16} className={`transition-transform duration-300 ${expandedPatientId === patient.id ? 'rotate-90' : ''}`}/>
                             </Button>
                         </div>

                         {/* Lista Desplegable de Expedientes */}
                         {expandedPatientId === patient.id && (
                             <div className="border-t border-gray-100 bg-gray-50 p-4 rounded-b-xl animate-in slide-in-from-top-2">
                                 {loadingList ? (
                                     <div className="text-center py-2 text-xs text-slate-400">Buscando historiales...</div>
                                 ) : patientRecordsList.length === 0 ? (
                                     <div className="text-center py-2 text-xs text-slate-400">Este paciente no tiene expedientes creados.</div>
                                 ) : (
                                     <div className="space-y-2">
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Historiales Disponibles</p>
                                         {patientRecordsList.map((rec) => (
                                             <button 
                                                 key={rec.id} 
                                                 onClick={() => loadFullHistory(rec.id)} // Aquí pasamos el ID del expediente
                                                 className="w-full text-left bg-white p-3 rounded-lg border border-gray-200 hover:border-teal-400 hover:shadow-sm cursor-pointer flex justify-between items-center transition-all group"
                                             >
                                                 <div>
                                                     <div className="flex items-center gap-2">
                                                         <p className="text-xs font-bold text-slate-700 group-hover:text-teal-700">Expediente #{rec.id}</p>
                                                         {rec.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                                     </div>
                                                     <p className="text-[10px] text-slate-500">Abierto: {new Date(rec.openingDate).toLocaleDateString()}</p>
                                                 </div>
                                                 <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                                     rec.status === 'ACTIVE' 
                                                     ? 'bg-green-50 text-green-700 border-green-200' 
                                                     : 'bg-gray-100 text-gray-500 border-gray-200'
                                                 }`}>
                                                     {rec.status === 'ACTIVE' ? 'ACTIVO' : 'CERRADO'}
                                                 </span>
                                             </button>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                 ))}
             </div>
         )}
    </div>  
  );
};

// --- COMPONENTES AUXILIARES PARA LIMPIEZA ---

const SectionTitle = ({ title, icon: Icon }: any) => (
    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2 mb-4">
        <Icon size={20} className="text-teal-600" /> {title}
    </h2>
);

const CardBlock = ({ title, icon, children }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
        <SectionTitle title={title} icon={icon} />
        <div className="space-y-4">{children}</div>
    </div>
);

const Field = ({ label, value }: any) => (
    <div>
        <span className="block text-xs font-bold text-slate-400 uppercase mb-1">{label}</span>
        <p className="text-sm text-slate-800 bg-gray-50 p-2 rounded border border-gray-100">
            {value || <span className="text-gray-400 italic">No especificado</span>}
        </p>
    </div>
);

const InfoCard = ({ label, value, highlight }: any) => (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-100'}`}>
        <span className="block text-xs font-bold text-slate-500 uppercase">{label}</span>
        <span className={`block font-bold ${highlight ? 'text-teal-700 text-lg' : 'text-slate-800'}`}>{value}</span>
    </div>
);

const ScaleRow = ({ label, val, labels }: any) => (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
        <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-slate-700">{label}</span>
            <span className="font-bold text-teal-600">{val}/5</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-500 h-full" style={{ width: `${(val/5)*100}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-semibold">
            <span>{labels[0]}</span>
            <span>{labels[1]}</span>
        </div>
    </div>
);

const BriefcaseIcon = ({ occupation }: any) => <span>{occupation}</span>;

const EmptyState = ({ message }: { message: string }) => (
    <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-slate-400">
        {message}
    </div>
);