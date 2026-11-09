import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { TabParamList } from '../types';
import { queryAnatomyAiAssistant } from '../services/medicalAiService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  linkedOrganId?: string;
  suggestedTopics?: string[];
}

const renderBoldInline = (str: string, textColor: string) => {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={[styles.boldInlineText, { color: textColor }]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={i} style={{ color: textColor }}>
        {part}
      </Text>
    );
  });
};

const FormattedMessage: React.FC<{ text: string; isUser: boolean }> = ({
  text,
  isUser,
}) => {
  if (isUser) {
    return <Text style={styles.messageTextUser}>{text}</Text>;
  }

  const lines = text.split('\n');

  return (
    <View style={styles.formattedContainer}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={idx} style={{ height: 4 }} />;
        }

        // Horizontal divider
        if (trimmed === '---' || trimmed === '___') {
          return <View key={idx} style={styles.divider} />;
        }

        // Headings or prominent titles
        if (
          trimmed.startsWith('#') ||
          (trimmed.startsWith('**') &&
            trimmed.endsWith('**') &&
            !trimmed.slice(2, -2).includes('**'))
        ) {
          const headingText = trimmed
            .replace(/^#+\s*/, '')
            .replace(/^\*\*|\*\*$/g, '');
          return (
            <Text key={idx} style={styles.messageHeading}>
              {headingText}
            </Text>
          );
        }

        // Bullet point
        if (
          trimmed.startsWith('•') ||
          trimmed.startsWith('- ') ||
          trimmed.startsWith('* ')
        ) {
          const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletContent}>
                {renderBoldInline(bulletText, '#1E293B')}
              </Text>
            </View>
          );
        }

        // Normal paragraph
        return (
          <Text key={idx} style={styles.paragraph}>
            {renderBoldInline(trimmed, '#1E293B')}
          </Text>
        );
      })}
    </View>
  );
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome_1',
    sender: 'bot',
    text: "Hello! I am your Educational Anatomy Assistant for the 3D Human Anatomy Explorer.\n\nI can explain human organs, body systems, anatomical structures, terminology, and physiological mechanisms in clear, student-friendly terms.\n\nWhat anatomical structure or system would you like to explore today?",
    timestamp: 'Just now',
    suggestedTopics: [
      'Explain the chambers and valves of the heart',
      'What are the functions of the cerebral cortex lobes?',
      'How do the lungs and alveoli perform gas exchange?',
      'How do nephrons in the kidneys filter blood?',
    ],
  },
];

const QUICK_PROMPTS = [
  { label: '🫀 Heart & Circulation', query: 'How does blood flow through the heart chambers and valves?' },
  { label: '🧠 Brain & Nervous', query: 'What are the main functions of the cerebrum, cerebellum, and brainstem?' },
  { label: '🫁 Respiratory System', query: 'How does gas exchange occur across pulmonary alveoli?' },
  { label: '🦴 Skeletal Framework', query: 'What are the primary differences between the axial and appendicular skeletons?' },
  { label: '💪 Muscular Action', query: 'How do actin and myosin filaments cause muscle contraction?' },
  { label: '🫘 Kidney & Filtration', query: 'How do nephrons filter metabolic wastes from blood plasma?' },
];

