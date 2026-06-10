import axios from 'axios';
import { Platform } from 'react-native';
import { PersistenceService } from './persistence';

// En desarrollo con Android Emulator, localhost es 10.0.2.2
// Para iOS o dispositivo físico, usar la IP de la máquina
const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000' 
  : 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar caché offline y cola de sincronización
api.interceptors.response.use(
  async (response) => {
    // Si es un GET exitoso de CV o Postulaciones, guardamos en persistencia local
    if (response.config.method === 'get') {
      if (response.config.url?.includes('/cv/')) {
        await PersistenceService.saveCV(response.data);
      } else if (response.config.url?.includes('/postulaciones/usuario/')) {
        await PersistenceService.savePostulaciones(response.data);
      } else if (response.config.url?.includes('/notificaciones/usuario/')) {
        await PersistenceService.saveNotificaciones(response.data);
      }
    }
    return response;
  },
  async (error) => {
    const { config, message } = error;

    // Si es un error de red o timeout
    if (!error.response || message === 'Network Error' || error.code === 'ECONNABORTED') {
      // Si es un GET, intentamos retornar datos locales
      if (config.method === 'get') {
        if (config.url?.includes('/cv/')) {
          const localData = await PersistenceService.getCV();
          if (localData) return { data: localData, status: 200, config, headers: {}, statusText: 'OK' };
        } else if (config.url?.includes('/postulaciones/usuario/')) {
          const localData = await PersistenceService.getPostulaciones();
          if (localData) return { data: localData, status: 200, config, headers: {}, statusText: 'OK' };
        } else if (config.url?.includes('/notificaciones/usuario/')) {
          const localData = await PersistenceService.getNotificaciones();
          if (localData) return { data: localData, status: 200, config, headers: {}, statusText: 'OK' };
        }
      }

      // Si es un POST/PATCH/PUT/DELETE, añadimos a la cola de sincronización
      if (['post', 'patch', 'put', 'delete'].includes(config.method)) {
        await PersistenceService.addToSyncQueue({
          url: config.url,
          method: config.method,
          data: JSON.parse(config.data),
        });
        // Retornamos una respuesta "exitosa" simulada para que la UI no se rompa
        return { data: { _offline: true }, status: 202, config, headers: {}, statusText: 'Accepted' };
      }
    }

    return Promise.reject(error);
  }
);

export default api;
