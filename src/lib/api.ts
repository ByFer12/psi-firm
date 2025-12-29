import axios from 'axios';

const API_URL = 'http://psifirm-alb-1728419943.us-east-2.elb.amazonaws.com/api/v1';

console.log('🔧 API configurada en:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ Para enviar cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor para inyectar el token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});