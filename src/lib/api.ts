import axios from 'axios';

// ✅ Detecta automáticamente el entorno
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:3000/api/v1' 
    : 'http://psifirm-alb-1728419943.us-east-2.elb.amazonaws.com/api/v1'
  );

console.log('🔧 API configurada en:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor para inyectar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});