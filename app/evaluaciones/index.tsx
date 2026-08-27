import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { Audio } from 'expo-av';
import { PersistenceService } from '../../src/services/persistence';
import { useAuth } from '../../src/context/AuthContext';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MultimediaPicker } from '../../src/components/MultimediaPicker';
import api from '../../src/services/api';
import { useFocusEffect } from 'expo-router';

type ContratoElegible = {
  id: string;
  startDate: string;
  endDate: string;
  regimenLaboral?: string;
  yaEvaluadoPorMi: boolean;
  trabajador?: { fullName: string; dni: string };
  oferta?: { title: string; companyName?: string; sector?: string } | null;
};

type Cuestionario = {
  contratoATiempo: boolean;
  deberesExplicados: boolean;
  derechosExplicados: boolean;
  pagoPuntual: boolean;
  capacitacionSeguridad: boolean;
  herramientasAdecuadas: boolean;
  logisticaAlimentacion: number;
  logisticaTransporte: number;
  climaLaboral: number;
  tratoSupervisor: number;
  satisfaccionGeneral: number;
  discriminacion: boolean;
  tipoDiscriminacion: string;
  recomendariaEmpresa: boolean;
  comentarios: string;
};

const emptyCuestionario = (): Cuestionario => ({
  contratoATiempo: false,
  deberesExplicados: false,
  derechosExplicados: false,
  pagoPuntual: false,
  capacitacionSeguridad: false,
  herramientasAdecuadas: false,
  logisticaAlimentacion: 3,
  logisticaTransporte: 3,
  climaLaboral: 3,
  tratoSupervisor: 3,
  satisfaccionGeneral: 3,
  discriminacion: false,
  tipoDiscriminacion: '',
  recomendariaEmpresa: true,
  comentarios: '',
});

