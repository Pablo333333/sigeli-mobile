import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header / Saludo */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, Comunero</Text>
        <Text style={styles.subtitle}>Bienvenido a SIGELI</Text>
      </View>

      {/* Alertas Críticas (Semáforo) */}
      <View style={[styles.card, styles.alertCard]}>
        <View style={styles.alertHeader}>
          <Ionicons name="notifications" size={24} color={Theme.colors.warning} />
          <Text style={styles.alertTitle}>Alertas Críticas</Text>
        </View>
        <View style={styles.alertItem}>
          <View style={[styles.statusDot, { backgroundColor: Theme.colors.success }]} />
          <Text style={styles.alertText}>Nueva oferta compatible con tu perfil.</Text>
        </View>
        <View style={styles.alertItem}>
          <View style={[styles.statusDot, { backgroundColor: Theme.colors.danger }]} />
          <Text style={styles.alertText}>Tu contrato vence en 5 días.</Text>
        </View>
      </View>

      {/* Gamificación (Puntos) */}
      <View style={[styles.card, styles.pointsCard]}>
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsLabel}>Puntos Acumulados</Text>
          <Text style={styles.pointsValue}>1,250</Text>
        </View>
        <Ionicons name="trophy" size={48} color="#fbbf24" />
      </View>

      {/* Bloques Grandes de Acción */}
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
          <Text style={styles.actionText}>Capacitarme</Text>
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
  greeting: {
    ...Theme.typography.h1,
    color: Theme.colors.text,
  },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCard: {
    borderLeftWidth: 6,
    borderLeftColor: Theme.colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  alertTitle: {
    ...Theme.typography.h2,
    fontSize: 18,
    color: Theme.colors.text,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  alertText: {
    ...Theme.typography.body,
    fontSize: 14,
    color: Theme.colors.text,
  },
  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  pointsInfo: {
    gap: 4,
  },
  pointsLabel: {
    ...Theme.typography.caption,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  pointsValue: {
    ...Theme.typography.h1,
    color: 'white',
    fontSize: 40,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionBlock: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  actionText: {
    ...Theme.typography.caption,
    color: 'white',
    fontWeight: '700',
  },
});
