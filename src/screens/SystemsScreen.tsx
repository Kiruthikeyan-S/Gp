import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { BODY_SYSTEMS, ORGANS } from '../data/anatomyData';
import { SYSTEM_IMAGES } from '../constants/anatomyImages';

type SystemsNavProp = NativeStackNavigationProp<RootStackParamList>;

interface SystemClinicalSpec {
  systemNumber: string;
  tag: string;
  id: string;
  name: string;
  subTitle: string;
  badge2: string;
  chips: string[];
  simulationText: string;
  icon: string;
  color: string;
  representativeOrganId: string;
  category: 'structural' | 'visceral' | 'regulatory';
}

const CLINICAL_SYSTEMS: SystemClinicalSpec[] = [
  {
    systemNumber: 'SYSTEM 01',
    tag: 'Osteology',
    id: 'skeletal',
    name: 'Skeletal System',
    subTitle: '206 Bones, Axial Skeleton, Pelvis & Limbs...',
    badge2: 'AXIAL & APPENDICULAR',
    chips: ['Cranium', 'Vertebrae', 'Pelvis', 'Femur'],
    simulationText: 'Biomechanical Levers & Load Bearing',
    icon: 'bone',
    color: '#0EA5E9',
    representativeOrganId: 'skeleton',
    category: 'structural',
  },
  {
    systemNumber: 'SYSTEM 02',
    tag: 'Myology',
    id: 'muscular',
    name: 'Muscular System',
    subTitle: 'Over 600 Muscles, Striated Sarcomeres & Tendons...',
    badge2: 'CONTRACTILE FORCE',
    chips: ['Deltoid', 'Pectoralis', 'Quadriceps', 'Sarcomere'],
    simulationText: 'Actin-Myosin Sliding Filament Action',
    icon: 'arm-flex',
    color: '#E11D48',
    representativeOrganId: 'muscles',
    category: 'structural',
  },
  {
    systemNumber: 'SYSTEM 03',
    tag: 'Neurology',
    id: 'nervous',
    name: 'Nervous System',
    subTitle: 'Brain, Cerebral Lobes, Spinal Cord & Nerves...',
    badge2: 'SYNAPSE TRANSMISSION',
    chips: ['Cerebrum', 'Cerebellum', 'Brainstem', 'Cranial Nerves'],
    simulationText: 'Electrochemical Impulse Pathways',
    icon: 'brain',
    color: '#7C3AED',
    representativeOrganId: 'brain',
    category: 'regulatory',
  },
  {
    systemNumber: 'SYSTEM 04',
    tag: 'Cardiology',
    id: 'circulatory',
    name: 'Circulatory System',
    subTitle: 'Heart Chambers, Coronary Vessels & Systemic Loops...',
    badge2: 'PULMONARY & SYSTEMIC',
    chips: ['Myocardium', 'Aortic Valve', 'Ventricles', 'Vena Cava'],
    simulationText: 'Continuous Hydrostatic Perfusion Gradient',
    icon: 'heart-pulse',
    color: '#DC2626',
    representativeOrganId: 'heart',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 05',
    tag: 'Pulmonology',
    id: 'respiratory',
    name: 'Respiratory System',
    subTitle: 'Bilateral Lungs, Trachea, Bronchi & Alveoli...',
    badge2: 'GAS DIFFUSION',
    chips: ['Alveoli', 'Trachea', 'Bronchioles', 'Pleural Cavity'],
    simulationText: 'Oxygen Saturation & CO2 Expulsion',
    icon: 'weather-windy',
    color: '#0284C7',
    representativeOrganId: 'lungs',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 06',
    tag: 'Gastroenterology',
    id: 'digestive',
    name: 'Digestive System',
    subTitle: 'Stomach, Intestines, Liver & Biliary Tract...',
    badge2: 'MACERATION & ABSORPTION',
    chips: ['Hepatic Lobes', 'Duodenum', 'Pancreas', 'Gastric Rugae'],
    simulationText: 'Enzymatic Hydrolysis & Nutrient Transport',
    icon: 'food-apple-outline',
    color: '#EA580C',
    representativeOrganId: 'stomach',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 07',
    tag: 'Nephrology',
    id: 'urinary',
    name: 'Urinary System',
    subTitle: 'Kidneys, Nephrons, Ureters & Bladder...',
    badge2: 'PLASMA CLEARANCE',
    chips: ['Renal Cortex', 'Glomerulus', 'Renal Pelvis', 'Ureter'],
    simulationText: 'Electrolyte Balance & Osmotic Regulation',
    icon: 'water-outline',
    color: '#CA8A04',
    representativeOrganId: 'kidneys',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 08',
    tag: 'Reproductive Biology',
    id: 'reproductive',
    name: 'Reproductive System',
    subTitle: 'Gonads, Gametogenesis, Uterus & Endocrine Loop...',
    badge2: 'GAMETOGENESIS',
    chips: ['Gonads', 'Steroidogenesis', 'Gametes', 'Pelvic Viscera'],
    simulationText: 'Hormonal Cycling & Gamete Maturation',
    icon: 'gender-male-female',
    color: '#D946EF',
    representativeOrganId: 'reproductive',
    category: 'visceral',
  },
  {
    systemNumber: 'SYSTEM 09',
    tag: 'Endocrinology',
    id: 'endocrine',
    name: 'Endocrine System',
    subTitle: 'Thyroid, Adrenal Glands, Pituitary & Hormone Loop...',
    badge2: 'CHEMICAL MESSENGERS',
    chips: ['Thyroid Lobes', 'T3 / T4', 'Adrenals', 'Parathyroid'],
    simulationText: 'Basal Metabolic Regulation',
    icon: 'molecule',
    color: '#10B981',
    representativeOrganId: 'thyroid',
    category: 'regulatory',
  },
  {
    systemNumber: 'SYSTEM 10',
    tag: 'Immunology',
    id: 'lymphatic',
    name: 'Lymphatic & Immune System',
    subTitle: 'Spleen, Lymph Nodes, Thymus & Interstitial Channels...',
    badge2: 'PATHOGEN SURVEILLANCE',
    chips: ['Spleen', 'Lymph Nodes', 'Thymus', 'Lymphatics'],
    simulationText: 'Adaptive Immunity & Fluid Drainage',
    icon: 'shield-check-outline',
    color: '#8B5CF6',
    representativeOrganId: 'spleen',
    category: 'regulatory',
  },
];

