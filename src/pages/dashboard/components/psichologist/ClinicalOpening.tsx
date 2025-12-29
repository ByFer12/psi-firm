import  { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Search, Save, ChevronRight, ChevronLeft, Trash2, FileText, CheckCircle, Calendar, Play } from 'lucide-react';
import { Button } from '../../../../components/UI/Button'; 
import { toast } from 'react-toastify';

interface ClinicalOpeningProps {
  patientId: number;
  psychologistId: number;
  patientName: string;
  onSuccess: () => void; // Botón "Cerrar / Ir a Agenda"
  onStartNow: () => void; // Botón "Iniciar Sesión"
}

// ... TextGroup y otros helpers se mantienen igual ...
const TextGroup = ({ label, value, onChange, placeholder }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <FileText size={14} className="text-teal-500"/> {label}
      </label>
      <textarea 
        className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none min-h-[80px] text-sm"
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
      />
    </div>
  );

export const ClinicalOpening = ({ patientId, psychologistId, patientName, onSuccess, onStartNow }: ClinicalOpeningProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // NUEVO ESTADO
  
  // ... Estados de formData, cieSearch, etc. IGUALES ...
  const [cieSearch, setCieSearch] = useState("");
  const [cieResults, setCieResults] = useState([]);
  const [formData, setFormData] = useState({
      patientId: patientId,
      psychologistId: psychologistId,
      serviceTypeId: 1,
      background: {
        familyStructure: '',
        familyRelationships: '',
        familyPsychiatricHistory: false,
        familyPsychiatricDetails: '',
        developmentalHistory: '',
        academicWorkHistory: '',
        medicalHistory: '',
        currentMedication: '',
        relevantFamilyEvents: '',
        alcoholConsumptionId: 1,
        tobaccoConsumptionId: 1,
        drugUseDetails: '',
        previousTreatments: false,
        previousTreatmentsDetails: ''
      },
      evaluation: {
        moodState: 3,
        anxietyLevel: 1,
        sleepQuality: 3,
        appetite: 3,
        socialFunctioning: '',
        generalObservations: '',
        functioningLevel: 5 
      },
      diagnoses: [] as any[], 
      treatmentPlan: {
        shortTermObjective: '',
        mediumTermObjective: '',
        longTermObjective: '',
        modalityId: 1,
        therapeuticApproachId: 1,
        frequencyId: 1,
        sessionsPerWeek: 1,
        estimatedDurationWeeks: 12,
        sessionCost: 0
      }
    });

  // ... useEffect del buscador y funciones addDiagnosis/removeDiagnosis IGUALES ...
    // Buscador de CIE-11 (Debounce)
    useEffect(() => {
        const searchCie = async () => {
          if (cieSearch.length > 2) {
            try {
              const res = await api.get(`/clinical-records/search-cie11?q=${cieSearch}`);
              setCieResults(res.data);
            } catch (error) {
              console.error("Error buscando CIE11", error);
            }
          }
        };
        const delayDebounce = setTimeout(searchCie, 500);
        return () => clearTimeout(delayDebounce);
      }, [cieSearch]);
    
      const addDiagnosis = (item: any) => {
        const newDiag = {
          cie11CatalogId: item.id,
          code: item.code,
          name: item.name,
          type: 'PRIMARY',
          description: item.name,
          factors: { predisposing: '', precipitating: '', maintaining: '' }
        };
        setFormData({...formData, diagnoses: [...formData.diagnoses, newDiag]});
        setCieSearch("");
        setCieResults([]);
      };
    
      const removeDiagnosis = (index: number) => {
        const list = [...formData.diagnoses];
        list.splice(index, 1);
        setFormData({...formData, diagnoses: list});
      };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // ... Construcción del payload IGUAL ...
      const payload = {
        patientId: Number(patientId),
        serviceTypeId: formData.serviceTypeId,
        background: {
          ...formData.background,
          familyStructure: formData.background.familyStructure || "No especificado",
          familyRelationships: formData.background.familyRelationships || "No especificado",
          developmentalHistory: formData.background.developmentalHistory || "No especificado",
          academicWorkHistory: formData.background.academicWorkHistory || "No especificado", 
          medicalHistory: formData.background.medicalHistory || "No especificado",
          currentMedication: formData.background.currentMedication || "Ninguno",
          relevantFamilyEvents: formData.background.relevantFamilyEvents || "Ninguno",
          alcoholConsumptionId: Number(formData.background.alcoholConsumptionId),
          tobaccoConsumptionId: Number(formData.background.tobaccoConsumptionId)
        },
        evaluation: {
          ...formData.evaluation,
          moodState: Number(formData.evaluation.moodState),
          anxietyLevel: Number(formData.evaluation.anxietyLevel),
          sleepQuality: Number(formData.evaluation.sleepQuality),
          appetite: Number(formData.evaluation.appetite),
          generalObservations: formData.evaluation.generalObservations || "Sin observaciones",
          socialFunctioning: formData.evaluation.socialFunctioning || "No especificado",
          functioningLevel: Number(formData.evaluation.functioningLevel)
        },
        diagnoses: formData.diagnoses.map(diag => ({
          cie11CatalogId: Number(diag.cie11CatalogId),
          type: diag.type,
          description: diag.description,
          factors: {
            predisposing: diag.factors.predisposing || "No detectado",
            precipitating: diag.factors.precipitating || "No detectado",
            maintaining: diag.factors.maintaining || "No detectado"
          }
        })),
        treatmentPlan: {
          ...formData.treatmentPlan,
          shortTermObjective: formData.treatmentPlan.shortTermObjective || "Iniciar tratamiento",
          modalityId: Number(formData.treatmentPlan.modalityId),
          therapeuticApproachId: Number(formData.treatmentPlan.therapeuticApproachId),
          frequencyId: Number(formData.treatmentPlan.frequencyId),
          sessionsPerWeek: Number(formData.treatmentPlan.sessionsPerWeek),
          estimatedDurationWeeks: Number(formData.treatmentPlan.estimatedDurationWeeks),
          sessionCost: Number(formData.treatmentPlan.sessionCost)
        }
      };

      await api.post('/clinical-records', payload);
      toast.success("Expediente creado correctamente");
      setIsSuccess(true); // CAMBIO: Activamos pantalla de éxito
    } catch (error: any) {
      toast.error("Error al guardar: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // --- NUEVA VISTA DE ÉXITO ---
  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-10 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Expediente Aperturado!</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Se ha creado correctamente el historial clínico para <strong>{patientName}</strong>. Ahora puede iniciar la sesión programada.
        </p>
        
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onSuccess} className="px-6 h-12 border-gray-300">
            <Calendar size={20} className="mr-2"/> Volver a Agenda
          </Button>
          <Button onClick={onStartNow} className="px-8 h-12 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100">
            <Play size={20} className="mr-2"/> Iniciar Sesión Ahora
          </Button>
        </div>
      </div>
    );
  }

  // ... Resto del render (Tabs, Steps) se mantiene IGUAL ...
  return (
    // ... todo el JSX del formulario que ya tienes ...
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-10">
      {/* Pasos de Progreso */}
      <div className="flex bg-slate-50 border-b overflow-x-auto">
        {['Antecedentes', 'Evaluación', 'Diagnóstico', 'Plan Terapéutico'].map((label, i) => (
          <div key={i} className={`flex-1 min-w-[120px] p-4 text-center text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${step === i + 1 ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-400'}`}
               onClick={() => setStep(i + 1)}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="p-4 md:p-8">
        
        {/* PASO 1: ANTECEDENTES COMPLETOS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center border-l-4 border-teal-500 pl-3 mb-6">
               <h3 className="text-xl font-bold text-slate-800">Historia Personal y Familiar</h3>
               <span className="text-xs font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded-full">Paciente: {patientName}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Contexto Familiar</h4>
                  <TextGroup label="Estructura Familiar" value={formData.background.familyStructure} onChange={(val:string) => setFormData({...formData, background: {...formData.background, familyStructure: val}})} placeholder="Con quién vive, núcleo familiar..." />
                  <TextGroup label="Dinámica Familiar" value={formData.background.familyRelationships} onChange={(val:string) => setFormData({...formData, background: {...formData.background, familyRelationships: val}})} placeholder="Calidad de relaciones, conflictos..." />
                  <TextGroup label="Eventos Relevantes" value={formData.background.relevantFamilyEvents} onChange={(val:string) => setFormData({...formData, background: {...formData.background, relevantFamilyEvents: val}})} placeholder="Duelos, separaciones, mudanzas..." />
               </div>

               <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Desarrollo Individual</h4>
                  <TextGroup label="Historia del Desarrollo" value={formData.background.developmentalHistory} onChange={(val:string) => setFormData({...formData, background: {...formData.background, developmentalHistory: val}})} placeholder="Embarazo, parto, hitos del desarrollo..." />
                  <TextGroup label="Historia Académica/Laboral" value={formData.background.academicWorkHistory} onChange={(val:string) => setFormData({...formData, background: {...formData.background, academicWorkHistory: val}})} placeholder="Rendimiento escolar, estabilidad laboral..." />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Historia Médica</h4>
                   <TextGroup label="Enfermedades/Cirugías" value={formData.background.medicalHistory} onChange={(val:string) => setFormData({...formData, background: {...formData.background, medicalHistory: val}})} placeholder="Condiciones médicas previas o actuales..." />
                   <TextGroup label="Medicación Actual" value={formData.background.currentMedication} onChange={(val:string) => setFormData({...formData, background: {...formData.background, currentMedication: val}})} placeholder="Fármacos y dosis..." />
                </div>

                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-slate-400 uppercase border-b pb-1">Otros Antecedentes</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Alcohol</label>
                        <select className="w-full p-2 border rounded text-sm" value={formData.background.alcoholConsumptionId} onChange={e=>setFormData({...formData, background: {...formData.background, alcoholConsumptionId: Number(e.target.value)}})}>
                            <option value={1}>Nunca</option>
                            <option value={2}>Ocasional</option>
                            <option value={3}>Frecuente</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Tabaco</label>
                        <select className="w-full p-2 border rounded text-sm" value={formData.background.tobaccoConsumptionId} onChange={e=>setFormData({...formData, background: {...formData.background, tobaccoConsumptionId: Number(e.target.value)}})}>
                            <option value={1}>Nunca</option>
                            <option value={2}>Ocasional</option>
                            <option value={3}>Frecuente</option>
                        </select>
                      </div>
                   </div>
                   
                   <div className="bg-gray-50 p-3 rounded-lg border">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={formData.background.familyPsychiatricHistory} onChange={e=>setFormData({...formData, background: {...formData.background, familyPsychiatricHistory: e.target.checked}})} />
                        <span className="text-sm font-medium">Antecedentes Psiquiátricos Familiares</span>
                      </label>
                      {formData.background.familyPsychiatricHistory && (
                        <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Especifique quién y qué..." value={formData.background.familyPsychiatricDetails} onChange={e=>setFormData({...formData, background: {...formData.background, familyPsychiatricDetails: e.target.value}})} />
                      )}
                   </div>
                </div>
            </div>
          </div>
        )}

        {/* PASO 2: EVALUACIÓN */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 border-l-4 border-teal-500 pl-3">Examen Mental y Funcionalidad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  {[
                    { label: 'Estado de Ánimo', key: 'moodState', min: 'Depresivo', max: 'Maníaco' },
                    { label: 'Nivel de Ansiedad', key: 'anxietyLevel', min: 'Nulo', max: 'Pánico' },
                    { label: 'Calidad de Sueño', key: 'sleepQuality', min: 'Pésimo', max: 'Excelente' },
                    { label: 'Apetito', key: 'appetite', min: 'Anorexia', max: 'Hiperfagia' }
                  ].map((item) => (
                    <div key={item.key} className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-bold text-slate-700">{item.label}</label>
                        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1 rounded">{(formData.evaluation as any)[item.key]}/5</span>
                      </div>
                      <input type="range" min="1" max="5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        value={(formData.evaluation as any)[item.key]} onChange={(e) => setFormData({...formData, evaluation: {...formData.evaluation, [item.key]: Number(e.target.value)}})} />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                         <span>{item.min}</span>
                         <span>{item.max}</span>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-4">
                  <TextGroup label="Funcionamiento Social" value={formData.evaluation.socialFunctioning} onChange={(val:string) => setFormData({...formData, evaluation: {...formData.evaluation, socialFunctioning: val}})} placeholder="Relaciones interpersonales, aislamiento..." />
                  <TextGroup label="Observaciones Generales" value={formData.evaluation.generalObservations} onChange={(val:string) => setFormData({...formData, evaluation: {...formData.evaluation, generalObservations: val}})} placeholder="Apariencia, conducta, lenguaje, memoria..." />
                  
                  <div className="pt-2">
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Nivel Global de Funcionamiento (GAF/GARF)</label>
                    <div className="flex items-center gap-4">
                        <input type="range" min="1" max="100" className="flex-1 h-2 bg-gray-200 rounded-lg accent-blue-600" 
                           value={formData.evaluation.functioningLevel} onChange={(e) => setFormData({...formData, evaluation: {...formData.evaluation, functioningLevel: Number(e.target.value)}})} />
                        <span className="font-bold text-blue-700 w-12 text-right">{formData.evaluation.functioningLevel}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">1 = Peligro persistente | 100 = Actividad satisfactoria</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PASO 3: DIAGNÓSTICO */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 border-l-4 border-teal-500 pl-3">Impresión Diagnóstica (CIE-11)</h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input type="text" placeholder="Buscar código o nombre CIE-11 (ej: Depresión, Ansiedad)..." className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                value={cieSearch} onChange={(e) => setCieSearch(e.target.value)} />
              
              {cieResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto">
                  {cieResults.map((item: any) => (
                    <div key={item.id} onClick={() => addDiagnosis(item)} className="p-3 hover:bg-teal-50 cursor-pointer border-b last:border-0 transition-colors flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 rounded">{item.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 mt-6">
              {formData.diagnoses.map((diag, index) => (
                <div key={index} className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm relative group hover:border-teal-300 transition-all">
                  <button onClick={() => removeDiagnosis(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">{diag.code}</span>
                    <h4 className="font-bold text-slate-700 text-lg">{diag.name}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
                    <div className="lg:col-span-1">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tipo</label>
                        <select className="w-full p-2 border rounded text-sm bg-white" value={diag.type} onChange={(e) => {
                            const ds = [...formData.diagnoses];
                            ds[index].type = e.target.value;
                            setFormData({...formData, diagnoses: ds});
                        }}>
                        <option value="PRIMARY">Principal</option>
                        <option value="SECONDARY">Secundario</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Predisponente</label>
                        <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Factor..." value={diag.factors.predisposing}
                            onChange={(e) => {
                            const ds = [...formData.diagnoses];
                            ds[index].factors.predisposing = e.target.value;
                            setFormData({...formData, diagnoses: ds});
                        }} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Precipitante</label>
                        <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Factor..." value={diag.factors.precipitating}
                            onChange={(e) => {
                            const ds = [...formData.diagnoses];
                            ds[index].factors.precipitating = e.target.value;
                            setFormData({...formData, diagnoses: ds});
                        }} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Mantenedor</label>
                        <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Factor..." value={diag.factors.maintaining}
                            onChange={(e) => {
                            const ds = [...formData.diagnoses];
                            ds[index].factors.maintaining = e.target.value;
                            setFormData({...formData, diagnoses: ds});
                        }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 4: PLAN */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 border-l-4 border-teal-500 pl-3">Plan de Tratamiento y Encuadre</h3>
            <div className="bg-white border rounded-xl p-6 shadow-sm">
               <div className="mb-6">
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Objetivos Terapéuticos (Corto/Mediano Plazo)</label>
                  <textarea placeholder="Describa los objetivos principales del tratamiento..." className="w-full p-4 border rounded-xl h-32 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                    value={formData.treatmentPlan.shortTermObjective}
                    onChange={(e) => setFormData({...formData, treatmentPlan: {...formData.treatmentPlan, shortTermObjective: e.target.value}})} />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Modalidad</label>
                    <select className="w-full p-3 border rounded-lg bg-gray-50" 
                        value={formData.treatmentPlan.modalityId}
                        onChange={(e) => setFormData({...formData, treatmentPlan: {...formData.treatmentPlan, modalityId: Number(e.target.value)}})}>
                        <option value="1">Individual</option>
                        <option value="2">Pareja</option>
                        <option value="3">Familiar</option>
                        <option value="4">Grupal</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Frecuencia</label>
                    <select className="w-full p-3 border rounded-lg bg-gray-50" 
                        value={formData.treatmentPlan.frequencyId}
                        onChange={(e) => setFormData({...formData, treatmentPlan: {...formData.treatmentPlan, frequencyId: Number(e.target.value)}})}>
                        <option value="1">Semanal</option>
                        <option value="2">Quincenal</option>
                        <option value="3">Mensual</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Duración Estimada (Semanas)</label>
                    <input type="number" className="w-full p-3 border rounded-lg bg-gray-50" placeholder="12"
                        value={formData.treatmentPlan.estimatedDurationWeeks}
                        onChange={(e) => setFormData({...formData, treatmentPlan: {...formData.treatmentPlan, estimatedDurationWeeks: Number(e.target.value)}})} />
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN */}
        <div className="mt-10 flex justify-between border-t pt-6">
          <Button disabled={step === 1} onClick={() => setStep(step - 1)} variant="outline" className="px-6">
            <ChevronLeft size={20} className="mr-2" /> Anterior
          </Button>
          
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} className="px-8 shadow-lg shadow-teal-100">
              Siguiente <ChevronRight size={20} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || formData.diagnoses.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-10 shadow-lg shadow-green-100">
              <Save size={20} className="mr-2" /> {loading ? 'Guardando...' : 'Finalizar Apertura'}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};