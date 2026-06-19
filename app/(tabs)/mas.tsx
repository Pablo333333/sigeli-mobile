import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useRouter } from 'expo-router';

export default function Mas() {
  const router = useRouter();
  
  const menuItems = [
    { id: 'evaluaciones', title: 'Evaluaciones 360°', icon: 'star', color: Theme.colors.primary, subtitle: 'Encuestas de satisfacción laboral', route: '/evaluaciones' },
    { id: 'capacitaciones', title: 'Mis Capacitaciones', icon: 'school', color: Theme.colors.success, subtitle: 'Certificados y progreso', route: null },
    { id: 'puntos', title: 'Programa de Puntos', icon: 'trophy', color: '#fbbf24', subtitle: 'Logros y recompensas', route: '/perfil/puntos' },
    { id: 'reclamos', title: 'Buzón de Reclamos', icon: 'chatbox-ellipses', color: Theme.colors.danger, subtitle: 'Mediación comunitaria', route: null },
    { id: 'configuracion', title: 'Configuración', icon: 'settings', color: Theme.colors.textSecondary, subtitle: 'Idioma y notificaciones', route: null },
  ];

  const handlePress = (route: string | null) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicios Adicionales</Text>
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
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>SIGELI Mobile v1.0.0</Text>
        <Text style={styles.offlineStatus}>
          <Ionicons name="cloud-done" size={14} color={Theme.colors.success} /> Modo Offline Preparado
        </Text>
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
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  iconContainer: {
    width: 50,
    height: 50,
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
  },
  menuSubtitle: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    gap: 4,
  },
  versionText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  offlineStatus: {
    ...Theme.typography.caption,
    color: Theme.colors.success,
    fontWeight: '600',
  },
});
