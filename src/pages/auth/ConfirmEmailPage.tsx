import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../../components/UI/Button';

export const ConfirmEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirm = async () => {
      try {
        await api.get(`/auth/confirm-email/${token}`);
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Token inválido o expirado');
      }
    };
    if (token) confirm();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader className="w-16 h-16 text-teal-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold">Verificando cuenta...</h2>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Cuenta Confirmada!</h2>
            <p className="text-slate-600 mb-6">Ya puedes iniciar sesión en PsiFirm.</p>
            <Link to="/login">
              <Button fullWidth>Ir al Login</Button>
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Error de Verificación</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <Link to="/">
              <Button variant="outline">Volver al Inicio</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};