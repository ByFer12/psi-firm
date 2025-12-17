import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Correo enviado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <Brain className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Revisa tu correo</h2>
          <p className="mt-2 text-slate-600 mb-6">Hemos enviado las instrucciones a {email}</p>
          <Link to="/login">
            <Button variant="outline" fullWidth>Volver al Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <Link to="/login" className="flex items-center text-sm text-slate-500 hover:text-teal-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Recuperar contraseña</h2>
        <p className="text-slate-600 mb-6">Ingresa tu correo y te enviaremos un enlace.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Correo electrónico" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>
      </div>
    </div>
  );
};