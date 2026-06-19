import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Theme } from '../../src/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  language?: string;
}

export default function VozScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Rimaykullayki (Saludos). Soy tu asistente de SIGELI. ¿En qué puedo ayudarte hoy?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [idioma, setIdioma] = useState<'ES' | 'QU'>('ES');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Solicitar permisos de audio al montar
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso al micrófono para el asistente de voz.');
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setRecording(null);
    setIsLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        await sendAudioMessage(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAudioMessage = async (uri: string) => {
    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);
    formData.append('usuarioId', user?.id || 'anon');
    formData.append('idioma', idioma);

    try {
      const { data } = await api.post('/voz/transcribir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Añadir mensaje del usuario (transcrito)
      const userMessage: Message = {
        id: Date.now().toString(),
        text: data.original || 'Consulta por voz',
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Procesar respuesta de la IA
      handleAIResponse(data);
    } catch (error) {
      console.error('Error sending audio', error);
      showErrorMessage();
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/voz/consulta', {
        usuarioId: user?.id || 'anon',
        mensaje: text,
        idioma: idioma,
      });

      handleAIResponse(data);
    } catch (error) {
      showErrorMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIResponse = (data: any) => {
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: data.respuesta,
      sender: 'ai',
      timestamp: new Date(),
      language: data.idioma,
    };

    setMessages((prev) => [...prev, aiMessage]);
    
    // Reproducir respuesta por voz (TTS)
    Speech.speak(data.respuesta, {
      language: idioma === 'QU' ? 'es-PE' : 'es-ES', // Quechua no siempre está disponible, usamos español con acento local como fallback
      pitch: 1.0,
      rate: 0.9,
    });

    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const showErrorMessage = () => {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Lo siento, tuve un problema al procesar tu consulta. Por favor, intenta de nuevo.',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text style={[
        styles.messageText,
        item.sender === 'user' ? styles.userText : styles.aiText
      ]}>
        {item.text}
      </Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={[styles.langBtn, idioma === 'ES' && styles.langBtnActive]}
            onPress={() => setIdioma('ES')}
          >
            <Text style={[styles.langText, idioma === 'ES' && styles.langTextActive]}>Español</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, idioma === 'QU' && styles.langBtnActive]}
            onPress={() => setIdioma('QU')}
          >
            <Text style={[styles.langText, idioma === 'QU' && styles.langTextActive]}>Quechua</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Procesando...</Text>
          </View>
        )}

        <View style={[styles.inputArea, { paddingBottom: 16 + insets.bottom }]}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu consulta..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.micButton, 
              isRecording && styles.micButtonActive,
              !inputText.trim() && !isRecording && styles.micButtonIdle
            ]}
            onPress={inputText.trim() ? () => sendMessage(inputText) : undefined}
            onPressIn={!inputText.trim() ? startRecording : undefined}
            onPressOut={!inputText.trim() ? stopRecording : undefined}
          >
            <Ionicons 
              name={inputText.trim() ? "send" : (isRecording ? "stop" : "mic")} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
        
        {isRecording && (
          <View style={styles.recordingOverlay}>
            <View style={styles.recordingPulse}>
              <Ionicons name="mic" size={48} color="white" />
            </View>
            <Text style={styles.recordingText}>Escuchando...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
  },
  langBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  langBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  langText: {
    color: '#64748B',
    fontWeight: '700',
  },
  langTextActive: {
    color: '#fff',
  },
  chatContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#1E293B',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 120,
    color: '#1E293B',
  },
  micButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  micButtonIdle: {
    backgroundColor: Theme.colors.secondary,
  },
  micButtonActive: {
    backgroundColor: Theme.colors.danger,
    transform: [{ scale: 1.1 }],
  },
  recordingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  recordingPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
