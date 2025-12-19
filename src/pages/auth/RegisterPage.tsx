
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../lib/api';

export const RegisterPage = () => {
const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Las contraseñas no coinciden");
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      toast.success("Registro exitoso. Por favor revisa tu correo para confirmar tu cuenta.");
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-4">
            <Brain className="h-12 w-12 text-teal-600" />
          </Link>
          <h2 className="text-3xl font-bold text-slate-900">Crear una cuenta</h2>
          <p className="mt-2 text-slate-600">Únete a PsiFirm hoy mismo</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Selector de Rol Simple (Según PDF, ambos pueden registrarse) */}

             <Input label="Usuario" id="username" type="text" placeholder="user12" required value={formData.username} onChange={handleChange} />
             

          <Input label="Correo electrónico" id="email" type="email" placeholder="juan@ejemplo.com" required value={formData.email} onChange={handleChange} />
          
          <Input label="Contraseña" id="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
          <Input label="Confirmar contraseña" id="confirmPassword" type="password" placeholder="••••••••" required value={formData.confirmPassword} onChange={handleChange} />

          <Button type="submit" fullWidth>
            Registrarse
          </Button>

          <p className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500">
              Inicia Sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};