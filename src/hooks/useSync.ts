import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SyncManager } from '../services/SyncManager';
import { useAuth } from '../context/AuthContext';

/**
 * Hook global para automatizar la sincronización de datos.
 * Escucha cambios en la conectividad y dispara el vaciado de la cola de sincronización.
 */
export const useSync = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Suscribirse a cambios de red
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected && !!state.isInternetReachable;
      
      // Si pasamos de desconectado a conectado, disparamos la sincronización
      if (!isConnected && connected) {
        handleSync();
      }
      
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, user]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await SyncManager.processQueue(user?.id);
    } catch (error) {
      console.error('Error durante la sincronización automática:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isConnected,
    isSyncing,
    forceSync: handleSync
  };
};
