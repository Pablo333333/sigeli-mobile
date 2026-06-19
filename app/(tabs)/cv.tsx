import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import api from '../../src/services/api';
import { PersistenceService } from '../../src/services/persistence';
import { useAuth } from '../../src/context/AuthContext';
import { MultimediaPicker } from '../../src/components/MultimediaPicker';

interface CVData {
  // Paso 1
  fullName: string;
  dni: string;
  birthDate: string;
  nativeLanguage: 'Castellano' | 'Quechua';
  vulnerableGroup: string;
  // Paso 2
  educationLevel: string;
  titles: string;
  currentOccupation: string;
  // Paso 3
  miningExperienceYears: string;
  miningExperienceMonths: string;
  generalExperienceYears: string;
  softSkills: string;
  // Paso 4
  profilePhotoUri: string | null;
  dniFrontUri: string | null;
  dniBackUri: string | null;
  presentationVideoUri: string | null;
}

const INITIAL_DATA: CVData = {
  fullName: '',
  dni: '',
  birthDate: '',
  nativeLanguage: 'Castellano',
  vulnerableGroup: 'Ninguno',
  educationLevel: '',
  titles: '',
  currentOccupation: '',
  miningExperienceYears: '0',
  miningExperienceMonths: '0',
  generalExperienceYears: '0',
  softSkills: '',
  profilePhotoUri: null,
  dniFrontUri: null,
  dniBackUri: null,
  presentationVideoUri: null,
};

