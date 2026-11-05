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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { theme } from '../theme';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { TabParamList } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  linkedOrganId?: string;
  suggestedTopics?: string[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome_1',
    sender: 'bot',
    text: "Hello! I am your 3D Anatomy AI Assistant. Ask me anything about human anatomy, physiological systems, organ functions, or blood circulation.\n\nType your question below or tap a quick topic to begin!",
    timestamp: 'Just now',
    suggestedTopics: [
      'How does the heart pump blood?',
      'Explain gas exchange in the lungs',
      'What are the 4 lobes of the brain?',
      'How do kidneys filter blood?',
    ],
  },
];

const QUICK_PROMPTS = [
  { label: '❤️ Cardiac Cycle', query: 'How does the heart pump blood through the 4 chambers?' },
  { label: '🫁 Lung Alveoli', query: 'How does gas exchange work in the lung alveoli?' },
  { label: '🧠 Brain Lobes', query: 'What are the main functions of the cerebral cortex lobes?' },
  { label: '🫘 Nephron Filtration', query: 'How do kidneys filter blood plasma into urine?' },
  { label: '🧪 Stomach Acid', query: 'Why does the stomach produce hydrochloric acid?' },
  { label: '💪 Muscle Contraction', query: 'How do skeletal muscles and myofibers contract?' },
];

