import NetInfo from '@react-native-community/netinfo';
import { PersistenceService } from './persistence';
import api from './api';
import axios from 'axios';

export class SyncManager {
  private static isSyncing = false;

  /**
   * Procesa la cola de sincronización pendiente.
   * Se dispara automáticamente mediante el hook useSync al recuperar conexión.
   */
  static async processQueue(userId?: string) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Procesar cola de escritura (POST, PUT, DELETE pendientes)
      const queue = await PersistenceService.getSyncQueue();
      if (queue.length > 0) {
        console.log(`[SyncManager] Sincronizando ${queue.length} elementos en segundo plano...`);
        for (const item of queue) {
          try {
            let config: any = {
              url: item.url,
              method: item.method,
              data: item.data,
            };

            // Soporte para envío resiliente de archivos multimedia en la cola
            if (item.data && (
              item.data.audioUri || 
              item.data.videoUri || 
              item.data.profilePhotoUri || 
              item.data.dniFrontUri || 
              item.data.dniBackUri || 
              item.data.presentationVideoUri
            )) {
              const formData = new FormData();
              Object.keys(item.data).forEach(key => {
                if (key.endsWith('Uri') && item.data[key]) {
                  const fileName = key.includes('audio') ? 'audio.m4a' : (key.includes('video') ? 'video.mp4' : 'photo.jpg');
                  const type = key.includes('audio') ? 'audio/m4a' : (key.includes('video') ? 'video/mp4' : 'image/jpeg');
                  const fieldName = key.replace('Uri', ''); // ej. audioUri -> audio
                  
                  formData.append(fieldName, {
                    uri: item.data[key],
                    name: fileName,
                    type: type,
                  } as any);
                } else {
                  formData.append(key, item.data[key]);
                }
              });
              config.data = formData;
              config.headers = { 'Content-Type': 'multipart/form-data' };
            }

            await api(config);
            await PersistenceService.removeFromSyncQueue(item.id);
          } catch (error) {
            console.error(`[SyncManager] Error en item ${item.id}:`, error);
            // Si es un error 4xx no reintentamos para no bloquear la cola
            if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
              await PersistenceService.removeFromSyncQueue(item.id);
            }
          }
        }
      }

      // 2. Refrescar datos esenciales si tenemos un userId
      if (userId) {
        await Promise.all([
          api.get(`/cv/${userId}`),
          api.get(`/postulaciones/usuario/${userId}`),
          api.get(`/notificaciones/usuario/${userId}`),
        ]);
      }
    } catch (error) {
      console.error('[SyncManager] Error crítico en proceso de sincronización:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  static async hasPendingSync() {
    const queue = await PersistenceService.getSyncQueue();
    return queue.length > 0;
  }
}