export default function EvaluacionScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [contratos, setContratos] = useState<ContratoElegible[]>([]);
  const [contractId, setContractId] = useState<string | null>(null);
  const [cuestionario, setCuestionario] = useState<Cuestionario>(emptyCuestionario());
  const [grabacionUrl, setGrabacionUrl] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadElegibles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/evaluaciones/contratos-elegibles');
      const list: ContratoElegible[] = res.data || [];
      setContratos(list);
      const pendiente = list.find((c) => !c.yaEvaluadoPorMi);
      setContractId(pendiente?.id || list[0]?.id || null);
    } catch (e) {
      console.error('No se pudieron cargar contratos elegibles', e);
      setContratos([]);
      setContractId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsOnline(!!state.isConnected);
      });
      loadElegibles();
      return () => unsubscribe();
    }, [loadElegibles]),
  );

  const setBool = (key: keyof Cuestionario, value: boolean) => {
    setCuestionario((prev) => ({ ...prev, [key]: value }));
  };

  const setRating = (key: keyof Cuestionario, value: number) => {
    setCuestionario((prev) => ({ ...prev, [key]: value }));
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setGrabacionUrl(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSubmit = async () => {
    if (!contractId) {
      Alert.alert('Sin contrato', 'Necesitas un contrato activo para evaluar.');
      return;
    }
    const seleccionado = contratos.find((c) => c.id === contractId);
    if (seleccionado?.yaEvaluadoPorMi) {
      Alert.alert('Ya evaluado', 'Ya registraste una evaluación para este contrato.');
      return;
    }
    if (cuestionario.discriminacion && !cuestionario.tipoDiscriminacion.trim()) {
      Alert.alert('Completar', 'Indica el tipo de discriminación reportada.');
      return;
    }

    setSubmitting(true);
    const payload = {
      contractId,
      cuestionario: {
        ...cuestionario,
        tipoDiscriminacion: cuestionario.discriminacion
          ? cuestionario.tipoDiscriminacion.trim()
          : undefined,
        comentarios: cuestionario.comentarios.trim() || undefined,
      },
      grabacionUrl: grabacionUrl || videoUri || undefined,
    };

    try {
      if (isOnline) {
        await api.post('/evaluaciones', payload);
        Alert.alert('Éxito', 'Evaluación 360° enviada correctamente.');
      } else {
        await PersistenceService.addToSyncQueue({
          url: '/evaluaciones',
          method: 'POST',
          data: payload,
        });
        Alert.alert(
          'Modo Offline',
          'Evaluación guardada localmente. Se sincronizará al recuperar conexión.',
        );
      }
      setCuestionario(emptyCuestionario());
      setGrabacionUrl(null);
      setVideoUri(null);
      await loadElegibles();
    } catch (error: any) {
      console.error('Error saving evaluation', error);
      const msg =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join('\n')
          : null) ||
        'No se pudo guardar la evaluación.';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (field: keyof Cuestionario, value: number) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(field, star)}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={28}
            color={star <= value ? Theme.colors.warning : Theme.colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSwitch = (label: string, key: keyof Cuestionario, danger = false) => (
    <View style={styles.inputGroup}>
      <View style={styles.switchRow}>
        <Text style={styles.label}>{label}</Text>
        <Switch
          value={!!cuestionario[key]}
          onValueChange={(v) => setBool(key, v)}
          trackColor={{
            false: '#cbd5e1',
            true: danger ? Theme.colors.danger : Theme.colors.success,
          }}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const disponibles = contratos.filter((c) => !c.yaEvaluadoPorMi);
  const sinContrato = contratos.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Evaluación 360°</Text>
          <Text style={styles.subtitle}>
            Cuestionario de satisfacción del trabajador. Solo disponible con contrato activo.
          </Text>
        </View>

        {sinContrato ? (
          <View style={[styles.card, styles.blockedCard]}>
            <Ionicons name="lock-closed" size={28} color={Theme.colors.warning} />
            <Text style={styles.blockedTitle}>Sin contrato activo</Text>
            <Text style={styles.blockedText}>
              La evaluación 360° está vinculada exclusivamente a comuneros con contrato en estado
              ACTIVO. Cuando tengas uno, podrás completar este cuestionario.
            </Text>
            <TouchableOpacity style={styles.reloadBtn} onPress={loadElegibles}>
              <Text style={styles.reloadBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contrato a evaluar</Text>
            {contratos.map((c) => {
              const active = contractId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.contractChip,
                    active && styles.contractChipActive,
                    c.yaEvaluadoPorMi && styles.contractChipDone,
                  ]}
                  onPress={() => setContractId(c.id)}
                  disabled={c.yaEvaluadoPorMi && disponibles.length > 0}
                >
                  <Text
                    style={[styles.contractTitle, active && styles.contractTitleActive]}
                    numberOfLines={2}
                  >
                    {c.oferta?.title || 'Contrato'} · {c.oferta?.companyName || 'Empresa'}
                  </Text>
                  <Text style={styles.contractMeta}>
                    {c.trabajador?.fullName || user?.fullName} · Régimen {c.regimenLaboral || '—'}
                    {c.yaEvaluadoPorMi ? ' · Ya evaluado' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {disponibles.length === 0 ? (
              <Text style={styles.infoNote}>Ya evaluaste todos tus contratos activos.</Text>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Condiciones contractuales</Text>
                {renderSwitch('¿Se firmó el contrato a tiempo?', 'contratoATiempo')}
                {renderSwitch('¿Te explicaron tus deberes?', 'deberesExplicados')}
                {renderSwitch('¿Te explicaron tus derechos?', 'derechosExplicados')}
                {renderSwitch('¿El pago de remuneraciones es puntual?', 'pagoPuntual')}

                <Text style={styles.sectionTitle}>Seguridad y herramientas</Text>
                {renderSwitch('¿Recibiste capacitación en seguridad?', 'capacitacionSeguridad')}
                {renderSwitch('¿Cuentas con herramientas adecuadas?', 'herramientasAdecuadas')}

                <Text style={styles.sectionTitle}>Logística y clima laboral</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Alimentación (1-5)</Text>
                  {renderStars('logisticaAlimentacion', cuestionario.logisticaAlimentacion)}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Transporte (1-5)</Text>
                  {renderStars('logisticaTransporte', cuestionario.logisticaTransporte)}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Clima laboral (1-5)</Text>
                  {renderStars('climaLaboral', cuestionario.climaLaboral)}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Trato del supervisor (1-5)</Text>
                  {renderStars('tratoSupervisor', cuestionario.tratoSupervisor)}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Satisfacción general (1-5)</Text>
                  {renderStars('satisfaccionGeneral', cuestionario.satisfaccionGeneral)}
                </View>

                <Text style={styles.sectionTitle}>Discriminación y recomendación</Text>
                {renderSwitch('¿Existió algún tipo de discriminación?', 'discriminacion', true)}
                {cuestionario.discriminacion && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tipo / detalle de discriminación</Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      placeholder="Describe la situación..."
                      value={cuestionario.tipoDiscriminacion}
                      onChangeText={(v) =>
                        setCuestionario((prev) => ({ ...prev, tipoDiscriminacion: v }))
                      }
                    />
                  </View>
                )}
                {renderSwitch('¿Recomendarías esta empresa a otros comuneros?', 'recomendariaEmpresa')}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Comentarios adicionales</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="Escribe aquí tus observaciones..."
                    value={cuestionario.comentarios}
                    onChangeText={(v) =>
                      setCuestionario((prev) => ({ ...prev, comentarios: v }))
                    }
                  />
                </View>

                <View style={styles.audioSection}>
                  <Text style={styles.label}>Mensaje de voz (opcional)</Text>
                  <View style={styles.audioControls}>
                    <TouchableOpacity
                      style={[
                        styles.audioBtn,
                        isRecording ? styles.audioBtnActive : styles.audioBtnIdle,
                      ]}
                      onPressIn={startRecording}
                      onPressOut={stopRecording}
                    >
                      <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="white" />
                    </TouchableOpacity>
                    {grabacionUrl && !isRecording && (
                      <View style={styles.audioStatus}>
                        <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
                        <Text style={styles.audioStatusText}>Audio grabado</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.audioHint}>Mantén presionado para grabar</Text>
                </View>

                <View style={styles.videoSection}>
                  <Text style={[styles.label, { marginBottom: 12 }]}>
                    Evidencia en video (opcional)
                  </Text>
                  <MultimediaPicker
                    label="Grabar video del entorno o testimonio"
                    type="video"
                    value={videoUri}
                    onSelect={(uri) => setVideoUri(uri)}
                    icon="videocam-outline"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitBtnText}>Enviar Evaluación 360°</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  title: {
    ...Theme.typography.h1,
    color: Theme.colors.primary,
  },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 2,
  },
  blockedCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  blockedText: {
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reloadBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
  },
  reloadBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: 12,
    marginTop: 4,
  },
  contractChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  contractChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '12',
  },
  contractChipDone: {
    opacity: 0.55,
  },
  contractTitle: {
    fontWeight: '700',
    color: Theme.colors.text,
    fontSize: 14,
  },
  contractTitleActive: {
    color: Theme.colors.primary,
  },
  contractMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  infoNote: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginTop: 8,
    textAlignVertical: 'top',
    fontSize: 16,
    minHeight: 90,
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: Theme.borderRadius.lg,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  audioBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  audioBtnIdle: {
    backgroundColor: Theme.colors.secondary,
  },
  audioBtnActive: {
    backgroundColor: Theme.colors.danger,
    transform: [{ scale: 1.1 }],
  },
  audioStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audioStatusText: {
    color: Theme.colors.success,
    fontWeight: '600',
  },
  audioHint: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 8,
  },
  videoSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    height: 56,
    borderRadius: Theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
