import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { canAccess, ROLE_LABELS, UserRole } from '../../src/utils/roles';

export default function Mas() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role as UserRole | undefined;

  const allItems = [
    {
      id: 'evaluaciones',
      title: 'Evaluaciones 360°',
      icon: 'star',
      color: Theme.colors.primary,
      subtitle: 'Encuestas de satisfacción laboral',
      route: '/evaluaciones',
      feature: 'evaluaciones',
    },
    {
      id: 'capacitaciones',
      title: 'Capacitaciones (CV)',
      icon: 'school',
      color: Theme.colors.success,
      subtitle: 'Historial de cursos en tu CV',
      route: '/capacitaciones',
      feature: 'capacitaciones',
    },
    {
      id: 'entrenamiento',
      title: 'Entrenamiento laboral',
      icon: 'construct',
      color: Theme.colors.primary,
      subtitle: 'Encuesta Antamina / socio (dashboard)',
      route: '/entrenamiento',
      feature: 'capacitaciones',
    },
    {
      id: 'puntos',
      title: 'Programa de Puntos',
      icon: 'trophy',
      color: '#fbbf24',
      subtitle: 'Logros y recompensas',
      route: '/perfil/puntos',
      feature: 'puntos',
    },
    {
      id: 'reclamos',
      title: 'Buzón de Reclamos',
      icon: 'chatbox-ellipses',
      color: Theme.colors.danger,
      subtitle: 'Mediación comunitaria',
      route: '/reclamos',
      feature: 'reclamos',
    },
    {
      id: 'postular',
      title: 'Postular comunero',
      icon: 'person-add',
      color: Theme.colors.primary,
      subtitle: 'Enviar CV de un comunero a una oferta',
      route: '/postular',
      feature: 'postularTerceros',
    },
  ];

  const menuItems = allItems.filter((item) => canAccess(role, item.feature));

  const handlePress = (route: string | null) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userCard}>
        <Text style={styles.userName}>{user?.fullName || 'Usuario Talento'}</Text>
        <Text style={styles.userRole}>
          {role ? ROLE_LABELS[role] || role : 'Sin rol'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicios disponibles</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handlePress(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.border} />
            </TouchableOpacity>
          ))}
          {menuItems.length === 0 && (
            <View style={styles.menuItem}>
              <Text style={styles.menuSubtitle}>No hay servicios adicionales para tu rol.</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
        <Ionicons name="log-out-outline" size={22} color={Theme.colors.danger} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
  },
  userCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  userRole: {
    marginTop: 4,
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuGrid: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: Theme.spacing.md,
    minHeight: Theme.touch.min,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Theme.colors.text,
    fontSize: 17,
  },
  menuSubtitle: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: Theme.touch.min,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    color: Theme.colors.danger,
    fontWeight: '700',
    fontSize: 17,
  },
});
