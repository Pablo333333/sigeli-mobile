import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { TimelineItem } from '../../src/components/TimelineItem';
import { useAuth } from '../../src/context/AuthContext';
import { canAccess, isDirectiva } from '../../src/utils/roles';
import api from '../../src/services/api';
import { Theme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostulacionesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const directiva = isDirectiva(user?.role);
  const canPostularTerceros = canAccess(user?.role, 'postularTerceros');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      let data: any[] = [];
      if (directiva || user?.role === 'EMPRESA' || user?.role === 'ADMIN') {
        const res = await api.get('/postulaciones');
        data = Array.isArray(res.data) ? res.data : [];
      } else if (user?.id) {
        const res = await api.get(`/postulaciones/usuario/${user.id}`);
        data = Array.isArray(res.data) ? res.data : [];
      }
      setPostulaciones(data);
    } catch (e) {
      console.error(e);
      setPostulaciones([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user?.id, user?.role]),
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.infoText}>Cargando procesos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>
              {directiva ? 'Seguimiento comunal' : 'Mis Procesos de Selección'}
            </Text>
            <Text style={styles.subtitle}>
              Timeline Antamina desde presentación de CV hasta subida al trabajo
            </Text>
          </View>
        </View>

        {canPostularTerceros && (
          <TouchableOpacity
            style={styles.postularBtn}
            onPress={() => router.push('/postular' as any)}
          >
            <Ionicons name="person-add" size={22} color="white" />
            <Text style={styles.postularBtnText}>Postular comunero a oferta</Text>
          </TouchableOpacity>
        )}

        {postulaciones.length === 0 ? (
          <View style={styles.centerEmpty}>
            <Ionicons name="time-outline" size={48} color={Theme.colors.border} />
            <Text style={styles.infoText}>No se encontraron postulaciones activas.</Text>
          </View>
        ) : (
          postulaciones.map((postulacion) => {
            const visual = Array.isArray(postulacion.visualTimeline)
              ? postulacion.visualTimeline.filter((s: any) => s.stage !== 'RECHAZADO' || postulacion.status === 'RECHAZADO')
              : [];

            return (
              <View key={postulacion.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.ofertaTitle}>
                    {postulacion?.oferta?.title || 'Oferta sin título'}
                  </Text>
                  <Text style={styles.sectorText}>
                    {postulacion?.oferta?.companyName ||
                      postulacion?.oferta?.sector ||
                      'Sector no especificado'}
                  </Text>
                  {directiva && (
                    <Text style={styles.candidato}>
                      Candidato: {postulacion?.user?.fullName} ({postulacion?.user?.dni})
                    </Text>
                  )}
                  {postulacion?.submittedBy && (
                    <Text style={styles.enviadoPor}>
                      Enviado por: {postulacion.submittedBy.fullName} (
                      {postulacion.submittedBy.role})
                    </Text>
                  )}
                </View>

                <View style={styles.timelineContainer}>
                  {visual.length > 0 ? (
                    visual.map((item: any, index: number) => (
                      <TimelineItem
                        key={`${item.stage}-${index}`}
                        status={item.label || item.stage}
                        date={item.lastEvent?.date}
                        notes={item.lastEvent?.notes}
                        subStatus={item.lastEvent?.subStatus}
                        isLast={index === visual.length - 1}
                        state={item.state || 'pending'}
                      />
                    ))
                  ) : (
                    <Text style={styles.pendingText}>Iniciando proceso...</Text>
                  )}
                </View>

                {postulacion?.status === 'CONTRATADO' && (
                  <View style={styles.successBanner}>
                    <Text style={styles.successText}>Proceso completado — subida al trabajo</Text>
                  </View>
                )}
                {postulacion?.status === 'RECHAZADO' && (
                  <View style={[styles.successBanner, styles.rejectBanner]}>
                    <Text style={styles.successText}>Proceso desestimado</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.chatLink}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/chat',
                      params: { postulacionId: postulacion.id },
                    } as any)
                  }
                >
                  <Ionicons name="chatbubbles" size={18} color={Theme.colors.primary} />
                  <Text style={styles.chatLinkText}>Comunicaciones del proceso</Text>
                  <Ionicons name="chevron-forward" size={18} color={Theme.colors.border} />
                </TouchableOpacity>
              </View>
            );
          })
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
    padding: 15,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  centerEmpty: {
    alignItems: 'center',
    marginTop: 48,
    gap: 12,
  },
  infoText: {
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  headerRow: {
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  postularBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    minHeight: 54,
    borderRadius: 12,
    marginBottom: 16,
  },
  postularBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    marginBottom: 14,
  },
  ofertaTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  sectorText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  candidato: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  enviadoPor: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  pendingText: {
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  successBanner: {
    marginTop: 8,
    backgroundColor: Theme.colors.success + '18',
    padding: 12,
    borderRadius: 10,
  },
  rejectBanner: {
    backgroundColor: Theme.colors.danger + '18',
  },
  successText: {
    color: Theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  chatLink: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary + '10',
  },
  chatLinkText: {
    flex: 1,
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
