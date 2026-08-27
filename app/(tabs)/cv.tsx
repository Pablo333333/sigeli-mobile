import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import api from '../../src/services/api';
import { PersistenceService } from '../../src/services/persistence';
import { useAuth } from '../../src/context/AuthContext';
import { MultimediaPicker } from '../../src/components/MultimediaPicker';
import { BigButton } from '../../src/components/BigButton';
import { canAccess } from '../../src/utils/roles';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';

type SectionId = 'hub' | 'personal' | 'educacion' | 'experiencia' | 'multimedia' | 'ia';

const NIVELES = [
  'Sin instrucción',
  'Primaria',
  'Secundaria',
  'Técnico',
  'Universitario',
  'Posgrado',
] as const;

function normalizeBirthDateInput(raw: string): string {
  return raw.replace(/[^\d]/g, '').slice(0, 8);
}

function parseBirthDate(birthDateStr: string): Date | null {
  const digits = birthDateStr.replace(/[^\d]/g, '');
  if (digits.length === 8) {
    const dd = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    const yyyy = Number(digits.slice(4, 8));
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd) return d;
  }
  const iso = new Date(birthDateStr);
  return isNaN(iso.getTime()) ? null : iso;
}

function formatBirthDateDisplay(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function calculateAge(birthDateStr: string): number | null {
  const d = parseBirthDate(birthDateStr);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/** DDMMYYYY o YYYY-MM-DD → ISO date string for API */
function toIsoDate(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 8) {
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    const d = parseBirthDate(digits);
    if (!d) return null;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return null;
}

function isoToDisplay(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

export default function CVScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canEditCv = canAccess(user?.role, 'cv');

  const [section, setSection] = useState<SectionId>('hub');
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal
  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<'Castellano' | 'Quechua'>('Castellano');
  const [currentOccupation, setCurrentOccupation] = useState('');
  const [softSkills, setSoftSkills] = useState('');

  // Educación form
  const [eduForm, setEduForm] = useState({
    id: '',
    institucion: '',
    titulo: '',
    tipoEstudio: 'Secundaria',
    startDate: '',
    endDate: '',
  });
  const [eduModal, setEduModal] = useState(false);

  // Experiencia form
  const [expForm, setExpForm] = useState({
    id: '',
    company: '',
    position: '',
    area: '',
    logros: '',
    categoria: 'GENERAL' as 'MINERIA' | 'GENERAL',
    startDate: '',
    endDate: '',
  });
  const [expModal, setExpModal] = useState(false);

  // Multimedia
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [dniFrontUri, setDniFrontUri] = useState<string | null>(null);
  const [dniBackUri, setDniBackUri] = useState<string | null>(null);

  // IA
  const [aiSummary, setAiSummary] = useState('');
  const [generatingIa, setGeneratingIa] = useState(false);

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  const loadCV = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const local = await PersistenceService.getCV();
      if (local) applyCv(local);
      const { data } = await api.get(`/cv/${user.id}`);
      if (data) {
        applyCv(data);
        await PersistenceService.saveCV(data);
      }
    } catch {
      // sin CV aún: ok
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const applyCv = (data: any) => {
    setCv(data);
    const meta = data?.multimedia?.profileMeta || {};
    setFullName(data?.user?.fullName || '');
    setDni(data?.user?.dni || '');
    setBirthDate(normalizeBirthDateInput(meta.birthDate || ''));
    setNativeLanguage(meta.nativeLanguage === 'Quechua' ? 'Quechua' : 'Castellano');
    setCurrentOccupation(meta.currentOccupation || data?.specialty || '');
    setSoftSkills(meta.softSkills || '');
    setAiSummary(data?.aiSummary || '');
    setProfilePhotoUri(data?.multimedia?.profilePhoto || null);
    setCoverPhotoUri(data?.multimedia?.coverPhoto || null);
    setDniFrontUri(data?.multimedia?.dniFront || null);
    setDniBackUri(data?.multimedia?.dniBack || null);
  };

  useFocusEffect(
    useCallback(() => {
      if (canEditCv) loadCV();
    }, [canEditCv, loadCV]),
  );

  if (!canEditCv) return <Redirect href="/(tabs)" />;

  const appendFile = (fd: FormData, key: string, uri: string | null, name: string) => {
    if (!uri || uri.startsWith('http')) return;
    fd.append(key, {
      uri: Platform.OS === 'android' && !uri.startsWith('file') ? `file://${uri}` : uri,
      name,
      type: name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
    } as any);
  };

  const savePersonal = async () => {
    if (!fullName.trim() || dni.replace(/\D/g, '').length !== 8) {
      Alert.alert('Completar', 'Nombre y DNI de 8 dígitos son obligatorios.');
      return;
    }
    if (!birthDate || birthDate.length !== 8) {
      Alert.alert('Fecha', 'Ingrese fecha de nacimiento en formato DDMMYYYY.');
      return;
    }
    if (age !== null && age < 18) {
      Alert.alert('Edad', 'Solo se registra CV de comuneros con 18 años o más.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('userId', user!.id);
      fd.append('fullName', fullName.trim());
      fd.append('dni', dni.replace(/\D/g, ''));
      fd.append('birthDate', birthDate);
      fd.append('nativeLanguage', nativeLanguage);
      fd.append('currentOccupation', currentOccupation);
      fd.append('specialty', currentOccupation);
      fd.append('softSkills', softSkills);
      if (aiSummary) fd.append('aiSummary', aiSummary);
      const { data } = await api.post('/cv', fd, {
        headers: { Accept: 'application/json' },
        transformRequest: (d, h) => {
          if (h) {
            delete (h as any)['Content-Type'];
            delete (h as any)['content-type'];
          }
          return d;
        },
      });
      applyCv(data);
      await PersistenceService.saveCV(data);
      Alert.alert('Guardado', 'Datos personales actualizados.');
      setSection('hub');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const saveEducacion = async () => {
    if (!eduForm.institucion || !eduForm.titulo || !eduForm.tipoEstudio) {
      Alert.alert('Completar', 'Institución, título y nivel son obligatorios.');
      return;
    }
    const start = toIsoDate(eduForm.startDate) || `${new Date().getFullYear()}-01-01`;
    const end = eduForm.endDate ? toIsoDate(eduForm.endDate) : undefined;
    setSaving(true);
    try {
      const { data } = await api.patch(`/cv/${user!.id}/educacion`, {
        ...(eduForm.id ? { id: eduForm.id } : {}),
        institucion: eduForm.institucion,
        titulo: eduForm.titulo,
        tipoEstudio: eduForm.tipoEstudio,
        startDate: start,
        endDate: end || undefined,
      });
      applyCv(data);
      setEduModal(false);
      Alert.alert('Guardado', 'Educación actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar educación.');
    } finally {
      setSaving(false);
    }
  };

  const saveExperiencia = async () => {
    if (!expForm.company || !expForm.position || !expForm.startDate) {
      Alert.alert('Completar', 'Empresa, cargo y fecha de inicio son obligatorios.');
      return;
    }
    const start = toIsoDate(expForm.startDate);
    if (!start) {
      Alert.alert('Fecha', 'Fecha inicio inválida. Use DDMMYYYY.');
      return;
    }
    const end = expForm.endDate ? toIsoDate(expForm.endDate) : undefined;
    setSaving(true);
    try {
      const { data } = await api.patch(`/cv/${user!.id}/experiencia`, {
        ...(expForm.id ? { id: expForm.id } : {}),
        company: expForm.company,
        position: expForm.position,
        area: expForm.area || undefined,
        logros: expForm.logros || undefined,
        categoria: expForm.categoria,
        startDate: start,
        endDate: end || undefined,
      });
      applyCv(data);
      setExpModal(false);
      Alert.alert('Guardado', 'Experiencia actualizada. Años recalculados automáticamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar experiencia.');
    } finally {
      setSaving(false);
    }
  };

  const saveMultimedia = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('userId', user!.id);
      if (fullName) fd.append('fullName', fullName);
      if (dni) fd.append('dni', dni);
      if (birthDate) fd.append('birthDate', birthDate);
      appendFile(fd, 'profilePhoto', profilePhotoUri, 'profile.jpg');
      appendFile(fd, 'coverPhoto', coverPhotoUri, 'cover.jpg');
      appendFile(fd, 'dniFront', dniFrontUri, 'dni-front.jpg');
      appendFile(fd, 'dniBack', dniBackUri, 'dni-back.jpg');
      const { data } = await api.post('/cv', fd, {
        headers: { Accept: 'application/json' },
        transformRequest: (d, h) => {
          if (h) {
            delete (h as any)['Content-Type'];
            delete (h as any)['content-type'];
          }
          return d;
        },
        timeout: 60000,
      });
      applyCv(data);
      await PersistenceService.saveCV(data);
      Alert.alert('Guardado', 'Fotos y portada actualizadas.');
      setSection('hub');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo subir multimedia.');
    } finally {
      setSaving(false);
    }
  };

  const generateIa = async () => {
    setGeneratingIa(true);
    try {
      const experiencia = Number(cv?.yearsExperience ?? 0) || 1;
      const especialidad = currentOccupation || cv?.specialty || 'oficios locales';
      const { data } = await api.post('/ia/generar-resumen', { especialidad, experiencia });
      const resumen = data?.resumen || '';
      setAiSummary(resumen);
      const fd = new FormData();
      fd.append('userId', user!.id);
      fd.append('aiSummary', resumen);
      if (especialidad) fd.append('specialty', especialidad);
      const saved = await api.post('/cv', fd, {
        headers: { Accept: 'application/json' },
        transformRequest: (d, h) => {
          if (h) {
            delete (h as any)['Content-Type'];
            delete (h as any)['content-type'];
          }
          return d;
        },
      });
      applyCv(saved.data);
      Alert.alert('Listo', 'Perfil con IA generado y guardado.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo generar el resumen.');
    } finally {
      setGeneratingIa(false);
    }
  };

  const educaciones = cv?.educaciones || [];
  const experiencias = cv?.experiencias || [];
  const yearsMining = Number(cv?.yearsExperienceMining ?? 0).toFixed(1);
  const yearsGeneral = Number(cv?.yearsExperienceGeneral ?? 0).toFixed(1);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const renderHub = () => (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      <Text style={styles.title}>Mi Perfil / CV</Text>
      <Text style={styles.subtitle}>
        Edita cada sección por separado. Fecha de nacimiento DDMMYYYY · edad automática · ≥ 18 años.
      </Text>

      {(coverPhotoUri || profilePhotoUri) && (
        <View style={styles.coverWrap}>
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverImg} />
          ) : (
            <View style={[styles.coverImg, styles.coverPlaceholder]} />
          )}
          {profilePhotoUri && (
            <Image source={{ uri: profilePhotoUri }} style={styles.avatar} />
          )}
        </View>
      )}

      {aiSummary ? (
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>Resumen IA</Text>
          <Text style={styles.aiText}>{aiSummary}</Text>
        </View>
      ) : null}

      <View style={styles.yearsRow}>
        <View style={styles.yearBox}>
          <Text style={styles.yearValue}>{yearsMining}</Text>
          <Text style={styles.yearLabel}>Años minería</Text>
        </View>
        <View style={styles.yearBox}>
          <Text style={styles.yearValue}>{yearsGeneral}</Text>
          <Text style={styles.yearLabel}>Años general</Text>
        </View>
      </View>

      {(Number(yearsMining) > 0 ||
        experiencias.some((e: any) => e.categoria === 'MINERIA')) && (
        <View style={styles.minaBadge}>
          <Ionicons name="hammer" size={18} color="#92400e" />
          <Text style={styles.minaBadgeText}>Trabajó en mina</Text>
        </View>
      )}

      {(
        [
          { id: 'personal' as const, title: 'Datos personales', icon: 'person', hint: 'Nombre, DNI, fecha nac., ocupación' },
          { id: 'educacion' as const, title: 'Educación (N títulos)', icon: 'school', hint: `${educaciones.length} registro(s)` },
          { id: 'experiencia' as const, title: 'Experiencia laboral', icon: 'briefcase', hint: `${experiencias.length} registro(s)` },
          { id: 'multimedia' as const, title: 'Foto y portada', icon: 'camera', hint: 'Perfil, portada, DNI' },
          { id: 'ia' as const, title: 'CV con IA', icon: 'sparkles', hint: 'Generar resumen profesional' },
        ] as const
      ).map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.sectionCard}
          onPress={() => setSection(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.sectionIcon}>
            <Ionicons name={item.icon as any} size={26} color={Theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.sectionHint}>{item.hint}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Theme.colors.border} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.sectionCard}
        onPress={() => router.push('/capacitaciones' as any)}
        activeOpacity={0.85}
      >
        <View style={styles.sectionIcon}>
          <Ionicons name="ribbon-outline" size={26} color={Theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Capacitaciones (historial CV)</Text>
          <Text style={styles.sectionHint}>Cursos y certificados del CV (no el programa Antamina)</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={Theme.colors.border} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sectionCard}
        onPress={() => router.push('/entrenamiento' as any)}
        activeOpacity={0.85}
      >
        <View style={styles.sectionIcon}>
          <Ionicons name="construct-outline" size={26} color={Theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Entrenamiento laboral</Text>
          <Text style={styles.sectionHint}>Encuesta Antamina / socio → indicador dashboard</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={Theme.colors.border} />
      </TouchableOpacity>
    </ScrollView>
  );

  const headerBack = (title: string) => (
    <View style={styles.sectionHeader}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => setSection('hub')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
    </View>
  );

  const renderPersonal = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        {headerBack('Datos personales')}
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        <Text style={styles.label}>DNI (8 dígitos)</Text>
        <TextInput
          style={styles.input}
          value={dni}
          keyboardType="number-pad"
          maxLength={8}
          onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))}
        />
        <Text style={styles.label}>Fecha nacimiento (DDMMYYYY)</Text>
        <TextInput
          style={styles.input}
          value={formatBirthDateDisplay(birthDate)}
          keyboardType="number-pad"
          placeholder="12032000"
          onChangeText={(t) => setBirthDate(normalizeBirthDateInput(t))}
        />
        {age !== null && (
          <Text style={[styles.ageHint, age < 18 && { color: Theme.colors.danger }]}>
            Edad automática: {age} años {age < 18 ? '(debe ser ≥ 18)' : ''}
          </Text>
        )}
        <Text style={styles.label}>Idioma nativo</Text>
        <View style={styles.row}>
          {(['Castellano', 'Quechua'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.chip, nativeLanguage === lang && styles.chipActive]}
              onPress={() => setNativeLanguage(lang)}
            >
              <Text style={[styles.chipText, nativeLanguage === lang && styles.chipTextActive]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Ocupación / especialidad</Text>
        <TextInput style={styles.input} value={currentOccupation} onChangeText={setCurrentOccupation} />
        <Text style={styles.label}>Habilidades blandas</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={softSkills}
          onChangeText={setSoftSkills}
        />
        <BigButton title="Guardar sección" onPress={savePersonal} loading={saving} large />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderEducacion = () => (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {headerBack('Educación')}
      <Text style={styles.subtitle}>Puedes registrar N títulos. Elige el nivel educativo con los selects.</Text>
      {educaciones.map((e: any) => (
        <TouchableOpacity
          key={e.id}
          style={styles.listCard}
          onPress={() => {
            setEduForm({
              id: e.id,
              institucion: e.institucion,
              titulo: e.titulo,
              tipoEstudio: e.tipoEstudio,
              startDate: isoToDisplay(e.startDate),
              endDate: isoToDisplay(e.endDate),
            });
            setEduModal(true);
          }}
        >
          <Text style={styles.listTitle}>{e.titulo}</Text>
          <Text style={styles.listMeta}>
            {e.tipoEstudio} · {e.institucion}
          </Text>
        </TouchableOpacity>
      ))}
      <BigButton
        title="Agregar título"
        variant="secondary"
        onPress={() => {
          setEduForm({
            id: '',
            institucion: '',
            titulo: '',
            tipoEstudio: 'Secundaria',
            startDate: '',
            endDate: '',
          });
          setEduModal(true);
        }}
        large
      />
    </ScrollView>
  );

  const renderExperiencia = () => (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {headerBack('Experiencia')}
      <Text style={styles.subtitle}>
        Cargo, empresa, área, logros y fechas. Los años de minería/general se calculan solos.
      </Text>
      <View style={styles.yearsRow}>
        <View style={styles.yearBox}>
          <Text style={styles.yearValue}>{yearsMining}</Text>
          <Text style={styles.yearLabel}>Minería (auto)</Text>
        </View>
        <View style={styles.yearBox}>
          <Text style={styles.yearValue}>{yearsGeneral}</Text>
          <Text style={styles.yearLabel}>General (auto)</Text>
        </View>
      </View>
      {experiencias.map((e: any) => (
        <TouchableOpacity
          key={e.id}
          style={styles.listCard}
          onPress={() => {
            setExpForm({
              id: e.id,
              company: e.company,
              position: e.position,
              area: e.area || '',
              logros: e.logros || '',
              categoria: e.categoria || 'GENERAL',
              startDate: isoToDisplay(e.startDate),
              endDate: isoToDisplay(e.endDate),
            });
            setExpModal(true);
          }}
        >
          <Text style={styles.listTitle}>
            {e.position} · {e.company}
          </Text>
          <Text style={styles.listMeta}>
            {e.categoria}
            {e.area ? ` · ${e.area}` : ''}
          </Text>
        </TouchableOpacity>
      ))}
      <BigButton
        title="Agregar experiencia"
        variant="secondary"
        onPress={() => {
          setExpForm({
            id: '',
            company: '',
            position: '',
            area: '',
            logros: '',
            categoria: 'GENERAL',
            startDate: '',
            endDate: '',
          });
          setExpModal(true);
        }}
        large
      />
    </ScrollView>
  );

  const renderMultimedia = () => (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {headerBack('Foto y portada')}
      <Text style={styles.subtitle}>Toma la foto y pulsa Guardar en cada picker; luego Guardar sección.</Text>
      <MultimediaPicker
        label="Foto de perfil"
        type="image"
        value={profilePhotoUri}
        onSelect={setProfilePhotoUri}
        icon="person-circle-outline"
      />
      <View style={{ height: 12 }} />
      <MultimediaPicker
        label="Portada del CV"
        type="image"
        value={coverPhotoUri}
        onSelect={setCoverPhotoUri}
        icon="image-outline"
      />
      <View style={{ height: 12 }} />
      <MultimediaPicker
        label="DNI frente"
        type="image"
        value={dniFrontUri}
        onSelect={setDniFrontUri}
        icon="card-outline"
      />
      <View style={{ height: 12 }} />
      <MultimediaPicker
        label="DNI dorso"
        type="image"
        value={dniBackUri}
        onSelect={setDniBackUri}
        icon="card-outline"
      />
      <View style={{ height: 16 }} />
      <BigButton title="Guardar multimedia" onPress={saveMultimedia} loading={saving} large />
    </ScrollView>
  );

  const renderIa = () => (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {headerBack('CV con IA')}
      <Text style={styles.subtitle}>
        Genera un resumen profesional a partir de tu especialidad y años de experiencia.
      </Text>
      {!!aiSummary && (
        <View style={styles.aiCard}>
          <Text style={styles.aiText}>{aiSummary}</Text>
        </View>
      )}
      <BigButton
        title={generatingIa ? 'Generando…' : 'Generar resumen con IA'}
        onPress={generateIa}
        loading={generatingIa}
        large
        icon={<Ionicons name="sparkles" size={20} color="#fff" />}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {section === 'hub' && renderHub()}
      {section === 'personal' && renderPersonal()}
      {section === 'educacion' && renderEducacion()}
      {section === 'experiencia' && renderExperiencia()}
      {section === 'multimedia' && renderMultimedia()}
      {section === 'ia' && renderIa()}

      {/* Modal educación */}
      <Modal visible={eduModal} animationType="slide" transparent onRequestClose={() => setEduModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <Text style={styles.modalTitle}>{eduForm.id ? 'Editar título' : 'Nuevo título'}</Text>
              <Text style={styles.label}>Nivel educativo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {NIVELES.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.chip, eduForm.tipoEstudio === n && styles.chipActive]}
                    onPress={() => setEduForm({ ...eduForm, tipoEstudio: n })}
                  >
                    <Text style={[styles.chipText, eduForm.tipoEstudio === n && styles.chipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.label}>Institución *</Text>
              <TextInput
                style={styles.input}
                value={eduForm.institucion}
                onChangeText={(t) => setEduForm({ ...eduForm, institucion: t })}
              />
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={eduForm.titulo}
                onChangeText={(t) => setEduForm({ ...eduForm, titulo: t })}
              />
              <Text style={styles.label}>Inicio (DDMMYYYY)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={formatBirthDateDisplay(eduForm.startDate)}
                onChangeText={(t) =>
                  setEduForm({ ...eduForm, startDate: normalizeBirthDateInput(t) })
                }
              />
              <Text style={styles.label}>Fin (DDMMYYYY, opcional)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={formatBirthDateDisplay(eduForm.endDate)}
                onChangeText={(t) =>
                  setEduForm({ ...eduForm, endDate: normalizeBirthDateInput(t) })
                }
              />
              <BigButton title="Guardar" onPress={saveEducacion} loading={saving} large />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEduModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal experiencia */}
      <Modal visible={expModal} animationType="slide" transparent onRequestClose={() => setExpModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Text style={styles.modalTitle}>
                  {expForm.id ? 'Editar experiencia' : 'Nueva experiencia'}
                </Text>
                <Text style={styles.label}>Empresa *</Text>
                <TextInput
                  style={styles.input}
                  value={expForm.company}
                  onChangeText={(t) => setExpForm({ ...expForm, company: t })}
                />
                <Text style={styles.label}>Cargo *</Text>
                <TextInput
                  style={styles.input}
                  value={expForm.position}
                  onChangeText={(t) => setExpForm({ ...expForm, position: t })}
                />
                <Text style={styles.label}>Área</Text>
                <TextInput
                  style={styles.input}
                  value={expForm.area}
                  onChangeText={(t) => setExpForm({ ...expForm, area: t })}
                  placeholder="Operaciones, Mantenimiento…"
                />
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.row}>
                  {(['MINERIA', 'GENERAL'] as const).map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, expForm.categoria === c && styles.chipActive]}
                      onPress={() => setExpForm({ ...expForm, categoria: c })}
                    >
                      <Text style={[styles.chipText, expForm.categoria === c && styles.chipTextActive]}>
                        {c === 'MINERIA' ? 'Minería' : 'General'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Inicio (DDMMYYYY) *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={formatBirthDateDisplay(expForm.startDate)}
                  onChangeText={(t) =>
                    setExpForm({ ...expForm, startDate: normalizeBirthDateInput(t) })
                  }
                />
                <Text style={styles.label}>Fin (DDMMYYYY, vacío = actual)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={formatBirthDateDisplay(expForm.endDate)}
                  onChangeText={(t) =>
                    setExpForm({ ...expForm, endDate: normalizeBirthDateInput(t) })
                  }
                />
                <Text style={styles.label}>Logros</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  value={expForm.logros}
                  onChangeText={(t) => setExpForm({ ...expForm, logros: t })}
                />
                <BigButton title="Guardar" onPress={saveExperiencia} loading={saving} large />
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setExpModal(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Theme.spacing.md, gap: 8 },
  title: { ...Theme.typography.h1, fontSize: 28, color: Theme.colors.primary },
  subtitle: { color: Theme.colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  coverWrap: { marginBottom: 16, alignItems: 'center' },
  coverImg: { width: '100%', height: 120, borderRadius: 16, backgroundColor: Theme.colors.muted },
  coverPlaceholder: { backgroundColor: Theme.colors.primary + '22' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginTop: -36,
    borderWidth: 3,
    borderColor: Theme.colors.surface,
  },
  aiCard: {
    backgroundColor: Theme.colors.accentSoft,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 12,
  },
  aiLabel: { fontWeight: '700', color: Theme.colors.accent, marginBottom: 6 },
  aiText: { color: Theme.colors.text, fontSize: 14, lineHeight: 20 },
  yearsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  minaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    minHeight: 44,
  },
  minaBadgeText: { fontWeight: '700', color: '#92400e', fontSize: 14 },
  yearBox: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  yearValue: { fontSize: 22, fontWeight: '800', color: Theme.colors.primary },
  yearLabel: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 4 },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Theme.touch.min,
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: Theme.colors.text },
  sectionHint: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  sectionHeaderTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.text },
  label: { fontWeight: '600', color: Theme.colors.text, marginBottom: 6, marginTop: 8, fontSize: 15 },
  input: {
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: Theme.touch.input,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surface,
    marginBottom: 8,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
  ageHint: { fontSize: 14, fontWeight: '600', color: Theme.colors.success, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { fontWeight: '600', color: Theme.colors.textSecondary },
  chipTextActive: { color: '#fff' },
  listCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 10,
    minHeight: Theme.touch.min,
    justifyContent: 'center',
  },
  listTitle: { fontWeight: '700', color: Theme.colors.text, fontSize: 15 },
  listMeta: { color: Theme.colors.textSecondary, marginTop: 4, fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,28,36,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text, marginBottom: 8 },
  cancelBtn: { alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: 8 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600', fontSize: 16 },
});
