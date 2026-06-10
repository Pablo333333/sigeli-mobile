import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { usePostulaciones } from '../../src/hooks/usePostulaciones';
import { TimelineItem } from '../../src/components/TimelineItem';

export default function PostulacionesScreen() {
  const userId = 'user-test-id'; // ID de prueba
  const { data: postulaciones, isLoading, error } = usePostulaciones(userId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Cargando tus procesos...</Text>
      </View>
    );
  }

  if (error || !postulaciones) {
    return (
      <View style={styles.center}>
        <Text>No se encontraron postulaciones activas.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainTitle}>Mis Procesos de Selección</Text>
      
      {postulaciones.map((postulacion: any) => (
        <View key={postulacion.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.ofertaTitle}>{postulacion.oferta.title}</Text>
            <Text style={styles.sectorText}>{postulacion.oferta.sector}</Text>
          </View>

          <View style={styles.timelineContainer}>
            {postulacion.timeline.map((item: any, index: number) => (
              <TimelineItem
                key={index}
                status={item.status}
                date={item.date}
                notes={item.notes}
                isFirst={index === 0}
                isLast={index === postulacion.timeline.length - 1}
                isCompleted={true} // En este caso mostramos el histórico como completado
              />
            ))}
            
            {/* Si no está contratado ni rechazado, mostramos el siguiente paso pendiente como guía */}
            {postulacion.status !== 'CONTRATADO' && postulacion.status !== 'RECHAZADO' && (
              <View style={styles.pendingStep}>
                <View style={styles.pendingCircle} />
                <Text style={styles.pendingText}>Siguiente paso en evaluación...</Text>
              </View>
            )}
          </View>

          {postulacion.status === 'CONTRATADO' && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>¡Felicidades! Proceso Completado 🎉</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
    marginBottom: 20,
  },
  ofertaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  sectorText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  timelineContainer: {
    paddingLeft: 5,
  },
  pendingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    paddingBottom: 10,
  },
  pendingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    marginRight: 20,
    marginLeft: 2,
  },
  pendingText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  successBanner: {
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  successText: {
    color: '#2F855A',
    fontWeight: 'bold',
  }
});