export const SystemsScreen: React.FC = () => {
  const navigation = useNavigation<SystemsNavProp>();
  const { selectOrgan, selectSystem } = useAnatomyStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'structural' | 'visceral' | 'regulatory'>('all');

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

        <TouchableOpacity
          style={styles.headerIconBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Search' as any)}
        >
          <Ionicons name="search-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Body Systems</Text>
            <View style={styles.clinicalBadge}>
              <Text style={styles.clinicalBadgeText}>10 SYSTEMS</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            10 Comprehensive Anatomical Systems & Visceral Networks
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
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Search' as any)}
          >
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
              All Systems (10)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeCategory === 'structural' && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory('structural')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bone"
              size={14}
              color={activeCategory === 'structural' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'structural' && styles.filterPillTextActive,
              ]}
            >
              Structural (2)
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
              name="heart-pulse"
              size={14}
              color={activeCategory === 'visceral' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'visceral' && styles.filterPillTextActive,
              ]}
            >
              Visceral (5)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeCategory === 'regulatory' && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory('regulatory')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="brain"
              size={14}
              color={activeCategory === 'regulatory' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeCategory === 'regulatory' && styles.filterPillTextActive,
              ]}
            >
              Regulatory (3)
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
                <View style={styles.thumbnailWrap}>
                  {SYSTEM_IMAGES[system.id] ? (
                    <Image
                      source={SYSTEM_IMAGES[system.id]}
                      style={styles.thumbnailImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={system.icon as any}
                      size={36}
                      color={system.color}
                    />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSystemTitle}>{system.name}</Text>
                  <Text style={styles.cardSystemSubtitle} numberOfLines={1}>
                    {system.subTitle}
                  </Text>

                  <View style={styles.badgesRow}>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>
                        {ORGANS.filter((o) => o.systemId === system.id).length}{' '}
                        {ORGANS.filter((o) => o.systemId === system.id).length === 1
                          ? 'MODELED ORGAN'
                          : 'MODELED ORGANS'}
                      </Text>
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
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
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
