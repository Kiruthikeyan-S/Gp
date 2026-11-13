import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useIsFocused, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ORGANS } from '../data/anatomyData';
import { ORGAN_SUB_PARTS, getSubPartColor } from '../data/organSubParts';
import { Anatomy3DViewport } from '../three/Anatomy3DViewport';
import { useAnatomyStore, CameraPreset } from '../state/useAnatomyStore';
import { RootStackParamList } from '../types';

type DetailsRouteProp = RouteProp<RootStackParamList, 'OrganDetails'>;
type DetailsNavProp = NativeStackNavigationProp<RootStackParamList>;

interface OrganClinicalSpecData {
  latinName: string;
  taxonomy: string;
  system: string;
  systemSub: string;
  topography: string;
  topographySub: string;
  mass: string;
  proportions: string;
  vascularSupply: string;
  vascularSupplySub: string;
  physiologySummary: string;
}

const CLINICAL_SPECS: Record<string, OrganClinicalSpecData> = {
  heart: {
    latinName: 'Heart (Cor) Details',
    taxonomy: 'Cardiovascular Taxonomy',
    system: 'Circulatory System',
    systemSub: 'Cardiovascular network',
    topography: 'Middle Mediastinum',
    topographySub: 'Vertebral levels T5 - T8',
    mass: '~300g (Adult Male)',
    proportions: '12 x 8.5 x 6 cm',
    vascularSupply: 'LCA & RCA',
    vascularSupplySub: 'Coronary arteries',
    physiologySummary:
      'Systemic & Pulmonary Perfusion: Serves as a synchronized dual muscular pump sustaining continuous hydrostatic pressure gradients across pulmonary alveoli and systemic capillary beds.',
  },
  lungs: {
    latinName: 'Lungs (Pulmones) Details',
    taxonomy: 'Respiratory Taxonomy',
    system: 'Respiratory System',
    systemSub: 'Pulmonary network',
    topography: 'Thoracic Cavity',
    topographySub: 'Bilateral pleural cavities',
    mass: '~1000g (Combined)',
    proportions: '25 x 15 x 10 cm',
    vascularSupply: 'Bronchial & Pulmonary',
    vascularSupplySub: 'Dual blood supply',
    physiologySummary:
      'Alveolar Gas Exchange: Facilitates rapid diffusion of oxygen into hemoglobin and expulsion of metabolic CO2 across 300 million alveoli with 70 m² total surface area.',
  },
  brain: {
    latinName: 'Brain (Encephalon) Details',
    taxonomy: 'Neuroanatomy Taxonomy',
    system: 'Nervous System',
    systemSub: 'Central nervous system',
    topography: 'Cranial Cavity',
    topographySub: 'Anterior & middle cranial fossae',
    mass: '~1400g (Adult)',
    proportions: '16.7 x 14 x 9.3 cm',
    vascularSupply: 'Circle of Willis',
    vascularSupplySub: 'ICA & Vertebral arteries',
    physiologySummary:
      'Neural Integration: Integrates sensory afferents, coordinates motor efferents, and houses executive cognitive processing via 86 billion interconnected neurons.',
  },
  liver: {
    latinName: 'Liver (Hepar) Details',
    taxonomy: 'Gastroenterology Taxonomy',
    system: 'Digestive System',
    systemSub: 'Hepatobiliary network',
    topography: 'Right Hypochondrium',
    topographySub: 'Epigastrium & subphrenic space',
    mass: '~1500g (Adult)',
    proportions: '28 x 16 x 12 cm',
    vascularSupply: 'Hepatic Artery & Portal Vein',
    vascularSupplySub: 'Dual systemic & portal inflow',
    physiologySummary:
      'Metabolic Homeostasis: Synthesizes plasma proteins, stores glycogen, metabolizes xenobiotics, and continuously produces bile to emulsify dietary lipids.',
  },
  stomach: {
    latinName: 'Stomach (Gaster) Details',
    taxonomy: 'Gastric Taxonomy',
    system: 'Digestive System',
    systemSub: 'Upper GI tract',
    topography: 'Left Upper Quadrant',
    topographySub: 'Epigastric & umbilical regions',
    mass: '~150g (Empty)',
    proportions: '25 x 12 x 8 cm',
    vascularSupply: 'Celiac Trunk Branches',
    vascularSupplySub: 'Gastric & gastroepiploic',
    physiologySummary:
      'Chemical & Mechanical Maceration: Parietal acid secretion and pepsin digestion convert solid boluses into acidic chyme delivered to the duodenum.',
  },
  kidneys: {
    latinName: 'Kidneys (Renes) Details',
    taxonomy: 'Nephrology Taxonomy',
    system: 'Urinary System',
    systemSub: 'Renal filtration system',
    topography: 'Retroperitoneum',
    topographySub: 'Vertebral levels T12 - L3',
    mass: '~150g (Per Kidney)',
    proportions: '11 x 6 x 3 cm',
    vascularSupply: 'Renal Arteries',
    vascularSupplySub: '20% of cardiac output',
    physiologySummary:
      'Glomerular Filtration: Filters ~180 L of blood plasma daily, reabsorbing 99% of water and solutes to regulate blood pressure, osmolarity, and pH balance.',
  },
  spleen: {
    latinName: 'Spleen (Lien) Details',
    taxonomy: 'Hematology & Immunology',
    system: 'Lymphatic & Immune',
    systemSub: 'Secondary lymphoid organ',
    topography: 'Left Hypochondrium',
    topographySub: 'Beneath ribs 9 - 11',
    mass: '~150g (Adult)',
    proportions: '12 x 7 x 4 cm',
    vascularSupply: 'Splenic Artery (Celiac Trunk)',
    vascularSupplySub: 'Splenic vein to portal axis',
    physiologySummary:
      'Erythrocyte Quality Control & Immunosurveillance: Filters senescent red blood cells in the splenic cords (red pulp) and mounts humoral and cell-mediated immune responses in white pulp follicles.',
  },
  pancreas: {
    latinName: 'Pancreas Details',
    taxonomy: 'Endocrinology & GI Network',
    system: 'Digestive & Endocrine',
    systemSub: 'Dual exocrine & endocrine gland',
    topography: 'Retroperitoneum',
    topographySub: 'Transverse along posterior abdominal wall',
    mass: '~90g (Adult)',
    proportions: '15 x 4 x 2 cm',
    vascularSupply: 'Splenic & Pancreaticoduodenal',
    vascularSupplySub: 'Celiac and SMA arcade branches',
    physiologySummary:
      'Digestive Enzyme & Glycemic Regulation: Acinar cells secrete pancreatic amylase, lipase, and proteases, while Islets of Langerhans beta cells secrete insulin and alpha cells secrete glucagon.',
  },
  small_intestine: {
    latinName: 'Small Intestine (Intestinum Tenue)',
    taxonomy: 'Gastroenterology Taxonomy',
    system: 'Digestive System',
    systemSub: 'Primary nutrient absorption tract',
    topography: 'Central & Lower Abdomen',
    topographySub: 'Umbilical and hypogastric regions',
    mass: '~1500g (Empty)',
    proportions: '6 meters x 2.5 cm',
    vascularSupply: 'Superior Mesenteric Artery',
    vascularSupplySub: 'Jejunal & ileal branches',
    physiologySummary:
      'Terminal Enzymatic Breakdown & Absorption: Circular plicae and 250 m² of enterocyte microvilli maximize active transport of amino acids, monosaccharides, and micellar lipids into mesenteric capillaries and lacteals.',
  },
  large_intestine: {
    latinName: 'Large Intestine (Colon & Rectum)',
    taxonomy: 'Colorectal Taxonomy',
    system: 'Digestive System',
    systemSub: 'Water recovery & compaction tract',
    topography: 'Peripheral Abdominal Frame',
    topographySub: 'Flanks small intestinal coils',
    mass: '~1200g (Empty)',
    proportions: '1.5 meters x 6.5 cm',
    vascularSupply: 'SMA & IMA Collateral Arcades',
    vascularSupplySub: 'Marginal artery of Drummond',
    physiologySummary:
      'Fluid Electrolyte Reclamation: Recovers 90% of entering water, houses commensal microbiota synthesizing vitamin K, and propels semi-solid waste toward the rectal vault via haustral churning.',
  },
  skeleton: {
    latinName: 'Skeleton (Systema Skeletale)',
    taxonomy: 'Osteology & Structural Framework',
    system: 'Skeletal System',
    systemSub: 'Axial and appendicular framework',
    topography: 'Whole Body Framework',
    topographySub: '206 articulated and fused bones',
    mass: '~10 - 12 kg (Adult male)',
    proportions: '175 cm standing height',
    vascularSupply: 'Nutrient & Periosteal Arteries',
    vascularSupplySub: 'Haversian canal microperfusion',
    physiologySummary:
      'Mechanical Support & Mineral Homeostasis: Provides structural levers for locomotion, protects thoracic and cranial cavities, houses hematopoiesis in red marrow, and buffers 99% of body calcium and phosphate.',
  },
  muscles: {
    latinName: 'Muscles (Systema Musculare)',
    taxonomy: 'Myology & Locomotion',
    system: 'Muscular System',
    systemSub: 'Over 600 skeletal muscles',
    topography: 'Superficial & Deep Compartments',
    topographySub: 'Attached to skeleton via tendons',
    mass: '~30 - 40 kg (40% total body mass)',
    proportions: 'Whole body coverage',
    vascularSupply: 'Muscular Arteries & Capillary Beds',
    vascularSupplySub: 'Up to 20x perfusion during exercise',
    physiologySummary:
      'Contractile Locomotion & Thermogenesis: Cross-bridge cycling of actin and myosin generates mechanical work for posture and voluntary movement while generating substantial basal metabolic heat.',
  },
  thyroid: {
    latinName: 'Thyroid Gland (Glandula Thyroidea)',
    taxonomy: 'Endocrine System',
    system: 'Endocrine System',
    systemSub: 'Metabolic regulatory gland',
    topography: 'Anterior Cervical Visceral Space',
    topographySub: 'Anterior to tracheal rings 2 - 4',
    mass: '~20 - 25g (Adult)',
    proportions: '5 x 3 x 2 cm (Per lobe)',
    vascularSupply: 'Superior & Inferior Thyroid Arteries',
    vascularSupplySub: 'Highest blood flow per gram tissue',
    physiologySummary:
      'Basal Metabolic Rate Control: Follicular thyrocytes synthesize thyroxine (T4) and triiodothyronine (T3) to stimulate mitochondrial ATP production, thermogenesis, and tissue growth under hypothalamic-pituitary TSH control.',
  },
  lymph_nodes: {
    latinName: 'Lymphatic Network (Systema Lymphaticum)',
    taxonomy: 'Immunology & Fluid Homeostasis',
    system: 'Lymphatic & Immune',
    systemSub: '600+ encapsulated lymph nodes',
    topography: 'Cervical, Axillary, Inguinal & Mesenteric',
    topographySub: 'Distributed along lymphatic trunks',
    mass: '~1 - 2 kg (Combined lymphoid tissue)',
    proportions: 'Nodes 1 - 20 mm, vessels up to 45 cm',
    vascularSupply: 'Hilar Arterioles & Capillaries',
    vascularSupplySub: 'High endothelial venules (HEV)',
    physiologySummary:
      'Interstitial Fluid Clearance & Immune Defense: Returns 3 to 4 liters of filtered extravasated fluid daily back to venous angles while antigen-presenting cells activate B and T lymphocytes within germinal centers.',
  },
  reproductive: {
    latinName: 'Reproductive System (Systema Genitale)',
    taxonomy: 'Reproductive Biology & Endocrinology',
    system: 'Reproductive System',
    systemSub: 'Gonadal and tract morphology',
    topography: 'Pelvic Cavity & Perineum',
    topographySub: 'Enclosed within lesser pelvic basin',
    mass: '~50 - 100g (Internal structures)',
    proportions: 'Pelvic basin span',
    vascularSupply: 'Gonadal & Internal Iliac Branches',
    vascularSupplySub: 'Ovarian/Testicular & uterine arteries',
    physiologySummary:
      'Gametogenesis & Endocrine Regulation: Synthesizes sex steroids (estrogen, progesterone, testosterone) to promote secondary sexual characteristics, support gametogenesis, and sustain reproductive continuity.',
  },
};

