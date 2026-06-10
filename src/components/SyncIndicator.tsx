import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncManager } from '../services/SyncManager';
import NetInfo from '@react-native-community/netinfo';

export const SyncIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    const checkPending = async () => {
      const pending = await SyncManager.hasPendingSync();
      setHasPending(pending);
    };

    const interval = setInterval(checkPending, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!isOffline && !hasPending) return null;

  return (
    <View style={[styles.container, isOffline ? styles.offline : styles.pending]}>
      <Ionicons 
        name={isOffline ? "cloud-offline" : "cloud-upload"} 
        size={14} 
        color="#fff" 
      />
      <Text style={styles.text}>
        {isOffline ? "Modo Offline" : "Sincronizando..."}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  offline: {
    backgroundColor: '#718096',
  },
  pending: {
    backgroundColor: '#4A90E2',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
