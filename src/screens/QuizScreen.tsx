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
import { theme } from '../theme';
import { QUIZ_QUESTIONS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';

export const QuizScreen: React.FC = () => {
  const { quizStats, recordQuizScore } = useAnatomyStore();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  const currentQ = QUIZ_QUESTIONS[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setSessionCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalCorrect = sessionCorrectCount;
      recordQuizScore(finalCorrect, QUIZ_QUESTIONS.length);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anatomy Practice Quiz</Text>
        <Text style={styles.headerSubtitle}>
          Test your comprehension of organ functions, locations, and structures.
        </Text>
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
              {sessionCorrectCount} / {QUIZ_QUESTIONS.length}
            </Text>
            <Text style={styles.resultsPercent}>
              Score: {Math.round((sessionCorrectCount / QUIZ_QUESTIONS.length) * 100)}%
            </Text>
            <Text style={styles.resultsMessage}>
              {sessionCorrectCount === QUIZ_QUESTIONS.length
                ? 'Outstanding! You answered every question correctly.'
                : sessionCorrectCount >= 3
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
                <Text style={styles.progressQuestionText}>
                  Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
                </Text>
                <Text style={styles.progressScoreText}>
                  Correct: {sessionCorrectCount}
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
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
