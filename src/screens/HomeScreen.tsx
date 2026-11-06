import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BODY_SYSTEMS, ORGANS } from '../data/anatomyData';
import { ORGAN_IMAGES } from '../constants/anatomyImages';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { RootStackParamList, TabParamList } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface PopularOrganItem {
  id: string;
  name: string;
  systemTag: string;
  subText: string;
  icon: string;
  accentColor: string;
}

const POPULAR_ORGANS: PopularOrganItem[] = [
  {
    id: 'brain',
    name: 'Brain',
    systemTag: 'NERVOUS',
    subText: 'Cerebral Cortex & Nuclei',
    icon: 'brain',
    accentColor: '#7C3AED',
  },
  {
    id: 'heart',
    name: 'Heart',
    systemTag: 'CIRCULATORY',
    subText: 'Atria & Ventricles',
    icon: 'heart-pulse',
    accentColor: '#DC2626',
  },
  {
    id: 'lungs',
    name: 'Lungs',
    systemTag: 'RESPIRATORY',
    subText: 'Lobes & Bronchioles',
    icon: 'lungs',
    accentColor: '#0284C7',
  },
  {
    id: 'liver',
    name: 'Liver',
    systemTag: 'DIGESTIVE',
    subText: 'Hepatic Lobes & Portal',
    icon: 'leaf',
    accentColor: '#853228',
  },
  {
    id: 'stomach',
    name: 'Stomach',
    systemTag: 'DIGESTIVE',
    subText: 'Fundus & Pylorus',
    icon: 'food-drumstick',
    accentColor: '#EA580C',
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    systemTag: 'URINARY',
    subText: 'Renal Cortex & Pelvis',
    icon: 'water-outline',
    accentColor: '#CA8A04',
  },
];

