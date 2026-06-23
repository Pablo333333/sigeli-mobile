import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { usePostulaciones } from '../../src/hooks/usePostulaciones';
import { TimelineItem } from '../../src/components/TimelineItem';
import { useAuth } from '../../src/context/AuthContext';

export default function PostulacionesScreen() {
  const { user } = useAuth();
  const { data: postulaciones, isLoading, error } = usePostulaciones(user?.id || '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>Cargando tus procesos...</Text>
      </View>
    );
  }

  // Si hay un error explícito o el formato recibido no es un array válido, mostramos el estado vacío
  if (error || !postulaciones || !Array.isArray(postulaciones) || postulaciones.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>No se encontraron postulaciones activas.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainTitle}>Mis Procesos de Selección</Text>
      
      {/* Usamos optional chaining y validación de array por seguridad extrema */}
      {Array.isArray(postulaciones) && postulaciones.map((postulacion: any) => (
        <View key={postulacion?.id || Math.random().toString()} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.ofertaTitle}>{postulacion?.oferta?.title || 'Oferta sin título'}</Text>
            <Text style={styles.sectorText}>{postulacion?.oferta?.sector || 'Sector no especificado'}</Text>
          </View>

          <View style={styles.timelineContainer}>
            {/* Validamos que exista timeline y sea un array antes de recorrerlo */}
            {Array.isArray(postulacion?.timeline) ? postulacion.timeline.map((item: any, index: number) => (
              <TimelineItem
                key={index}
                status={item?.status || 'Pendiente'}
                date={item?.date || 'Fecha no disponible'}
                notes={item?.notes || ''}
                isFirst={index === 0}
                isLast={index === (postulacion.timeline?.length || 1) - 1}
                isCompleted={true}
              />
            )) : (
              <Text style={styles.pendingText}>Iniciando proceso...</Text>
            )}
            
            {/* Si no está contratado ni rechazado, mostramos el siguiente paso pendiente */}
            {postulacion?.status !== 'CONTRATADO' && postulacion?.status !== 'RECHAZADO' && (
              <View style={styles.pendingStep}>
                <View style={styles.pendingCircle} />
                <Text style={styles.pendingText}>Siguiente paso en evaluación...</Text>
              </View>
            )}
          </View>

          {postulacion?.status === 'CONTRATADO' && (
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
    backgroundColor: '#F7FAFC',
  },
  infoText: {
    fontSize: 16,
    color: '#718096',
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