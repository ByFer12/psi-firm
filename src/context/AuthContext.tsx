import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api'; // Asegúrate de que esta instancia tenga withCredentials: true

export type UserRole = 1 | 2 | 3 | 4 | 5 | 6;

interface User {
  id: number;
  username: string;
  email: string;
  roleId: UserRole;
  // Añade aquí otros campos no sensibles que devuelva tu API
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para verificar si el usuario sigue autenticado (usando la cookie)
  const checkAuth = async () => {
    try {
      // Debes crear una ruta GET /auth/me en tu backend
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // Ya no guardamos token en localStorage, la cookie ya está en el navegador
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // El backend debe limpiar las cookies
    } finally {
      setUser(null);
      // Opcional: limpiar cualquier rastro en memoria y redirigir
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
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