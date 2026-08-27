import axios from 'axios';
import { Platform } from 'react-native';
import { PersistenceService } from './persistence';
import * as SecureStore from 'expo-secure-store';

// En desarrollo con Android Emulator, localhost es 10.0.2.2
// Para iOS o dispositivo físico, usar la IP de la máquina
const BASE_URL = 'https://sigeli-backend-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('talento_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData (foto facial / audio): no forzar application/json
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
      // Excepción: auth biométrica / login no deben encolarse como éxito falso
      const url = config.url || '';
      const skipOfflineQueue =
        url.includes('/auth/login') ||
        url.includes('/auth/verify-biometric') ||
        url.includes('/voz/');

      if (['post', 'patch', 'put', 'delete'].includes(config.method) && !skipOfflineQueue) {
        let requestData = config.data;
        
        // Manejo especial para FormData: extraer partes para que sea serializable en la cola
        if (config.data && typeof config.data === 'object' && config.data._parts) {
          requestData = {};
          config.data._parts.forEach(([key, value]: [string, any]) => {
            // Si es un archivo, guardamos solo la URI para la cola
            if (value && typeof value === 'object' && value.uri) {
              requestData[`${key}Uri`] = value.uri;
            } else {
              requestData[key] = value;
            }
          });
        } else {
          try {
            if (typeof config.data === 'string') {
              requestData = JSON.parse(config.data);
            }
          } catch (e) {
            console.log('No se pudo parsear data para la cola de sincronización, se guardará como está.');
          }
        }

        await PersistenceService.addToSyncQueue({
          url: config.url,
          method: config.method,
          data: requestData,
        });
        // Retornamos una respuesta "exitosa" simulada para que la UI no se rompa
        return { data: { _offline: true }, status: 202, config, headers: {}, statusText: 'Accepted' };
      }
    }

    return Promise.reject(error);
  }
);

export default api;
