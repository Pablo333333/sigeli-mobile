import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SyncManager } from '../src/services/SyncManager';
import { SyncIndicator } from '../src/components/SyncIndicator';
import { AuthProvider } from '../src/context/AuthContext';
import { useSync } from '../src/hooks/useSync';
import { NotificationService } from '../src/services/NotificationService';

const queryClient = new QueryClient();

function AppContent() {
  // Inicializamos el hook de sincronización automática
  useSync();

  useEffect(() => {
    // Configurar notificaciones push al iniciar
    NotificationService.registerForPushNotificationsAsync();
    
    const subscription = NotificationService.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida en primer plano:', notification);
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <SyncIndicator />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SyncManager.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
