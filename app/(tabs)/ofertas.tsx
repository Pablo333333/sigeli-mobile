import React, { useState, useEffect, useCallback } from 'react';
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

interface Oferta {
  id: string;
  title: string;
  company: string;
  daysLeft: number;
  salary: string;
  location: string;
  status?: 'disponible' | 'postulado';
}

export default function Ofertas() {
  const { user } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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
      // 1. Intentar cargar de la API
      const response = await api.get('/ofertas');
      const data = response.data;
      
      // 2. Cruzar con postulaciones locales para marcar estado
      const localPostulaciones = await PersistenceService.getPostulaciones() || [];
      const updatedData = data.map((o: Oferta) => ({
        ...o,
        status: localPostulaciones.some((p: any) => p.ofertaId === o.id) ? 'postulado' : 'disponible'
      }));

      setOfertas(updatedData);
      // Guardar en caché para modo offline
      await PersistenceService.saveOfertas(updatedData);
    } catch (error) {
      console.error('Error al cargar ofertas:', error);
      // 3. Fallback a datos locales si falla la red
      const cached = await PersistenceService.getOfertas();
      if (cached) {
        setOfertas(cached);
      } else {
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

    // Actualización visual inmediata (Optimistic UI)
    setOfertas(prev => prev.map(o => 
      o.id === ofertaId ? { ...o, status: 'postulado' } : o
    ));

    try {
      if (isOnline) {
        await api.post('/postulaciones', {
          ofertaId,
          usuarioId: user.id,
          fecha: new Date().toISOString(),
        });
        Alert.alert('¡Éxito!', 'Tu postulación ha sido enviada correctamente.');
      } else {
        // Lógica Offline: Guardar en cola de sincronización
        await PersistenceService.addToSyncQueue({
          url: '/postulaciones',
          method: 'POST',
          data: { ofertaId, usuarioId: user.id, fecha: new Date().toISOString() }
        });
        Alert.alert(
          'Modo Offline', 
          'No tienes conexión. Tu postulación se ha guardado localmente y se enviará automáticamente cuando recuperes la señal.'
        );
      }

      // Guardar estado actualizado localmente
      const currentPostulaciones = await PersistenceService.getPostulaciones() || [];
      await PersistenceService.savePostulaciones([...currentPostulaciones, { ofertaId, status: 'postulado' }]);

    } catch (error) {
      console.error('Error al postular:', error);
      // Revertir cambio visual si falló y no es por falta de red
      if (isOnline) {
        setOfertas(prev => prev.map(o => 
          o.id === ofertaId ? { ...o, status: 'disponible' } : o
        ));
        Alert.alert('Error', 'No se pudo procesar la postulación. Intente más tarde.');
      }
    }
  };

  const renderItem = ({ item }: { item: Oferta }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <View style={[styles.tag, item.status === 'postulado' && styles.tagSuccess]}>
          <Text style={[styles.tagText, item.status === 'postulado' && styles.tagTextSuccess]}>
            {item.status === 'postulado' ? 'En Proceso' : `${item.daysLeft} días restantes`}
          </Text>
        </View>
      </View>
      
      <Text style={styles.companyText}>{item.company}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={16} color={Theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash" size={16} color={Theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.salary}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.applyButton, 
          item.status === 'postulado' && styles.applyButtonDisabled
        ]}
        onPress={() => handleApply(item.id)}
        disabled={item.status === 'postulado'}
      >
        {item.status === 'postulado' ? (
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.applyButtonText}>Ya Postulaste</Text>
          </View>
        ) : (
          <Text style={styles.applyButtonText}>Postulación con un clic</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
            <Text style={styles.subtitle}>Encontradas según tu perfil de comunero</Text>
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
  },
  tagSuccess: {
    backgroundColor: Theme.colors.success + '20',
  },
  tagText: {
    ...Theme.typography.caption,
    color: Theme.colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  tagTextSuccess: {
    color: Theme.colors.success,
  },
  companyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
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
  applyButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
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
