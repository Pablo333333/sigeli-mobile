import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { PersistenceService } from '../../src/services/persistence';
import { useAuth } from '../../src/context/AuthContext';
import NetInfo from '@react-native-community/netinfo';

interface Capacitacion {
  id: string;
  title: string;
  description: string;
  sector: string;
  tipo?: string;
  learningPath?: { duracion?: string | number; nivel?: string; entidad?: string };
  usuarios?: any[];
  isCompleted?: boolean;
  progress?: number;
}

/**
 * Historial de capacitaciones del CV (NO es el programa de entrenamiento laboral).
 * Filtra tipo=CV_HISTORIAL.
 */
export default function CapacitacionesHistorialScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    loadData();
    return () => unsubscribe();
  }, []);

  const processData = useCallback(
    (data: any[]): Capacitacion[] => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((item) => !item.tipo || item.tipo === 'CV_HISTORIAL')
        .map((item) => {
          const userProgress = item.usuarios?.find((u: any) => u.userId === user?.id);
          return {
            ...item,
            isCompleted: userProgress?.isCertified || false,
            progress: userProgress?.progress || 0,
            title: item.title || 'Capacitación sin título',
            description: item.description || 'Sin descripción disponible.',
            sector: item.sector || 'General',
          };
        });
    },
    [user?.id],
  );

  const fetchCapacitaciones = async () => {
    try {
      const response = await api.get('/capacitaciones', {
        params: { tipo: 'CV_HISTORIAL' },
      });
      if (response.data) {
        const processed = processData(response.data);
        setCapacitaciones(processed);
        await PersistenceService.saveCapacitaciones(response.data);
      }
    } catch (error) {
      console.error('Error fetching capacitaciones:', error);
      if (!capacitaciones.length) {
        Alert.alert('Error', 'No se pudieron cargar las capacitaciones del servidor.');
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const localData = await PersistenceService.getCapacitaciones();
      if (localData) setCapacitaciones(processData(localData));
      if (isOnline) await fetchCapacitaciones();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isOnline) await fetchCapacitaciones();
    else Alert.alert('Modo Offline', 'No puedes actualizar sin conexión.');
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Capacitaciones (CV)</Text>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={12} color="white" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          Historial de cursos y certificados de tu CV. No incluye el programa de entrenamiento
          laboral de Antamina.
        </Text>
        <TouchableOpacity
          style={styles.linkBanner}
          onPress={() => router.push('/entrenamiento' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="construct-outline" size={20} color={Theme.colors.primary} />
          <Text style={styles.linkBannerText}>Ir a Programa de entrenamiento laboral →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
        }
      >
        {loading && !capacitaciones.length ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : capacitaciones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No hay capacitaciones de historial CV disponibles.</Text>
          </View>
        ) : (
          capacitaciones.map((item) => {
            if (!item.title && !item.description) return null;
            return (
              <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9}>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: item.isCompleted
                        ? Theme.colors.success + '20'
                        : Theme.colors.primary + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: item.isCompleted ? Theme.colors.success : Theme.colors.primary },
                    ]}
                  >
                    {item.sector}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {item.description}
                </Text>

                {item.progress !== undefined && item.progress > 0 && !item.isCompleted && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{item.progress}% completado</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={16} color={Theme.colors.textSecondary} />
                    <Text style={styles.footerText}>{item.learningPath?.duracion ?? 'N/D'}</Text>
                  </View>
                  {item.isCompleted ? (
                    <View style={styles.footerItem}>
                      <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
                      <Text style={[styles.footerText, { color: Theme.colors.success }]}>
                        Completado
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => Alert.alert('Capacitación', `Historial CV: ${item.title}`)}
                    >
                      <Text style={styles.startBtnText}>
                        {item.progress && item.progress > 0 ? 'Continuar' : 'Ver'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    padding: Theme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  title: { ...Theme.typography.h1, color: Theme.colors.primary, flex: 1, fontSize: 22 },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  offlineText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  linkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: Theme.colors.primary + '12',
    borderRadius: Theme.borderRadius.md,
    minHeight: Theme.touch.min,
  },
  linkBannerText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 14, flex: 1 },
  content: { padding: Theme.spacing.md, paddingBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  cardTitle: { ...Theme.typography.h3, color: Theme.colors.text, marginBottom: 4, fontWeight: 'bold' },
  cardDescription: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: { marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: Theme.colors.primary },
  progressText: { fontSize: 10, color: Theme.colors.textSecondary, textAlign: 'right' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: Theme.colors.textSecondary },
  startBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  startBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 60, padding: 40 },
  emptyText: { textAlign: 'center', color: Theme.colors.textSecondary, marginTop: 16, fontSize: 16 },
});
