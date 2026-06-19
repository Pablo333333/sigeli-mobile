import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import api from './api';

export const BiometriaService = {
  /**
   * Verifica si el dispositivo soporta biometría y si tiene registros.
   */
  async isAvailable() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  /**
   * Autenticación local (FaceID/TouchID/Huella)
   */
  async authenticateLocal() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicie sesión con biometría',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Recuperar token guardado de forma segura
        const token = await SecureStore.getItemAsync('sigeli_token');
        const user = await SecureStore.getItemAsync('sigeli_user');
        
        if (token && user) {
          return { success: true, token, user: JSON.parse(user) };
        }
      }
      return { success: false, error: 'No se encontraron credenciales guardadas o fallo la autenticación.' };
    } catch (error) {
      console.error('Biometric auth error', error);
      return { success: false, error: 'Error en la autenticación biométrica.' };
    }
  },

  /**
   * Validación Facial Estricta (Cruce contra DB/Backend)
   * Se usa para el primer registro o verificaciones en campo.
   */
  async verifyFacialStrict(dni: string, photoUri: string) {
    try {
      // En una implementación real, enviaríamos la foto al backend para reconocimiento facial
      const formData = new FormData();
      formData.append('dni', dni);
      formData.append('photo', {
        uri: photoUri,
        name: 'verification.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await api.post('/auth/verify-biometric', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data; // { success: true, token, user }
    } catch (error) {
      console.error('Strict facial verification error', error);
      throw error;
    }
  },

  /**
   * Guarda las credenciales de forma segura tras un login exitoso
   */
  async saveCredentialsSecurely(token: string, user: any) {
    await SecureStore.setItemAsync('sigeli_token', token);
    await SecureStore.setItemAsync('sigeli_user', JSON.stringify(user));
  }
};
