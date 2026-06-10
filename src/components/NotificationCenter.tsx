import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';

interface NotificationCenterProps {
  userId: string;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onClose }) => {
  const { data: notifications, isLoading, markAsRead } = useNotifications(userId);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.item, !item.leido && styles.unreadItem]}
      onPress={() => !item.leido && markAsRead.mutate(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.tipo === 'OFERTA' ? 'briefcase' : 'alert-circle'} 
          size={24} 
          color={item.tipo === 'OFERTA' ? '#4A90E2' : '#F5A623'} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.message, !item.leido && styles.unreadText]}>{item.mensaje}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      {!item.leido && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Centro de Notificaciones</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4A90E2" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tienes notificaciones por ahora.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loader: {
    marginTop: 40,
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#f8faff',
  },
  iconContainer: {
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  unreadText: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginLeft: 10,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  }
});
