import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

// Tipos...
interface LoginData { email: string; password: string; }

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<any>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setAuthUser: (user: any) => void; // Necesario para el login 2 pasos
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Verificar sesión (al recargar página)
  const checkAuth = async () => {
    try {
      // Axios envía la cookie automáticamente gracias a withCredentials: true
      const response = await api.get('/auth/me'); 
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Si falla es porque la cookie no existe o expiró
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Login (Paso 1)
  const login = async (data: LoginData) => {
    const res = await api.post('/auth/login', data);
    return res.data; // Retorna { requires2FA: true... } o user
  };

  // 3. Set Manual (Para usarse después de validar código 2FA)
  const setAuthUser = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // 4. Logout
  const logout = async () => {
    try {
        await api.post('/auth/logout'); // Backend borra cookie
    } catch (e) {
        console.error(e);
    } finally {
        setUser(null);
        setIsAuthenticated(false);
        // Opcional: Recarga dura para limpiar cualquier estado en memoria
        // window.location.href = '/'; 
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, checkAuth, setAuthUser }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};