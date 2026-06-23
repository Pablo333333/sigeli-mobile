import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { PersistenceService } from '../../src/services/persistence';
import NetInfo from '@react-native-community/netinfo';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'read' | 'answered';
}

export default function ChatScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // ID de chat real obtenido de los parámetros o configurado dinámicamente
  // Por ahora usamos un ID que el backend reconozca o el del usuario para buscar sus chats
  const chatId = user?.id || 'default_chat';
  const employerName = 'Centro de Atención al Comunero';

  useEffect(() => {
    if (user) {
      loadMessages();
    }
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Cargar de persistencia local
      const localMessages = await PersistenceService.getChatMessages(chatId);
      if (localMessages.length > 0) {
        setMessages(localMessages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }

      // 2. Intentar cargar del backend si hay internet
      if (isOnline) {
        try {
          const response = await api.get(`/chat/${chatId}`);
          if (response.data && Array.isArray(response.data)) {
            const remoteMessages = response.data.map((m: any) => ({ 
              ...m, 
              timestamp: new Date(m.timestamp),
              // Asegurar que el status sea válido para la interfaz
              status: m.status || 'sent'
            }));
            setMessages(remoteMessages);
            await PersistenceService.saveChatMessages(chatId, remoteMessages);
          }
        } catch (e) {
          console.log('Error al cargar mensajes del backend');
        }
      }
    } catch (error) {
      console.error('Error loading messages', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: user.id,
      senderName: user.fullName,
      receiverId: 'admin_sigeli', // ID de destino real (Admin/Empresa)
      timestamp: new Date(),
      status: isOnline ? 'sent' : 'pending',
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    await PersistenceService.saveChatMessages(chatId, updatedMessages);

    try {
      if (isOnline) {
        await api.post('/chat/send', {
          chatId,
          text: newMessage.text,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
        });
        
        // Actualizar estado a enviado si fue exitoso
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      } else {
        // El interceptor de la API ya lo añadirá a la cola de sincronización
        // pero lo marcamos como pendiente localmente
        Alert.alert('Modo Offline', 'Tu mensaje se enviará automáticamente cuando recuperes conexión.');
      }
    } catch (error) {
      console.error('Error sending message', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje. Se reintentará automáticamente.');
    } finally {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Ionicons 
                name={item.status === 'pending' ? 'time-outline' : (item.status === 'read' || item.status === 'answered' ? 'checkmark-done' : 'checkmark')} 
                size={14} 
                color={item.status === 'read' || item.status === 'answered' ? Theme.colors.success : 'rgba(255,255,255,0.7)'} 
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="business" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{employerName}</Text>
            <Text style={styles.headerStatus}>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadMessages}>
          <Ionicons name="refresh" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputArea, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={28} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: Theme.colors.success,
    fontWeight: '500',
  },
  chatList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myText: {
    color: 'white',
  },
  theirText: {
    color: Theme.colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  myTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTime: {
    color: Theme.colors.textSecondary,
  },
  statusIcon: {
    marginLeft: 2,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachBtn: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
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
    elevation: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
