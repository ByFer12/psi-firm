import { api } from '../lib/api';

export interface Appointment {
  id: number;
  appointmentDate: string;
  durationMinutes: number;
  statusId: number;
  notes?: string;
  patient?: any;
  psychologist?: {
    employee: {
      name: string;
      lastname: string;
    }
  };
  area?: {
    id: number;
    name: string;
  };
}

export const appointmentService = {
  // GET /citas
  getMyAppointments: async () => {
    const response = await api.get<Appointment[]>('/citas');
    return response.data;
  },

  // POST /citas/request
  requestAppointment: async (date: string, areaId: number, notes: string) => {
    // Nota: El backend espera userId, pero usualmente se saca del token. 
    // Si tu backend lo exige en el body explícitamente, habría que agregarlo.
    // Asumiremos que el backend lo toma del Token o que el frontend lo inyecta.
    const response = await api.post('/citas/request', {
      date, 
      areaId, 
      notes
    });
    return response.data;
  },
};