import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { Activity, Plus, Search, Edit2, Power, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { toast } from 'react-toastify';
import { CreateAreaModal } from './modals/CreateAreaModal';

export const AdminClinicalAreas = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any | null>(null);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clinical-areas'); 
      setAreas(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando áreas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleToggleStatus = async (id: number) => {
    try {
        await api.patch(`/clinical-areas/${id}/status`);
        toast.success("Estado actualizado");
        loadAreas();
    } catch (error) {
        toast.error("Error al actualizar estado");
    }
  };

  const handleEdit = (area: any) => {
    setSelectedArea(area);
    setShowModal(true);
  };

  const handleCreate = () => {
      setSelectedArea(null);
      setShowModal(true);
  };

  // --- LÓGICA FILTRADO + PAGINACIÓN ---
  
  // 1. Filtrar
  const filtered = areas.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 2. Calcular índices
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Resetear página si buscas algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-teal-600"/> Catálogo de Áreas Clínicas
              </h1>
              <p className="text-slate-500 text-sm">Gestiona las especialidades y servicios de la clínica.</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
              <Plus size={18}/> Nueva Área
          </Button>
       </div>

       {/* Buscador */}
       <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
       </div>

       {/* Tabla */}
       {loading ? (
         <div className="flex justify-center py-10"><Loader2 className="animate-spin text-teal-600"/></div>
       ) : (
         <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-slate-600 text-sm border-b">
                            <th className="p-4 font-semibold">Nombre</th>
                            <th className="p-4 font-semibold">Descripción</th>
                            <th className="p-4 font-semibold text-center">Estado</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentItems.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">No se encontraron resultados</td></tr>
                        ) : (
                            currentItems.map(area => (
                                <tr key={area.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-slate-800">{area.name}</td>
                                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{area.description || '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            area.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {area.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => handleEdit(area)}
                                            className="text-slate-500 hover:text-teal-600 transition p-1"
                                            title="Editar"
                                        >
                                            <Edit2 size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => handleToggleStatus(area.id)}
                                            className={`p-1 transition ${area.status === 'ACTIVE' ? 'text-slate-400 hover:text-red-500' : 'text-green-500 hover:text-green-700'}`}
                                            title={area.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                                        >
                                            <Power size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                    <span className="text-sm text-slate-500">
                        Mostrando {currentItems.length} de {filtered.length} áreas
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16}/>
                        </button>
                        <span className="text-sm font-medium px-2">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>
            )}
         </>
       )}

       {showModal && (
           <CreateAreaModal 
               onClose={() => setShowModal(false)}
               onSuccess={() => { setShowModal(false); loadAreas(); }}
               areaData={selectedArea}
           />
       )}
    </div>
  );
};