export const ChatbotScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { selectOrgan } = useAnatomyStore();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 250);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {});

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    // Immediate synchronous lock: prevents duplicate triggers from double taps or simultaneous submit events
    if (isSubmittingRef.current || isTyping) return;

    const rawText = textToSend || inputText;
    const trimmed = rawText.trim();
    if (!trimmed) return;

    isSubmittingRef.current = true;
    setIsTyping(true);
    setInputText('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: trimmed,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      // Map prior conversation history for context continuity (excluding initial welcome banner)
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome_1')
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'assistant') as
            | 'user'
            | 'assistant',
          content: m.text,
        }));

      const res = await queryAnatomyAiAssistant(historyPayload, trimmed);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender: 'bot',
        text: res.text,
        timestamp: 'Just now',
        linkedOrganId: res.organId,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Anatomy AI consultation error:', err);
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: 'The educational assistant experienced a temporary network disruption. Please verify your internet connection or backend server and submit your question again.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      isSubmittingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const handleOpen3DOrgan = (organId: string) => {
    selectOrgan(organId);
    navigation.navigate('ExplorerTab', { targetOrganId: organId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatarBadge}>
            <MaterialCommunityIcons name="school-outline" size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Anatomy Educational Tutor</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Educational Knowledge Base Active</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handleClearChat}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Quick Topic Chips Strip */}
      <View style={styles.quickPromptsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsScroll}
        >
          {QUICK_PROMPTS.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.promptChip, isTyping && { opacity: 0.5 }]}
              onPress={() => handleSendMessage(p.query)}
              disabled={isTyping}
              activeOpacity={0.8}
            >
              <Text style={styles.promptChipText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Keyboard-aware Chat Container */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Scroll Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((item) => {
            const isUser = item.sender === 'user';
            return (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowBot,
                ]}
              >
                {!isUser && (
                  <View style={styles.botMiniAvatar}>
                    <MaterialCommunityIcons name="medical-bag" size={14} color="#0284C7" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.bubbleUser : styles.bubbleBot,
                  ]}
                >
                  <FormattedMessage text={item.text} isUser={isUser} />

                  {/* Optional 3D Viewport Deep-link Pill */}
                  {item.linkedOrganId && (
                    <TouchableOpacity
                      style={styles.organ3DLinkBtn}
                      onPress={() => handleOpen3DOrgan(item.linkedOrganId!)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="cube-scan" size={15} color="#0284C7" />
                      <Text style={styles.organ3DLinkText}>
                        Inspect {item.linkedOrganId.toUpperCase()} in 3D Atlas →
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Optional Suggested Prompt buttons */}
                  {item.suggestedTopics && item.suggestedTopics.length > 0 && (
                    <View style={styles.starterQuestionsWrap}>
                      <Text style={styles.starterHeading}>Suggested Inquiries:</Text>
                      {item.suggestedTopics.map((st, sIdx) => (
                        <TouchableOpacity
                          key={sIdx}
                          style={[styles.starterBtn, isTyping && { opacity: 0.5 }]}
                          onPress={() => handleSendMessage(st)}
                          disabled={isTyping}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="chat-question-outline" size={14} color="#0284C7" />
                          <Text style={styles.starterBtnText}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text
                    style={[
                      styles.timestampText,
                      isUser ? styles.timestampUser : styles.timestampBot,
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowBot]}>
              <View style={styles.botMiniAvatar}>
                <MaterialCommunityIcons name="medical-bag" size={14} color="#0284C7" />
              </View>
              <View style={[styles.messageBubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#0284C7" />
                <Text style={styles.typingText}>Anatomy Tutor is reviewing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="chat-processing-outline"
              size={20}
              color="#0284C7"
              style={{ marginLeft: 12 }}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Ask about organs, anatomy & body systems..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
              multiline={false}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
            />
            {inputText.length > 0 && (
              <TouchableOpacity
                onPress={() => setInputText('')}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length === 0 || isTyping
                ? styles.sendButtonDisabled
                : styles.sendButtonActive,
            ]}
            onPress={() => handleSendMessage()}
            disabled={inputText.trim().length === 0 || isTyping}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Educational Disclaimer Strip */}
        <View style={styles.disclaimerStrip}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#64748B" />
          <Text style={styles.disclaimerStripText}>
            Educational anatomy assistant for study only. Not for clinical diagnosis or treatment.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  quickPromptsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  keyboardAvoidingWrap: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botMiniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  formattedContainer: {
    gap: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  messageHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
    marginTop: 7,
  },
  bulletContent: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#1E293B',
  },
  paragraph: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#1E293B',
    marginVertical: 1,
  },
  boldInlineText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextBot: {
    color: '#0F172A',
  },
  organ3DLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  organ3DLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  starterQuestionsWrap: {
    marginTop: 12,
    gap: 6,
  },
  starterHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  starterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  starterBtnText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '500',
    flex: 1,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timestampBot: {
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 6,
    marginRight: 6,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#0284C7',
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  disclaimerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 5,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  disclaimerStripText: {
    fontSize: 10,
    color: '#64748B',
  },
});
