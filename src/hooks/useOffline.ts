import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineStore } from '../store/offlineStore';

/**
 * Hook para manejar el estado de conexión y sincronización offline.
 */
export function useOffline<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Suscribirse a cambios de red
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Cargar datos iniciales desde el store offline
    const loadOfflineData = async () => {
      const cachedData = await OfflineStore.get(key);
      if (cachedData) {
        setData(cachedData);
      }
    };

    loadOfflineData();

    return () => unsubscribe();
  }, [key]);

  const updateData = async (newData: T) => {
    setData(newData);
    await OfflineStore.save(key, newData);
  };

  return { data, updateData, isOffline };
}