const BOOKMARKED_ITEMS = [
  {
    id: 'circle_of_willis',
    title: 'Circle of Willis',
    subtitle: 'Cerebral arterial anastomosis',
    icon: 'brain',
    organId: 'brain',
  },
  {
    id: 'sa_node',
    title: 'Sinoatrial (SA) Node',
    subtitle: 'Cardiac conduction pacemaker',
    icon: 'heart-pulse',
    organId: 'heart',
  },
  {
    id: 'vagus_nerve',
    title: 'Cranial Nerve X (Vagus)',
    subtitle: 'Parasympathetic visceral branch',
    icon: 'medical-bag',
    organId: 'brain',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {
    loadPersistedData,
    selectOrgan,
    selectSystem,
  } = useAnatomyStore();

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  const handleOpenOrganDetails = (organId: string) => {
    selectOrgan(organId);
    navigation.navigate('OrganDetails', { organId });
  };

  const handleOpenSystem = (systemId: string) => {
    selectSystem(systemId as any);
    navigation.navigate('SystemsTab');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Clinical Header Bar matching Image 1 */}
      <View style={styles.topHeader}>
        <View style={styles.branding}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons
              name="microscope"
              size={22}
              color="#0284C7"
            />
          </View>
          <View>
            <Text style={styles.appTitle}>3D Human Anatomy Explorer</Text>
            <Text style={styles.appSuiteLabel}>CLINICAL SUITE</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart-outline" size={19} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Credits')}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Welcome, Anatomy Student</Text>
          <Text style={styles.greetingSubtitle}>
            Interactive 3D Human Anatomy & Medical Atlas
          </Text>
        </View>

        {/* Interactive 3D Anatomy Hero Banner */}
        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ExplorerTab')}
        >
          <View style={styles.moduleHeaderRow}>
            <View style={styles.moduleTagPill}>
              <View style={styles.moduleTagSquare} />
              <Text style={styles.moduleTagText}>FEATURED 3D EXPLORER</Text>
            </View>

            <View style={styles.progressRing}>
              <MaterialCommunityIcons name="cube-scan" size={18} color="#0284C7" />
            </View>
          </View>

          <Text style={styles.moduleTitle}>Interactive 3D Human Anatomy</Text>
          <Text style={styles.moduleSubtitle}>Explore organs, skeletal framework & musculature in 360°</Text>

          <View style={styles.moduleFooterRow}>
            <View style={{ flex: 1 }} />
            <View style={styles.resumeModuleBtn}>
              <Text style={styles.resumeModuleText}>Launch 3D Atlas</Text>
              <Ionicons name="arrow-forward" size={14} color="#0284C7" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Tools Navigation */}
        <View style={styles.quickToolsGrid}>
          <TouchableOpacity
            style={styles.quickToolCard}
            onPress={() => navigation.navigate('ExplorerTab')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickToolIcon, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="cube-scan" size={20} color="#0284C7" />
            </View>
            <Text style={styles.quickToolTitle}>3D Solo Atlas</Text>
            <Text style={styles.quickToolSub}>Organs & High-Res Scans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickToolCard}
            onPress={() => navigation.navigate('SystemsTab')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickToolIcon, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="human-male-height" size={20} color="#16A34A" />
            </View>
            <Text style={styles.quickToolTitle}>10 Body Systems</Text>
            <Text style={styles.quickToolSub}>Osteology, Myology & More</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickToolCard}
            onPress={() => navigation.navigate('ChatTab')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickToolIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="robot-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.quickToolTitle}>AI Anatomy Tutor</Text>
            <Text style={styles.quickToolSub}>Educational Inquiries</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickToolCard}
            onPress={() => navigation.navigate('Credits')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickToolIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#9333EA" />
            </View>
            <Text style={styles.quickToolTitle}>Medical Scans & Models</Text>
            <Text style={styles.quickToolSub}>NIH 3D & Sketchfab Library</Text>
          </TouchableOpacity>
        </View>

        {/* Body Systems Horizontal Scroll matching Image 1 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Body Systems</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.systemsScroll}
        >
          {BODY_SYSTEMS.map((system) => {
            const count = ORGANS.filter((o) => o.systemId === system.id).length;
            return (
              <TouchableOpacity
                key={system.id}
                style={styles.systemBoxCard}
                activeOpacity={0.85}
                onPress={() => handleOpenSystem(system.id)}
              >
                <View
                  style={[
                    styles.systemIconBubble,
                    { backgroundColor: `${system.color}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={system.icon as any}
                    size={22}
                    color={system.color}
                  />
                </View>
                <Text style={styles.systemBoxTitle}>{system.name.replace(' System', '')}</Text>
                <Text style={styles.systemBoxSubtitle} numberOfLines={1}>
                  {system.id === 'circulatory'
                    ? 'Heart & vessels'
                    : system.id === 'respiratory'
                    ? 'Lungs & trachea'
                    : system.id === 'nervous'
                    ? 'Brain & nerves'
                    : system.id === 'digestive'
                    ? 'Stomach & liver'
                    : system.id === 'urinary'
                    ? 'Kidneys & bladder'
                    : system.id === 'skeletal'
                    ? 'Bones & joints'
                    : 'Muscles & fibers'}
                </Text>
                <View style={styles.systemOrganPill}>
                  <Text style={styles.systemOrganPillText}>
                    {count > 0 ? `${count} Organs` : 'Framework'}
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color="#0284C7" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Popular Organs 2-Column Grid matching Image 1 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Popular Organs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SystemsTab')}>
            <Text style={styles.viewAllText}>VIEW ALL &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.popularOrgansGrid}>
          {POPULAR_ORGANS.map((organ) => (
            <TouchableOpacity
              key={organ.id}
              style={styles.organGridCard}
              activeOpacity={0.88}
              onPress={() => handleOpenOrganDetails(organ.id)}
            >
              {/* Category Tag */}
              <View style={styles.organTagPill}>
                <Text style={styles.organTagText}>{organ.systemTag}</Text>
              </View>

              {/* Organ 3D Picture Preview matching Image 1 */}
              <View style={styles.organPreviewBox}>
                {ORGAN_IMAGES[organ.id] ? (
                  <Image
                    source={ORGAN_IMAGES[organ.id]}
                    style={styles.organImage}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={organ.icon as any}
                    size={42}
                    color={organ.accentColor}
                  />
                )}
              </View>

              <Text style={styles.organCardName}>{organ.name}</Text>
              <Text style={styles.organCardSubText} numberOfLines={1}>
                {organ.subText}
              </Text>

              <View style={styles.organCardArrowCircle}>
                <Ionicons name="arrow-forward" size={13} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookmarked Structures matching Image 1 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Bookmarked Structures</Text>
          <View style={styles.savedBadge}>
            <Text style={styles.savedBadgeText}>3 SAVED</Text>
          </View>
        </View>

        <View style={styles.bookmarkedList}>
          {BOOKMARKED_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.bookmarkRowCard}
              activeOpacity={0.85}
              onPress={() => handleOpenOrganDetails(item.organId)}
            >
              <View style={styles.bookmarkIconWrap}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color="#0284C7"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.bookmarkTitle}>{item.title}</Text>
                <Text style={styles.bookmarkSubtitle}>{item.subtitle}</Text>
              </View>

              <MaterialCommunityIcons
                name="bookmark"
                size={20}
                color="#0284C7"
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  appSuiteLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  greetingSection: {
    marginTop: 14,
    marginBottom: 14,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moduleTagSquare: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: '#0284C7',
  },
  moduleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  progressRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  moduleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  resumeModuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resumeModuleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  systemsScroll: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  systemBoxCard: {
    width: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  systemIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  systemBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  systemBoxSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 8,
  },
  systemOrganPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  systemOrganPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  popularOrgansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  organGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  organTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  organTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  organPreviewBox: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    padding: 4,
  },
  organImage: {
    width: '100%',
    height: '100%',
  },
  organCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  organCardSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  organCardArrowCircle: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  bookmarkedList: {
    gap: 10,
  },
  bookmarkRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  bookmarkIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bookmarkSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  quickToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickToolCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickToolIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickToolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickToolSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
