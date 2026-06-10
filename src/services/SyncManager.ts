import NetInfo from '@react-native-community/netinfo';
import { PersistenceService } from './persistence';
import api from './api';

export class SyncManager {
  private static isSyncing = false;

  static initialize() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Conexión recuperada. Iniciando sincronización...');
        this.processQueue();
      }
    });
  }

  static async processQueue() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    // 1. Procesar cola de escritura (peticiones pendientes)
    const queue = await PersistenceService.getSyncQueue();
    if (queue.length > 0) {
      console.log(`Procesando ${queue.length} solicitudes pendientes...`);
      for (const item of queue) {
        try {
          await api({
            url: item.url,
            method: item.method,
            data: item.data,
          });
          await PersistenceService.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Error al sincronizar ${item.url}:`, error);
        }
      }
    }

    // 2. Refrescar datos de lectura (GET)
    try {
      const userId = 'user-test-id'; // En producción vendría del Auth
      await Promise.all([
        api.get(`/cv/${userId}`),
        api.get(`/postulaciones/usuario/${userId}`),
        api.get(`/notificaciones/usuario/${userId}`),
      ]);
      console.log('Datos locales refrescados tras reconexión.');
    } catch (error) {
      console.error('Error al refrescar datos tras reconexión:', error);
    }

    this.isSyncing = false;
  }

  static async hasPendingSync() {
    const queue = await PersistenceService.getSyncQueue();
    return queue.length > 0;
  }
}
