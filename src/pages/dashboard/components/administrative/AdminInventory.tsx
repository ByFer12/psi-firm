import { useState, useEffect, useMemo } from 'react'; // Agregamos useMemo para optimizar
import { api } from '../../../../lib/api';
import { 
  Search, Plus, Package, AlertTriangle, 
  TrendingUp, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import { toast } from 'react-toastify';
import { CreateProductModal } from './modals/CreateProductModal';
import { MovementModal } from './modals/MovementModal';

interface Product {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  price: number;
  categoryId: number;
  category?: { name: string };
  unit?: { name: string };
}

// Configuración
const ITEMS_PER_PAGE = 7;

export const AdminInventory = () => {
  // --- Estados de Datos ---
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados de UI, Filtros y Paginación ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Estados de Modales ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, alertRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/alerts')
      ]);
      setProducts(prodRes.data);
      setAlerts(alertRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- Lógica de Procesamiento de Datos (Filtro -> Orden -> Paginación) ---
  const processedProducts = useMemo(() => {
    // 1. Filtrar
    let result = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Ordenar por precio
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchTerm, sortOrder]);

  // 3. Segmentar para Paginación
  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = processedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetear a página 1 cuando se busca algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            icon={Package} color="blue" 
            label="Total Productos" value={products.length} 
        />
        <StatCard 
            icon={AlertTriangle} color="red" 
            label="Alertas de Stock" value={alerts.length} 
        />
        <StatCard 
            icon={TrendingUp} color="green" 
            label="Valor Inventario" 
            value={`Q. ${products.reduce((acc, p) => acc + (Number(p.price) * p.stock), 0).toLocaleString()}`} 
        />
      </div>

      {/* 2. Barra de Herramientas */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-1 gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar producto..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              
              {/* Filtro de Ordenamiento */}
              <select 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <option value="none">Sin orden</option>
                <option value="desc">Precio: Mayor a Menor</option>
                <option value="asc">Precio: Menor a Mayor</option>
              </select>
          </div>

          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 shadow-sm whitespace-nowrap">
              <Plus size={18} /> Nuevo Producto
          </Button>
      </div>

      {/* 3. Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-slate-500 border-b border-gray-200 uppercase text-xs tracking-wider sticky top-0">
                      <tr>
                          <th className="px-6 py-4 font-semibold">Producto</th>
                          <th className="px-6 py-4 font-semibold">Categoría</th>
                          <th className="px-6 py-4 font-semibold">Stock Actual</th>
                          <th className="px-6 py-4 font-semibold">
                            <div className="flex items-center gap-1">
                                Precio {sortOrder !== 'none' && <ArrowUpDown size={12} />}
                            </div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {loading ? (
                          <tr><td colSpan={5} className="p-10 text-center text-slate-400">Cargando inventario...</td></tr>
                      ) : paginatedProducts.length === 0 ? (
                          <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No se encontraron productos.</td></tr>
                      ) : (
                        paginatedProducts.map((product) => {
                            const isLowStock = product.stock <= product.minStock;
                            return (
                              <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                  <td className="px-6 py-4 align-middle">
                                      <div className="font-bold text-slate-700 text-base">{product.name}</div>
                                      {isLowStock && (
                                          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                                              <AlertTriangle size={10} /> STOCK CRÍTICO
                                          </div>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 align-middle">
                                      {product.category?.name || 'General'}
                                  </td>
                                  <td className="px-6 py-4 align-middle">
                                      <div className="flex items-center gap-2">
                                          <span className={`font-mono font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                                              {product.stock}
                                          </span>
                                          <span className="text-xs text-slate-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                              {product.unit?.name || 'U'}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-600 align-middle">
                                      Q.{Number(product.price).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 text-right align-middle">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => { setSelectedProduct(product); setShowMoveModal(true); }}
                                        className="text-teal-600 hover:bg-teal-50 border border-transparent hover:border-teal-100"
                                      >
                                          <RefreshCw size={16} className="mr-2" /> Ajustar Stock
                                      </Button>
                                  </td>
                              </tr>
                          );
                        })
                      )}
                  </tbody>
              </table>
          </div>
          
          {/* 4. Paginación */}
          {!loading && processedProducts.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                      Mostrando {paginatedProducts.length} de {processedProducts.length} productos
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="disabled:opacity-30"
                      >
                        <ChevronLeft size={20} />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                                    currentPage === page 
                                    ? 'bg-teal-600 text-white' 
                                    : 'text-slate-500 hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="disabled:opacity-30"
                      >
                        <ChevronRight size={20} />
                      </Button>
                  </div>
              </div>
          )}
      </div>

      {/* --- Modales --- */}
      {showCreateModal && (
          <CreateProductModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={() => { setShowCreateModal(false); loadData(); }} 
          />
      )}
      {showMoveModal && selectedProduct && (
          <MovementModal 
            product={selectedProduct}
            onClose={() => { setShowMoveModal(false); setSelectedProduct(null); }}
            onSuccess={() => { setShowMoveModal(false); setSelectedProduct(null); loadData(); }}
          />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, color, label, value }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-100 text-blue-600',
        red: 'bg-red-100 text-red-600',
        green: 'bg-green-100 text-green-600'
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            </div>
        </div>
    );
};