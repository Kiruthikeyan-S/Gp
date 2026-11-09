import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, BodySystemId } from '../types';
import { FLASHCARDS, Flashcard } from '../data/flashcardsData';
import { useAnatomyStore } from '../state/useAnatomyStore';

const SYSTEM_TABS: { id: BodySystemId | 'all'; label: string }[] = [
  { id: 'all', label: 'All Systems' },
  { id: 'circulatory', label: 'Circulatory' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'nervous', label: 'Nervous' },
  { id: 'skeletal', label: 'Skeletal' },
  { id: 'muscular', label: 'Muscular' },
  { id: 'digestive', label: 'Digestive' },
  { id: 'urinary', label: 'Urinary' },
  { id: 'endocrine', label: 'Endocrine' },
  { id: 'lymphatic', label: 'Lymphatic' },
  { id: 'reproductive', label: 'Reproductive' },
];

export const FlashcardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Flashcards'>>();
  const initialSystemId = route.params?.systemId || 'all';

  const [activeSystemId, setActiveSystemId] = useState<BodySystemId | 'all'>(initialSystemId);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const {
    knownFlashcardIds,
    reviewFlashcardIds,
    markFlashcardKnown,
    markFlashcardReview,
    recordDailyActivity,
  } = useAnatomyStore();

  const flipAnim = useRef(new Animated.Value(0)).current;

  // Filter flashcards by system
  const deck: Flashcard[] =
    activeSystemId === 'all'
      ? FLASHCARDS
      : FLASHCARDS.filter((c) => c.systemId === activeSystemId);

  const safeIndex = Math.min(currentIndex, Math.max(0, deck.length - 1));
  const currentCard = deck[safeIndex];

  const handleFlip = () => {
    recordDailyActivity();
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(false);
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    }
  };

  const resetFlip = () => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (safeIndex < deck.length - 1) {
      resetFlip();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      resetFlip();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMarkMastered = () => {
    if (!currentCard) return;
    markFlashcardKnown(currentCard.id);
    handleNext();
  };

  const handleMarkReview = () => {
    if (!currentCard) return;
    markFlashcardReview(currentCard.id);
    handleNext();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const isMastered = currentCard && knownFlashcardIds.includes(currentCard.id);
  const isReview = currentCard && reviewFlashcardIds.includes(currentCard.id);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Anatomy Flashcards</Text>
          <Text style={styles.headerSubtitle}>
            Active Recall & Spaced Repetition
          </Text>
        </View>

        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountText}>
            {deck.length > 0 ? `${safeIndex + 1}/${deck.length}` : '0/0'}
          </Text>
        </View>
      </View>

      {/* System Tabs Strip */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {SYSTEM_TABS.map((tab) => {
            const isActive = activeSystemId === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => {
                  setActiveSystemId(tab.id);
                  setCurrentIndex(0);
                  resetFlip();
                }}
              >
                <Text
                  style={[styles.tabChipText, isActive && styles.tabChipTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width:
                deck.length > 0
                  ? `${((safeIndex + 1) / deck.length) * 100}%`
                  : '0%',
            },
          ]}
        />
      </View>

      {/* Main Flashcard Container */}
      <View style={styles.cardArea}>
        {deck.length === 0 || !currentCard ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cards-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Cards Available</Text>
            <Text style={styles.emptySub}>
              Select another system to review flashcards.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleFlip}
            style={styles.cardFlipTouchable}
          >
            {/* Front Card */}
            <Animated.View
              style={[
                styles.flipCard,
                styles.frontCard,
                { transform: [{ rotateY: frontInterpolate }] },
                isFlipped && { pointerEvents: 'none' },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>
                    {currentCard.systemName.toUpperCase()}
                  </Text>
                </View>
                {isMastered && (
                  <View style={styles.masteredBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.masteredText}>Mastered</Text>
                  </View>
                )}
                {isReview && (
                  <View style={styles.reviewBadge}>
                    <Ionicons name="time" size={14} color="#F59E0B" />
                    <Text style={styles.reviewText}>Review</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardCenter}>
                <Text style={styles.cardQuestionText}>{currentCard.front}</Text>
                {currentCard.hint && (
                  <View style={styles.hintBox}>
                    <Ionicons name="bulb-outline" size={14} color="#0284C7" />
                    <Text style={styles.hintText}>{currentCard.hint}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBottomRow}>
                <Ionicons name="refresh" size={14} color="#64748B" />
                <Text style={styles.flipPrompt}>Tap card to flip for answer</Text>
              </View>
            </Animated.View>

            {/* Back Card */}
            <Animated.View
              style={[
                styles.flipCard,
                styles.backCard,
                { transform: [{ rotateY: backInterpolate }] },
                !isFlipped && { pointerEvents: 'none' },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.answerBadge}>
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  <Text style={styles.answerBadgeText}>ANSWER</Text>
                </View>
                {currentCard.keyStructure && (
                  <Text style={styles.keyStructureText} numberOfLines={1}>
                    {currentCard.keyStructure}
                  </Text>
                )}
              </View>

              <ScrollView
                style={styles.backScroll}
                contentContainerStyle={styles.backScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.answerText}>{currentCard.back}</Text>

                {currentCard.clinicalNote && (
                  <View style={styles.clinicalBox}>
                    <View style={styles.clinicalHeader}>
                      <MaterialCommunityIcons name="stethoscope" size={15} color="#0D9488" />
                      <Text style={styles.clinicalTitle}>CLINICAL CORRELATION</Text>
                    </View>
                    <Text style={styles.clinicalText}>
                      {currentCard.clinicalNote}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.cardBottomRow}>
                <Ionicons name="refresh" size={14} color="#64748B" />
                <Text style={styles.flipPrompt}>Tap to flip back</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.navBtn, safeIndex === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={safeIndex === 0}
        >
          <Ionicons name="chevron-back" size={22} color={safeIndex === 0 ? '#CBD5E1' : '#0F172A'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.reviewActionBtn]}
          onPress={handleMarkReview}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-circle-outline" size={18} color="#D97706" />
          <Text style={styles.reviewActionText}>Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.flipActionBtn]}
          onPress={handleFlip}
          activeOpacity={0.85}
        >
          <Ionicons name="sync" size={16} color="#0284C7" />
          <Text style={styles.flipActionText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.masteredActionBtn]}
          onPress={handleMarkMastered}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
          <Text style={styles.masteredActionText}>Known</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, safeIndex >= deck.length - 1 && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={safeIndex >= deck.length - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={safeIndex >= deck.length - 1 ? '#CBD5E1' : '#0F172A'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
  },
  headerCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  tabChipActive: {
    backgroundColor: '#0284C7',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0284C7',
  },
  cardArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFlipTouchable: {
    width: '100%',
    height: '100%',
    maxHeight: 460,
  },
  flipCard: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    justifyContent: 'space-between',
  },
  frontCard: {
    borderColor: '#BAE6FD',
  },
  backCard: {
    borderColor: '#BBF7D0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  systemBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  masteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  masteredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  cardCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cardQuestionText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 18,
  },
  hintText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  flipPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  answerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  keyStructureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    maxWidth: '55%',
  },
  backScroll: {
    flex: 1,
    marginVertical: 10,
  },
  backScrollContent: {
    paddingVertical: 6,
  },
  answerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 23,
  },
  clinicalBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginTop: 14,
  },
  clinicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clinicalTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  clinicalText: {
    fontSize: 12,
    color: '#134E4A',
    lineHeight: 17,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
  },
  reviewActionBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  flipActionBtn: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  flipActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  masteredActionBtn: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  masteredActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
});
