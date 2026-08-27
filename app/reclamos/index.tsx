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

type Empresa = { id: string; name: string };

const CATEGORIAS = [
  'Pago / remuneración',
  'Condiciones laborales',
  'Discriminación',
  'Seguridad y salud',
  'Incumplimiento de acuerdo',
  'Otro',
];

export default function ReclamosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const response = await api.get('/transparencia/empresas');
      const list: Empresa[] = Array.isArray(response.data) ? response.data : [];
      setEmpresas(list);
      if (list.length > 0) {
        setTenantId(list[0].id);
      }
    } catch (error) {
      console.error('Error cargando empresas', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const handleSubmit = async () => {
    if (!motivo.trim() || !descripcion.trim()) {
      Alert.alert('Error', 'Por favor completa el motivo y la descripción.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para enviar un reclamo.');
      return;
    }

    setSubmitting(true);
    const payload = {
      tenantId: tenantId || undefined,
      motivo: motivo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      nombreAfectado: user.fullName,
    };

    try {
      if (isOnline) {
        const response = await api.post('/transparencia/reclamos', payload);
        if (response.status === 202 || response.data?._offline) {
          Alert.alert(
            'Modo Offline',
            'Tu reclamo quedó en cola y se enviará automáticamente cuando recuperes conexión.',
            [{ text: 'OK', onPress: () => router.back() }],
          );
        } else {
          Alert.alert(
            'Éxito',
            'Tu reclamo ha sido enviado correctamente y será revisado por mediación comunitaria.',
            [{ text: 'OK', onPress: () => router.back() }],
          );
        }
      } else {
        await PersistenceService.addToSyncQueue({
          url: '/transparencia/reclamos',
          method: 'POST',
          data: payload,
        });
        Alert.alert(
          'Modo Offline',
          'Tu reclamo ha sido guardado localmente y se enviará automáticamente cuando recuperes conexión.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (error: any) {
      console.error('Error sending reclamo:', error);
      const message =
        error.response?.data?.message ||
        'No se pudo enviar el reclamo. Por favor intenta más tarde.';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
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
          <Text style={styles.subtitle}>
            Canal oficial para mediación comunitaria y resolución de conflictos.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Empresa / contratista involucrada</Text>
            {loadingEmpresas ? (
              <ActivityIndicator color={Theme.colors.primary} />
            ) : empresas.length === 0 ? (
              <Text style={styles.helperText}>
                No hay empresas cargadas. El reclamo se asociará a tu comunidad.
              </Text>
            ) : (
              <View style={styles.chipsWrap}>
                {empresas.map((empresa) => (
                  <TouchableOpacity
                    key={empresa.id}
                    style={[styles.chip, tenantId === empresa.id && styles.chipActive]}
                    onPress={() => setTenantId(empresa.id)}
                  >
                    <Text
                      style={[styles.chipText, tenantId === empresa.id && styles.chipTextActive]}
                    >
                      {empresa.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIAS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, categoria === item && styles.chipActive]}
                  onPress={() => setCategoria(item)}
                >
                  <Text style={[styles.chipText, categoria === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Motivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Problema con el pago, desacuerdo en campo..."
              value={motivo}
              onChangeText={setMotivo}
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
  helperText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary + '18',
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
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
    minHeight: 120,
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
