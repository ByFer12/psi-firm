
import { Brain, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../UI/Button';
import { NavHashLink as Link } from 'react-router-hash-link';
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-teal-600" />
              <span className="font-bold text-xl text-slate-800 tracking-tight">PsiFirm</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link smooth to="/#" className="text-slate-600 hover:text-teal-600 transition-colors font-medium">Inicio</Link>
            <Link smooth to="/#servicios" className="text-slate-600 hover:text-teal-600 transition-colors font-medium">Servicios</Link>
            <Link smooth to="/#nosotros" className="text-slate-600 hover:text-teal-600 transition-colors font-medium">Nosotros</Link>
            <div className="flex items-center gap-3 ml-4">
              <Link to="/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link to="/registro">
                <Button variant="primary">Registrarse</Button>
              </Link>
            </div>
          </div>

          {/* Mobile button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2">
          <div className="px-4 space-y-3 pb-3">
            <Link smooth to="/" className="block text-slate-600 py-2">Inicio</Link>
            <Link smooth to="/#servicios" className="block text-slate-600 py-2">Servicios</Link>
            <Link smooth to="/#nosotros" className="block text-slate-600 py-2">Nosotros</Link>
            <Link to="/login" className="block w-full">
              <Button variant="outline" fullWidth>Iniciar Sesión</Button>
            </Link>
            <Link to="/registro" className="block w-full">
              <Button fullWidth>Registrarse</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};