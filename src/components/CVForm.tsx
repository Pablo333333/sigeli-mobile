import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useCV } from '../hooks/useCV';

interface CVFormProps {
  userId: string;
  section: 'PERSONAL' | 'EXPERIENCIA' | 'EDUCACION' | 'HABILIDADES';
  initialData?: any;
  onSuccess?: () => void;
}

export const CVForm: React.FC<CVFormProps> = ({ userId, section, initialData, onSuccess }) => {
  const { updateExperiencia, updateEducacion, updateHabilidades } = useCV(userId);
  const [formData, setFormData] = useState(initialData || {});

  const validate = () => {
    if (section === 'EXPERIENCIA') {
      if (!formData.company || !formData.position || !formData.startDate) return false;
    }
    if (section === 'EDUCACION') {
      if (!formData.institucion || !formData.titulo || !formData.startDate) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (section === 'EXPERIENCIA') {
        await updateExperiencia.mutateAsync(formData);
      } else if (section === 'EDUCACION') {
        await updateEducacion.mutateAsync(formData);
      } else if (section === 'HABILIDADES') {
        await updateHabilidades.mutateAsync({ names: formData.names });
      }
      
      Alert.alert('Éxito', 'Información actualizada correctamente');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la información');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar {section.toLowerCase()}</Text>
      
      {section === 'EXPERIENCIA' && (
        <>
          <Text style={styles.label}>Empresa *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.company} 
            onChangeText={(text) => setFormData({...formData, company: text})} 
          />
          <Text style={styles.label}>Cargo *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.position} 
            onChangeText={(text) => setFormData({...formData, position: text})} 
          />
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.row}>
            {['MINERIA', 'GENERAL'].map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[styles.chip, formData.categoria === cat && styles.chipActive]}
                onPress={() => setFormData({...formData, categoria: cat})}
              >
                <Text style={[styles.chipText, formData.categoria === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Fecha Inicio * (YYYY-MM-DD)</Text>
          <TextInput 
            style={styles.input} 
            value={formData.startDate} 
            onChangeText={(text) => setFormData({...formData, startDate: text})} 
          />
        </>
      )}

      {section === 'EDUCACION' && (
        <>
          <Text style={styles.label}>Institución *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.institucion} 
            onChangeText={(text) => setFormData({...formData, institucion: text})} 
          />
          <Text style={styles.label}>Título *</Text>
          <TextInput 
            style={styles.input} 
            value={formData.titulo} 
            onChangeText={(text) => setFormData({...formData, titulo: text})} 
          />
          <Text style={styles.label}>Tipo de Estudio *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej: Universitario, Técnico"
            value={formData.tipoEstudio} 
            onChangeText={(text) => setFormData({...formData, tipoEstudio: text})} 
          />
        </>
      )}

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSave}
        disabled={updateExperiencia.isPending || updateEducacion.isPending}
      >
        <Text style={styles.saveButtonText}>
          {updateExperiencia.isPending || updateEducacion.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  chipText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#1e40af',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
