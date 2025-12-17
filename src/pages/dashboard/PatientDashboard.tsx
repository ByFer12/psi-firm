import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/UI/Button';

export const PatientDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <span className="font-bold text-teal-600 text-xl">PsiFirm | Pacientes</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Hola, {user?.sub}</span> {/* user.sub o username del token */}
            <Button variant="outline" onClick={logout} className="text-sm">Cerrar Sesión</Button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Mi Panel</h1>
        <div className="grid md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold mb-2">Mis Citas</h2>
             <p className="text-slate-500 mb-4">Gestiona tus próximas sesiones.</p>
             <Button fullWidth>Ver Calendario</Button>
           </div>
           {/* Más tarjetas... */}
        </div>
      </main>
    </div>
  );
};