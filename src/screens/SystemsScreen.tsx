import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAnatomyStore } from '../state/useAnatomyStore';

type SystemsNavProp = NativeStackNavigationProp<RootStackParamList>;

interface SystemClinicalSpec {
  systemNumber: string;
  tag: string;
  id: string;
  name: string;
  subTitle: string;
  badge1: string;
  badge2: string;
  chips: string[];
  simulationText: string;
  icon: string;
  color: string;
  representativeOrganId: string;
  category: 'visceral' | 'neural' | 'musculoskeletal';
}

const CLINICAL_SYSTEMS: SystemClinicalSpec[] = [
  {
    systemNumber: 'SYSTEM 01',
    tag: 'Exploration Ready',
    id: 'circulatory',
    name: 'Circulatory System',
    subTitle: 'Heart, Blood Vessels & Arterial Network...',
    badge1: '12 MODELED ORGANS',
    badge2: 'HIGH RESOLUTION',
    chips: ['Myocardium', 'Aortic Valve', 'Pulmonary Trunk', 'Vena Cava'],
    simulationText: 'Cardiovascular Flow Simulation',
    icon: 'heart-pulse',
    color: '#DC2626',
    representativeOrganId: 'heart',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 02',
    tag: 'Pulmonology',
    id: 'respiratory',
    name: 'Respiratory System',
    subTitle: 'Lungs, Trachea, Bronchial Tree & Alveoli...',
    badge1: '8 MODELED ORGANS',
    badge2: 'DYNAMIC AIRFLOW',
    chips: ['Trachea', 'Bronchioles', 'Alveoli', 'Pleura'],
    simulationText: 'Gas Exchange Mechanics',
    icon: 'lungs',
    color: '#0284C7',
    representativeOrganId: 'lungs',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 03',
    tag: 'Neurology',
    id: 'nervous',
    name: 'Nervous System',
    subTitle: 'Brain, Spinal Cord & Peripheral Nerves...',
    badge1: '16 MODELED ORGANS',
    badge2: 'SYNAPSE LAYER',
    chips: ['Cerebrum', 'Brainstem', 'Vagus Nerve', 'Spinal Medulla'],
    simulationText: 'Signal Transmission Pathway',
    icon: 'brain',
    color: '#7C3AED',
    representativeOrganId: 'brain',
    category: 'neural',
  },
  {
    systemNumber: 'SYSTEM 04',
    tag: 'Gastroenterology',
    id: 'digestive',
    name: 'Digestive System',
    subTitle: 'Stomach, Intestines, Liver & Biliary Tract...',
    badge1: '14 MODELED ORGANS',
    badge2: 'CROSS SECTIONAL',
    chips: ['Hepatic Lobes', 'Duodenum', 'Pancreas', 'Mesentery'],
    simulationText: 'Nutrient Absorption Simulation',
    icon: 'food-drumstick',
    color: '#EA580C',
    representativeOrganId: 'stomach',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 05',
    tag: 'Nephrology',
    id: 'urinary',
    name: 'Urinary System',
    subTitle: 'Kidneys, Ureters, Bladder & Urethra...',
    badge1: '4 MODELED ORGANS',
    badge2: 'FILTRATION MODEL',
    chips: ['Renal Cortex', 'Nephron Units', 'Renal Pelvis', 'Detrusor'],
    simulationText: 'Fluid & Electrolyte Regulation',
    icon: 'water-outline',
    color: '#CA8A04',
    representativeOrganId: 'kidneys',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 06',
    tag: 'Osteology',
    id: 'skeletal',
    name: 'Skeletal System',
    subTitle: 'Cranial, Axial & Appendicular Skeleton...',
    badge1: '206 BONES GROUPED',
    badge2: 'ARTICULATED JOINTS',
    chips: ['Cranium', 'Vertebral Column', 'Thoracic Cage', 'Pelvic Girdle'],
    simulationText: 'Structural Biomechanics',
    icon: 'bone',
    color: '#4B5563',
    representativeOrganId: 'heart',
    category: 'musculoskeletal',
  },
  {
    systemNumber: 'SYSTEM 07',
    tag: 'Myology',
    id: 'muscular',
    name: 'Muscular System',
    subTitle: 'Skeletal, Cardiac & Smooth Musculature...',
    badge1: '24 MUSCLE GROUPS',
    badge2: 'KINETIC MAPPING',
    chips: ['Pectoralis', 'Biceps Brachii', 'Quadriceps', 'Fascial Planes'],
    simulationText: 'Contraction & Kinetic Chains',
    icon: 'arm-flex-outline',
    color: '#BE185D',
    representativeOrganId: 'heart',
    category: 'musculoskeletal',
  },
];

