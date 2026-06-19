import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
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

export const MultimediaPicker: React.FC<MultimediaPickerProps> = ({ 
  label, 
  type, 
  value, 
  onSelect,
  icon 
}) => {
  const handlePick = async () => {
    const { status } = type === 'image' 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync(); // También pedimos cámara para video

    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para esta función.');
      return;
    }

    let result;
    if (type === 'image') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60, // 1 minuto máximo
      });
    }

    if (!result.canceled) {
      onSelect(result.assets[0].uri);
    }
  };

  const handleRemove = () => {
    onSelect(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {value ? (
        <View style={styles.previewContainer}>
          {type === 'image' ? (
            <Image source={{ uri: value }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.videoPlaceholder]}>
              <Ionicons name="videocam" size={40} color={Theme.colors.primary} />
              <Text style={styles.videoText}>Video capturado</Text>
            </View>
          )}
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
            <Ionicons name="close-circle" size={24} color={Theme.colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.pickerBtn} onPress={handlePick}>
          <Ionicons name={icon as any} size={32} color={Theme.colors.textSecondary} />
          <Text style={styles.pickerText}>Capturar {type === 'image' ? 'Foto' : 'Video'}</Text>
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
    height: 150,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  preview: {
    width: '100%',
    height: '100%',
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
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  }
});
