import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface MultimediaPickerProps {
  label: string;
  type: 'image' | 'video';
  value: string | null;
  onSelect: (uri: string | null) => void;
  icon: keyof typeof Ionicons.prototype.name;
}

/**
 * Captura multimedia con confirmación explícita ("Guardar foto/video")
 * para evitar el caso "solo toma la foto y no guarda".
 */
export const MultimediaPicker: React.FC<MultimediaPickerProps> = ({ 
  label, 
  type, 
  value, 
  onSelect,
  icon 
}) => {
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    // Si el valor externo cambia (reload CV), limpia borrador pendiente
    setPendingUri(null);
  }, [value]);

  const handlePick = async () => {
    setCapturing(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para esta función.');
        return;
      }

      const result = type === 'image'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          })
        : await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.7,
            videoMaxDuration: 60,
          });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPendingUri(result.assets[0].uri);
      }
    } finally {
      setCapturing(false);
    }
  };

  const handleSave = () => {
    if (!pendingUri) return;
    onSelect(pendingUri);
    setPendingUri(null);
  };

  const handleDiscardPending = () => {
    setPendingUri(null);
  };

  const handleRemove = () => {
    onSelect(null);
    setPendingUri(null);
  };

  const previewUri = pendingUri || value;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {previewUri ? (
        <View style={styles.previewContainer}>
          {type === 'image' ? (
            <Image source={{ uri: previewUri }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.videoPlaceholder]}>
              <Ionicons name="videocam" size={40} color={Theme.colors.primary} />
              <Text style={styles.videoText}>
                {pendingUri ? 'Video listo para guardar' : 'Video capturado'}
              </Text>
            </View>
          )}

          {pendingUri ? (
            <View style={styles.pendingActions}>
              <TouchableOpacity style={styles.discardBtn} onPress={handleDiscardPending}>
                <Text style={styles.discardBtnText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text style={styles.saveBtnText}>
                  Guardar {type === 'image' ? 'foto' : 'video'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.savedActions}>
              <TouchableOpacity style={styles.retakeChip} onPress={handlePick}>
                <Ionicons name="camera-outline" size={16} color={Theme.colors.primary} />
                <Text style={styles.retakeChipText}>Cambiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <Ionicons name="close-circle" size={24} color={Theme.colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.pickerBtn} onPress={handlePick} disabled={capturing}>
          {capturing ? (
            <ActivityIndicator color={Theme.colors.primary} />
          ) : (
            <>
              <Ionicons name={icon as any} size={32} color={Theme.colors.textSecondary} />
              <Text style={styles.pickerText}>Capturar {type === 'image' ? 'Foto' : 'Video'}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  pickerBtn: {
    height: 120,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pickerText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    minHeight: 150,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#fff',
  },
  preview: {
    width: '100%',
    height: 150,
  },
  videoPlaceholder: {
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  videoText: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  removeBtn: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  savedActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    left: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeChipText: {
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  discardBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardBtnText: {
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
