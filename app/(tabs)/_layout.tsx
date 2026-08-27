import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { canAccess, isDirectiva } from '../../src/utils/roles';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const showCv = canAccess(user.role, 'cv');
  const showPuntosTabLabel = isDirectiva(user.role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 8,
          backgroundColor: Theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Theme.colors.primary,
        },
        headerTintColor: Theme.colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: Theme.colors.textOnPrimary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: showPuntosTabLabel ? 'Panel' : 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ofertas"
        options={{
          title: 'Trabajos',
          href: canAccess(user.role, 'ofertas') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cv"
        options={{
          title: 'Mi Perfil',
          href: showCv ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="postulaciones"
        options={{
          title: 'Seguimiento',
          href: canAccess(user.role, 'postulaciones') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: canAccess(user.role, 'chat') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voz"
        options={{
          title: 'Asistente',
          href: isDirectiva(user.role) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mas"
        options={{
          title: 'Más',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
