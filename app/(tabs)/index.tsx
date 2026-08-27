import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { canAccess, isDirectiva, ROLE_LABELS, UserRole } from '../../src/utils/roles';
import api from '../../src/services/api';
import { useNotifications } from '../../src/hooks/useNotifications';
import { NotificationCenter } from '../../src/components/NotificationCenter';

type FilterState = {
  sector: string;
  gender: string;
  tipoManoObra: string;
  anio: string;
};

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <View style={styles.miniBarRow}>
      <Text style={styles.miniBarLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width: `${width}%` }]} />
      </View>
      <Text style={styles.miniBarValue}>{value}</Text>
    </View>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value || 'all'}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sector: '',
    gender: '',
    tipoManoObra: '',
    anio: String(new Date().getFullYear()),
  });

  const role = user?.role as UserRole | undefined;
  const directiva = isDirectiva(role);
  const { unreadCount } = useNotifications(user?.id || '');

  const loadDashboard = async (f: FilterState = filters) => {
    setLoadingStats(true);
    try {
      const params = new URLSearchParams();
      if (f.sector) params.set('sector', f.sector);
      if (f.gender) params.set('gender', f.gender);
      if (f.tipoManoObra) params.set('tipoManoObra', f.tipoManoObra);
      if (f.anio) params.set('anio', f.anio);
      const qs = params.toString();
      const [dashRes, heatRes] = await Promise.all([
        api.get(`/analitica/dashboards${qs ? `?${qs}` : ''}`),
        api.get('/analitica/heatmap?capa=todos').catch(() => null),
      ]);
      setStats(dashRes.data);
      if (heatRes?.data) setHeatmap(heatRes.data);
    } catch (e) {
      console.log('Dashboard no disponible aún', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (canAccess(role, 'dashboard')) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (directiva) {
    const catalogo = stats?.catalogoFiltros;
    const interesados = stats?.interesados;
    const sectores: Array<{ key: string; label: string; value: number }> =
      stats?.comunerosPorSector || [];
    const edades: Array<{ key: string; label: string; value: number }> =
      stats?.potencialPorEdad || [];
    const manoObra: Array<{ key: string; label: string; value: number }> =
      stats?.manoObraRequerida || [];
    const contratosMes: Array<{ mes: number; label: string; total: number }> =
      stats?.contratos?.porMes || [];
    const maxSector = Math.max(...sectores.map((s) => s.value), 1);
    const maxEdad = Math.max(...edades.map((s) => s.value), 1);
    const maxMO = Math.max(...manoObra.map((s) => s.value), 1);
    const maxContratoMes = Math.max(...contratosMes.map((s) => s.total), 1);
    const heatPoints: Array<{
      nombre: string;
      peso: number;
      intensidad: number;
      ofertas: number;
      comuneros: number;
      postulantes: number;
    }> = (heatmap?.puntos || []).filter((p: any) => p.peso > 0).slice(0, 5);
    const maxHeat = Math.max(...heatPoints.map((p) => p.peso), 1);

    const sectorOptions = [
      { label: 'Todos', value: '' },
      ...((catalogo?.sectores || []) as string[]).map((s) => ({ label: s, value: s })),
    ];
    const genderOptions = [
      { label: 'Todos', value: '' },
      { label: 'Masculino', value: 'MASCULINO' },
      { label: 'Femenino', value: 'FEMENINO' },
      { label: 'Otro', value: 'OTRO' },
    ];
    const moOptions = [
      { label: 'Todas', value: '' },
      ...((catalogo?.tiposManoObra || []) as Array<{ value: string; label: string }>).map((t) => ({
        label: t.label,
        value: t.value,
      })),
    ];
    const anioOptions = ((catalogo?.anios || [new Date().getFullYear()]) as number[]).map((y) => ({
      label: String(y),
      value: String(y),
    }));

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {user?.fullName?.split(' ')[0] || 'Directiva'}</Text>
          <Text style={styles.roleBadge}>{ROLE_LABELS.DIRECTIVA}</Text>
          <Text style={styles.subtitle}>Dashboard personalizado comunal</Text>
        </View>

        <View style={[styles.card, styles.infoCard]}>
          <Ionicons name="information-circle" size={22} color={Theme.colors.primary} />
          <Text style={styles.infoText}>
            Indicadores filtrables: género, sectores, rangos de edad, tipos de mano de obra, contratos
            por mes y participación en entrenamiento.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Filtros</Text>
          <Text style={styles.filterLabel}>Sector</Text>
          <ChipRow
            options={sectorOptions}
            value={filters.sector}
            onChange={(sector) => setFilters((prev) => ({ ...prev, sector }))}
          />
          <Text style={styles.filterLabel}>Género</Text>
          <ChipRow
            options={genderOptions}
            value={filters.gender}
            onChange={(gender) => setFilters((prev) => ({ ...prev, gender }))}
          />
          <Text style={styles.filterLabel}>Tipo mano de obra</Text>
          <ChipRow
            options={moOptions}
            value={filters.tipoManoObra}
            onChange={(tipoManoObra) => setFilters((prev) => ({ ...prev, tipoManoObra }))}
          />
          <Text style={styles.filterLabel}>Año</Text>
          <ChipRow
            options={anioOptions}
            value={filters.anio}
            onChange={(anio) => setFilters((prev) => ({ ...prev, anio }))}
          />
          <TouchableOpacity style={styles.applyBtn} onPress={() => loadDashboard()} activeOpacity={0.8}>
            <Ionicons name="filter" size={16} color="#fff" />
            <Text style={styles.applyBtnText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>

        {loadingStats ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : stats ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{interesados?.total ?? stats.totalComuneros ?? '—'}</Text>
                <Text style={styles.statLabel}>Interesados</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{interesados?.varones ?? '—'}</Text>
                <Text style={styles.statLabel}>Varones</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{interesados?.mujeres ?? '—'}</Text>
                <Text style={styles.statLabel}>Mujeres</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalContratados ?? '—'}</Text>
                <Text style={styles.statLabel}>Contratos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.convocatorias?.total ?? '—'}</Text>
                <Text style={styles.statLabel}>Convocatorias</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {stats.programaEntrenamiento?.participantes ?? '—'}
                </Text>
                <Text style={styles.statLabel}>Entrenamiento</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Mapa de calor (resumen)</Text>
              <Text style={styles.heatHint}>
                Concentración por centro poblado georreferenciado. Vista completa en el panel web.
              </Text>
              {heatPoints.length === 0 ? (
                <Text style={styles.emptyText}>Sin concentraciones aún</Text>
              ) : (
                heatPoints.map((p) => (
                  <View key={p.nombre} style={{ marginBottom: 10 }}>
                    <MiniBar label={p.nombre} value={p.peso} max={maxHeat} />
                    <Text style={styles.heatMeta}>
                      O:{p.ofertas} · C:{p.comuneros} · P:{p.postulantes} ·{' '}
                      {Math.round(p.intensidad * 100)}%
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Comuneros por sector</Text>
              {sectores.length === 0 ? (
                <Text style={styles.emptyText}>Sin datos</Text>
              ) : (
                sectores.map((s) => (
                  <MiniBar key={s.key} label={s.label} value={s.value} max={maxSector} />
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Potencial por rango de edad</Text>
              {edades.length === 0 ? (
                <Text style={styles.emptyText}>Sin datos</Text>
              ) : (
                edades
                  .filter((e) => e.key !== 'sinDato' || e.value > 0)
                  .map((e) => (
                    <MiniBar key={e.key} label={e.label} value={e.value} max={maxEdad} />
                  ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Mano de obra requerida</Text>
              {manoObra.length === 0 ? (
                <Text style={styles.emptyText}>Sin datos</Text>
              ) : (
                manoObra.map((m) => (
                  <MiniBar key={m.key} label={m.label} value={m.value} max={maxMO} />
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Contratos por mes ({stats.contratos?.anio ?? filters.anio})
              </Text>
              {contratosMes.every((m) => m.total === 0) ? (
                <Text style={styles.emptyText}>Sin contratos en el año</Text>
              ) : (
                contratosMes
                  .filter((m) => m.total > 0)
                  .map((m) => (
                    <MiniBar
                      key={m.mes}
                      label={m.label}
                      value={m.total}
                      max={maxContratoMes}
                    />
                  ))
              )}
            </View>
          </>
        ) : null}

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBlock, { backgroundColor: Theme.colors.primary }]}
            onPress={() => router.push('/ofertas')}
            activeOpacity={0.7}
          >
            <Ionicons name="briefcase" size={32} color="white" />
            <Text style={styles.actionText}>Ver Ofertas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBlock, { backgroundColor: Theme.colors.success }]}
            onPress={() => router.push('/postulaciones')}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={32} color="white" />
            <Text style={styles.actionText}>Seguimiento</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => router.push('/postular' as any)}
        >
          <Ionicons name="person-add" size={22} color={Theme.colors.primary} />
          <Text style={styles.secondaryActionText}>Postular comunero a oferta</Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.border} />
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              Hola, {user?.fullName?.split(' ')[0] || 'Comunero'}
            </Text>
            {role && role !== 'COMUNERO' && (
              <Text style={styles.roleBadge}>{ROLE_LABELS[role] || role}</Text>
            )}
            <Text style={styles.subtitle}>Bienvenido a SIGELI</Text>
          </View>
          {user?.id && (
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setShowNotifs(true)}
              hitSlop={12}
            >
              <Ionicons name="notifications" size={26} color={Theme.colors.primary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.card, styles.alertCard]}
        onPress={() => setShowNotifs(true)}
        activeOpacity={0.85}
      >
        <View style={styles.alertHeader}>
          <Ionicons name="notifications" size={24} color={Theme.colors.warning} />
          <Text style={styles.alertTitle}>Notificaciones</Text>
        </View>
        <Text style={styles.alertText}>
          {unreadCount > 0
            ? `Tienes ${unreadCount} sin leer (incluye nuevas ofertas laborales).`
            : 'Sin alertas nuevas. Al publicar ofertas te avisaremos aquí.'}
        </Text>
      </TouchableOpacity>

      <Modal visible={showNotifs} animationType="slide" onRequestClose={() => setShowNotifs(false)}>
        {user?.id ? (
          <NotificationCenter userId={user.id} onClose={() => setShowNotifs(false)} />
        ) : null}
      </Modal>

      {canAccess(role, 'puntos') && (
        <View style={[styles.card, styles.pointsCard]}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Puntos Acumulados</Text>
            <Text style={styles.pointsValue}>{user?.points?.toLocaleString() || '0'}</Text>
          </View>
          <Ionicons name="trophy" size={48} color="#fbbf24" />
        </View>
      )}

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionBlock, { backgroundColor: Theme.colors.primary }]}
          onPress={() => router.push('/ofertas')}
          activeOpacity={0.7}
        >
          <Ionicons name="briefcase" size={32} color="white" />
          <Text style={styles.actionText}>Buscar Trabajo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBlock, { backgroundColor: Theme.colors.success }]}
          onPress={() => router.push('/capacitaciones')}
          activeOpacity={0.7}
        >
          <Ionicons name="school" size={32} color="white" />
          <Text style={styles.actionText}>Capacitaciones CV</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  header: {
    marginBottom: Theme.spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  greeting: {
    ...Theme.typography.h1,
    color: Theme.colors.text,
  },
  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.primary + '18',
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: Theme.colors.text,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  applyBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    minHeight: Theme.touch.min,
    borderRadius: Theme.borderRadius.md,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  miniBarLabel: {
    width: 88,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  miniBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.border,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  miniBarValue: {
    width: 28,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  heatHint: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 10,
    lineHeight: 17,
  },
  heatMeta: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginLeft: 96,
    marginTop: -4,
  },
  alertCard: {},
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: Theme.colors.text,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  alertText: {
    flex: 1,
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsInfo: {},
  pointsLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionBlock: {
    flex: 1,
    minHeight: 120,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Theme.colors.primary + '10',
    borderColor: Theme.colors.primary + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    minHeight: Theme.touch.min,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  secondaryActionText: {
    flex: 1,
    fontWeight: '600',
    color: Theme.colors.text,
    fontSize: 15,
  },
});
