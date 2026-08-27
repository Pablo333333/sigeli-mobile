import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { PersistenceService } from '../../src/services/persistence';
import NetInfo from '@react-native-community/netinfo';
import { canAccess } from '../../src/utils/roles';

interface Oferta {
  id: string;
  title: string;
  company?: string;
  companyName?: string;
  daysLeft?: number | null;
  salary?: number | string;
  location?: string;
  sector?: string;
  estadoLabel?: string;
  status?: string;
  tipoManoObra?: string;
  vacancies?: number;
  regimenLaboral?: string;
  sistemaTrabajo?: string;
  horarioTrabajo?: string;
  tiempoContratoMeses?: number;
  description?: string;
  perfilRequisitos?: string;
  applyStatus?: 'disponible' | 'postulado';
}

const TIPO_LABELS: Record<string, string> = {
  NO_CALIFICADA: 'No calificada',
  SEMI_CALIFICADA: 'Semi calificada',
  CALIFICADA: 'Calificada',
  PROFESIONAL: 'Profesional',
  TECNICO: 'Técnico',
  PRACTICAS: 'Prácticas',
};

export default function Ofertas() {
  const { user } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const canApply = canAccess(user?.role, 'postulaciones') && user?.role === 'COMUNERO';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    loadData();
    return () => unsubscribe();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/ofertas');
      const data = Array.isArray(response.data) ? response.data : [];
      
      const localPostulaciones = await PersistenceService.getPostulaciones() || [];
      const safeLocalPostulaciones = Array.isArray(localPostulaciones) ? localPostulaciones : [];

      const updatedData = data.map((o: Oferta) => ({
        ...o,
        applyStatus: safeLocalPostulaciones.some((p: any) => p?.ofertaId === o?.id)
          ? 'postulado'
          : 'disponible',
      }));

      setOfertas(updatedData);
      await PersistenceService.saveOfertas(updatedData);
    } catch (error) {
      console.error('Error al cargar ofertas:', error);
      const cached = await PersistenceService.getOfertas();
      if (Array.isArray(cached)) {
        setOfertas(cached);
      } else {
        setOfertas([]);
        Alert.alert('Error', 'No se pudieron cargar las vacantes. Verifique su conexión.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApply = async (ofertaId: string) => {
    if (!user) {
      Alert.alert('Acceso Requerido', 'Debes iniciar sesión para postular.');
      return;
    }
    if (!canApply) {
      Alert.alert(
        'Directiva / Empresa',
        'La postulación en nombre de comuneros se habilita en la Fase 3. Por ahora use el panel web o espere esa entrega.',
      );
      return;
    }

    setOfertas(prev => (Array.isArray(prev) ? prev : []).map(o => 
      o?.id === ofertaId ? { ...o, applyStatus: 'postulado' } : o
    ));

    try {
      if (isOnline) {
        await api.post('/postulaciones', { ofertaId });
        Alert.alert('¡Éxito!', 'Tu postulación ha sido enviada correctamente.');
      } else {
        await PersistenceService.addToSyncQueue({
          url: '/postulaciones',
          method: 'POST',
          data: { ofertaId },
        });
        Alert.alert(
          'Modo Offline', 
          'No tienes conexión. Tu postulación se ha guardado localmente y se enviará automáticamente cuando recuperes la señal.'
        );
      }

      const currentPostulaciones = await PersistenceService.getPostulaciones() || [];
      const safeCurrentPostulaciones = Array.isArray(currentPostulaciones) ? currentPostulaciones : [];
      await PersistenceService.savePostulaciones([
        ...safeCurrentPostulaciones,
        { ofertaId, status: 'PRESENTACION_CV' },
      ]);
    } catch (error) {
      console.error('Error al postular:', error);
      if (isOnline) {
        setOfertas(prev => (Array.isArray(prev) ? prev : []).map(o => 
          o?.id === ofertaId ? { ...o, applyStatus: 'disponible' } : o
        ));
        Alert.alert('Error', 'No se pudo procesar la postulación. Intente más tarde.');
      }
    }
  };

  const formatSalary = (salary?: number | string) => {
    if (salary === undefined || salary === null || salary === '') return 'Sueldo a tratar';
    const n = Number(salary);
    if (Number.isNaN(n)) return String(salary);
    return `S/ ${n.toLocaleString()}`;
  };

  const renderItem = ({ item }: { item: Oferta }) => {
    const company = item.company || item.companyName || 'Empresa convocante';
    const location = item.location || item.sector || 'Ubicación no disponible';
    const daysText =
      item.estadoLabel ||
      (item.daysLeft != null ? `${item.daysLeft} días restantes` : 'Vigente');

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <Text style={styles.offerTitle}>{item?.title || 'Sin título'}</Text>
          <View style={[styles.tag, item?.applyStatus === 'postulado' && styles.tagSuccess]}>
            <Text style={[styles.tagText, item?.applyStatus === 'postulado' && styles.tagTextSuccess]}>
              {item?.applyStatus === 'postulado' ? 'En Proceso' : daysText}
            </Text>
          </View>
        </View>
        
        <Text style={styles.companyText}>{company}</Text>

        {!!item.tipoManoObra && (
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {TIPO_LABELS[item.tipoManoObra] || item.tipoManoObra}
              </Text>
            </View>
            {item.vacancies != null && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{item.vacancies} vacantes</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={Theme.colors.textSecondary} />
            <Text style={styles.detailText}>{location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color={Theme.colors.textSecondary} />
            <Text style={styles.detailText}>{formatSalary(item.salary)}</Text>
          </View>
        </View>

        {(item.regimenLaboral || item.sistemaTrabajo || item.horarioTrabajo) && (
          <View style={styles.metaBlock}>
            {!!item.regimenLaboral && (
              <Text style={styles.metaText}>Régimen: {item.regimenLaboral}</Text>
            )}
            {!!item.sistemaTrabajo && (
              <Text style={styles.metaText}>Sistema: {item.sistemaTrabajo}</Text>
            )}
            {!!item.horarioTrabajo && (
              <Text style={styles.metaText}>Horario: {item.horarioTrabajo}</Text>
            )}
            {item.tiempoContratoMeses != null && (
              <Text style={styles.metaText}>Contrato: {item.tiempoContratoMeses} meses</Text>
            )}
          </View>
        )}

        {canApply && (
          <TouchableOpacity 
            style={[
              styles.applyButton, 
              item?.applyStatus === 'postulado' && styles.applyButtonDisabled
            ]}
            onPress={() => handleApply(item?.id)}
            disabled={item?.applyStatus === 'postulado'}
          >
            {item?.applyStatus === 'postulado' ? (
              <View style={styles.row}>
                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.applyButtonText}>Ya Postulaste</Text>
              </View>
            ) : (
              <Text style={styles.applyButtonText}>Postulación con un clic</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Buscando mejores oportunidades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ofertas}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Vacantes Vigentes</Text>
            <Text style={styles.subtitle}>
              {user?.role === 'DIRECTIVA'
                ? 'Convocatorias visibles para la comunidad'
                : 'Encontradas según tu perfil de comunero'}
            </Text>
            {!isOnline && (
              <View style={styles.offlineBanner}>
                <Ionicons name="cloud-offline" size={16} color="white" />
                <Text style={styles.offlineBannerText}>Modo Offline: Mostrando datos guardados</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No se encontraron vacantes disponibles en este momento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  header: {
    marginBottom: Theme.spacing.md,
  },
  title: {
    ...Theme.typography.h2,
    color: Theme.colors.text,
  },
  subtitle: {
    ...Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  offlineBanner: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.warning,
    padding: 8,
    borderRadius: Theme.borderRadius.sm,
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  offlineBannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  offerCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  offerTitle: {
    ...Theme.typography.h2,
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  tag: {
    backgroundColor: Theme.colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    maxWidth: 140,
  },
  tagSuccess: {
    backgroundColor: Theme.colors.success + '20',
  },
  tagText: {
    ...Theme.typography.caption,
    color: Theme.colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextSuccess: {
    color: Theme.colors.success,
  },
  companyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: Theme.colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  metaBlock: {
    marginBottom: Theme.spacing.md,
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  applyButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: Theme.colors.success,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    fontSize: 16,
  },
});
