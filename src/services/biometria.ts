import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from './api';

function normalizePhotoUri(uri: string): string {
  if (!uri) return uri;
  // Android a veces necesita file:// explícito
  if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
    return `file://${uri}`;
  }
  return uri;
}

export const BiometriaService = {
  async isAvailable() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  async authenticateLocal() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicie sesión con biometría',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const token = await SecureStore.getItemAsync('sigeli_token');
        const user = await SecureStore.getItemAsync('sigeli_user');

        if (token && user) {
          return { success: true, token, user: JSON.parse(user) };
        }
      }
      return {
        success: false,
        error: 'No se encontraron credenciales guardadas o falló la autenticación.',
      };
    } catch (error) {
      console.error('Biometric auth error', error);
      return { success: false, error: 'Error en la autenticación biométrica.' };
    }
  },

  /**
   * Verificación facial estricta vía endpoint definitivo POST /auth/verify-biometric
   */
  async verifyFacialStrict(dni: string, photoUri: string, options?: { reenroll?: boolean }) {
    const formData = new FormData();
    formData.append('dni', dni.trim());
    if (options?.reenroll) {
      formData.append('reenroll', 'true');
    }

    const uri = normalizePhotoUri(photoUri);
    formData.append('photo', {
      uri,
      name: 'verification.jpg',
      type: 'image/jpeg',
    } as any);

    const qs = options?.reenroll ? '?reenroll=true' : '';
    const response = await api.post(`/auth/verify-biometric${qs}`, formData, {
      // Dejar que RN/axios fijen el boundary (no forzar Content-Type)
      headers: {
        Accept: 'application/json',
      },
      transformRequest: (data, headers) => {
        if (headers && typeof headers === 'object') {
          delete (headers as any)['Content-Type'];
          delete (headers as any)['content-type'];
        }
        return data;
      },
      timeout: 45000,
    });

    return response.data;
  },

  async saveCredentialsSecurely(token: string, user: any) {
    await SecureStore.setItemAsync('sigeli_token', token);
    await SecureStore.setItemAsync('sigeli_user', JSON.stringify(user));
  },
};
