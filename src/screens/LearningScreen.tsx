import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { LESSONS, ORGANS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { SystemBadge } from '../components/SystemBadge';
import { Lesson, RootStackParamList } from '../types';

type LearningNavProp = NativeStackNavigationProp<RootStackParamList>;

export const LearningScreen: React.FC = () => {
  const navigation = useNavigation<LearningNavProp>();
  const {
    completedLessonIds,
    bookmarkedOrganIds,
    toggleLessonCompleted,
    isLessonCompleted,
    toggleBookmark,
    isBookmarked,
    selectOrgan,
  } = useAnatomyStore();

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(
    LESSONS[0]
  );
  const [filterTab, setFilterTab] = useState<
    'all' | 'completed' | 'in_progress' | 'bookmarked'
  >('all');

  const filteredLessons = LESSONS.filter((lesson) => {
    const isCompleted = isLessonCompleted(lesson.id);
    if (filterTab === 'completed') return isCompleted;
    if (filterTab === 'in_progress') return !isCompleted;
    if (filterTab === 'bookmarked')
      return bookmarkedOrganIds.includes(lesson.organId);
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anatomy Lessons</Text>
        <Text style={styles.headerSubtitle}>
          Concise, high-yield physiological explanations verified against
          medical references.
        </Text>

        {/* Tab Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          <TouchableOpacity
            style={[
              styles.tabItem,
              filterTab === 'all' && styles.tabItemActive,
            ]}
            onPress={() => setFilterTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                filterTab === 'all' && styles.tabTextActive,
              ]}
            >
              All ({LESSONS.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              filterTab === 'in_progress' && styles.tabItemActive,
            ]}
            onPress={() => setFilterTab('in_progress')}
          >
            <Text
              style={[
                styles.tabText,
                filterTab === 'in_progress' && styles.tabTextActive,
              ]}
            >
              In Progress ({LESSONS.length - completedLessonIds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              filterTab === 'completed' && styles.tabItemActive,
            ]}
            onPress={() => setFilterTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                filterTab === 'completed' && styles.tabTextActive,
              ]}
            >
              Completed ({completedLessonIds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              filterTab === 'bookmarked' && styles.tabItemActive,
            ]}
            onPress={() => setFilterTab('bookmarked')}
          >
            <Text
              style={[
                styles.tabText,
                filterTab === 'bookmarked' && styles.tabTextActive,
              ]}
            >
              Bookmarked
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredLessons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="book-outline"
              size={36}
              color={theme.colors.textMuted}
            />
            <Text style={styles.emptyText}>
              No lessons match the selected filter yet.
            </Text>
          </View>
        ) : (
          filteredLessons.map((lesson) => {
            const completed = isLessonCompleted(lesson.id);
            const organ = ORGANS.find((o) => o.id === lesson.organId);
            const organBookmarked = isBookmarked(lesson.organId);
            const isExpanded = selectedLesson?.id === lesson.id;

            return (
              <View
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  completed && styles.lessonCardCompleted,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedLesson(isExpanded ? null : lesson)
                  }
                >
                  <View style={styles.cardTop}>
                    <View style={styles.badgeRow}>
                      <SystemBadge systemId={lesson.systemId} size="sm" />
                      <View style={styles.readTimeBadge}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={theme.colors.textMuted}
                        />
                        <Text style={styles.readTimeText}>
                          {lesson.readTimeMinutes} min read
                        </Text>
                      </View>
                    </View>
                    <View style={styles.topRightIcons}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => toggleBookmark(lesson.organId)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons
                          name={
                            organBookmarked ? 'bookmark' : 'bookmark-outline'
                          }
                          size={22}
                          color={
                            organBookmarked
                              ? theme.colors.warning
                              : theme.colors.textMuted
                          }
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => toggleLessonCompleted(lesson.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={
                            completed ? 'checkmark-circle' : 'ellipse-outline'
                          }
                          size={24}
                          color={
                            completed
                              ? theme.colors.success
                              : theme.colors.textMuted
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonSummary}>{lesson.summary}</Text>
                </TouchableOpacity>

                {/* Expanded Lesson Reader */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    {lesson.sections.map((sec, idx) => (
                      <View key={idx} style={styles.sectionBlock}>
                        <Text style={styles.sectionHeading}>{sec.heading}</Text>
                        <Text style={styles.sectionBody}>{sec.body}</Text>
                      </View>
                    ))}

                    <View style={styles.lessonFooterActions}>
                      {organ && (
                        <TouchableOpacity
                          style={styles.inspectOrganBtn}
                          onPress={() => {
                            selectOrgan(organ.id);
                            navigation.navigate('OrganDetails', {
                              organId: organ.id,
                            });
                          }}
                        >
                          <MaterialCommunityIcons
                            name={organ.icon as any}
                            size={18}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.inspectOrganText}>
                            {organ.name} Details
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.toggleDoneBtn,
                          completed && styles.toggleDoneBtnActive,
                        ]}
                        onPress={() => toggleLessonCompleted(lesson.id)}
                      >
                        <Text
                          style={[
                            styles.toggleDoneText,
                            completed && styles.toggleDoneTextActive,
                          ]}
                        >
                          {completed
                            ? 'Completed ✓'
                            : 'Mark Lesson Complete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Expand/Collapse Bar Indicator */}
                <TouchableOpacity
                  style={styles.expandBar}
                  onPress={() =>
                    setSelectedLesson(isExpanded ? null : lesson)
                  }
                >
                  <Text style={styles.expandBarText}>
                    {isExpanded ? 'Collapse Lesson' : 'Read Full Lesson'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            );
          })
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
    paddingTop: theme.spacing.md,
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
    marginBottom: theme.spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: theme.spacing.sm,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  lessonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  lessonCardCompleted: {
    borderColor: theme.colors.success,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  readTimeText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 2,
  },
  lessonTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  lessonSummary: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  expandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle,
  },
  expandBarText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  expandedContent: {
    marginTop: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.cardBorder,
    marginVertical: theme.spacing.sm,
  },
  sectionBlock: {
    marginBottom: theme.spacing.md,
  },
  sectionHeading: {
    ...theme.typography.bodyMedium,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionBody: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  lessonFooterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  inspectOrganBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  inspectOrganText: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  toggleDoneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
  },
  toggleDoneBtnActive: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
  },
  toggleDoneText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  toggleDoneTextActive: {
    color: '#065F46',
  },
});