export const OrganDetailsScreen: React.FC = () => {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<DetailsNavProp>();
  const isFocused = useIsFocused();
  const { organId, subPartId: initialSubPartId } = route.params;

  const {
    selectOrgan,
    toggleBookmark,
    isBookmarked,
  } = useAnatomyStore();

  const organ = ORGANS.find((o) => o.id === organId) || ORGANS[1]; // default heart
  const bookmarked = isBookmarked(organ.id);
  const organSubParts = ORGAN_SUB_PARTS[organ.id] || [];

  const [activeSpotlightId, setActiveSpotlightId] = useState<string | null>(
    initialSubPartId || null
  );
  const [activeAngle, setActiveAngle] = useState<'FRONT' | 'LATERAL' | 'ISO'>('FRONT');

  const cameraPreset: CameraPreset =
    activeAngle === 'LATERAL'
      ? 'side'
      : activeAngle === 'ISO'
      ? 'isometric'
      : 'front';

  const activeSpotlight =
    organSubParts.find((sp) => sp.id === activeSpotlightId) || null;

  const clinicalData = CLINICAL_SPECS[organ.id] || {
    latinName: `${organ.name} Details`,
    taxonomy: `${organ.systemName} Taxonomy`,
    system: organ.systemName,
    systemSub: `${organ.systemName} network`,
    topography: organ.location,
    topographySub: 'Internal visceral cavity',
    mass: 'Standard Adult Anatomy',
    proportions: 'Anatomical Proportion',
    vascularSupply: 'Systemic Vasculature',
    vascularSupplySub: 'Arterial & venous network',
    physiologySummary: organ.howItWorks,
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${organ.name} Medical Anatomical Reference - 3D Human Anatomy Explorer: ${organ.function}`,
      });
    } catch {
      // ignore
    }
  };

  const handleStart3DDissection = () => {
    selectOrgan(organ.id);
    navigation.navigate('MainTabs', {
      screen: 'ExplorerTab',
      params: { targetOrganId: organ.id },
    } as any);
  };

  const handleAskAITutor = () => {
    navigation.navigate('MainTabs', {
      screen: 'ChatTab',
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Bar matching Image 3 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
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
          <Text style={styles.headerTitle}>{clinicalData.latinName}</Text>
          <View style={styles.taxonomyRow}>
            <View style={styles.taxonomyDot} />
            <Text style={styles.headerSubtitle}>{clinicalData.taxonomy}</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => toggleBookmark(organ.id)}
          >
            <MaterialCommunityIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? '#0284C7' : '#0F172A'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={19} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive 3D Render Banner Card matching Image 3 */}
        <View style={styles.renderCard}>
          {/* Top Render Badges */}
          <View style={styles.renderTopBadgesRow}>
            <View style={styles.liveRenderBadge}>
              <View style={styles.liveRedDot} />
              <Text style={styles.liveRenderText}>LIVE 3D RENDER</Text>
            </View>

            <TouchableOpacity
              style={styles.crossSectionBtn}
              onPress={handleStart3DDissection}
            >
              <MaterialCommunityIcons name="layers-outline" size={13} color="#0284C7" />
              <Text style={styles.crossSectionText}>CROSS-SECTION</Text>
            </TouchableOpacity>
          </View>

          {/* 3D Visual Box with Interactive 360 Viewport */}
          <View style={styles.renderCanvasBox}>
            <Anatomy3DViewport
              selectedOrganId={organ.id}
              selectedSubPartId={activeSpotlightId}
              selectedSystemId={organ.systemId as any}
              cameraPreset={cameraPreset}
              zoomLevel={100}
              viewMode="isolate"
              shellMode="hidden"
              showSkeletal={false}
              showMuscular={false}
              showVascular={false}
              animatePhysiology={true}
              canvasBackgroundColor="#F1F5F9"
              isActive={isFocused}
              onSelectOrgan={() => {}}
              onSelectSubPart={(subPartId) => {
                setActiveSpotlightId(subPartId);
              }}
            />

            {/* Active Spotlight floating pill tag if a part is highlighted */}
            {activeSpotlight && (
              <View style={styles.spotlightFloatingPill}>
                <View
                  style={[
                    styles.spotlightDot,
                    { backgroundColor: getSubPartColor(activeSpotlight.id) },
                  ]}
                />
                <Text
                  style={[
                    styles.spotlightPillText,
                    { color: getSubPartColor(activeSpotlight.id) },
                  ]}
                  numberOfLines={1}
                >
                  {activeSpotlight.name.toUpperCase()}
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveSpotlightId(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.spotlightCloseBtn}
                >
                  <Ionicons name="close-circle" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom Rotation Ribbon */}
          <View style={styles.renderBottomRibbon}>
            <View style={styles.rotateHintRow}>
              <MaterialCommunityIcons name="gesture-swipe" size={15} color="#64748B" />
              <Text style={styles.rotateHintText}>Drag to rotate 360°</Text>
            </View>

            <View style={styles.anglePillsRow}>
              {(['FRONT', 'LATERAL', 'ISO'] as const).map((ang) => (
                <TouchableOpacity
                  key={ang}
                  style={[
                    styles.anglePill,
                    activeAngle === ang && styles.anglePillActive,
                  ]}
                  onPress={() => setActiveAngle(ang)}
                >
                  <Text
                    style={[
                      styles.anglePillText,
                      activeAngle === ang && styles.anglePillTextActive,
                    ]}
                  >
                    {ang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Anatomical Specifications 2x2 Grid matching Image 3 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Anatomical Specifications</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.graysRefLink}>GRAY'S ANATOMY 42ND ED</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.specsGrid}>
          {/* Box 1: Organ System */}
          <View style={styles.specBox}>
            <View style={styles.specIconRow}>
              <MaterialCommunityIcons name="heart-pulse" size={17} color="#DC2626" />
              <Text style={styles.specLabel}>ORGAN SYSTEM</Text>
            </View>
            <Text style={styles.specMainText}>{clinicalData.system}</Text>
            <Text style={styles.specSubText}>{clinicalData.systemSub}</Text>
          </View>

          {/* Box 2: Topography */}
          <View style={styles.specBox}>
            <View style={styles.specIconRow}>
              <Ionicons name="compass-outline" size={17} color="#0284C7" />
              <Text style={styles.specLabel}>TOPOGRAPHY</Text>
            </View>
            <Text style={styles.specMainText}>{clinicalData.topography}</Text>
            <Text style={styles.specSubText}>{clinicalData.topographySub}</Text>
          </View>

          {/* Box 3: Mass & Proportions */}
          <View style={styles.specBox}>
            <View style={styles.specIconRow}>
              <MaterialCommunityIcons name="scale-bathroom" size={17} color="#7C3AED" />
              <Text style={styles.specLabel}>MASS & PROPORTIONS</Text>
            </View>
            <Text style={styles.specMainText}>{clinicalData.mass}</Text>
            <Text style={styles.specSubText}>{clinicalData.proportions}</Text>
          </View>

          {/* Box 4: Vascular Supply */}
          <View style={styles.specBox}>
            <View style={styles.specIconRow}>
              <Ionicons name="water-outline" size={17} color="#0D9488" />
              <Text style={styles.specLabel}>VASCULAR SUPPLY</Text>
            </View>
            <Text style={styles.specMainText}>{clinicalData.vascularSupply}</Text>
            <Text style={styles.specSubText}>{clinicalData.vascularSupplySub}</Text>
          </View>
        </View>

        {/* Histological Layers & Sub-Parts matching Image 3 */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Histological Layers & Valves</Text>
            <Text style={styles.sectionSubHeading}>
              Select zone to spotlight in interactive viewport
            </Text>
          </View>
          <View style={styles.regionsBadge}>
            <Text style={styles.regionsBadgeText}>
              {organSubParts.length} REGIONS
            </Text>
          </View>
        </View>

        <View style={styles.histologyList}>
          {organSubParts.map((sp, idx) => {
            const isSpotlighted = activeSpotlightId === sp.id;
            const partColor = getSubPartColor(sp.id);
            return (
              <TouchableOpacity
                key={sp.id}
                style={[
                  styles.histologyCard,
                  isSpotlighted && {
                    borderColor: partColor,
                    backgroundColor: `${partColor}10`,
                  },
                ]}
                activeOpacity={0.88}
                onPress={() =>
                  setActiveSpotlightId((prev) => (prev === sp.id ? null : sp.id))
                }
              >
                <View
                  style={[
                    styles.histologyNumBadge,
                    isSpotlighted && { backgroundColor: partColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.histologyNumText,
                      isSpotlighted && styles.histologyNumTextActive,
                    ]}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.histologyTitleRow}>
                    <Text style={styles.histologyTitle}>{sp.name}</Text>
                    {isSpotlighted && (
                      <View
                        style={[
                          styles.spotlightTag,
                          { backgroundColor: `${partColor}22` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.spotlightTagText,
                            { color: partColor },
                          ]}
                        >
                          ACTIVE SPOTLIGHT
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.histologyDesc}>{sp.description}</Text>
                </View>

                <MaterialCommunityIcons
                  name={isSpotlighted ? 'crosshairs-gps' : 'chevron-right'}
                  size={18}
                  color={isSpotlighted ? partColor : '#94A3B8'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Clinical Physiology Card matching Image 3 */}
        <View style={styles.physiologyBox}>
          <View style={styles.physiologyHeaderRow}>
            <View style={styles.physiologyTitleWrap}>
              <MaterialCommunityIcons name="pulse" size={18} color="#0284C7" />
              <Text style={styles.physiologyTitle}>Clinical Physiology</Text>
            </View>
            <View style={styles.coreMechanismBadge}>
              <Text style={styles.coreMechanismText}>CORE MECHANISM</Text>
            </View>
          </View>
          <Text style={styles.physiologyBody}>
            {clinicalData.physiologySummary}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar matching Image 3 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryDissectBtn}
          activeOpacity={0.88}
          onPress={handleStart3DDissection}
        >
          <MaterialCommunityIcons name="cube-scan" size={17} color="#FFFFFF" />
          <Text style={styles.primaryDissectText}>Start 3D Dissection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryQuizBtn}
          activeOpacity={0.85}
          onPress={handleAskAITutor}
        >
          <MaterialCommunityIcons name="robot-outline" size={16} color="#0284C7" />
          <Text style={styles.secondaryQuizText}>Ask AI Tutor</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  headerBackBtn: {
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  taxonomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  taxonomyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DC2626',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  renderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  renderTopBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveRenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  liveRenderText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  crossSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  crossSectionText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  renderCanvasBox: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  spotlightFloatingPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spotlightDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  spotlightPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  spotlightCloseBtn: {
    marginLeft: 2,
  },
  renderBottomRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rotateHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rotateHintText: {
    fontSize: 11,
    color: '#64748B',
  },
  anglePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  anglePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  anglePillActive: {
    backgroundColor: '#0284C7',
  },
  anglePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  anglePillTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubHeading: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  graysRefLink: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  specBox: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  specMainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  specSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  regionsBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  regionsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  histologyList: {
    gap: 10,
    marginBottom: 18,
  },
  histologyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  histologyCardSpotlighted: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  histologyNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  histologyNumBadgeActive: {
    backgroundColor: '#0284C7',
  },
  histologyNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  histologyNumTextActive: {
    color: '#FFFFFF',
  },
  histologyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  histologyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  spotlightTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spotlightTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0284C7',
  },
  histologyDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
    marginTop: 2,
  },
  physiologyBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  physiologyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  physiologyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  physiologyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  coreMechanismBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coreMechanismText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0284C7',
  },
  physiologyBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#0369A1',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryDissectBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryDissectText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryQuizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryQuizText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
});