export default function CVScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CVData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCV();
  }, []);

  const loadCV = async () => {
    setLoading(true);
    try {
      // 1. Intentar cargar de persistencia local
      const localCV = await PersistenceService.getCV();
      if (localCV) {
        setFormData({ ...INITIAL_DATA, ...localCV });
      }

      // 2. Intentar cargar del backend si hay internet
      if (user?.id) {
        try {
          const response = await api.get(`/cv/${user.id}`);
          if (response.data) {
            setFormData({ ...INITIAL_DATA, ...response.data });
            await PersistenceService.saveCV(response.data);
          }
        } catch (e) {
          console.log('Error al cargar CV del backend, usando local');
        }
      }
    } catch (error) {
      console.error('Error loading CV', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CVData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return 'N/A';
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.dni || !formData.birthDate) {
        Alert.alert('Campos incompletos', 'Por favor complete Nombres, DNI y Fecha de Nacimiento.');
        return false;
      }
      if (formData.dni.length !== 8) {
        Alert.alert('DNI inválido', 'El DNI debe tener 8 dígitos.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.educationLevel || !formData.currentOccupation) {
        Alert.alert('Campos incompletos', 'Por favor complete el Nivel Educativo y su Ocupación Actual.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.generalExperienceYears) {
        Alert.alert('Campos incompletos', 'Por favor indique sus años de experiencia general.');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (validateStep()) {
      await PersistenceService.saveCV(formData);
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        // Preparar FormData para envío multimedia
        const data = new FormData();
        
        // Agregar campos de texto
        Object.keys(formData).forEach(key => {
          if (!key.endsWith('Uri') && !['miningExperienceYears', 'miningExperienceMonths', 'generalExperienceYears'].includes(key)) {
            data.append(key, (formData as any)[key]);
          }
        });

        // Calcular y agregar años de experiencia total
        const miningYears = parseFloat(formData.miningExperienceYears || '0');
        const miningMonths = parseFloat(formData.miningExperienceMonths || '0');
        const generalYears = parseFloat(formData.generalExperienceYears || '0');
        const totalYears = miningYears + (miningMonths / 12) + generalYears;
        data.append('yearsExperience', totalYears.toString());

        // Agregar archivos multimedia
        if (formData.profilePhotoUri) {
          data.append('profilePhoto', {
            uri: formData.profilePhotoUri,
            name: 'profile.jpg',
            type: 'image/jpeg',
          } as any);
        }
        if (formData.dniFrontUri) {
          data.append('dniFront', {
            uri: formData.dniFrontUri,
            name: 'dni_front.jpg',
            type: 'image/jpeg',
          } as any);
        }
        if (formData.dniBackUri) {
          data.append('dniBack', {
            uri: formData.dniBackUri,
            name: 'dni_back.jpg',
            type: 'image/jpeg',
          } as any);
        }
        if (formData.presentationVideoUri) {
          data.append('presentationVideo', {
            uri: formData.presentationVideoUri,
            name: 'presentation.mp4',
            type: 'video/mp4',
          } as any);
        }

        // Agregar userId al FormData para que el backend lo identifique
        data.append('userId', user.id);

        console.log('Intentando guardar CV en URL:', `${api.defaults.baseURL}/cv`);
        console.log('Método: POST');
        
        await api.post('/cv', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Éxito', 'Tu CV y archivos multimedia han sido guardados y sincronizados correctamente.');
      } else {
        await PersistenceService.saveCV(formData);
        Alert.alert('Guardado Local', 'CV guardado localmente. Se sincronizará cuando inicies sesión.');
      }
    } catch (error) {
      console.error('Error saving CV', error);
      Alert.alert('Aviso', 'No se pudo conectar con el servidor. Tu CV y rutas de archivos se guardaron localmente y se enviarán cuando recuperes conexión.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View 
            style={[
              styles.stepDot, 
              s <= step ? styles.stepDotActive : styles.stepDotInactive,
              s === step && styles.stepDotCurrent
            ]} 
          >
            <Text style={[styles.stepNumber, s <= step && styles.stepNumberActive]}>{s}</Text>
          </View>
          <Text style={[styles.stepLabel, s === step && styles.stepLabelActive]}>
            {s === 1 ? 'Personal' : s === 2 ? 'Formación' : s === 3 ? 'Experiencia' : 'Multimedia'}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Talento Comunal</Text>
            <Text style={styles.subtitle}>Completa tu perfil para acceder a mejores oportunidades.</Text>
          </View>

          {renderStepIndicator()}

          <View style={styles.formCard}>
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={[styles.sectionTitle, { color: Theme.colors.primary }]}>1. DATOS PERSONALES</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombres y Apellidos Completos</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.fullName}
                    onChangeText={(v) => updateField('fullName', v)}
                    placeholder="Ej. Juan Pérez"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>DNI</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.dni}
                      onChangeText={(v) => updateField('dni', v.replace(/[^0-9]/g, '').slice(0, 8))}
                      keyboardType="numeric"
                      placeholder="8 dígitos"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Fecha Nac. (AAAA-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.birthDate}
                      onChangeText={(v) => updateField('birthDate', v)}
                      placeholder="1990-05-20"
                    />
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={Theme.colors.secondary} />
                  <Text style={styles.infoText}>Edad calculada: <Text style={styles.bold}>{calculateAge(formData.birthDate)} años</Text></Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Idioma Nativo</Text>
                  <View style={styles.pickerRow}>
                    {['Castellano', 'Quechua'].map((lang) => (
                      <TouchableOpacity 
                        key={lang}
                        style={[styles.pickerOption, formData.nativeLanguage === lang && styles.pickerOptionActive]}
                        onPress={() => updateField('nativeLanguage', lang as any)}
                      >
                        <Text style={[styles.pickerOptionText, formData.nativeLanguage === lang && styles.pickerOptionTextActive]}>{lang}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>¿Pertenece a un Grupo Vulnerable?</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.vulnerableGroup}
                    onChangeText={(v) => updateField('vulnerableGroup', v)}
                    placeholder="Ej. Discapacidad, Madre soltera, etc."
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={[styles.sectionTitle, { color: Theme.colors.success }]}>2. FORMACIÓN ACADÉMICA</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nivel Educativo Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.educationLevel}
                    onChangeText={(v) => updateField('educationLevel', v)}
                    placeholder="Ej. Secundaria Completa, Técnico, Universitario"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Títulos o Certificaciones</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={formData.titles}
                    onChangeText={(v) => updateField('titles', v)}
                    multiline
                    placeholder="Ej. Certificado en Soldadura 3G, Licencia A3C"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ocupación Actual</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.currentOccupation}
                    onChangeText={(v) => updateField('currentOccupation', v)}
                    placeholder="Ej. Agricultor, Desempleado, Operador"
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.sectionTitle, { color: Theme.colors.warning }]}>3. EXPERIENCIA LABORAL</Text>
                
                <Text style={styles.subLabel}>Experiencia Específica en Minería</Text>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Años</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.miningExperienceYears}
                      onChangeText={(v) => updateField('miningExperienceYears', v.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Meses</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.miningExperienceMonths}
                      onChangeText={(v) => updateField('miningExperienceMonths', v.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Años de Experiencia General</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.generalExperienceYears}
                    onChangeText={(v) => updateField('generalExperienceYears', v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Habilidades Blandas</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={formData.softSkills}
                    onChangeText={(v) => updateField('softSkills', v)}
                    multiline
                    placeholder="Ej. Trabajo en equipo, Puntualidad, Liderazgo"
                  />
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={[styles.sectionTitle, { color: Theme.colors.secondary }]}>4. DOCUMENTACIÓN MULTIMEDIA</Text>
                
                <MultimediaPicker
                  label="Foto de Perfil (Para Validación Biométrica)"
                  type="image"
                  value={formData.profilePhotoUri}
                  onSelect={(uri) => updateField('profilePhotoUri', uri as any)}
                  icon="person-circle-outline"
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <MultimediaPicker
                      label="DNI Frontal"
                      type="image"
                      value={formData.dniFrontUri}
                      onSelect={(uri) => updateField('dniFrontUri', uri as any)}
                      icon="card-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MultimediaPicker
                      label="DNI Reverso"
                      type="image"
                      value={formData.dniBackUri}
                      onSelect={(uri) => updateField('dniBackUri', uri as any)}
                      icon="card-outline"
                    />
                  </View>
                </View>

                <MultimediaPicker
                  label="Video de Presentación o Habilidades"
                  type="video"
                  value={formData.presentationVideoUri}
                  onSelect={(uri) => updateField('presentationVideoUri', uri as any)}
                  icon="videocam-outline"
                />
              </View>
            )}

            <View style={styles.buttonRow}>
              {step > 1 && (
                <TouchableOpacity 
                  style={[styles.navButton, styles.backButton]} 
                  onPress={() => setStep(step - 1)}
                  disabled={saving}
                >
                  <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.navButton, styles.nextButton, step === 4 && styles.finishButton]} 
                onPress={handleNext}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {step < 4 ? 'Siguiente' : 'Finalizar y Enviar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={loadCV}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.updateButtonText}>Actualizar / Recargar Datos</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  title: {
    ...Theme.typography.h1,
    color: Theme.colors.primary,
  },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  stepDotActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  stepDotInactive: {
    backgroundColor: 'white',
    borderColor: Theme.colors.border,
  },
  stepDotCurrent: {
    borderColor: Theme.colors.secondary,
    transform: [{ scale: 1.1 }],
  },
  stepNumber: {
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stepContent: {
    minHeight: 350,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 12,
    marginTop: 10,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: Theme.colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
  },
  bold: {
    fontWeight: 'bold',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerOption: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  pickerOptionActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  pickerOptionText: {
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  pickerOptionTextActive: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.xl,
  },
  navButton: {
    flex: 1,
    height: 56,
    borderRadius: Theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  nextButton: {
    backgroundColor: Theme.colors.primary,
  },
  finishButton: {
    backgroundColor: Theme.colors.success,
  },
  backButtonText: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.textSecondary,
    paddingVertical: 16,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xl,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});
