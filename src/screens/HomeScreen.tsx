import React, { useEffect } from 'react';
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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { theme } from '../theme';
import { BODY_SYSTEMS, ORGANS, LESSONS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { StatCard } from '../components/StatCard';
import { RootStackParamList, TabParamList } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {
    completedLessonIds,
    bookmarkedOrganIds,
    quizStats,
    loadPersistedData,
    selectOrgan,
    selectSystem,
  } = useAnatomyStore();

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  const featuredOrgan = ORGANS[1]; // Heart
  const nextLesson =
    LESSONS.find((l) => !completedLessonIds.includes(l.id)) || LESSONS[0];
  const bookmarkedOrgans = ORGANS.filter((o) =>
    bookmarkedOrganIds.includes(o.id)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.branding}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons
                name="cube-scan"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <View>
              <Text style={styles.appTitle}>Anatomy Explorer 3D</Text>
              <Text style={styles.appSubtitle}>
                Interactive Human Body Atlas
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => navigation.navigate('LearnTab')}
          >
            <Ionicons
              name="book-outline"
              size={20}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Hero 3D Explorer Banner */}
        <TouchableOpacity
          style={styles.heroBanner}
          activeOpacity={0.9}
          onPress={() => {
            selectOrgan('heart');
            selectSystem('all');
            navigation.navigate('ExplorerTab', { targetOrganId: 'heart' });
          }}
        >
          <View style={styles.heroContent}>
            <View style={styles.badgePill}>
              <MaterialCommunityIcons
                name="axis-arrow"
                size={14}
                color="#7DD3FC"
              />
              <Text style={styles.badgePillText}>Interactive 3D WebGL</Text>
            </View>
            <Text style={styles.heroTitle}>Explore the Human Body in 3D</Text>
            <Text style={styles.heroDescription}>
              Rotate 360°, tap individual 3D organs to highlight them, and
              filter skeletal, muscular, and visceral layers.
            </Text>
            <View style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Open 3D Body Explorer</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Learning Progress Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Learning Progress</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Lessons Done"
            value={`${completedLessonIds.length}/${LESSONS.length}`}
            icon="book-outline"
            color={theme.colors.primary}
          />
          <View style={{ width: theme.spacing.sm }} />
          <StatCard
            label="Best Quiz"
            value={
              quizStats.attempts > 0 ? `${quizStats.bestScorePercent}%` : '--'
            }
            icon="trophy-outline"
            color={theme.colors.warning}
          />
          <View style={{ width: theme.spacing.sm }} />
          <StatCard
            label="Bookmarks"
            value={bookmarkedOrganIds.length}
            icon="bookmark-outline"
            color={theme.colors.accent}
          />
        </View>

        {/* Continue Learning Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LearnTab')}>
            <Text style={styles.seeAllText}>All Lessons</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.continueCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('LearnTab')}
        >
          <View style={styles.continueIconBox}>
            <Ionicons
              name="school-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.continueInfo}>
            <Text style={styles.continueTag}>
              NEXT LESSON • {nextLesson.readTimeMinutes} MIN READ
            </Text>
            <Text style={styles.continueTitle} numberOfLines={1}>
              {nextLesson.title}
            </Text>
            <Text style={styles.continueSummary} numberOfLines={1}>
              {nextLesson.summary}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>

        {/* Bookmarked Organs (if any) */}
        {bookmarkedOrgans.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Bookmarked Organs ({bookmarkedOrgans.length})
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {bookmarkedOrgans.map((organ) => (
                <TouchableOpacity
                  key={organ.id}
                  style={styles.bookmarkChip}
                  onPress={() => {
                    selectOrgan(organ.id);
                    navigation.navigate('OrganDetails', { organId: organ.id });
                  }}
                >
                  <MaterialCommunityIcons
                    name={organ.icon as any}
                    size={18}
                    color={organ.accentColor}
                  />
                  <Text style={styles.bookmarkChipText}>{organ.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Featured Organ Spotlight */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Organ Spotlight</Text>
          <TouchableOpacity
            onPress={() => {
              selectOrgan(featuredOrgan.id);
              navigation.navigate('OrganDetails', {
                organId: featuredOrgan.id,
              });
            }}
          >
            <Text style={styles.seeAllText}>Details</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={0.85}
          onPress={() => {
            selectOrgan(featuredOrgan.id);
            navigation.navigate('OrganDetails', { organId: featuredOrgan.id });
          }}
        >
          <View
            style={[
              styles.featuredIcon,
              { backgroundColor: `${featuredOrgan.accentColor}18` },
            ]}
          >
            <MaterialCommunityIcons
              name={featuredOrgan.icon as any}
              size={32}
              color={featuredOrgan.accentColor}
            />
          </View>
          <View style={styles.featuredInfo}>
            <View style={styles.featuredRow}>
              <Text style={styles.featuredName}>{featuredOrgan.name}</Text>
              <Text style={styles.featuredSystem}>
                {featuredOrgan.systemName}
              </Text>
            </View>
            <Text style={styles.featuredSnippet} numberOfLines={2}>
              {featuredOrgan.function}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>

        {/* Body Systems Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Human Body Systems</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SystemsTab')}>
            <Text style={styles.seeAllText}>
              View All ({BODY_SYSTEMS.length})
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {BODY_SYSTEMS.map((system) => (
            <TouchableOpacity
              key={system.id}
              style={styles.systemCard}
              activeOpacity={0.8}
              onPress={() => {
                selectSystem(system.id);
                navigation.navigate('SystemsTab');
              }}
            >
              <View
                style={[
                  styles.systemIconCircle,
                  { backgroundColor: `${system.color}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name={system.icon as any}
                  size={24}
                  color={system.color}
                />
              </View>
              <Text style={styles.systemName} numberOfLines={1}>
                {system.name}
              </Text>
              <Text style={styles.systemOrgansCount}>
                {system.organIds.length > 0
                  ? `${system.organIds.length} Key Organs`
                  : '3D Layer'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interactive Quiz Quick Callout */}
        <TouchableOpacity
          style={styles.quizCallout}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('QuizTab')}
        >
          <View style={styles.quizCalloutLeft}>
            <View style={styles.quizIconWrap}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={26}
                color="#FFFFFF"
              />
            </View>
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text style={styles.quizCalloutTitle}>
                Test Your Anatomy Knowledge
              </Text>
              <Text style={styles.quizCalloutSubtitle}>
                Multiple-choice questions with clinical explanations.
              </Text>
            </View>
          </View>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  appTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  appSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.hover,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  badgePillText: {
    ...theme.typography.small,
    color: '#7DD3FC',
    marginLeft: 4,
  },
  heroTitle: {
    ...theme.typography.h1,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroDescription: {
    ...theme.typography.body,
    color: '#94A3B8',
    marginBottom: theme.spacing.md,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
  },
  heroButtonText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  seeAllText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  continueIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  continueInfo: {
    flex: 1,
    marginRight: 8,
  },
  continueTag: {
    ...theme.typography.small,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  continueTitle: {
    ...theme.typography.bodyMedium,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  continueSummary: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  bookmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: 8,
    gap: 6,
  },
  bookmarkChipText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  featuredIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginRight: theme.spacing.xs,
  },
  featuredName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  featuredSystem: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  featuredSnippet: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  horizontalScroll: {
    paddingRight: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  systemCard: {
    backgroundColor: theme.colors.surface,
    width: 140,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  systemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  systemName: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  systemOrgansCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  quizCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginTop: theme.spacing.xs,
    ...theme.shadows.card,
  },
  quizCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quizIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizCalloutTitle: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  quizCalloutSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
