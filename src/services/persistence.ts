import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CV: '@sigeli_cv',
  POSTULACIONES: '@sigeli_postulaciones',
  NOTIFICACIONES: '@sigeli_notificaciones',
  SYNC_QUEUE: '@sigeli_sync_queue',
};

export const PersistenceService = {
  async saveCV(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.CV, JSON.stringify(data));
  },

  async getCV() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CV);
    return data ? JSON.parse(data) : null;
  },

  async savePostulaciones(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.POSTULACIONES, JSON.stringify(data));
  },

  async getPostulaciones() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.POSTULACIONES);
    return data ? JSON.parse(data) : null;
  },

  async saveNotificaciones(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICACIONES, JSON.stringify(data));
  },

  async getNotificaciones() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICACIONES);
    return data ? JSON.parse(data) : [];
  },

  async addToSyncQueue(request: { url: string; method: string; data: any }) {
    const queue = await this.getSyncQueue();
    queue.push({ ...request, id: Date.now().toString() });
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  async getSyncQueue(): Promise<any[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async clearSyncQueue() {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  },

  async removeFromSyncQueue(id: string) {
    const queue = await this.getSyncQueue();
    const newQueue = queue.filter((item: any) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(newQueue));
  }
};
