import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
const redirectByRole = (role: number) => {
  switch (role) {
    case 6:
      navigate('/dashboard/paciente'); // Corregido: antes decía /patient/dashboard
      break;
    case 1:
    case 2:
    case 3:
    case 4:
      navigate('/dashboard/empleado');
      break;
    default:
      navigate('/'); // Redirección segura por defecto
      break;
  }
};
const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // POST /auth/login
      const response = await api.post('/auth/login', { email, password });
      //const token = response.data.token || response.data.accessToken; 
      const userData = response.data.user;
      
      login(userData);
      console.log("Sesion iniciado retorna> ", userData.roleId)
      toast.success('Bienvenido de nuevo');
     
      redirectByRole(userData.roleId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }



  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-4">
            <Brain className="h-12 w-12 text-teal-600" />
          </Link>
          <h2 className="text-3xl font-bold text-slate-900">Bienvenido de nuevo</h2>
          <p className="mt-2 text-slate-600">Accede a tu cuenta en PsiFirm</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input 
              label="Correo electrónico o Usuario" 
              id="email" 
              type="text" 
              placeholder="ejemplo@psifirm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <Input 
              label="Contraseña" 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-slate-600">Recordarme</label>
            </div>
             <Link to="/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                    ¿Olvidaste tu contraseña?
                </Link>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          <p className="text-center text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-teal-600 hover:text-teal-500">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};