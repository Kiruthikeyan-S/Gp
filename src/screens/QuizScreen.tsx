import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../theme';
import { QUIZ_QUESTIONS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { RootStackParamList, BodySystemId } from '../types';

const SYSTEM_QUIZ_FILTERS: { id: BodySystemId | 'all'; label: string }[] = [
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

export const QuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Quiz'>>();
  const initialSystemId = route.params?.systemId || 'all';

  const { quizStats, recordQuizScore, recordDailyActivity, recordTopicResult } = useAnatomyStore();

  const [activeSystemId, setActiveSystemId] = useState<BodySystemId | 'all'>(initialSystemId);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  const filteredQuestions =
    activeSystemId === 'all'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter((q) => q.systemId === activeSystemId);

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQ = filteredQuestions[safeIndex] || QUIZ_QUESTIONS[0];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    recordDailyActivity();
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (currentQ.systemId) {
      recordTopicResult(currentQ.systemId, isCorrect);
    }
    if (isCorrect) {
      setSessionCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (safeIndex < filteredQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalCorrect = sessionCorrectCount;
      recordQuizScore(finalCorrect, filteredQuestions.length);
      setIsQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSessionCorrectCount(0);
    setIsQuizCompleted(false);
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'advanced':
        return '#EF4444';
      case 'intermediate':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                (navigation as any).navigate('MainTabs');
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Anatomy Practice Quiz</Text>
            <Text style={styles.headerSubtitle}>
              Clinical MCQs, instant rationale & difficulty levels
            </Text>
          </View>
        </View>

        {/* System Filter Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {SYSTEM_QUIZ_FILTERS.map((f) => {
            const isActive = activeSystemId === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 16,
                    backgroundColor: isActive ? '#0284C7' : '#F1F5F9',
                  },
                ]}
                onPress={() => {
                  setActiveSystemId(f.id);
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsAnswered(false);
                  setSessionCorrectCount(0);
                  setIsQuizCompleted(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isActive ? '#FFFFFF' : '#475569',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isQuizCompleted ? (
          /* Quiz Results View */
          <View style={styles.resultsCard}>
            <View style={styles.trophyCircle}>
              <MaterialCommunityIcons name="trophy" size={54} color={theme.colors.warning} />
            </View>
            <Text style={styles.resultsTitle}>Quiz Completed!</Text>
            <Text style={styles.resultsScore}>
              {sessionCorrectCount} / {filteredQuestions.length}
            </Text>
            <Text style={styles.resultsPercent}>
              Score: {Math.round((sessionCorrectCount / filteredQuestions.length) * 100)}%
            </Text>
            <Text style={styles.resultsMessage}>
              {sessionCorrectCount === filteredQuestions.length
                ? 'Outstanding! You answered every question correctly.'
                : sessionCorrectCount >= Math.ceil(filteredQuestions.length * 0.6)
                ? 'Great job! You have a solid grasp of human anatomy.'
                : 'Good attempt! Review the lessons and try again to improve.'}
            </Text>

            {/* Lifetime stats */}
            <View style={styles.statsBox}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{quizStats.attempts}</Text>
                <Text style={styles.statLabel}>Total Quizzes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{quizStats.bestScorePercent}%</Text>
                <Text style={styles.statLabel}>Best Score</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.restartBtnText}>Retake Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Active Question View */
          <View>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.progressQuestionText}>
                    Question {safeIndex + 1} of {filteredQuestions.length}
                  </Text>
                  {currentQ.difficulty && (
                    <View
                      style={{
                        backgroundColor: `${getDifficultyColor(currentQ.difficulty)}15`,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '800',
                          color: getDifficultyColor(currentQ.difficulty),
                          letterSpacing: 0.5,
                        }}
                      >
                        {currentQ.difficulty.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.progressScoreText}>
                  Correct: {sessionCorrectCount}
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((safeIndex + 1) / filteredQuestions.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Question Card */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{currentQ.question}</Text>

              {/* Options */}
              <View style={styles.optionsList}>
                {currentQ.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === currentQ.correctIndex;

                  const isCorrectAnswer = isAnswered && isCorrect;
                  const isWrongAnswer = isAnswered && isSelected && !isCorrect;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionItem,
                        isCorrectAnswer && styles.optionCorrect,
                        isWrongAnswer && styles.optionWrong,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectOption(index)}
                      disabled={isAnswered}
                    >
                      <View style={styles.optionLetterBox}>
                        <Text style={styles.optionLetter}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isCorrectAnswer && styles.optionTextCorrect,
                          isWrongAnswer && styles.optionTextWrong,
                        ]}
                      >
                        {option}
                      </Text>
                      {isCorrectAnswer && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={theme.colors.success}
                          style={styles.feedbackIcon}
                        />
                      )}
                      {isWrongAnswer && (
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color={theme.colors.danger}
                          style={styles.feedbackIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Immediate Explanation Feedback */}
              {isAnswered && (
                <View style={styles.explanationBox}>
                  <View style={styles.explanationHeader}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.explanationTitle}>Anatomical Explanation</Text>
                  </View>
                  <Text style={styles.explanationBody}>{currentQ.explanation}</Text>
                </View>
              )}
            </View>

            {/* Next Button */}
            {isAnswered && (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {currentIndex === QUIZ_QUESTIONS.length - 1 ? 'Show Results' : 'Next Question'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressQuestionText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  progressScoreText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.cardBorder,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  questionText: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
  },
  optionCorrect: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
  },
  optionWrong: {
    backgroundColor: theme.colors.dangerLight,
    borderColor: theme.colors.danger,
  },
  optionLetterBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  optionLetter: {
    ...theme.typography.small,
    color: theme.colors.textPrimary,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  optionTextCorrect: {
    color: '#065F46',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#991B1B',
    fontWeight: '600',
  },
  feedbackIcon: {
    marginLeft: 8,
  },
  explanationBox: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explanationTitle: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  explanationBody: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
    ...theme.shadows.card,
  },
  nextBtnText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.hover,
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  resultsTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  resultsScore: {
    ...theme.typography.h1,
    fontSize: 36,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  resultsPercent: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  resultsMessage: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.cardBorder,
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
  },
  restartBtnText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
