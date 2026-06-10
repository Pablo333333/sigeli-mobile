import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface ContratoFormProps {
  postulacionId: string;
  userId: string;
  onSuccess?: () => void;
}

export const ContratoForm: React.FC<ContratoFormProps> = ({ postulacionId, userId, onSuccess }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara para la validación biométrica.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.takePictureAsync({ base64: true, quality: 0.5 });
      const biometricToken = photo.base64; // En una implementación real, esto sería un hash del rostro

      // Intentar formalizar el contrato con el token biométrico
      await api.post('/contratos', {
        postulacionId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // +1 año
        salary: 2500, // Ejemplo
        regimenLaboral: '728',
        biometricToken,
      });

      Alert.alert('Éxito', 'Contrato formalizado correctamente tras validación biométrica.');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = error.response?.status === 401 
        ? 'Fallo en la validación biométrica. El rostro no coincide.' 
        : 'Error al formalizar el contrato.';
      Alert.alert('Error de Seguridad', msg);
    } finally {
      setIsProcessing(false);
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formalización de Contrato</Text>
      <Text style={styles.subtitle}>Para proceder, requerimos una validación de identidad biométrica facial.</Text>

      {!isCapturing ? (
        <TouchableOpacity style={styles.mainButton} onPress={() => setIsCapturing(true)}>
          <Ionicons name="scan-circle" size={48} color="#fff" />
          <Text style={styles.mainButtonText}>Iniciar Validación Facial</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing="front"
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.overlay}>
              <View style={styles.faceGuide} />
            </View>
          </CameraView>
          
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={handleCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setIsCapturing(false)}
              disabled={isProcessing}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  text: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mainButton: {
    backgroundColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    elevation: 4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  cameraContainer: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 125,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  cancelButton: {
    position: 'absolute',
    right: 20,
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
