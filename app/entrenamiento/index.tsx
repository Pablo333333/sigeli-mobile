import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { BigButton } from '../../src/components/BigButton';

interface Encuesta {
  capacitadoPorAntamina: boolean;
  anioParticipacion?: number | null;
  socioOrganizador?: string | null;
  nombrePrograma?: string | null;
  horas?: number | null;
  temas?: string | null;
  obtuvoCertificado?: boolean;
  observaciones?: string | null;
}

interface CursoPrograma {
  id: string;
  title: string;
  description: string;
  sector: string;
  socioOrganizador?: string | null;
  usuarios?: { userId: string; progress: number; isCertified: boolean }[];
}

/**
 * Programa de entrenamiento laboral (Antamina / socio).
 * Encuesta SI/NO + cursos tipo PROGRAMA_ENTRENAMIENTO → indicador del dashboard.
 */
export default function EntrenamientoLaboralScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursos, setCursos] = useState<CursoPrograma[]>([]);
  const [form, setForm] = useState<Encuesta>({
    capacitadoPorAntamina: false,
    anioParticipacion: undefined,
    socioOrganizador: 'Antamina',
    nombrePrograma: '',
    horas: undefined,
    temas: '',
    obtuvoCertificado: false,
    observaciones: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [encuestaRes, cursosRes] = await Promise.all([
        api.get('/capacitaciones/encuesta/mia').catch(() => ({ data: null })),
        api.get('/capacitaciones', { params: { tipo: 'PROGRAMA_ENTRENAMIENTO' } }),
      ]);
      if (encuestaRes.data) {
        setForm({
          capacitadoPorAntamina: !!encuestaRes.data.capacitadoPorAntamina,
          anioParticipacion: encuestaRes.data.anioParticipacion ?? undefined,
          socioOrganizador: encuestaRes.data.socioOrganizador || 'Antamina',
          nombrePrograma: encuestaRes.data.nombrePrograma || '',
          horas: encuestaRes.data.horas ?? undefined,
          temas: encuestaRes.data.temas || '',
          obtuvoCertificado: !!encuestaRes.data.obtuvoCertificado,
          observaciones: encuestaRes.data.observaciones || '',
        });
      }
      setCursos(Array.isArray(cursosRes.data) ? cursosRes.data : []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cargar el programa de entrenamiento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const saveEncuesta = async () => {
    setSaving(true);
    try {
      await api.put('/capacitaciones/encuesta/mia', {
        capacitadoPorAntamina: form.capacitadoPorAntamina,
        anioParticipacion: form.capacitadoPorAntamina
          ? form.anioParticipacion
            ? Number(form.anioParticipacion)
            : undefined
          : undefined,
        socioOrganizador: form.capacitadoPorAntamina ? form.socioOrganizador || undefined : undefined,
        nombrePrograma: form.capacitadoPorAntamina ? form.nombrePrograma || undefined : undefined,
        horas: form.capacitadoPorAntamina && form.horas != null ? Number(form.horas) : undefined,
        temas: form.capacitadoPorAntamina ? form.temas || undefined : undefined,
        obtuvoCertificado: form.capacitadoPorAntamina ? !!form.obtuvoCertificado : false,
        observaciones: form.observaciones || undefined,
      });
      Alert.alert(
        'Guardado',
        form.capacitadoPorAntamina
          ? 'Tu participación en el programa de entrenamiento se registró. Contará en el dashboard.'
          : 'Encuesta guardada (sin participación en el programa).',
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar la encuesta.');
    } finally {
      setSaving(false);
    }
  };

  const inscrito = (curso: CursoPrograma) =>
    curso.usuarios?.some((u) => u.userId === user?.id);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Entrenamiento laboral</Text>
          </View>
          <Text style={styles.subtitle}>
            Programa de Antamina y socios. Esta encuesta alimenta el indicador del dashboard
            (participantes). Es distinto del historial de capacitaciones de tu CV.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Encuesta</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>¿Has sido capacitado por Antamina / programa de entrenamiento?</Text>
              <Switch
                value={form.capacitadoPorAntamina}
                onValueChange={(v) => setForm((f) => ({ ...f, capacitadoPorAntamina: v }))}
                trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '88' }}
                thumbColor={form.capacitadoPorAntamina ? Theme.colors.primary : '#f4f4f5'}
              />
            </View>

            {form.capacitadoPorAntamina && (
              <View style={styles.fields}>
                <Text style={styles.label}>Año de participación</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="Ej. 2024"
                  value={form.anioParticipacion != null ? String(form.anioParticipacion) : ''}
                  onChangeText={(t) =>
                    setForm((f) => ({
                      ...f,
                      anioParticipacion: t ? parseInt(t.replace(/\D/g, '').slice(0, 4), 10) : undefined,
                    }))
                  }
                />

                <Text style={styles.label}>Socio / organizador</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Antamina, Ferreyros…"
                  value={form.socioOrganizador || ''}
                  onChangeText={(t) => setForm((f) => ({ ...f, socioOrganizador: t }))}
                />

                <Text style={styles.label}>Nombre del programa</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Programa de entrenamiento laboral"
                  value={form.nombrePrograma || ''}
                  onChangeText={(t) => setForm((f) => ({ ...f, nombrePrograma: t }))}
                />

                <Text style={styles.label}>Horas</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="Ej. 120"
                  value={form.horas != null ? String(form.horas) : ''}
                  onChangeText={(t) =>
                    setForm((f) => ({
                      ...f,
                      horas: t ? parseInt(t.replace(/\D/g, ''), 10) : undefined,
                    }))
                  }
                />

                <Text style={styles.label}>Temas</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  multiline
                  placeholder="Temas tratados"
                  value={form.temas || ''}
                  onChangeText={(t) => setForm((f) => ({ ...f, temas: t }))}
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>¿Obtuviste certificado?</Text>
                  <Switch
                    value={!!form.obtuvoCertificado}
                    onValueChange={(v) => setForm((f) => ({ ...f, obtuvoCertificado: v }))}
                    trackColor={{ false: Theme.colors.border, true: Theme.colors.primary + '88' }}
                    thumbColor={form.obtuvoCertificado ? Theme.colors.primary : '#f4f4f5'}
                  />
                </View>
              </View>
            )}

            <BigButton
              title="Guardar encuesta"
              onPress={saveEncuesta}
              loading={saving}
              disabled={saving}
              style={{ marginTop: 16 }}
            />
          </View>

          <Text style={styles.sectionTitle}>Cursos del programa</Text>
          <Text style={styles.sectionHint}>
            Cursos oficiales del programa (no son el historial del CV).
          </Text>

          {cursos.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay cursos del programa publicados.</Text>
          ) : (
            cursos.map((c) => (
              <View key={c.id} style={styles.cursoCard}>
                <Text style={styles.cursoTitle}>{c.title}</Text>
                <Text style={styles.cursoDesc} numberOfLines={2}>
                  {c.description}
                </Text>
                <View style={styles.cursoMeta}>
                  <Text style={styles.badge}>{c.socioOrganizador || c.sector}</Text>
                  {inscrito(c) && (
                    <Text style={[styles.badge, { backgroundColor: Theme.colors.success + '22', color: Theme.colors.success }]}>
                      Inscrito
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.linkOut}
            onPress={() => router.push('/capacitaciones' as any)}
          >
            <Text style={styles.linkOutText}>Ver capacitaciones del CV (historial) →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    padding: Theme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  title: { ...Theme.typography.h1, color: Theme.colors.primary, flex: 1, fontSize: 22 },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  content: { padding: Theme.spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: 'white',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: Theme.touch.min,
    marginBottom: 8,
  },
  switchLabel: { flex: 1, fontSize: 15, color: Theme.colors.text, fontWeight: '600', lineHeight: 20 },
  fields: { marginTop: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  sectionHint: { fontSize: 13, color: Theme.colors.textSecondary, marginBottom: 12 },
  emptyText: { color: Theme.colors.textSecondary, marginBottom: 16 },
  cursoCard: {
    backgroundColor: 'white',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 10,
  },
  cursoTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  cursoDesc: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  cursoMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  linkOut: { marginTop: 16, paddingVertical: 14, minHeight: Theme.touch.min, justifyContent: 'center' },
  linkOutText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 15 },
});
