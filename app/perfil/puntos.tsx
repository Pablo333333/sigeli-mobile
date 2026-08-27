import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGROS = [
  { id: '1', title: 'Capacitación: Seguridad Minera', points: 50, date: '15 Jun 2026', icon: 'school' },
  { id: '2', title: 'Evaluación Positiva: Supervisor Antamina', points: 30, date: '10 Jun 2026', icon: 'star' },
  { id: '3', title: 'Postulación Exitosa: Operador de Maquinaria', points: 20, date: '05 Jun 2026', icon: 'briefcase' },
  { id: '4', title: 'Inducción General Completada', points: 15, date: '01 Jun 2026', icon: 'checkmark-circle' },
];

const COMPETENCIAS = [
  { name: 'Soldadura 3G', level: 0.9 },
  { name: 'Seguridad en Altura', level: 0.85 },
  { name: 'Trabajo en Equipo', level: 0.95 },
  { name: 'Primeros Auxilios', level: 0.7 },
];

export default function PuntosScreen() {
  const { user } = useAuth();
  const totalPoints = LOGROS.reduce((acc, curr) => acc + curr.points, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Estilo LinkedIn */}
        <View style={styles.profileCard}>
          <View style={styles.banner} />
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={60} color="white" />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName || 'Comunero Talento'}</Text>
              <Text style={styles.userRole}>Talento Comunal • Sector Verdecocha</Text>
              <Text style={styles.userLocation}>Ancash, Perú</Text>
            </View>
          </View>
        </View>

        {/* Marcador de Puntos */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Puntaje Acumulado</Text>
            <Text style={styles.pointsValue}>{totalPoints}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="trophy" size={40} color="#fbbf24" />
            <Text style={styles.badgeText}>Nivel Oro</Text>
          </View>
        </View>

        {/* Mapa de Competencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapa de Competencias</Text>
          <View style={styles.competenceList}>
            {COMPETENCIAS.map((comp, index) => (
              <View key={index} style={styles.competenceItem}>
                <View style={styles.competenceHeader}>
                  <Text style={styles.competenceName}>{comp.name}</Text>
                  <Text style={styles.competencePercent}>{Math.round(comp.level * 100)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${comp.level * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Historial de Logros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Logros</Text>
          {LOGROS.map((logro) => (
            <View key={logro.id} style={styles.logroItem}>
              <View style={styles.logroIconContainer}>
                <Ionicons name={logro.icon as any} size={24} color={Theme.colors.primary} />
              </View>
              <View style={styles.logroTextContainer}>
                <Text style={styles.logroTitle}>{logro.title}</Text>
                <Text style={styles.logroDate}>{logro.date}</Text>
              </View>
              <View style={styles.logroPoints}>
                <Text style={styles.logroPointsText}>+{logro.points}</Text>
              </View>
            </View>
          ))}
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: 'white',
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  banner: {
    height: 100,
    backgroundColor: Theme.colors.primary,
  },
  profileHeader: {
    padding: Theme.spacing.md,
    marginTop: -50,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginTop: Theme.spacing.sm,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  userRole: {
    fontSize: 16,
    color: Theme.colors.text,
    marginTop: 2,
  },
  userLocation: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  pointsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: Theme.spacing.md,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 2,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  pointsBadge: {
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  competenceList: {
    gap: 16,
  },
  competenceItem: {
    gap: 8,
  },
  competenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  competenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  competencePercent: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.success,
  },
  logroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logroTextContainer: {
    flex: 1,
  },
  logroTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  logroDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  logroPoints: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logroPointsText: {
    color: Theme.colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
