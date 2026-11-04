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
import { BODY_SYSTEMS, ORGANS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
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
    loadPersistedData,
    selectOrgan,
    selectSystem,
  } = useAnatomyStore();

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  const featuredOrgan = ORGANS[1]; // Heart

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Sleek Medical Header */}
        <View style={styles.topHeader}>
          <View style={styles.branding}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons
                name="cube-scan"
                size={24}
                color="#38BDF8"
              />
            </View>
            <View>
              <Text style={styles.appTitle}>Anatomy 3D Explorer</Text>
              <Text style={styles.appSubtitle}>Medical Atlas & AI Tutor</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => navigation.navigate('ChatTab')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="robot-outline"
              size={20}
              color="#38BDF8"
            />
          </TouchableOpacity>
        </View>

        {/* Hero 3D Explorer Banner */}
        <TouchableOpacity
          style={styles.heroBanner}
          activeOpacity={0.9}
          onPress={() => {
            selectSystem('all');
            navigation.navigate('ExplorerTab');
          }}
        >
          <View style={styles.heroContent}>
            <View style={styles.badgePill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.badgePillText}>Interactive 3D Atlas</Text>
            </View>
            <Text style={styles.heroTitle}>Explore Human Anatomy in 3D</Text>
            <Text style={styles.heroDescription}>
              360° medical scans, isolated organ views, and multi-system layers.
            </Text>
            <View style={styles.heroButton}>
              <MaterialCommunityIcons name="cube-outline" size={17} color="#0B0F19" />
              <Text style={styles.heroButtonText}>Launch 3D Atlas</Text>
              <Ionicons name="arrow-forward" size={15} color="#0B0F19" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick AI Assistant Card */}
        <TouchableOpacity
          style={styles.aiTutorCard}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('ChatTab')}
        >
          <View style={styles.aiTutorLeft}>
            <View style={styles.aiTutorIconWrap}>
              <MaterialCommunityIcons name="robot" size={24} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTutorTitle}>Anatomy AI Assistant</Text>
              <Text style={styles.aiTutorSubtitle}>
                Ask any question about organ function, circulation, or physiology
              </Text>
            </View>
          </View>
          <View style={styles.aiTutorAction}>
            <Text style={styles.aiTutorActionText}>Chat</Text>
            <Ionicons name="chevron-forward" size={16} color="#38BDF8" />
          </View>
        </TouchableOpacity>

        {/* Human Body Systems Strip */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Body Systems</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SystemsTab')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.systemsScroll}
        >
          {BODY_SYSTEMS.map((system) => (
            <TouchableOpacity
              key={system.id}
              style={styles.systemIconPill}
              activeOpacity={0.8}
              onPress={() => {
                selectSystem(system.id);
                navigation.navigate('ExplorerTab', { targetSystemId: system.id });
              }}
            >
              <View
                style={[
                  styles.systemIconBubble,
                  { backgroundColor: `${system.color}20`, borderColor: `${system.color}50` },
                ]}
              >
                <MaterialCommunityIcons
                  name={system.icon as any}
                  size={22}
                  color={system.color}
                />
              </View>
              <Text style={styles.systemPillName} numberOfLines={1}>
                {system.name.replace(' System', '')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Organ Cards (Horizontal Scroll) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Key Anatomical Organs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SystemsTab')}>
            <Text style={styles.seeAllText}>Browse All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.organsScroll}
        >
          {ORGANS.map((organ) => (
            <TouchableOpacity
              key={organ.id}
              style={styles.organQuickCard}
              activeOpacity={0.85}
              onPress={() => {
                selectOrgan(organ.id);
                navigation.navigate('ExplorerTab', { targetOrganId: organ.id });
              }}
            >
              <View
                style={[
                  styles.organIconBox,
                  { backgroundColor: `${organ.accentColor}18` },
                ]}
              >
                <MaterialCommunityIcons
                  name={organ.icon as any}
                  size={26}
                  color={organ.accentColor}
                />
              </View>
              <Text style={styles.organQuickName}>{organ.name}</Text>
              <Text style={styles.organQuickSystem}>{organ.systemName}</Text>
              <View style={styles.organQuickInspectBtn}>
                <MaterialCommunityIcons name="cube-scan" size={13} color="#38BDF8" />
                <Text style={styles.organQuickInspectText}>3D View</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Spotlight Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Organ Spotlight</Text>
        </View>
        <TouchableOpacity
          style={styles.spotlightCard}
          activeOpacity={0.88}
          onPress={() => {
            selectOrgan(featuredOrgan.id);
            navigation.navigate('ExplorerTab', { targetOrganId: featuredOrgan.id });
          }}
        >
          <View style={styles.spotlightHeader}>
            <View
              style={[
                styles.spotlightIconWrap,
                { backgroundColor: `${featuredOrgan.accentColor}25` },
              ]}
            >
              <MaterialCommunityIcons
                name={featuredOrgan.icon as any}
                size={28}
                color={featuredOrgan.accentColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.spotlightTitle}>{featuredOrgan.name}</Text>
              <Text style={styles.spotlightSystem}>{featuredOrgan.systemName}</Text>
            </View>
            <View style={styles.spotlightBadge}>
              <Text style={styles.spotlightBadgeText}>3D Scan</Text>
            </View>
          </View>
          <Text style={styles.spotlightSnippet} numberOfLines={2}>
            {featuredOrgan.function}
          </Text>
          <View style={styles.spotlightFooter}>
            <View style={styles.spotlightMeta}>
              <Ionicons name="location-outline" size={14} color="#94A3B8" />
              <Text style={styles.spotlightLocation} numberOfLines={1}>
                {featuredOrgan.location}
              </Text>
            </View>
            <View style={styles.spotlightActionPill}>
              <Text style={styles.spotlightActionText}>Inspect in 3D</Text>
              <Ionicons name="arrow-forward" size={14} color="#38BDF8" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7DD3FC',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
    marginBottom: 14,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 6,
  },
  heroButtonText: {
    fontSize: 13,
    color: '#0B0F19',
    fontWeight: '700',
  },
  aiTutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 18,
  },
  aiTutorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  aiTutorIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTutorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  aiTutorSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  aiTutorAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiTutorActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  systemsScroll: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 12,
  },
  systemIconPill: {
    alignItems: 'center',
    width: 68,
  },
  systemIconBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  systemPillName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  organsScroll: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 14,
  },
  organQuickCard: {
    width: 130,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  organIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  organQuickName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  organQuickSystem: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  organQuickInspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  organQuickInspectText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  spotlightCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  spotlightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  spotlightSystem: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  spotlightBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  spotlightSnippet: {
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
    marginBottom: 12,
  },
  spotlightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  spotlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  spotlightLocation: {
    fontSize: 11,
    color: '#94A3B8',
  },
  spotlightActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  spotlightActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
