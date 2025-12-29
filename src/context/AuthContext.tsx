import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export type UserRole = 1 | 2 | 3 | 4 | 5 | 6;

interface User {
  id: number;
  username: string;
  email: string;
  roleId: UserRole;
}

// Interfaz para los datos que recibes en el login
interface LoginData {
    email: string;
    password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<any>; // Corregido el tipo
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al cargar
  const checkAuth = async () => {
    // Si no hay token guardado, no intentamos llamar al backend
    const token = localStorage.getItem('token');
    if (!token) {
        setIsLoading(false);
        return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error verificando sesión", error);
      localStorage.removeItem('token'); // Si falla, limpiamos
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Función de Login
  const login = async (data: LoginData) => {
    try {
      const res = await api.post('/auth/login', data);
      
      // 1. GUARDAMOS EL TOKEN
      if (res.data.tokens && res.data.tokens.accessToken) {
          localStorage.setItem('token', res.data.tokens.accessToken);
      }
      
      // 2. Guardamos el usuario
      setUser(res.data.user);
      setIsAuthenticated(true);
      return res.data;
    } catch (error) {
        throw error;
    }
  };

  const logout = async () => {
    try {
        // Opcional: Avisar al backend
        // await api.post('/auth/logout'); 
    } catch (e) {
        console.error(e);
    } finally {
        // Limpieza local
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading,
      login, 
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};