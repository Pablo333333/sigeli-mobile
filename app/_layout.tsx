import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState, Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { SyncBootstrap } from '../src/components/SyncBootstrap';
import { Theme } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';

// --- Error Boundary Component ---
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    console.error('CRASH DETECTADO:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <ScrollView contentContainerStyle={styles.errorContent}>
            <Ionicons name="alert-circle" size={80} color={Theme.colors.danger} />
            <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
            <Text style={styles.errorSubtitle}>La aplicación ha detectado un error crítico y no puede continuar.</Text>
            
            <View style={styles.detailsBox}>
              <Text style={styles.detailsTitle}>Detalles técnicos:</Text>
              <Text style={styles.detailsText}>{this.state.error?.toString()}</Text>
              <Text style={styles.detailsTitle}>Component Stack:</Text>
              <Text style={styles.detailsText}>{this.state.errorInfo?.componentStack}</Text>
            </View>

            <TouchableOpacity 
              style={styles.retryBtn} 
              onPress={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
              }}
            >
              <Text style={styles.retryBtnText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simular preparación de recursos
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SyncBootstrap />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="postular" options={{ headerShown: false }} />
            <Stack.Screen name="reclamos" options={{ headerShown: false }} />
            <Stack.Screen name="capacitaciones" options={{ headerShown: false }} />
            <Stack.Screen name="entrenamiento" options={{ headerShown: false }} />
            <Stack.Screen name="evaluaciones" options={{ headerShown: false }} />
            <Stack.Screen name="perfil/puntos" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContent: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  errorTitle: {
    ...Theme.typography.h1,
    color: Theme.colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 30,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  detailsText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: Theme.colors.danger,
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 4,
  },
  retryBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
