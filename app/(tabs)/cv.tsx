import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useCV } from '../../src/hooks/useCV';
import { useNotifications } from '../../src/hooks/useNotifications';
import { CVForm } from '../../src/components/CVForm';
import { NotificationCenter } from '../../src/components/NotificationCenter';
import { Ionicons } from '@expo/vector-icons';

export default function CVScreen() {
  const userId = 'user-test-id'; 
  const { data: cv, isLoading, error } = useCV(userId);
  const { unreadCount } = useNotifications(userId);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [editSection, setEditSection] = useState<'PERSONAL' | 'EXPERIENCIA' | 'EDUCACION' | 'HABILIDADES'>('PERSONAL');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Cargando perfil de comunero...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error al cargar el perfil. Asegúrate de que el backend esté corriendo.</Text>
      </View>
    );
  }

  const openEdit = (section: any) => {
    setEditSection(section);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.bellButton} 
          onPress={() => setNotificationsVisible(true)}
        >
          <Ionicons name="notifications" size={24} color="#1e40af" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{cv?.user?.fullName || 'Comunero'}</Text>
        <Text style={styles.subtitle}>DNI: {cv?.user?.dni}</Text>
        <View style={[styles.badge, { backgroundColor: cv?.user?.trustLevel === 'VERDE' ? '#4CAF50' : '#FFC107' }]}>
          <Text style={styles.badgeText}>Confianza: {cv?.user?.trustLevel}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Perfil IA</Text>
        </View>
        <Text style={styles.bodyText}>{cv?.aiSummary || 'Generando perfil con IA...'}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen de Experiencia</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Number(cv?.yearsExperienceMining).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Años Minería</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Number(cv?.yearsExperienceGeneral).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Años General</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Experiencia Laboral</Text>
          <TouchableOpacity onPress={() => openEdit('EXPERIENCIA')}>
            <Ionicons name="add-circle" size={24} color="#1e40af" />
          </TouchableOpacity>
        </View>
        {cv?.experiencias?.map((exp: any) => (
          <View key={exp.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{exp.position}</Text>
            <Text style={styles.itemSubtitle}>{exp.company} • {exp.categoria}</Text>
            <Text style={styles.itemDate}>
              {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Actualidad'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Educación</Text>
          <TouchableOpacity onPress={() => openEdit('EDUCACION')}>
            <Ionicons name="add-circle" size={24} color="#1e40af" />
          </TouchableOpacity>
        </View>
        {cv?.educaciones?.map((edu: any) => (
          <View key={edu.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{edu.titulo}</Text>
            <Text style={styles.itemSubtitle}>{edu.institucion} • {edu.tipoEstudio}</Text>
          </View>
        ))}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CVForm 
              userId={userId} 
              section={editSection} 
              onSuccess={() => setModalVisible(false)} 
            />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationsVisible}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <NotificationCenter 
              userId={userId} 
              onClose={() => setNotificationsVisible(false)} 
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  bodyText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  itemCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButtonText: {
    color: '#666',
    fontWeight: 'bold',
  }
});
