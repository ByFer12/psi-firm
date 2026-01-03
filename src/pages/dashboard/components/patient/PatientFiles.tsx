import { useState, useRef, useEffect } from 'react';
import { api } from '../../../../lib/api'; // Ajusta según tu estructura
import { Button } from '../../../../components/UI/Button';
import { Input } from '../../../../components/UI/Input';
import { 
  FileText, Image as ImageIcon, Trash2, Upload, 
  Eye, Loader2, X, ZoomIn, ZoomOut, RotateCcw, Move 
} from 'lucide-react';
import { toast } from 'react-toastify';

// --- TIPOS ---
interface FileData {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: 'DOCUMENT' | 'IMAGE';
  description?: string;
  createdAt: string;
}

// --- COMPONENTE MODAL VISOR (Zoom & Pan) ---
const FileViewerModal = ({ file, onClose }: { file: FileData | null, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!file) return null;

  // Reset al abrir nuevo archivo
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [file]);

  // Manejo del Zoom con botones
  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(prev + delta, 4))); // Min 0.5x, Max 4x
  };

  // Manejo del Zoom con Rueda del Mouse
  const handleWheel = (e: React.WheelEvent) => {
    if (file.fileType === 'IMAGE') {
      e.preventDefault(); // Evita scroll de la página
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    }
  };

  // Inicio del Arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) { // Solo permitir arrastrar si hay zoom
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  // Movimiento del Arrastre
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Fin del Arrastre
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      {/* Contenedor Principal del Modal */}
      <div 
        className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 z-10">
          <div className="flex items-center gap-2">
            {file.fileType === 'DOCUMENT' ? <FileText className="text-red-500"/> : <ImageIcon className="text-teal-600"/>}
            <h3 className="font-semibold text-slate-800 truncate max-w-xs md:max-w-md">{file.description || file.fileName}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={24} className="text-slate-600"/>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 relative overflow-hidden bg-gray-100 flex items-center justify-center">
          
          {/* VISTA PARA DOCUMENTOS PDF */}
          {file.fileType === 'DOCUMENT' && (
             <iframe 
               src={file.fileUrl} 
               className="w-full h-full border-none"
               title="Visor PDF"
             />
          )}

          {/* VISTA PARA IMÁGENES CON ZOOM */}
          {file.fileType === 'IMAGE' && (
            <>
              {/* Controles Flotantes */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 p-2 rounded-full shadow-lg z-20 backdrop-blur">
                <button onClick={() => handleZoom(-0.25)} className="p-2 hover:bg-gray-100 rounded-full" title="Reducir"><ZoomOut size={20}/></button>
                <span className="w-16 text-center text-sm font-medium self-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => handleZoom(0.25)} className="p-2 hover:bg-gray-100 rounded-full" title="Aumentar"><ZoomIn size={20}/></button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button onClick={() => { setScale(1); setPosition({x:0,y:0}); }} className="p-2 hover:bg-gray-100 rounded-full" title="Resetear"><RotateCcw size={20}/></button>
              </div>

              {/* Área de la Imagen Interactiva */}
              <div 
                ref={containerRef}
                className={`w-full h-full flex items-center justify-center overflow-hidden ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={file.fileUrl} 
                  alt="Visor"
                  draggable={false}
                  className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out select-none"
                  style={{ 
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` 
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const PatientFiles = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'images'>('documents');
  const [documents, setDocuments] = useState<FileData[]>([]);
  const [images, setImages] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Drag and Drop States
  const [dragActive, setDragActive] = useState(false);

  // Modal State
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  // Refs
  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [docDescription, setDocDescription] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files/my-files');
      setDocuments(res.data.documents || []);
      setImages(res.data.images || []);
    } catch (error) {
      console.error("Error cargando archivos", error);
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJO DE DRAG AND DROP ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;

      if (activeTab === 'documents') {
        // Validar que sea PDF
        if (files[0].type !== 'application/pdf') {
            return toast.error("Solo se permiten archivos PDF en esta sección");
        }
        // Asignar al input para reutilizar lógica
        if (docInputRef.current) {
             const dataTransfer = new DataTransfer();
             dataTransfer.items.add(files[0]);
             docInputRef.current.files = dataTransfer.files;
             // Disparar evento manual o llamar función directa
             // Aquí llamamos directo a la lógica de subida, pero pediremos confirmación visual
             toast.info("Archivo PDF detectado. Añade una descripción y presiona Subir.");
        }
      } else {
        // Imágenes
        const validImages = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (validImages.length === 0) return toast.error("Arrastra archivos de imagen válidos");
        
        if (imgInputRef.current) {
            const dataTransfer = new DataTransfer();
            validImages.forEach(file => dataTransfer.items.add(file));
            imgInputRef.current.files = dataTransfer.files;
            
            // Subida automática para imágenes (opcional, o pedir click en botón)
            const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
            handleUploadImages(syntheticEvent);
        }
      }
    }
  };

  // --- LÓGICA DE SUBIDA (Igual que antes) ---
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = docInputRef.current?.files?.[0];
    if (!file) return toast.error("Selecciona un documento PDF");

    const formData = new FormData();
    formData.append('document', file);
    if (docDescription) formData.append('description', docDescription);

    try {
      setUploading(true);
      await api.post('/files/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Documento subido correctamente');
      setDocDescription('');
      if (docInputRef.current) docInputRef.current.value = '';
      loadFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = imgInputRef.current?.files;
    if (!files || files.length === 0) return toast.error("Selecciona al menos una imagen");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setUploading(true);
      await api.post('/files/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Imágenes subidas correctamente');
      if (imgInputRef.current) imgInputRef.current.value = '';
      loadFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir modal si clickeamos borrar
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;
    try {
      await api.delete(`/files/${id}`);
      toast.success('Archivo eliminado');
      loadFiles();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>Cargando archivos...</div>;

  return (
    <div className="space-y-6">
      {/* Modal Viewer */}
      {selectedFile && (
        <FileViewerModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Mis Archivos</h2>
        <p className="text-slate-500 text-sm">Gestiona tus documentos médicos y fotografías. Arrastra archivos para subirlos rápido.</p>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b">
          <button 
            onClick={() => setActiveTab('documents')}
            className={`pb-3 px-2 text-sm font-medium transition ${activeTab === 'documents' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-slate-500'}`}
          >
            <span className="flex items-center gap-2"><FileText size={18}/> Documentos PDF</span>
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            className={`pb-3 px-2 text-sm font-medium transition ${activeTab === 'images' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-slate-500'}`}
          >
            <span className="flex items-center gap-2"><ImageIcon size={18}/> Galería de Imágenes</span>
          </button>
        </div>

        {/* --- Sección Documentos --- */}
        {activeTab === 'documents' && (
          <div className="mt-6 space-y-6">
            {/* Area de Carga con Drag & Drop */}
            <form 
                onSubmit={handleUploadDocument}
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop}
                className={`relative p-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-4
                    ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                `}
            >
              <div className="bg-white p-3 rounded-full shadow-sm">
                  <Upload className={dragActive ? "text-teal-600" : "text-slate-400"} size={24}/>
              </div>
              <div>
                  <p className="text-slate-700 font-medium">Arrastra tu PDF aquí o haz clic para buscar</p>
                  <p className="text-slate-400 text-xs mt-1">Soporta solo archivos PDF</p>
              </div>
              
              {/* Input Original (Oculto pero funcional) */}
              <input 
                type="file" 
                ref={docInputRef}
                onChange={() => toast.info("Archivo seleccionado. Añade descripción si deseas.")} 
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {/* Formulario visible para descripción y botón */}
              <div className="z-10 w-full max-w-md flex flex-col md:flex-row gap-2 mt-2" onClick={e => e.stopPropagation()}>
                 <Input 
                    placeholder="Descripción (ej. Receta 2024)" 
                    value={docDescription} 
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="bg-white"
                 />
                 <Button type="submit" disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin"/> : 'Subir'}
                 </Button>
              </div>
            </form>

            {/* Lista de Documentos */}
            <div className="grid gap-3">
              {documents.length === 0 ? (
                <p className="text-center text-slate-400 py-4">No hay documentos subidos.</p>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition group">
                    <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setSelectedFile(doc)}>
                      <div className="bg-red-50 p-2 rounded-lg text-red-500 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate group-hover:text-teal-600 transition">{doc.description || doc.fileName}</p>
                        <p className="text-xs text-slate-400 truncate">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => setSelectedFile(doc)} 
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-full" 
                        title="Ver Documento"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(doc.id, e)} 
                        className="p-2 text-red-400 hover:bg-red-50 rounded-full"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- Sección Imágenes --- */}
        {activeTab === 'images' && (
          <div className="mt-6 space-y-6">
             <form 
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop}
                className={`relative p-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-4
                    ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                `}
            >
               <Upload className={dragActive ? "text-teal-600" : "text-slate-400"} size={24}/>
               <div>
                  <p className="text-slate-700 font-medium">Arrastra tus imágenes aquí</p>
                  <p className="text-slate-400 text-xs">JPG, PNG, WebP (Máx 10)</p>
               </div>
               
               <input 
                  type="file" 
                  multiple
                  ref={imgInputRef}
                  onChange={handleUploadImages} // Sube automáticamente al seleccionar
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.length === 0 ? (
                 <p className="col-span-full text-center text-slate-400 py-4">No hay imágenes subidas.</p>
              ) : (
                images.map(img => (
                  <div 
                    key={img.id} 
                    className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border cursor-pointer"
                    onClick={() => setSelectedFile(img)}
                  >
                    <img src={img.fileUrl} alt={img.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                       <button className="text-white flex flex-col items-center">
                          <Eye size={24} />
                          <span className="text-xs mt-1">Ver</span>
                       </button>
                    </div>
                    <button 
                        onClick={(e) => handleDelete(img.id, e)}
                        className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};