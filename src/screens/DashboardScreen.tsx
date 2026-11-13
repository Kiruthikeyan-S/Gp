import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { BODY_SYSTEMS, LESSONS } from '../data/anatomyData';
import { FLASHCARDS } from '../data/flashcardsData';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const {
    completedLessonIds,
    bookmarkedOrganIds,
    knownFlashcardIds,
    reviewFlashcardIds,
    streakDays,
    quizStats,
    topicStats,
    resetProgress,
  } = useAnatomyStore();

  const totalLessons = LESSONS.length;
  const lessonsCompletedCount = completedLessonIds.length;
  const lessonProgressPercent = totalLessons > 0 ? Math.round((lessonsCompletedCount / totalLessons) * 100) : 0;

  const totalFlashcards = FLASHCARDS.length;
  const flashcardsKnownCount = knownFlashcardIds.length;
  const flashcardProgressPercent = totalFlashcards > 0 ? Math.round((flashcardsKnownCount / totalFlashcards) * 100) : 0;

  const avgQuizScore = quizStats.totalAnswered > 0
    ? Math.round((quizStats.correctCount / quizStats.totalAnswered) * 100)
    : 0;

  // Identify weak topics (systems with errors, low accuracy, or cards marked for review)
  const weakTopics = BODY_SYSTEMS.filter((sys) => {
    const stats = topicStats[sys.id];
    const reviewCardsInSys = FLASHCARDS.filter(
      (c) => c.systemId === sys.id && reviewFlashcardIds.includes(c.id)
    ).length;
    if (reviewCardsInSys > 0) return true;
    if (stats && stats.incorrect > 0) {
      const accuracy = Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100);
      return accuracy < 70;
    }
    return false;
  });

  const handleReset = () => {
    Alert.alert(
      'Reset Learning Progress',
      'Are you sure you want to reset your quiz scores, lesson history, flashcards, and bookmarks? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            Alert.alert('Reset Complete', 'Your learning progress has been reset.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs');
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Learning Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Track your anatomy mastery & streaks
          </Text>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak & Consistency Hero Card */}
        <View style={styles.streakHeroCard}>
          <View style={styles.streakHeroLeft}>
            <View style={styles.streakFireCircle}>
              <MaterialCommunityIcons name="fire" size={28} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.streakCountText}>{streakDays}-Day Study Streak</Text>
              <Text style={styles.streakSubText}>
                {streakDays >= 3
                  ? 'Fantastic consistency! Keep learning daily.'
                  : 'Complete a lesson or quiz today to maintain momentum!'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2x2 Metric Grid */}
        <View style={styles.metricGrid}>
          {/* Card 1: Lessons Completed */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="book" size={18} color="#0284C7" />
            </View>
            <Text style={styles.metricValue}>
              {lessonsCompletedCount}
              <Text style={styles.metricTotal}>/{totalLessons}</Text>
            </Text>
            <Text style={styles.metricLabel}>Lessons Completed</Text>
            <View style={styles.miniProgressTrack}>
              <View
                style={[
                  styles.miniProgressBar,
                  { width: `${lessonProgressPercent}%`, backgroundColor: '#0284C7' },
                ]}
              />
            </View>
          </View>

          {/* Card 2: Quiz Score Stats */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="trophy" size={18} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>
              {quizStats.bestScorePercent}%
            </Text>
            <Text style={styles.metricLabel}>Best Quiz Score</Text>
            <Text style={styles.metricSubInfo}>
              Avg: {avgQuizScore}% • {quizStats.attempts} {quizStats.attempts === 1 ? 'attempt' : 'attempts'}
            </Text>
          </View>

          {/* Card 3: Flashcards Mastered */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="cards-outline" size={18} color="#16A34A" />
            </View>
            <Text style={styles.metricValue}>
              {flashcardsKnownCount}
              <Text style={styles.metricTotal}>/{totalFlashcards}</Text>
            </Text>
            <Text style={styles.metricLabel}>Cards Mastered</Text>
            <View style={styles.miniProgressTrack}>
              <View
                style={[
                  styles.miniProgressBar,
                  { width: `${flashcardProgressPercent}%`, backgroundColor: '#16A34A' },
                ]}
              />
            </View>
          </View>

          {/* Card 4: Bookmarked Organs */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bookmark" size={18} color="#9333EA" />
            </View>
            <Text style={styles.metricValue}>{bookmarkedOrganIds.length}</Text>
            <Text style={styles.metricLabel}>Pinned Organs</Text>
            <Text style={styles.metricSubInfo}>Saved for quick 3D review</Text>
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Quiz')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="school-outline" size={20} color="#0284C7" />
            </View>
            <Text style={styles.actionBtnTitle}>Practice Quiz</Text>
            <Text style={styles.actionBtnSub}>MCQs & Instant Explanations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Flashcards')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="cards-outline" size={20} color="#16A34A" />
            </View>
            <Text style={styles.actionBtnTitle}>Flashcards</Text>
            <Text style={styles.actionBtnSub}>Spaced Repetition Review</Text>
          </TouchableOpacity>
        </View>

        {/* Weak-Topic Tracking */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Focus Areas (Weak Topics)</Text>
          <Text style={[styles.sectionBadgeText, { color: '#EF4444' }]}>
            {weakTopics.length > 0 ? `${weakTopics.length} Need Review` : 'All On Track'}
          </Text>
        </View>

        {weakTopics.length > 0 ? (
          <View style={styles.weakTopicsCard}>
            {weakTopics.map((sys) => {
              const stats = topicStats[sys.id];
              const reviewCardsInSys = FLASHCARDS.filter(
                (c) => c.systemId === sys.id && reviewFlashcardIds.includes(c.id)
              ).length;
              return (
                <View key={sys.id} style={styles.weakTopicRow}>
                  <View style={styles.weakTopicLeft}>
                    <View style={[styles.weakIconCircle, { backgroundColor: `${sys.color}20` }]}>
                      <MaterialCommunityIcons name={sys.icon as any} size={18} color={sys.color} />
                    </View>
                    <View>
                      <Text style={styles.weakTopicName}>{sys.name}</Text>
                      <Text style={styles.weakTopicDetail}>
                        {reviewCardsInSys > 0 ? `${reviewCardsInSys} flagged cards` : ''}
                        {reviewCardsInSys > 0 && stats ? ' • ' : ''}
                        {stats ? `${stats.incorrect} quiz errors` : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reviewTopicBtn}
                    onPress={() => navigation.navigate('Quiz', { systemId: sys.id })}
                  >
                    <Text style={styles.reviewTopicBtnText}>Practice</Text>
                    <Ionicons name="arrow-forward" size={12} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyWeakTopicsCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#16A34A" />
            <Text style={styles.emptyWeakText}>
              All topics in strong standing. As you take quizzes and flag flashcards, areas needing revision will appear here.
            </Text>
          </View>
        )}

        {/* 10 Body Systems Progress Overview */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>System Breakdown</Text>
          <Text style={styles.sectionBadgeText}>10 Systems Active</Text>
        </View>

        <View style={styles.systemsList}>
          {BODY_SYSTEMS.map((sys) => {
            const sysLessons = LESSONS.filter((l) => l.systemId === sys.id);
            const sysCompletedLessons = sysLessons.filter((l) =>
              completedLessonIds.includes(l.id)
            );
            const sysCards = FLASHCARDS.filter((c) => c.systemId === sys.id);
            const sysMasteredCards = sysCards.filter((c) =>
              knownFlashcardIds.includes(c.id)
            );
            const pct =
              sysLessons.length > 0
                ? Math.round((sysCompletedLessons.length / sysLessons.length) * 100)
                : 0;

            return (
              <View key={sys.id} style={styles.systemProgressRow}>
                <View
                  style={[
                    styles.systemIconCircle,
                    { backgroundColor: `${sys.color}15`, borderColor: `${sys.color}40` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={sys.icon as any}
                    size={20}
                    color={sys.color}
                  />
                </View>

                <View style={styles.systemInfoWrap}>
                  <View style={styles.systemNameRow}>
                    <Text style={styles.systemNameText}>{sys.name}</Text>
                    <Text style={[styles.systemPctText, { color: sys.color }]}>
                      {pct}%
                    </Text>
                  </View>

                  <View style={styles.systemStatsRow}>
                    <Text style={styles.systemStatsText}>
                      {sysCompletedLessons.length}/{sysLessons.length} lessons •{' '}
                      {sysMasteredCards.length}/{sysCards.length} cards
                    </Text>
                  </View>

                  <View style={styles.systemTrack}>
                    <View
                      style={[
                        styles.systemFill,
                        { width: `${pct}%`, backgroundColor: sys.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  streakHeroCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    marginBottom: 16,
  },
  streakHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFireCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C2410C',
  },
  streakSubText: {
    fontSize: 12,
    color: '#9A3412',
    marginTop: 2,
    lineHeight: 16,
    maxWidth: 240,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  metricSubInfo: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  miniProgressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBtnSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  systemsList: {
    gap: 10,
  },
  systemProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  systemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  systemInfoWrap: {
    flex: 1,
  },
  systemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  systemPctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  systemStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  systemStatsText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  systemTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  systemFill: {
    height: '100%',
    borderRadius: 2,
  },
  weakTopicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
    gap: 10,
  },
  weakTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  weakTopicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  weakIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakTopicName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  weakTopicDetail: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 1,
  },
  reviewTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  reviewTopicBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  emptyWeakTopicsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyWeakText: {
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    lineHeight: 17,
  },
});
