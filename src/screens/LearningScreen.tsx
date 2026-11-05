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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LESSONS, ORGANS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { Lesson, TabParamList } from '../types';

export const LearningScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const {
    completedLessonIds,
    toggleLessonCompleted,
    isLessonCompleted,
    selectOrgan,
  } = useAnatomyStore();

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    LESSONS[0].id
  );
  const [activeSystemFilter, setActiveSystemFilter] = useState<string>('all');

  const filteredLessons = LESSONS.filter((lesson) => {
    if (activeSystemFilter === 'all') return true;
    return lesson.systemId === activeSystemFilter;
  });

  const handleInspectIn3D = (organId: string) => {
    selectOrgan(organId);
    navigation.navigate('ExplorerTab', { targetOrganId: organId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Anatomy Lessons</Text>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>
              {completedLessonIds.length}/{LESSONS.length} Complete
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Concise medical explanations and clinical physiology
        </Text>

        {/* Clean System Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['all', 'circulatory', 'respiratory', 'nervous', 'digestive'].map(
            (sys) => {
              const isActive = activeSystemFilter === sys;
              return (
                <TouchableOpacity
                  key={sys}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveSystemFilter(sys)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {sys === 'all'
                      ? 'All'
                      : sys.charAt(0).toUpperCase() + sys.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredLessons.map((lesson) => {
          const isCompleted = isLessonCompleted(lesson.id);
          const isExpanded = expandedLessonId === lesson.id;
          const organ = ORGANS.find((o) => o.id === lesson.organId);

          return (
            <View
              key={lesson.id}
              style={[
                styles.lessonCard,
                isCompleted && styles.lessonCardCompleted,
              ]}
            >
              <TouchableOpacity
                style={styles.lessonCardHeader}
                activeOpacity={0.85}
                onPress={() =>
                  setExpandedLessonId(isExpanded ? null : lesson.id)
                }
              >
                <View style={styles.lessonMetaRow}>
                  <View
                    style={[
                      styles.systemTag,
                      {
                        backgroundColor: organ
                          ? `${organ.accentColor}20`
                          : '#1E293B',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.systemTagDot,
                        {
                          backgroundColor: organ
                            ? organ.accentColor
                            : '#38BDF8',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.systemTagText,
                        {
                          color: organ ? organ.accentColor : '#38BDF8',
                        },
                      ]}
                    >
                      {lesson.systemId.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.readTimeRow}>
                    <Ionicons name="time-outline" size={13} color="#94A3B8" />
                    <Text style={styles.readTimeText}>
                      {lesson.readTimeMinutes} min read
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.checkAction}
                    onPress={() => toggleLessonCompleted(lesson.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={
                        isCompleted
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={isCompleted ? '#10B981' : '#64748B'}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonSummary} numberOfLines={isExpanded ? undefined : 2}>
                  {lesson.summary}
                </Text>
              </TouchableOpacity>

              {/* Expanded Lesson Content */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {lesson.sections.map((sec, sIdx) => (
                    <View key={sIdx} style={styles.sectionBlock}>
                      <View style={styles.sectionHeadingRow}>
                        <View style={styles.sectionNumberBadge}>
                          <Text style={styles.sectionNumberText}>
                            {sIdx + 1}
                          </Text>
                        </View>
                        <Text style={styles.sectionHeading}>
                          {sec.heading}
                        </Text>
                      </View>
                      <Text style={styles.sectionBody}>{sec.body}</Text>
                    </View>
                  ))}

                  {/* Actions Row */}
                  <View style={styles.lessonActionsRow}>
                    <TouchableOpacity
                      style={styles.inspect3DBtn}
                      onPress={() => handleInspectIn3D(lesson.organId)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="cube-scan"
                        size={15}
                        color="#0B0F19"
                      />
                      <Text style={styles.inspect3DBtnText}>
                        Inspect in 3D Atlas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.markCompleteBtn,
                        isCompleted && styles.markCompleteBtnDone,
                      ]}
                      onPress={() => toggleLessonCompleted(lesson.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={
                          isCompleted
                            ? 'checkmark-circle'
                            : 'checkmark-outline'
                        }
                        size={15}
                        color={isCompleted ? '#10B981' : '#E2E8F0'}
                      />
                      <Text
                        style={[
                          styles.markCompleteBtnText,
                          isCompleted && { color: '#10B981' },
                        ]}
                      >
                        {isCompleted ? 'Completed' : 'Mark Done'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  lessonCardCompleted: {
    borderColor: '#A7F3D0',
  },
  lessonCardHeader: {
    padding: 16,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  systemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  systemTagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  systemTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  readTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  checkAction: {
    padding: 2,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  lessonSummary: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    gap: 12,
  },
  sectionBlock: {
    gap: 4,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    paddingLeft: 28,
  },
  lessonActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inspect3DBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  inspect3DBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markCompleteBtnDone: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  markCompleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
});
