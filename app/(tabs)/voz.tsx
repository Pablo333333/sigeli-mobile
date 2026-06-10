import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  language?: string;
}

export default function VozScreen() {
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
  const [idioma, setIdioma] = useState<'ES' | 'QU'>('ES');
  const flatListRef = useRef<FlatList>(null);

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
      // Consumir el endpoint de voz que definimos en el backend
      const { data } = await api.post('/voz/consulta', {
        usuarioId: 'user-test-id', // En producción vendría del Auth
        mensaje: text,
        idioma: idioma,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.respuesta,
        sender: 'ai',
        timestamp: new Date(),
        language: data.idioma,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, tuve un problema al procesar tu consulta. Por favor, intenta de nuevo.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Scroll al final
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      {/* Selector de Idioma */}
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
          <ActivityIndicator color="#4A90E2" />
          <Text style={styles.loadingText}>Interpretando voz...</Text>
        </View>
      )}

      {/* Input y Micrófono */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu consulta..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        
        <TouchableOpacity 
          style={styles.micButton}
          onPress={() => sendMessage(inputText)}
          onLongPress={() => alert('Grabando audio... (Simulación)')}
        >
          <Ionicons 
            name={inputText.trim() ? "send" : "mic"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  langBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#D1D5DA',
  },
  langBtnActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  langText: {
    color: '#586069',
    fontWeight: '600',
  },
  langTextActive: {
    color: '#fff',
  },
  chatContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#24292E',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#586069',
    fontSize: 14,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1E4E8',
  },
  input: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});
