import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { BiometriaService } from '../src/services/biometria';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../src/theme';
import { BrandLogo } from '../src/components/BrandLogo';
import { BigButton } from '../src/components/BigButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Flujo verificación facial (compatible Android/iOS — sin Alert.prompt)
  const [facialModalVisible, setFacialModalVisible] = useState(false);
  const [facialDni, setFacialDni] = useState('');
  const [facialPhotoUri, setFacialPhotoUri] = useState<string | null>(null);
  const [facialError, setFacialError] = useState<string | null>(null);
  const [facialSubmitting, setFacialSubmitting] = useState(false);
  const [facialReenroll, setFacialReenroll] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const available = await BiometriaService.isAvailable();
    setBiometricAvailable(available);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      await BiometriaService.saveCredentialsSecurely(access_token, user);
      await login(access_token, user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    const result = await BiometriaService.authenticateLocal();
    
    if (result.success && result.token && result.user) {
      await login(result.token, result.user);
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Fallo la autenticación biométrica.');
    }
    setLoading(false);
  };

  const openFacialVerification = () => {
    setFacialDni('');
    setFacialPhotoUri(null);
    setFacialError(null);
    setFacialModalVisible(true);
  };

  const closeFacialVerification = () => {
    if (facialSubmitting) return;
    setFacialModalVisible(false);
    setFacialDni('');
    setFacialPhotoUri(null);
    setFacialError(null);
    setFacialReenroll(false);
  };

  const handleTakeFacialPhoto = async () => {
    setFacialError(null);

    if (!facialDni || facialDni.trim().length !== 8 || !/^\d{8}$/.test(facialDni.trim())) {
      setFacialError('Ingrese un DNI válido de 8 dígitos antes de tomar la foto.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFacialError('Se requiere acceso a la cámara para la verificación facial.');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!photo.canceled && photo.assets?.[0]?.uri) {
      setFacialPhotoUri(photo.assets[0].uri);
    }
  };

  const handleSaveAndVerifyFacial = async (forceReenroll = false) => {
    setFacialError(null);

    if (!facialDni || facialDni.trim().length !== 8 || !/^\d{8}$/.test(facialDni.trim())) {
      setFacialError('Ingrese un DNI válido de 8 dígitos.');
      return;
    }

    if (!facialPhotoUri) {
      setFacialError('Tome una foto y luego pulse Guardar y verificar.');
      return;
    }

    setFacialSubmitting(true);
    try {
      const result = await BiometriaService.verifyFacialStrict(facialDni.trim(), facialPhotoUri, {
        reenroll: forceReenroll || facialReenroll,
      });
      const token = result.access_token;
      const user = result.user;

      if (!token || !user) {
        throw new Error('Respuesta incompleta del servidor');
      }

      await BiometriaService.saveCredentialsSecurely(token, user);
      await login(token, user);
      setFacialModalVisible(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'La validación facial no coincide con el DNI proporcionado.';
      const msg = Array.isArray(message) ? message.join(', ') : message;
      setFacialError(msg);
      if (String(msg).toLowerCase().includes('no coincide') || String(msg).toLowerCase().includes('distancia')) {
        setFacialReenroll(true);
      }
    } finally {
      setFacialSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <BrandLogo size={88} variant="full" light />
            <Text style={styles.subtitle}>{Theme.brand.tagline}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Acceso Seguro</Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={22} color={Theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="usuario@talento.local"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color={Theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <BigButton
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              large
            />

            {biometricAvailable && (
              <TouchableOpacity 
                style={styles.biometricButton} 
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <Ionicons 
                  name={Platform.OS === 'ios' ? 'face-id' : 'finger-print'} 
                  size={28} 
                  color={Theme.colors.primary} 
                />
                <Text style={styles.biometricButtonText}>Usar Biometría</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.strictButton} 
              onPress={openFacialVerification}
              disabled={loading}
            >
              <Ionicons name="scan-outline" size={24} color={Theme.colors.text} />
              <Text style={styles.strictButtonText}>Verificación Facial (DNI)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() =>
                Alert.alert(
                  'Soporte Talento',
                  'Contacte a la directiva comunal o al administrador para restablecer su acceso.',
                )
              }
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña? <Text style={styles.link}>Contactar soporte</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={facialModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeFacialVerification}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verificación Facial</Text>
                <TouchableOpacity onPress={closeFacialVerification} disabled={facialSubmitting}>
                  <Ionicons name="close" size={28} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalHint}>
                Ingrese su DNI, tome una foto frontal y pulse Guardar y verificar.
                La primera vez se registra su rostro; las siguientes se validan contra ese registro.
              </Text>

              {facialError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{facialError}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Número de DNI</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="8 dígitos"
                    value={facialDni}
                    onChangeText={(text) => setFacialDni(text.replace(/[^\d]/g, '').slice(0, 8))}
                    keyboardType="number-pad"
                    maxLength={8}
                    editable={!facialSubmitting}
                  />
                </View>
              </View>

              {facialPhotoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: facialPhotoUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={handleTakeFacialPhoto}
                    disabled={facialSubmitting}
                  >
                    <Ionicons name="camera-outline" size={18} color="#1e40af" />
                    <Text style={styles.retakeButtonText}>Volver a tomar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleTakeFacialPhoto}
                  disabled={facialSubmitting}
                >
                  <Ionicons name="camera" size={28} color="#1e40af" />
                  <Text style={styles.captureButtonText}>Tomar foto</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveVerifyButton,
                  (!facialPhotoUri || facialSubmitting) && styles.buttonDisabled,
                ]}
                onPress={() => handleSaveAndVerifyFacial(false)}
                disabled={!facialPhotoUri || facialSubmitting}
              >
                {facialSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="white" />
                    <Text style={styles.buttonText}>Guardar y verificar</Text>
                  </>
                )}
              </TouchableOpacity>

              {facialReenroll && (
                <TouchableOpacity
                  style={[styles.button, styles.reenrollButton, facialSubmitting && styles.buttonDisabled]}
                  onPress={() => handleSaveAndVerifyFacial(true)}
                  disabled={!facialPhotoUri || facialSubmitting}
                >
                  <Text style={styles.buttonText}>Re-registrar rostro</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    padding: 36,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  formContainer: {
    padding: 24,
    marginTop: -20,
    backgroundColor: Theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 20,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: Theme.touch.input,
    backgroundColor: Theme.colors.surface,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: Theme.colors.text,
    minHeight: Theme.touch.input,
  },
  button: {
    ...Theme.button.primary,
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.colors.textOnPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    minHeight: Theme.touch.min,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    gap: 10,
    backgroundColor: Theme.colors.surface,
  },
  biometricButtonText: {
    color: Theme.colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  strictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Theme.colors.muted,
    gap: 10,
    minHeight: Theme.touch.min,
  },
  strictButtonText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPassword: {
    marginTop: 24,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
  },
  link: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 42, 53, 0.6)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  modalHint: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  captureButton: {
    borderWidth: 2,
    borderColor: Theme.colors.primaryLight,
    borderStyle: 'dashed',
    borderRadius: 16,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.accentSoft,
    gap: 8,
    marginBottom: 16,
  },
  captureButtonText: {
    color: Theme.colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  photoPreviewWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPreview: {
    width: 180,
    height: 180,
    borderRadius: 16,
    backgroundColor: Theme.colors.muted,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  retakeButtonText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  saveVerifyButton: {
    marginBottom: 8,
    backgroundColor: Theme.colors.primary,
  },
  reenrollButton: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: Theme.colors.accent,
  },
});
