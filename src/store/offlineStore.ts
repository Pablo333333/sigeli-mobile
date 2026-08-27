import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Talento Offline Store
 * Maneja la persistencia de datos para funcionamiento sin conexión.
 */
export const OfflineStore = {
  async save(key: string, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(`@talento_${key}`, jsonValue);
    } catch (e) {
      console.error('Error saving to offline store', e);
    }
  },

  async get(key: string) {
    try {
      const jsonValue = await AsyncStorage.getItem(`@talento_${key}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error getting from offline store', e);
      return null;
    }
  },

  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(`@talento_${key}`);
    } catch (e) {
      console.error('Error removing from offline store', e);
    }
  }
};