export const SystemsScreen: React.FC = () => {
  const navigation = useNavigation<SystemsNavProp>();
  const { selectOrgan, selectSystem } = useAnatomyStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'visceral' | 'neural' | 'musculoskeletal'>('all');

  const filteredSystems = CLINICAL_SYSTEMS.filter((sys) => {
    const matchesCategory =
      activeCategory === 'all' ? true : sys.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === ''
        ? true
        : sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sys.chips.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleExploreIn3D = (system: SystemClinicalSpec) => {
    selectSystem(system.id as any);
    selectOrgan(system.representativeOrganId);
    // Directly opens the dedicated 3D Organ Details view (Image 3)
    navigation.navigate('OrganDetails', {
      organId: system.representativeOrganId,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Clinical Bar matching Image 2 */}
      <View style={styles.topHeader}>
        <View style={styles.branding}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons
              name="microscope"
              size={20}
              color="#0284C7"
            />
          </View>
          <Text style={styles.appTitle}>3D Human Anatomy Explorer</Text>
        </View>

        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section matching Image 2 */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Body Systems</Text>
            <View style={styles.clinicalBadge}>
              <Text style={styles.clinicalBadgeText}>CLINICAL V4.2</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            7 Fundamental Anatomical Frameworks
          </Text>
        </View>

        {/* Search & Filter Bar matching Image 2 */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputBox}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter systems, structures or organs"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <Ionicons name="options-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Filter Category Pills matching Image 2 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeCategory === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Systems (7)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeCategory === 'visceral' && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory('visceral')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="source-branch"
              size={14}
              color={activeCategory === 'visceral' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'visceral' && styles.filterPillTextActive,
              ]}
            >
              Visceral
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeCategory === 'neural' && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory('neural')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="brain"
              size={14}
              color={activeCategory === 'neural' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'neural' && styles.filterPillTextActive,
              ]}
            >
              Neural
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeCategory === 'musculoskeletal' && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory('musculoskeletal')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={14}
              color={activeCategory === 'musculoskeletal' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'musculoskeletal' && styles.filterPillTextActive,
              ]}
            >
              Musculoskeletal
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 7 Clinical System Cards matching Image 2 */}
        <View style={styles.systemsList}>
          {filteredSystems.map((system) => (
            <View key={system.id} style={styles.systemCard}>
              {/* Card Header Row */}
              <View style={styles.cardTopMeta}>
                <View style={styles.systemNumPill}>
                  <Text style={styles.systemNumText}>{system.systemNumber}</Text>
                </View>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{system.tag}</Text>
                </View>
              </View>

              {/* Main Body Row: Thumbnail + Info */}
              <View style={styles.cardMainRow}>
                <View
                  style={[
                    styles.thumbnailWrap,
                    { backgroundColor: `${system.color}14` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={system.icon as any}
                    size={36}
                    color={system.color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSystemTitle}>{system.name}</Text>
                  <Text style={styles.cardSystemSubtitle} numberOfLines={1}>
                    {system.subTitle}
                  </Text>

                  <View style={styles.badgesRow}>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>{system.badge1}</Text>
                    </View>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>{system.badge2}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Sub-Structure Chips */}
              <View style={styles.chipsRow}>
                {system.chips.map((chip, cIdx) => (
                  <View key={cIdx} style={styles.structureChip}>
                    <Text style={styles.structureChipText}>{chip}</Text>
                  </View>
                ))}
              </View>

              {/* Card Footer matching Image 2 */}
              <View style={styles.cardFooter}>
                <View style={styles.simulationWrap}>
                  <MaterialCommunityIcons
                    name="pulse"
                    size={16}
                    color="#0284C7"
                  />
                  <Text style={styles.simulationText} numberOfLines={1}>
                    {system.simulationText}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.explore3DBtn}
                  activeOpacity={0.85}
                  onPress={() => handleExploreIn3D(system)}
                >
                  <Text style={styles.explore3DBtnText}>Explore in 3D</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
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
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  clinicalBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clinicalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  systemsList: {
    gap: 14,
  },
  systemCard: {
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
  },
  cardTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  systemNumPill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  systemNumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  tagPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSystemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSystemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  structureChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  structureChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  simulationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  simulationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  explore3DBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  explore3DBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
