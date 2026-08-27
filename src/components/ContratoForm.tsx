import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';
import { Theme } from '../theme';
import { BigButton } from './BigButton';

interface ContratoFormProps {
  postulacionId: string;
  userId: string;
  onSuccess?: () => void;
}

type Matriz = {
  numeroContrato: string;
  companyName: string;
  puesto: string;
  cargo: string;
  area: string;
  sector: string;
  tipoManoObra: string;
  startDate: string;
  endDate: string;
  salary: string;
  regimenLaboral: string;
  tiempoContratoMeses: string;
  horarioTrabajo: string;
  sistemaTrabajo: string;
  observaciones: string;
};

const EMPTY: Matriz = {
  numeroContrato: '',
  companyName: '',
  puesto: '',
  cargo: '',
  area: '',
  sector: '',
  tipoManoObra: 'NO_CALIFICADA',
  startDate: '',
  endDate: '',
  salary: '',
  regimenLaboral: '728',
  tiempoContratoMeses: '6',
  horarioTrabajo: '',
  sistemaTrabajo: '',
  observaciones: '',
};

/** Formalización de contrato: matriz completa + biometría. */
export const ContratoForm: React.FC<ContratoFormProps> = ({
  postulacionId,
  userId,
  onSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [comuneroLabel, setComuneroLabel] = useState('');
  const [form, setForm] = useState<Matriz>(EMPTY);

  useEffect(() => {
    (async () => {
      setLoadingPrefill(true);
      try {
        const { data } = await api.get(`/contratos/prefill/${postulacionId}`);
        if (data?.comunero) {
          setComuneroLabel(`${data.comunero.fullName} · DNI ${data.comunero.dni}`);
        }
        const m = data?.matriz || {};
        setForm({
          numeroContrato: m.numeroContrato || '',
          companyName: m.companyName || '',
          puesto: m.puesto || '',
          cargo: m.cargo || '',
          area: m.area || '',
          sector: m.sector || '',
          tipoManoObra: m.tipoManoObra || 'NO_CALIFICADA',
          startDate: m.startDate || '',
          endDate: m.endDate || '',
          salary: m.salary != null ? String(m.salary) : '',
          regimenLaboral: m.regimenLaboral || '728',
          tiempoContratoMeses:
            m.tiempoContratoMeses != null ? String(m.tiempoContratoMeses) : '6',
          horarioTrabajo: m.horarioTrabajo || '',
          sistemaTrabajo: m.sistemaTrabajo || '',
          observaciones: m.observaciones || '',
        });
        if (data?.yaTieneContrato) {
          Alert.alert('Aviso', 'Esta postulación ya tiene un contrato formalizado.');
        }
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || 'No se pudo cargar la matriz.');
      } finally {
        setLoadingPrefill(false);
      }
    })();
  }, [postulacionId]);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          Necesitamos permiso de cámara para la validación biométrica.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const payloadFromForm = (biometricToken?: string) => ({
    postulacionId,
    startDate: form.startDate,
    endDate: form.endDate,
    salary: Number(form.salary) || 0,
    regimenLaboral: form.regimenLaboral,
    biometricToken,
    numeroContrato: form.numeroContrato || undefined,
    companyName: form.companyName || undefined,
    puesto: form.puesto || undefined,
    cargo: form.cargo || undefined,
    area: form.area || undefined,
    sector: form.sector || undefined,
    tipoManoObra: form.tipoManoObra || undefined,
    tiempoContratoMeses: form.tiempoContratoMeses
      ? Number(form.tiempoContratoMeses)
      : undefined,
    horarioTrabajo: form.horarioTrabajo || undefined,
    sistemaTrabajo: form.sistemaTrabajo || undefined,
    observaciones: form.observaciones || undefined,
  });

  const handleCapture = async () => {
    if (!cameraRef) return;
    if (!form.startDate || !form.endDate || !form.salary) {
      Alert.alert('Completar', 'Fecha inicio, fin y sueldo son obligatorios.');
      return;
    }
    setIsProcessing(true);
    try {
      const photo = await cameraRef.takePictureAsync({ base64: true, quality: 0.5 });
      await api.post('/contratos', payloadFromForm(photo.base64));
      Alert.alert('Éxito', 'Contrato formalizado con matriz completa y biometría.');
      onSuccess?.();
    } catch (error: any) {
      const msg =
        error.response?.status === 401
          ? 'Fallo biométrico: el rostro no coincide.'
          : error.response?.data?.message || 'Error al formalizar el contrato.';
      Alert.alert('Error', msg);
    } finally {
      setIsProcessing(false);
      setIsCapturing(false);
    }
  };

  if (loadingPrefill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const field = (label: string, key: keyof Matriz, opts?: { multiline?: boolean }) => (
    <View style={styles.field} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, opts?.multiline && styles.textarea]}
        value={form[key]}
        multiline={opts?.multiline}
        onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Matriz de contrato</Text>
        <Text style={styles.subtitle}>
          Campos autocompletados desde la postulación/oferta. Revise y confirme con biometría.
        </Text>
        {!!comuneroLabel && <Text style={styles.comunero}>{comuneroLabel}</Text>}
        <Text style={styles.hint}>userId ref: {userId.slice(0, 8)}…</Text>

        {field('Nº contrato', 'numeroContrato')}
        {field('Empresa', 'companyName')}
        {field('Puesto', 'puesto')}
        {field('Cargo', 'cargo')}
        {field('Área', 'area')}
        {field('Sector / ubicación', 'sector')}
        {field('Tipo mano de obra', 'tipoManoObra')}
        {field('Inicio (YYYY-MM-DD)', 'startDate')}
        {field('Fin (YYYY-MM-DD)', 'endDate')}
        {field('Sueldo', 'salary')}
        {field('Régimen laboral', 'regimenLaboral')}
        {field('Meses de contrato', 'tiempoContratoMeses')}
        {field('Horario', 'horarioTrabajo')}
        {field('Sistema de trabajo', 'sistemaTrabajo')}
        {field('Observaciones', 'observaciones', { multiline: true })}

        {!isCapturing ? (
          <BigButton
            title="Validar biometría y formalizar"
            onPress={() => setIsCapturing(true)}
            style={{ marginTop: 12 }}
          />
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing="front" ref={(ref) => setCameraRef(ref)}>
              <View style={styles.overlay}>
                <View style={styles.faceGuide} />
              </View>
            </CameraView>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.captureInner} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsCapturing(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 },
  comunero: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary, marginBottom: 4 },
  hint: { fontSize: 11, color: Theme.colors.textSecondary, marginBottom: 12 },
  field: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 48,
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  text: { textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: Theme.colors.primary, padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cameraContainer: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 16,
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 125,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  cancelButton: { position: 'absolute', right: 20 },
  cancelText: { color: '#fff', fontWeight: 'bold' },
});
