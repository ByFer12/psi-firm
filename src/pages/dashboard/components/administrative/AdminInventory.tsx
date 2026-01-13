import { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, Package, ArrowDown, ArrowUp } from 'lucide-react';
import { api } from '../../../../lib/api';
// import api from '../../../../services/api'; // Tu instancia de axios

export const AdminInventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Estado para el movimiento de stock
  const [movement, setMovement] = useState({ quantity: 0, typeId: 1, reason: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
    const res = await api.get('/inventory/products');
      setProducts(res.data);
      

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedProduct) return;
    try {
        // await api.post('/inventory/movements', { 
        //    productId: selectedProduct.id,
        //    ...movement
        // });
        alert("Movimiento registrado con éxito (Simulado)");
        setShowModal(false);
        fetchProducts(); // Recargar datos
    } catch (error) {
        alert("Error al registrar movimiento");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-teal-600" /> Inventario y Farmacia
        </h2>
        <div className="flex gap-2">
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2">
                <Plus size={18} /> Nuevo Producto
            </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">Producto</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Categoría</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Precio</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Stock</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Estado</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-slate-800">{product.name}</td>
                <td className="p-4 text-slate-500">{product.category.name}</td>
                <td className="p-4 text-slate-600">Q{product.price.toFixed(2)}</td>
                <td className="p-4">
                    <span className={`font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-700'}`}>
                        {product.stock}
                    </span>
                </td>
                <td className="p-4">
                  {product.stock <= product.minStock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      <AlertTriangle size={12} /> Stock Crítico
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      Normal
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => { setSelectedProduct(product); setShowModal(true); }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ajustar Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Movimientos */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
                <h3 className="text-lg font-bold mb-4">Ajustar Stock: {selectedProduct.name}</h3>
                <form onSubmit={handleMovement} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Movimiento</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setMovement({...movement, typeId: 1})} className={`flex-1 py-2 rounded-lg border ${movement.typeId === 1 ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-center gap-2"><ArrowUp size={16}/> Entrada</div>
                            </button>
                            <button type="button" onClick={() => setMovement({...movement, typeId: 2})} className={`flex-1 py-2 rounded-lg border ${movement.typeId === 2 ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-center gap-2"><ArrowDown size={16}/> Salida</div>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Cantidad</label>
                        <input type="number" min="1" className="w-full border border-gray-300 rounded-lg p-2" 
                            onChange={e => setMovement({...movement, quantity: parseInt(e.target.value)})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Razón / Comentario</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2" placeholder="Ej: Compra, Merma..."
                            onChange={e => setMovement({...movement, reason: e.target.value})} required />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Registrar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};