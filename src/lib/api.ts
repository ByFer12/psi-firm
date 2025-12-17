import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1'; 

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // <--- ¡OBLIGATORIO! Sin esto, F5 siempre te deslogueará
  headers: {
    'Content-Type': 'application/json',
  },
});