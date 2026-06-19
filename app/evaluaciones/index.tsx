import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { Audio } from 'expo-av';
import { PersistenceService } from '../../src/services/persistence';
import { useAuth } from '../../src/context/AuthContext';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MultimediaPicker } from '../../src/components/MultimediaPicker';
import api from '../../src/services/api';

interface EvaluationData {
  contractOnTime: boolean;
  dutiesExplained: boolean;
  rightsExplained: boolean;
  logisticsRating: number;
  discrimination: boolean;
  comments: string;
  audioUri: string | null;
  videoUri: string | null;
}

export default function EvaluacionScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EvaluationData>({
    contractOnTime: false,
    dutiesExplained: false,
    rightsExplained: false,
    logisticsRating: 3,
    discrimination: false,
    comments: '',
    audioUri: null,
    videoUri: null,
  });

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
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
      setFormData(prev => ({ ...prev, audioUri: uri }));
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      ...formData,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Enviar con FormData para soportar archivos multimedia
        const data = new FormData();
        
        // Agregar campos de texto
        Object.keys(payload).forEach(key => {
          if (key !== 'audioUri' && key !== 'videoUri') {
            data.append(key, (payload as any)[key]);
          }
        });

        // Agregar audio si existe
        if (formData.audioUri) {
          data.append('audio', {
            uri: formData.audioUri,
            name: 'feedback_audio.m4a',
            type: 'audio/m4a',
          } as any);
        }

        // Agregar video si existe
        if (formData.videoUri) {
          data.append('video', {
            uri: formData.videoUri,
            name: 'evidence_video.mp4',
            type: 'video/mp4',
          } as any);
        }

        await api.post('/evaluaciones', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Éxito', 'Evaluación y evidencias enviadas correctamente.');
      } else {
        // En modo offline, guardamos el objeto con las URIs locales
        // El SyncManager se encargará de convertirlos a FormData al sincronizar
        await PersistenceService.addToSyncQueue({
          url: '/evaluaciones',
          method: 'POST',
          data: payload
        });
        Alert.alert('Modo Offline', 'Evaluación guardada localmente. Las evidencias se subirán automáticamente al recuperar conexión.');
      }
      // Reset form
      setFormData({
        contractOnTime: false,
        dutiesExplained: false,
        rightsExplained: false,
        logisticsRating: 3,
        discrimination: false,
        comments: '',
        audioUri: null,
        videoUri: null,
      });
    } catch (error) {
      console.error('Error saving evaluation', error);
      Alert.alert('Error', 'No se pudo guardar la evaluación.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setFormData(prev => ({ ...prev, logisticsRating: star }))}>
          <Ionicons 
            name={star <= formData.logisticsRating ? "star" : "star-outline"} 
            size={32} 
            color={star <= formData.logisticsRating ? Theme.colors.warning : Theme.colors.border} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Evaluación 360°</Text>
          <Text style={styles.subtitle}>Tu opinión nos ayuda a mejorar las condiciones laborales en campo.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>¿Se firmó el contrato a tiempo?</Text>
              <Switch 
                value={formData.contractOnTime} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, contractOnTime: v }))}
                trackColor={{ false: '#cbd5e1', true: Theme.colors.success }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>¿Te explicaron tus deberes?</Text>
              <Switch 
                value={formData.dutiesExplained} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, dutiesExplained: v }))}
                trackColor={{ false: '#cbd5e1', true: Theme.colors.success }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>¿Te explicaron tus derechos?</Text>
              <Switch 
                value={formData.rightsExplained} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, rightsExplained: v }))}
                trackColor={{ false: '#cbd5e1', true: Theme.colors.success }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Logística (Alimentación/Transporte)</Text>
            {renderStarRating()}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>¿Existió algún tipo de discriminación?</Text>
              <Switch 
                value={formData.discrimination} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, discrimination: v }))}
                trackColor={{ false: '#cbd5e1', true: Theme.colors.danger }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comentarios Adicionales</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Escribe aquí tus observaciones..."
              value={formData.comments}
              onChangeText={(v) => setFormData(prev => ({ ...prev, comments: v }))}
            />
          </View>

          <View style={styles.audioSection}>
            <Text style={styles.label}>O graba un mensaje de voz</Text>
            <View style={styles.audioControls}>
              <TouchableOpacity 
                style={[styles.audioBtn, isRecording ? styles.audioBtnActive : styles.audioBtnIdle]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
              >
                <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="white" />
              </TouchableOpacity>
              {formData.audioUri && !isRecording && (
                <View style={styles.audioStatus}>
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
                  <Text style={styles.audioStatusText}>Audio grabado</Text>
                </View>
              )}
            </View>
            <Text style={styles.audioHint}>Mantén presionado para grabar</Text>
          </View>

          <View style={styles.videoSection}>
            <Text style={[styles.label, { marginBottom: 12 }]}>Evidencia en Video / Testimonio de Campo</Text>
            <MultimediaPicker
              label="Grabar video del entorno o testimonio"
              type="video"
              value={formData.videoUri}
              onSelect={(uri) => setFormData(prev => ({ ...prev, videoUri: uri }))}
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
              <Text style={styles.submitBtnText}>Enviar Evaluación</Text>
            )}
          </TouchableOpacity>
        </View>
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
  inputGroup: {
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 32,
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
