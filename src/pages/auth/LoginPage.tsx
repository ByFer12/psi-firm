import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Lock, ArrowLeft, Mail } from 'lucide-react'; // Iconos añadidos para UX
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api'; // Necesario para la llamada directa del paso 2

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, setAuthUser } = useAuth();

  // Estados de control de flujo
  const [step, setStep] = useState<'LOGIN' | '2FA'>('LOGIN');
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  // Lógica de redirección (Original)
  const redirectByRole = (role: number) => {
    switch (role) {
      case 6:
        navigate('/dashboard/paciente');
        break;
      case 1:
      case 2:
      case 3:
      case 4:
        navigate('/dashboard/empleado');
        break;
      default:
        navigate('/');
        break;
    }
  };

  // --- PASO 1: LOGIN (Credenciales) ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Usamos la función login del contexto
      const response = await login({ email, password });
      
      // Verificamos si el backend pide 2FA
      if (response.requires2FA) {
        setUserId(response.userId);
        setStep('2FA');
        toast.info(response.message || 'Código enviado a tu correo');
      } else {
        // Login directo (Fallback si desactivas 2FA)
        console.log("Sesión iniciada rol >", response.user.roleId);
        toast.success('Bienvenido de nuevo');
        setAuthUser(response.user); // Actualizar contexto
        redirectByRole(response.user.roleId);
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // --- PASO 2: VERIFICACIÓN (Código) ---
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamada directa a la API para verificar el código
      const response = await api.post('/auth/verify-2fa', { 
        userId, 
        code 
      });

      const data = response.data;

      // Si llegamos aquí, las cookies ya se setearon
      toast.success('Verificación exitosa');
      setAuthUser(data.user); // Actualizamos contexto manualmente
      redirectByRole(data.user.roleId);

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* --- ENCABEZADO (Común para ambos pasos) --- */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-4">
            <Brain className="h-12 w-12 text-teal-600" />
          </Link>
          <h2 className="text-3xl font-bold text-slate-900">
            {step === 'LOGIN' ? 'Bienvenido de nuevo' : 'Verificación de Seguridad'}
          </h2>
          <p className="mt-2 text-slate-600">
            {step === 'LOGIN' 
              ? 'Accede a tu cuenta en PsiFirm' 
              : `Ingresa el código enviado a ${email}`}
          </p>
        </div>

        {/* --- FORMULARIO PASO 1: LOGIN --- */}
        {step === 'LOGIN' && (
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
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

            {/* Elementos recuperados: Remember Me y Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded" 
                />
                <label htmlFor="remember-me" className="ml-2 block text-slate-600">
                  Recordarme
                </label>
              </div>
              <Link to="/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>

            {/* Elemento recuperado: Registro */}
            <p className="text-center text-sm text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="font-medium text-teal-600 hover:text-teal-500">
                Regístrate aquí
              </Link>
            </p>
          </form>
        )}

        {/* --- FORMULARIO PASO 2: CÓDIGO 2FA --- */}
        {step === '2FA' && (
          <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
            
            {/* Aviso visual extra para mejorar UX */}
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <p className="text-sm text-teal-800">
                    Revisa tu bandeja de entrada o spam para encontrar el código de 6 dígitos.
                </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                <Input 
                  label="Código de Verificación" 
                  id="code" 
                  type="text" 
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Solo números
                  className="pl-10 text-center text-2xl tracking-[0.2em] font-bold"
                  autoFocus
                  required 
                />
              </div>
            </div>

            <Button type="submit" fullWidth disabled={loading || code.length < 6}>
              {loading ? 'Validando...' : 'Confirmar Ingreso'}
            </Button>
            
            <button 
              type="button" 
              onClick={() => { setStep('LOGIN'); setCode(''); }}
              className="w-full flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 mt-4 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
              Volver al inicio de sesión
            </button>
          </form>
        )}

      </div>
    </div>
  );
};