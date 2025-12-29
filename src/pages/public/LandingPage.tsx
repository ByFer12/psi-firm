import { Navbar } from '../../components/layouts/Navbar';
import { Button } from '../../components/UI/Button';
import { Brain, HeartHandshake, ShieldCheck, Clock, Stethoscope, Users, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleScheduleClick = () => {
    if (isAuthenticated) {
      // Usamos roleId y casting 'as any' o el nombre correcto de la propiedad 
      // para evitar el bloqueo de TypeScript si la interfaz User es limitada
      const userRole = (user as any)?.roleId || (user as any)?.role;

      if (userRole === 6) {
        navigate('/dashboard/paciente/citas/nueva');
      } else {
        navigate('/dashboard/empleado');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          <div id='/' className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Bienestar mental con <span className="text-teal-600">gestión profesional</span>.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              PsiFirm integra la gestión clínica y administrativa para ofrecer un servicio de salud mental de clase mundial. Atención personalizada para cada paciente.
            </p>
            <div className="flex gap-4 pt-4">
              <Button className="h-12 px-8 text-base" onClick={handleScheduleClick}>Agendar Cita</Button>
              <Button variant="outline" className="h-12 px-8 text-base">Conocer más</Button>
            </div>
          </div>
          <div className="lg:w-1/2 bg-teal-50 rounded-3xl p-8 lg:p-12 shadow-inner">
             <div className="aspect-video bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <Brain size={64} />
             </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
       <section id="servicios" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800">Nuestros Servicios</h2>
            <p className="mt-4 text-slate-600">Enfoque integral en salud mental</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
             <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <Brain className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Psicología Clínica</h3>
                <p className="text-slate-600">Evaluación y tratamiento de trastornos emocionales y conductuales.</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <Stethoscope className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Psiquiatría</h3>
                <p className="text-slate-600">Diagnóstico médico y manejo farmacológico especializado.</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <Users className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Terapia Familiar</h3>
                <p className="text-slate-600">Espacios seguros para mejorar la comunicación en el núcleo familiar.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
                <div className="bg-teal-100 rounded-2xl overflow-hidden h-80 flex items-center justify-center shadow-lg">
                    <img 
                      src="https://media.puntal.com.ar/p/4e07f73438303fb686e359db0b60595d/adjuntos/270/imagenes/001/358/0001358872/psicologosjpg.jpg" 
                      alt="Profesionales de la salud" 
                      className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <div className="md:w-1/2 space-y-6">
                <h2 className="text-3xl font-bold text-slate-800">Sobre Nosotros</h2>
                <p className="text-slate-600 text-lg">
                    Fundada en 2024, PsiFirm nació con la misión de democratizar el acceso a la salud mental de calidad en la región.
                </p>
                <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-slate-700 font-medium">
                        <CalendarCheck className="w-5 h-5 text-teal-600" /> Citas flexibles presenciales y virtuales.
                    </li>
                    <li className="flex items-center gap-2 text-slate-700 font-medium">
                        <CalendarCheck className="w-5 h-5 text-teal-600" /> Historial clínico digital 100% seguro.
                    </li>
                </ul>
            </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: HeartHandshake, title: "Terapia Personalizada", desc: "Planes adaptados a tus necesidades individuales." },
            { icon: ShieldCheck, title: "Privacidad Garantizada", desc: "Tus datos están protegidos con estándares de alta seguridad." },
            { icon: Clock, title: "Gestión Eficiente", desc: "Agenda citas y revisa tu historial desde cualquier dispositivo." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6 text-teal-600">
                <item.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2024 PsiFirm. Gestión profesional en salud mental.</p>
        </div>
      </footer>
    </div>
  );
};