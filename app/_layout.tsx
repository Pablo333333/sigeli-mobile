import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SyncManager } from '../src/services/SyncManager';
import { SyncIndicator } from '../src/components/SyncIndicator';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    SyncManager.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SyncIndicator />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