function generateMedicalAnswer(query: string): { text: string; organId?: string } {
  const q = query.toLowerCase();

  if (q.includes('heart') || q.includes('cardiac') || q.includes('chamber') || q.includes('pump') || q.includes('valve')) {
    return {
      organId: 'heart',
      text: "The human heart operates as a synchronized dual-pump system:\n\n• Right Atrium & Ventricle: Receive deoxygenated blood from the vena cavae and pump it to the pulmonary artery for oxygenation in the lungs.\n• Left Atrium & Ventricle: Receive oxygen-rich blood from pulmonary veins and pump it out through the aorta at systemic arterial pressure (~120/80 mmHg).\n• Valves: Mitral, tricuspid, aortic, and pulmonary valves prevent backflow, producing the characteristic 'lub-dub' heart sounds.",
    };
  }

  if (q.includes('lung') || q.includes('breath') || q.includes('respirat') || q.includes('alveol') || q.includes('trachea')) {
    return {
      organId: 'lungs',
      text: "Gas exchange occurs across the thin respiratory membrane of over 300 million alveoli:\n\n• Inhalation: The diaphragm contracts downward, expanding thoracic volume and pulling atmospheric oxygen through the trachea and bronchi into alveolar sacs.\n• Diffusion: Oxygen diffuses across the 0.5-micron alveolar-capillary barrier into red blood cell hemoglobin, while metabolic carbon dioxide (CO2) diffuses out to be exhaled.\n• Capacity: Adults breathe ~12–16 times per minute, exchanging roughly 500 mL of air per tidal breath.",
    };
  }

  if (q.includes('brain') || q.includes('cortex') || q.includes('neuron') || q.includes('nerve') || q.includes('cerebell')) {
    return {
      organId: 'brain',
      text: "The human brain contains ~86 billion neurons organized into specialized structural regions:\n\n• Frontal Lobe: Executive planning, motor control, reasoning, and speech production (Broca's area).\n• Parietal Lobe: Somatosensory perception (touch, pressure, pain) and 3D spatial mapping.\n• Temporal Lobe: Auditory processing, language comprehension (Wernicke's area), and memory encoding (hippocampus).\n• Occipital Lobe: Primary visual cortex for image, color, and motion processing.\n• Cerebellum: Fine motor coordination, balance, and muscular reflexes.",
    };
  }

  if (q.includes('kidney') || q.includes('nephron') || q.includes('urine') || q.includes('ureter') || q.includes('renal')) {
    return {
      organId: 'kidneys',
      text: "Each kidney contains approximately 1 million microscopic filtering units called nephrons:\n\n• Glomerular Filtration: Blood enters under high arterial pressure; plasma water, glucose, electrolytes, and urea pass into Bowman's capsule.\n• Tubular Reabsorption: Proximal and distal convoluted tubules actively reclaim ~99% of filtered water and essential salts back into peritubular capillaries.\n• Secretion & Excretion: Metabolic wastes, drugs, and surplus hydrogen ions are secreted into the collecting duct, forming urine delivered via ureters to the urinary bladder.",
    };
  }

  if (q.includes('stomach') || q.includes('gastric') || q.includes('digest') || q.includes('acid') || q.includes('pylor')) {
    return {
      organId: 'stomach',
      text: "The stomach performs both mechanical churning and enzymatic chemical digestion:\n\n• Gastric Acid (HCl): Parietal cells secrete hydrochloric acid (pH 1.5–2.5), denaturing dietary proteins and sterilizing ingested microorganisms.\n• Pepsin Enzyme: Chief cells secrete inactive pepsinogen, cleaved by acid into active pepsin to break protein peptide chains.\n• Protective Mucus: Surface goblet cells secrete thick bicarbonate-rich mucus that shields the stomach lining from self-digestion.\n• Chyme: Peristaltic waves meter acidified chyme through the pyloric sphincter into the duodenum.",
    };
  }

  if (q.includes('liver') || q.includes('hepatic') || q.includes('bile') || q.includes('gallbladder')) {
    return {
      organId: 'liver',
      text: "The liver is the body's largest internal metabolic processing hub (>500 distinct vital functions):\n\n• Detoxification: Hepatocytes process metabolic byproducts, drugs, alcohol, and ammonia (converted to urea).\n• Bile Synthesis: Continuously secretes bile containing bile salts, stored in the gallbladder, to emulsify dietary lipids.\n• Energy Storage: Stores surplus glucose as glycogen and releases it under glucagon stimulation to maintain blood sugar balance.\n• Protein Synthesis: Manufactures essential plasma proteins including albumin and blood clotting factors.",
    };
  }

  if (q.includes('muscle') || q.includes('muscular') || q.includes('contraction') || q.includes('myosin') || q.includes('actin')) {
    return {
      text: "Muscular contraction operates via the sliding filament mechanism:\n\n• Neuromuscular Junction: Motor neurons release acetylcholine (ACh), generating an action potential across the muscle fiber membrane (sarcolemma).\n• Calcium Release: Sarcoplasmic reticulum floods calcium ions (Ca²⁺) into sarcomeres, binding troponin and freeing actin binding sites.\n• Power Stroke: Myosin head cross-bridges hydrolyze ATP and pull actin filaments inward, shortening each sarcomere and generating mechanical tension.\n• Antagonistic Pairs: Muscles work in opposing groups (e.g. biceps flexors vs triceps extensors) anchored to bones via collagenous tendons.",
    };
  }

  if (q.includes('bone') || q.includes('skelet') || q.includes('joint') || q.includes('calcium') || q.includes('rib')) {
    return {
      text: "The human skeletal system comprises 206 bones divided into two major components:\n\n• Axial Skeleton (80 bones): Skull, vertebral column (24 vertebrae + sacrum/coccyx), and thoracic ribcage (12 pairs of ribs + sternum), protecting vital brain, spinal cord, and cardiopulmonary organs.\n• Appendicular Skeleton (126 bones): Shoulder girdles, pelvic girdle, upper limbs, and lower limbs facilitating locomotion and manipulation.\n• Hematopoiesis: Red bone marrow in spongy bone generates erythrocytes (RBCs), leukocytes (WBCs), and platelets.",
    };
  }

  return {
    text: `Great question regarding: "${query}".\n\nIn human physiology, all 11 organ systems operate as an integrated homeostatic network. For example, neural and endocrine regulators continuously adjust heart rate, blood pressure, respiratory ventilation, and electrolyte balances in response to metabolic demands.\n\n💡 Tip: You can inspect this anatomical structure in real 3D using the 3D Atlas tab!`,
  };
}

export const ChatbotScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { selectOrgan, selectSystem } = useAnatomyStore();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const rawText = textToSend || inputText;
    const trimmed = rawText.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulated medical reasoning delay
    setTimeout(() => {
      const generated = generateMedicalAnswer(trimmed);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: generated.text,
        timestamp: 'Just now',
        linkedOrganId: generated.organId,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 750);
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
            <MaterialCommunityIcons name="robot-confused-outline" size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Anatomy AI Assistant</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Medical Knowledge Base Active</Text>
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
              style={styles.promptChip}
              onPress={() => handleSendMessage(p.query)}
              activeOpacity={0.8}
            >
              <Text style={styles.promptChipText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
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
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.messageTextUser : styles.messageTextBot,
                  ]}
                >
                  {item.text}
                </Text>

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
                        style={styles.starterBtn}
                        onPress={() => handleSendMessage(st)}
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
              <Text style={styles.typingText}>Consulting Medical Index...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="chat-processing-outline"
              size={20}
              color="#94A3B8"
              style={{ marginLeft: 12 }}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Ask any anatomy or organ question..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
              multiline={false}
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
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
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
});
