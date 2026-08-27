import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CV: '@talento_cv',
  OFERTAS: '@talento_ofertas',
  POSTULACIONES: '@talento_postulaciones',
  NOTIFICACIONES: '@talento_notificaciones',
  SYNC_QUEUE: '@talento_sync_queue',
  CHAT_MESSAGES: '@talento_chat_messages',
  EVALUACIONES: '@talento_evaluaciones',
  CAPACITACIONES: '@talento_capacitaciones',
  RECLAMOS: '@talento_reclamos',
};

export const PersistenceService = {
  // Estado de automatización
  isSyncAutomated: true,

  async saveCapacitaciones(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.CAPACITACIONES, JSON.stringify(data));
  },

  async getCapacitaciones() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CAPACITACIONES);
    return data ? JSON.parse(data) : null;
  },

  async saveReclamos(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.RECLAMOS, JSON.stringify(data));
  },

  async getReclamos() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECLAMOS);
    return data ? JSON.parse(data) : [];
  },

  // ... existing methods ...
  async saveChatMessages(chatId: string, messages: any[]) {
    await AsyncStorage.setItem(`${STORAGE_KEYS.CHAT_MESSAGES}_${chatId}`, JSON.stringify(messages));
  },

  async getChatMessages(chatId: string) {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.CHAT_MESSAGES}_${chatId}`);
    return data ? JSON.parse(data) : [];
  },

  async saveOfertas(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.OFERTAS, JSON.stringify(data));
  },

  async getOfertas() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFERTAS);
    return data ? JSON.parse(data) : null;
  },

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
