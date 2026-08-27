import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { useLocalSearchParams } from 'expo-router';

type Conversacion = {
  postulacionId: string;
  puesto: string;
  empresa?: string;
  candidato: string;
  estadoProceso: string;
  ultimoMensaje?: { texto: string; fecha: string; de: string } | null;
  pendientes: number;
};

type Mensaje = {
  id: string;
  mensaje: string;
  fecha: string;
  estado: 'PENDIENTE' | 'LEIDO' | 'RESPONDIDO';
  esMio: boolean;
  remitente: { id: string; fullName: string; role: string };
  destinatario: { id: string; fullName: string; role: string };
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  LEIDO: 'Leído',
  RESPONDIDO: 'Respondido',
};

export default function ChatScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ postulacionId?: string }>();

  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    typeof params.postulacionId === 'string' ? params.postulacionId : null,
  );
  const [headerTitle, setHeaderTitle] = useState('Comunicaciones');
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadConversaciones = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/chat/conversaciones');
      setConversaciones(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setConversaciones([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMensajes = useCallback(async (postulacionId: string) => {
    setLoadingChat(true);
    try {
      const res = await api.get(`/chat/postulacion/${postulacionId}`);
      setMessages(Array.isArray(res.data?.mensajes) ? res.data.mensajes : []);
      const puesto = res.data?.postulacion?.oferta?.title;
      const candidato = res.data?.postulacion?.candidato?.fullName;
      setHeaderTitle(puesto ? `${puesto}${candidato ? ` · ${candidato}` : ''}` : 'Seguimiento');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 150);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudieron cargar los mensajes.');
      setSelectedId(null);
    } finally {
      setLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    loadConversaciones();
  }, [loadConversaciones]);

  useEffect(() => {
    if (selectedId) {
      loadMensajes(selectedId);
    }
  }, [selectedId, loadMensajes]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedId || !user) return;
    setSending(true);
    const texto = inputText.trim();
    setInputText('');
    try {
      const res = await api.post('/chat/send', {
        postulacionId: selectedId,
        mensaje: texto,
      });
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      loadConversaciones();
    } catch (e: any) {
      setInputText(texto);
      Alert.alert('Error', e.response?.data?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Mensaje }) => {
    const isMe = item.esMio;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMe && <Text style={styles.senderName}>{item.remitente?.fullName}</Text>}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {item.mensaje}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
              {new Date(item.fecha).toLocaleString([], {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isMe && (
              <Text style={[styles.estadoChip, isMe && styles.estadoChipMine]}>
                {ESTADO_LABEL[item.estado] || item.estado}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!selectedId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat de seguimiento</Text>
          <Text style={styles.headerSub}>Evidencia por postulación (fecha, remitente, estado)</Text>
        </View>
        {loadingList ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={conversaciones}
            keyExtractor={(item) => item.postulacionId}
            refreshControl={
              <RefreshControl refreshing={loadingList} onRefresh={loadConversaciones} />
            }
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No hay postulaciones con canal de comunicación aún. Postula a una oferta para
                iniciar el seguimiento.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convCard}
                onPress={() => setSelectedId(item.postulacionId)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.convTitle}>{item.puesto}</Text>
                  <Text style={styles.convMeta}>
                    {item.candidato}
                    {item.empresa ? ` · ${item.empresa}` : ''}
                  </Text>
                  {item.ultimoMensaje && (
                    <Text style={styles.convPreview} numberOfLines={1}>
                      {item.ultimoMensaje.de}: {item.ultimoMensaje.texto}
                    </Text>
                  )}
                </View>
                {item.pendientes > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.pendientes}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.border} />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={() => setSelectedId(null)} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Text style={styles.headerStatus}>Trazabilidad del proceso</Text>
          </View>
          <TouchableOpacity onPress={() => selectedId && loadMensajes(selectedId)}>
            <Ionicons name="refresh" size={22} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loadingChat ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin mensajes. Escribe el primero para dejar evidencia.</Text>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputArea, { paddingBottom: 12 + insets.bottom }]}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje de seguimiento..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="send" size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  headerSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 4 },
  headerStatus: { fontSize: 12, color: Theme.colors.success, fontWeight: '500' },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  convTitle: { fontWeight: '700', fontSize: 15, color: Theme.colors.text },
  convMeta: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
  convPreview: { fontSize: 12, color: '#64748b', marginTop: 6 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  empty: {
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  chatList: { padding: 16, paddingBottom: 20 },
  messageWrapper: { marginBottom: 14, maxWidth: '85%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  theirMessageWrapper: { alignSelf: 'flex-start' },
  senderName: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  myText: { color: 'white' },
  theirText: { color: Theme.colors.text },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 6,
  },
  messageTime: { fontSize: 10 },
  myTime: { color: 'rgba(255,255,255,0.75)' },
  theirTime: { color: Theme.colors.textSecondary },
  estadoChip: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  estadoChipMine: { color: 'rgba(255,255,255,0.9)' },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: Theme.colors.text,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },
});
