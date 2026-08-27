import { useEffect, useState, useRef } from 'react';
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
  const wasConnected = useRef<boolean | null>(null);

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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected && state.isInternetReachable !== false;

      if (wasConnected.current === false && connected) {
        handleSync();
      } else if (wasConnected.current === null && connected) {
        handleSync();
      }

      wasConnected.current = connected;
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  return {
    isConnected,
    isSyncing,
    forceSync: handleSync
  };
};
