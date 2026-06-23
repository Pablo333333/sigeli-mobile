import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { PersistenceService } from '../../src/services/persistence';
import NetInfo from '@react-native-community/netinfo';

export default function ReclamosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!asunto || !descripcion) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    setSubmitting(true);
    const payload = {
      asunto,
      descripcion,
      tipo: 'RECLAMO',
      prioridad: 'MEDIA',
      userId: user?.id,
      timestamp: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        await api.post('/transparencia/reclamos', payload);
        Alert.alert('Éxito', 'Tu reclamo ha sido enviado correctamente y será revisado por mediación comunitaria.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        // Guardar en la cola de sincronización para cuando haya internet
        await PersistenceService.addToSyncQueue({
          url: '/transparencia/reclamos',
          method: 'POST',
          data: payload
        });
        Alert.alert('Modo Offline', 'Tu reclamo ha sido guardado localmente y se enviará automáticamente cuando recuperes conexión.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error sending reclamo:', error);
      Alert.alert('Error', 'No se pudo enviar el reclamo. Por favor intenta más tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Buzón de Reclamos</Text>
            {!isOnline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline" size={12} color="white" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>Canal oficial para mediación comunitaria y resolución de conflictos.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Asunto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Problema con el pago, desacuerdo en campo..."
              value={asunto}
              onChangeText={setAsunto}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción Detallada</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              placeholder="Describe lo sucedido con el mayor detalle posible..."
              value={descripcion}
              onChangeText={setDescripcion}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Theme.colors.primary} />
            <Text style={styles.infoText}>
              Tu reclamo será tratado de forma confidencial por el equipo de mediación.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar Reclamo</Text>
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
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Theme.typography.h1,
    color: Theme.colors.danger,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  offlineText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary + '10',
    padding: 12,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.primary,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: Theme.colors.danger,
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
