import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../src/theme';
import api from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { canAccess } from '../src/utils/roles';
import { Redirect } from 'expo-router';

export default function PostularComuneroScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [comuneros, setComuneros] = useState<any[]>([]);
  const [ofertaId, setOfertaId] = useState('');
  const [userId, setUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const allowed = canAccess(user?.role, 'postularTerceros');

  useEffect(() => {
    if (allowed) {
      load();
    }
  }, [allowed]);

  const load = async () => {
    setLoading(true);
    try {
      const [ofRes, comRes] = await Promise.all([
        api.get('/ofertas'),
        api.get('/postulaciones/comuneros'),
      ]);
      setOfertas(Array.isArray(ofRes.data) ? ofRes.data : []);
      setComuneros(Array.isArray(comRes.data) ? comRes.data : []);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) {
    return <Redirect href="/(tabs)/postulaciones" />;
  }

  const handleSubmit = async () => {
    if (!ofertaId || !userId) {
      Alert.alert('Campos incompletos', 'Seleccione oferta y comunero.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/postulaciones', { ofertaId, userId, notes: notes || undefined });
      Alert.alert('Éxito', 'El CV del comunero fue enviado a la oferta.', [
        { text: 'Ver seguimiento', onPress: () => router.replace('/(tabs)/postulaciones') },
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.message;
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Postular comunero</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          La Directiva Comunal puede enviar el CV de un comunero a una convocatoria vigente con un
          clic.
        </Text>

        <Text style={styles.label}>Oferta laboral</Text>
        <View style={styles.chips}>
          {ofertas.map((o) => (
            <TouchableOpacity
              key={o.id}
              style={[styles.chip, ofertaId === o.id && styles.chipActive]}
              onPress={() => setOfertaId(o.id)}
            >
              <Text style={[styles.chipText, ofertaId === o.id && styles.chipTextActive]}>
                {o.title}
              </Text>
              <Text style={styles.chipSub}>{o.company || o.companyName}</Text>
            </TouchableOpacity>
          ))}
          {ofertas.length === 0 && (
            <Text style={styles.empty}>No hay ofertas vigentes.</Text>
          )}
        </View>

        <Text style={styles.label}>Comunero</Text>
        <View style={styles.chips}>
          {comuneros.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, userId === c.id && styles.chipActive]}
              onPress={() => setUserId(c.id)}
            >
              <Text style={[styles.chipText, userId === c.id && styles.chipTextActive]}>
                {c.fullName}
              </Text>
              <Text style={styles.chipSub}>DNI {c.dni}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ej. Prioridad del sector..."
          multiline
        />

        <TouchableOpacity
          style={[styles.submit, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Enviar CV a la oferta</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  content: { padding: 16, paddingBottom: 40 },
  hint: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  chips: { gap: 8, marginBottom: 12 },
  chip: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 12,
  },
  chipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '12',
  },
  chipText: { fontWeight: '600', color: Theme.colors.text },
  chipTextActive: { color: Theme.colors.primary },
  chipSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
  empty: { color: Theme.colors.textSecondary },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submit: {
    backgroundColor: Theme.colors.primary,
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
