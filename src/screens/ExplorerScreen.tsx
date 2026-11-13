import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ORGANS, BODY_SYSTEMS } from '../data/anatomyData';
import { ORGAN_SUB_PARTS, OrganSubPart } from '../data/organSubParts';
import { useAnatomyStore, CameraPreset } from '../state/useAnatomyStore';
import {
  Anatomy3DViewport,
  ViewMode3D,
  ShellMode,
} from '../three/Anatomy3DViewport';
import { RootStackParamList, TabParamList } from '../types';

type ExplorerRouteProp = RouteProp<TabParamList, 'ExplorerTab'>;
type ExplorerNavProp = NativeStackNavigationProp<RootStackParamList>;

const CAMERA_SEQUENCE: { preset: CameraPreset; label: string }[] = [
  { preset: 'front', label: 'FRONT' },
  { preset: 'side', label: 'SIDE' },
  { preset: 'back', label: 'BACK' },
  { preset: 'isometric', label: 'ISO' },
];

const SYSTEM_PRIMARY_ORGAN: Record<string, string> = {
  skeletal: 'skeleton',
  muscular: 'muscles',
  nervous: 'brain',
  circulatory: 'heart',
  respiratory: 'lungs',
  digestive: 'stomach',
  urinary: 'kidneys',
  endocrine: 'thyroid',
  lymphatic: 'spleen',
  reproductive: 'reproductive',
};

export const ExplorerScreen: React.FC = () => {
  const navigation = useNavigation<ExplorerNavProp>();
  const route = useRoute<ExplorerRouteProp>();
  const isFocused = useIsFocused();

  const {
    selectedOrganId,
    selectedSystemId,
    cameraPreset,
    selectOrgan,
    selectSystem,
    setCameraPreset,
    toggleBookmark,
    isBookmarked,
  } = useAnatomyStore();

  const [viewMode, setViewMode] = useState<ViewMode3D>('isolate');
  const [selectedSubPartId, setSelectedSubPartId] = useState<string | null>(
    null
  );
  const [shellMode, setShellMode] = useState<ShellMode>('xray');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showSkeletal, setShowSkeletal] = useState<boolean>(false);
  const [showMuscular, setShowMuscular] = useState<boolean>(false);
  const [showVascular, setShowVascular] = useState<boolean>(true);
  const [showInternalOrgans, setShowInternalOrgans] = useState<boolean>(true);
  const [showNervous, setShowNervous] = useState<boolean>(true);
  const [showLayersDrawer, setShowLayersDrawer] = useState<boolean>(false);
  const [animatePhysiology, setAnimatePhysiology] = useState<boolean>(true);
  const [showSystemsFilter, setShowSystemsFilter] = useState<boolean>(false);
  const [isCardMinimized, setIsCardMinimized] = useState<boolean>(false);
  const [hideInterface, setHideInterface] = useState<boolean>(false);

  React.useEffect(() => {
    if (route.params?.targetOrganId) {
      selectOrgan(route.params.targetOrganId);
      setSelectedSubPartId(null);
      setViewMode('isolate');
      setZoomLevel(100);
      setIsCardMinimized(false);
    }
    if (route.params?.targetSystemId) {
      selectSystem(route.params.targetSystemId);
      setSelectedSubPartId(null);
      setViewMode('isolate');
      setZoomLevel(100);
    }
  }, [route.params, selectOrgan, selectSystem]);

  const visibleOrgans = ORGANS.filter((organ) => {
    if (selectedSystemId === 'all') return true;
    return organ.systemId === selectedSystemId;
  });

  const handleSelectSystem = (sysId: string) => {
    selectSystem(sysId as any);
    setSelectedSubPartId(null);
    if (sysId === 'all') {
      setShowInternalOrgans(true);
      setShowSkeletal(false);
      setShowMuscular(false);
      setShowVascular(true);
      setShowNervous(true);
      setViewMode('isolate');
    } else {
      const primaryOrganId = SYSTEM_PRIMARY_ORGAN[sysId];
      if (primaryOrganId) {
        selectOrgan(primaryOrganId);
      }
      if (sysId === 'skeletal') {
        setShowSkeletal(true);
        setShowMuscular(false);
        setShowInternalOrgans(false);
        setShowNervous(false);
        setShowVascular(false);
      } else if (sysId === 'muscular') {
        setShowMuscular(true);
        setShowSkeletal(false);
        setShowInternalOrgans(false);
        setShowNervous(false);
        setShowVascular(false);
      } else if (sysId === 'nervous') {
        setShowNervous(true);
        setShowSkeletal(true);
        setShowInternalOrgans(false);
        setShowMuscular(false);
        setShowVascular(false);
      } else if (sysId === 'circulatory') {
        setShowVascular(true);
        setShowInternalOrgans(true);
        setShowSkeletal(false);
        setShowMuscular(false);
      } else {
        setShowInternalOrgans(true);
        setShowSkeletal(false);
        setShowMuscular(false);
      }
      setViewMode('isolate');
      setZoomLevel(100);
      setIsCardMinimized(false);
    }
  };

  const activeOrgan =
    ORGANS.find((o) => o.id === selectedOrganId) || ORGANS[1]; // Default Heart
  const bookmarked = isBookmarked(activeOrgan.id);

  const organSubParts: OrganSubPart[] =
    ORGAN_SUB_PARTS[activeOrgan.id] || [];
  const activeSubPart =
    organSubParts.find((sp) => sp.id === selectedSubPartId) || null;

  const cycleCameraPreset = () => {
    const idx = CAMERA_SEQUENCE.findIndex((c) => c.preset === cameraPreset);
    const next = CAMERA_SEQUENCE[(idx + 1) % CAMERA_SEQUENCE.length];
    setCameraPreset(next.preset);
  };

  const cycleShellMode = () => {
    setShellMode((prev) =>
      prev === 'xray' ? 'solid' : prev === 'solid' ? 'hidden' : 'xray'
    );
  };

  const currentCamLabel =
    CAMERA_SEQUENCE.find((c) => c.preset === cameraPreset)?.label || 'FRONT';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.viewportContainer}>
        {/* Full-Screen Immersive 3D Viewport */}
        <Anatomy3DViewport
          selectedOrganId={activeOrgan.id}
          selectedSubPartId={selectedSubPartId}
          selectedSystemId={selectedSystemId}
          cameraPreset={cameraPreset}
          zoomLevel={zoomLevel}
          viewMode={viewMode}
          shellMode={shellMode}
          showSkeletal={showSkeletal}
          showMuscular={showMuscular}
          showVascular={showVascular}
          showInternalOrgans={showInternalOrgans}
          showNervous={showNervous}
          animatePhysiology={animatePhysiology}
          canvasBackgroundColor="#ffebff"
          isActive={isFocused}
          onSelectOrgan={(organId) => {
            if (organId !== activeOrgan.id || viewMode !== 'isolate') {
              setSelectedSubPartId(null);
            }
            selectOrgan(organId);
            setViewMode('isolate');
            setZoomLevel(100);
            setIsCardMinimized(false);
          }}
          onSelectSubPart={(subPartId) => {
            setSelectedSubPartId(subPartId);
            setIsCardMinimized(false);
          }}
        />

        {/* TOP FLOATING BAR: View Mode Switcher (Full Body vs Isolated Organ) & Systems Button */}
        {!hideInterface && (
          <View style={styles.topFloatingContainer}>
            <View style={styles.topBarRow}>
              {/* Systems Drawer Toggle Button (Like Image 3 "CONTENTS") */}
              <TouchableOpacity
                style={[
                  styles.contentsBtn,
                  showSystemsFilter && styles.contentsBtnActive,
                ]}
                onPress={() => setShowSystemsFilter((v) => !v)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="layers-triple-outline"
                  size={17}
                  color={showSystemsFilter ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.contentsBtnText,
                    showSystemsFilter && { color: '#0284C7' },
                  ]}
                >
                  {selectedSystemId === 'all'
                    ? 'Systems'
                    : selectedSystemId.toUpperCase()}
                </Text>
              </TouchableOpacity>

              {/* Dedicated Solo 3D Atlas Mode Indicator (Organ Focus Only) */}
              <View style={styles.soloModeBadge}>
                <MaterialCommunityIcons
                  name="cube-scan"
                  size={15}
                  color="#0284C7"
                />
                <Text style={styles.soloModeBadgeText}>
                  Solo 3D Atlas
                </Text>
              </View>

              {/* Hide UI Button */}
              <TouchableOpacity
                style={styles.iconGlassBtn}
                onPress={() => setHideInterface(true)}
              >
                <Ionicons name="eye-off-outline" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Collapsible Compact System Filter Ribbon */}
            {showSystemsFilter && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.systemsRibbon}
              >
                <TouchableOpacity
                  style={[
                    styles.sysChip,
                    selectedSystemId === 'all' && styles.sysChipActive,
                  ]}
                  onPress={() => handleSelectSystem('all')}
                >
                  <Text
                    style={[
                      styles.sysChipText,
                      selectedSystemId === 'all' && styles.sysChipTextActive,
                    ]}
                  >
                    All Systems
                  </Text>
                </TouchableOpacity>
                {BODY_SYSTEMS.map((sys) => {
                  const active = selectedSystemId === sys.id;
                  return (
                    <TouchableOpacity
                      key={sys.id}
                      style={[
                        styles.sysChip,
                        active && {
                          backgroundColor: sys.color,
                          borderColor: sys.color,
                        },
                      ]}
                      onPress={() => handleSelectSystem(sys.id)}
                    >
                      <Text
                        style={[
                          styles.sysChipText,
                          active && styles.sysChipTextActive,
                        ]}
                      >
                        {sys.name.replace(' System', '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {/* Touch-Activated 3D Part Name Callout Badge (Shows ONLY when a part is touched on the 3D model) */}
            {activeSubPart && (
              <View
                style={[
                  styles.touchedPartBanner,
                  { borderColor: activeSubPart.color },
                ]}
              >
                <View
                  style={[
                    styles.organDot,
                    { backgroundColor: activeSubPart.color },
                  ]}
                />
                <Text
                  style={[
                    styles.touchedPartLabel,
                    { color: activeSubPart.color },
                  ]}
                  numberOfLines={1}
                >
                  {activeSubPart.name.toUpperCase()}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedSubPartId(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={17} color={activeSubPart.color} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Restore UI Floating Pill when Interface is Hidden */}
        {hideInterface && (
          <TouchableOpacity
            style={styles.restoreUiBtn}
            onPress={() => setHideInterface(false)}
          >
            <Ionicons name="eye-outline" size={16} color="#38BDF8" />
            <Text style={styles.restoreUiText}>Show Controls</Text>
          </TouchableOpacity>
        )}

        {/* LEFT VERTICAL FLOATING TOOL DOCK (Matching Image 1 & Image 3) */}
        {!hideInterface && (
          <View style={styles.leftFloatingDock}>
            {/* Camera View Angle Cycler */}
            <TouchableOpacity
              style={styles.dockBtn}
              onPress={cycleCameraPreset}
            >
              <MaterialCommunityIcons
                name="axis-arrow"
                size={19}
                color="#0284C7"
              />
              <Text style={styles.dockTinyLabel}>{currentCamLabel}</Text>
            </TouchableOpacity>

            {/* Body Shell X-Ray / Solid / Hidden Transparency Toggle */}
            {viewMode === 'body' && (
              <TouchableOpacity
                style={[
                  styles.dockBtn,
                  shellMode !== 'hidden' && styles.dockBtnActive,
                ]}
                onPress={cycleShellMode}
              >
                <MaterialCommunityIcons
                  name="human-handsdown"
                  size={19}
                  color={shellMode !== 'hidden' ? '#0284C7' : '#64748B'}
                />
                <Text style={styles.dockTinyLabel}>
                  {shellMode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}

            {/* Vascular Layer Toggle */}
            {viewMode === 'body' && (
              <TouchableOpacity
                style={[styles.dockBtn, showVascular && styles.dockBtnActive]}
                onPress={() => setShowVascular((v) => !v)}
              >
                <MaterialCommunityIcons
                  name="source-branch"
                  size={18}
                  color={showVascular ? '#EF4444' : '#64748B'}
                />
                <Text style={styles.dockTinyLabel}>VESSEL</Text>
              </TouchableOpacity>
            )}

            {/* Skeletal Layer Toggle */}
            {viewMode === 'body' && (
              <TouchableOpacity
                style={[styles.dockBtn, showSkeletal && styles.dockBtnActive]}
                onPress={() => setShowSkeletal((v) => !v)}
              >
                <MaterialCommunityIcons
                  name="bone"
                  size={18}
                  color={showSkeletal ? '#0284C7' : '#64748B'}
                />
                <Text style={styles.dockTinyLabel}>BONE</Text>
              </TouchableOpacity>
            )}

            {/* Muscular Layer Toggle */}
            {viewMode === 'body' && (
              <TouchableOpacity
                style={[styles.dockBtn, showMuscular && styles.dockBtnActive]}
                onPress={() => setShowMuscular((v) => !v)}
              >
                <MaterialCommunityIcons
                  name="arm-flex"
                  size={18}
                  color={showMuscular ? '#E11D48' : '#64748B'}
                />
                <Text style={styles.dockTinyLabel}>MUSCLE</Text>
              </TouchableOpacity>
            )}

            {/* Layers Explorer Drawer Toggle */}
            <TouchableOpacity
              style={[
                styles.dockBtn,
                showLayersDrawer && styles.dockBtnActive,
              ]}
              onPress={() => setShowLayersDrawer((v) => !v)}
            >
              <MaterialCommunityIcons
                name="layers-triple"
                size={18}
                color={showLayersDrawer ? '#0284C7' : '#64748B'}
              />
              <Text style={styles.dockTinyLabel}>LAYERS</Text>
            </TouchableOpacity>

            {/* Live Heartbeat & Breathing Pulse */}
            <TouchableOpacity
              style={[
                styles.dockBtn,
                animatePhysiology && styles.dockBtnActive,
              ]}
              onPress={() => setAnimatePhysiology((v) => !v)}
            >
              <MaterialCommunityIcons
                name="heart-pulse"
                size={18}
                color={animatePhysiology ? '#EF4444' : '#64748B'}
              />
              <Text style={styles.dockTinyLabel}>PULSE</Text>
            </TouchableOpacity>

            {/* Zoom In */}
            <TouchableOpacity
              style={styles.dockBtnSmall}
              onPress={() => setZoomLevel((z) => Math.min(z + 20, 200))}
            >
              <Ionicons name="add" size={19} color="#0F172A" />
            </TouchableOpacity>

            {/* Zoom Out */}
            <TouchableOpacity
              style={styles.dockBtnSmall}
              onPress={() => setZoomLevel((z) => Math.max(z - 20, 60))}
            >
              <Ionicons name="remove" size={19} color="#0F172A" />
            </TouchableOpacity>

            {/* Center / Reset Camera */}
            <TouchableOpacity
              style={styles.dockBtnSmall}
              onPress={() => {
                setZoomLevel(100);
                setCameraPreset('front');
              }}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={17}
                color="#0284C7"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* RIGHT VERTICAL ORGAN QUICK-SELECT RAIL (Matching Image 1) */}
        {!hideInterface && (
          <View style={styles.rightOrganRailWrapper}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.rightOrganRailScroll}
            >
              {(visibleOrgans.length > 0 ? visibleOrgans : ORGANS).map(
                (organ) => {
                  const isSelected = activeOrgan.id === organ.id;
                  return (
                    <TouchableOpacity
                      key={organ.id}
                      style={[
                        styles.railOrganBtn,
                        isSelected && {
                          borderColor: organ.accentColor,
                          backgroundColor: `${organ.accentColor}28`,
                        },
                      ]}
                      onPress={() => {
                        selectOrgan(organ.id);
                        setSelectedSubPartId(null);
                        setViewMode('isolate');
                        setZoomLevel(100);
                        setIsCardMinimized(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={organ.icon as any}
                        size={20}
                        color={isSelected ? organ.accentColor : '#CBD5E1'}
                      />
                      <Text
                        style={[
                          styles.railOrganLabel,
                          isSelected && {
                            color: '#FFFFFF',
                            fontWeight: '700',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {organ.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </View>
        )}

        {/* FLOATING ORGAN INFORMATION CARD (Matching Image 4 MedRoom Callout Hierarchy) */}
        {!hideInterface && (
          <View style={styles.floatingCardWrapper}>
            {isCardMinimized ? (
              /* Minimized Compact Pill */
              <TouchableOpacity
                style={styles.minimizedCardPill}
                onPress={() => setIsCardMinimized(false)}
                activeOpacity={0.9}
              >
                <View style={styles.minimizedLeft}>
                  <View
                    style={[
                      styles.organDot,
                      {
                        backgroundColor: activeSubPart
                          ? activeSubPart.color
                          : activeOrgan.accentColor,
                      },
                    ]}
                  />
                  <Text style={styles.minimizedOrganName}>
                    {activeSubPart
                      ? `${activeOrgan.name}: ${activeSubPart.name}`
                      : activeOrgan.name}
                  </Text>
                  <Text style={styles.minimizedSystemText}>
                    • {activeOrgan.systemName}
                  </Text>
                </View>
                <Ionicons name="chevron-up" size={18} color="#0284C7" />
              </TouchableOpacity>
            ) : (
              /* Expanded Floating Glass Medical Info Card */
              <View style={styles.floatingOrganCard}>
                <View style={styles.cardTopMetaRow}>
                  <View style={styles.systemPill}>
                    <View
                      style={[
                        styles.organDot,
                        {
                          backgroundColor: activeSubPart
                            ? activeSubPart.color
                            : activeOrgan.accentColor,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.systemPillText,
                        { color: activeOrgan.accentColor },
                      ]}
                    >
                      {activeSubPart
                        ? `${activeOrgan.name.toUpperCase()} • HIGHLIGHTED 3D PART`
                        : activeOrgan.systemName.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.cardTopActions}>
                    <TouchableOpacity
                      style={styles.cardIconAction}
                      onPress={() => toggleBookmark(activeOrgan.id)}
                    >
                      <MaterialCommunityIcons
                        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={bookmarked ? '#FBBF24' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardIconAction}
                      onPress={() => setIsCardMinimized(true)}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.cardOrganTitle}>
                  {activeSubPart
                    ? activeSubPart.name.toUpperCase()
                    : activeOrgan.name}
                </Text>
                <Text style={styles.cardLocationText} numberOfLines={1}>
                  {activeSubPart
                    ? `🔬 Part of ${activeOrgan.name} (${activeOrgan.location})`
                    : `📍 ${activeOrgan.location}`}
                </Text>
                <Text style={styles.cardFunctionText} numberOfLines={2}>
                  {activeSubPart
                    ? activeSubPart.description
                    : activeOrgan.function}
                </Text>

                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryActionBtn,
                      { backgroundColor: activeOrgan.accentColor },
                    ]}
                    onPress={() =>
                      navigation.navigate('OrganDetails', {
                        organId: activeOrgan.id,
                        subPartId: selectedSubPartId || undefined,
                      })
                    }
                  >
                    <Text style={styles.primaryActionText}>
                      Organ Details
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* FLOATING BODY LAYER EXPLORER PANEL */}
        {showLayersDrawer && !hideInterface && (
          <View style={styles.layersDrawerCard}>
            <View style={styles.layersDrawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="layers-triple" size={18} color="#0284C7" />
                <Text style={styles.layersDrawerTitle}>Body Layer Explorer</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLayersDrawer(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.layersList}>
              {/* Layer 1: Skin */}
              <View style={styles.layerRow}>
                <View style={styles.layerInfo}>
                  <MaterialCommunityIcons name="human-handsdown" size={18} color="#0284C7" />
                  <Text style={styles.layerName}>Skin / Body Shell</Text>
                </View>
                <TouchableOpacity
                  style={[styles.layerCyclePill, { backgroundColor: '#E0F2FE' }]}
                  onPress={cycleShellMode}
                >
                  <Text style={[styles.layerCycleText, { color: '#0284C7' }]}>
                    {shellMode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Layer 2: Muscles */}
              <View style={styles.layerRow}>
                <View style={styles.layerInfo}>
                  <MaterialCommunityIcons name="arm-flex" size={18} color="#E11D48" />
                  <Text style={styles.layerName}>Muscular System</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.layerTogglePill,
                    showMuscular ? styles.layerTogglePillOn : styles.layerTogglePillOff,
                  ]}
                  onPress={() => setShowMuscular((v) => !v)}
                >
                  <Text
                    style={[
                      styles.layerToggleText,
                      showMuscular ? styles.layerToggleTextOn : styles.layerToggleTextOff,
                    ]}
                  >
                    {showMuscular ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Layer 3: Skeleton */}
              <View style={styles.layerRow}>
                <View style={styles.layerInfo}>
                  <MaterialCommunityIcons name="bone" size={18} color="#64748B" />
                  <Text style={styles.layerName}>Skeletal Framework</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.layerTogglePill,
                    showSkeletal ? styles.layerTogglePillOn : styles.layerTogglePillOff,
                  ]}
                  onPress={() => setShowSkeletal((v) => !v)}
                >
                  <Text
                    style={[
                      styles.layerToggleText,
                      showSkeletal ? styles.layerToggleTextOn : styles.layerToggleTextOff,
                    ]}
                  >
                    {showSkeletal ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Layer 4: Nervous */}
              <View style={styles.layerRow}>
                <View style={styles.layerInfo}>
                  <MaterialCommunityIcons name="brain" size={18} color="#7C3AED" />
                  <Text style={styles.layerName}>Nervous Structures</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.layerTogglePill,
                    showNervous ? styles.layerTogglePillOn : styles.layerTogglePillOff,
                  ]}
                  onPress={() => setShowNervous((v) => !v)}
                >
                  <Text
                    style={[
                      styles.layerToggleText,
                      showNervous ? styles.layerToggleTextOn : styles.layerToggleTextOff,
                    ]}
                  >
                    {showNervous ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Layer 5: Internal Organs */}
              <View style={styles.layerRow}>
                <View style={styles.layerInfo}>
                  <MaterialCommunityIcons name="heart-pulse" size={18} color="#DC2626" />
                  <Text style={styles.layerName}>Internal Organs</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.layerTogglePill,
                    showInternalOrgans ? styles.layerTogglePillOn : styles.layerTogglePillOff,
                  ]}
                  onPress={() => setShowInternalOrgans((v) => !v)}
                >
                  <Text
                    style={[
                      styles.layerToggleText,
                      showInternalOrgans ? styles.layerToggleTextOn : styles.layerToggleTextOff,
                    ]}
                  >
                    {showInternalOrgans ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Layer 6: Vessels */}
              <View style={styles.layerRow}>
                <View style={styles.layerInfo}>
                  <MaterialCommunityIcons name="source-branch" size={18} color="#EF4444" />
                  <Text style={styles.layerName}>Vascular System</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.layerTogglePill,
                    showVascular ? styles.layerTogglePillOn : styles.layerTogglePillOff,
                  ]}
                  onPress={() => setShowVascular((v) => !v)}
                >
                  <Text
                    style={[
                      styles.layerToggleText,
                      showVascular ? styles.layerToggleTextOn : styles.layerToggleTextOff,
                    ]}
                  >
                    {showVascular ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetLayersBtn}
              onPress={() => {
                setShellMode('xray');
                setShowMuscular(true);
                setShowSkeletal(true);
                setShowInternalOrgans(true);
                setShowNervous(true);
                setShowVascular(true);
              }}
            >
              <Ionicons name="refresh" size={14} color="#0284C7" />
              <Text style={styles.resetLayersText}>Reset All Layers</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffebff',
  },
  viewportContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffebff',
  },
  topFloatingContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  contentsBtnActive: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  contentsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  soloModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  soloModeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  viewModeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  viewModeBtnActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  viewModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
  },
  topAtlasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  topAtlasBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  iconGlassBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  systemsRibbon: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  sysChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sysChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  sysChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sysChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  restoreUiBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  restoreUiText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  leftFloatingDock: {
    position: 'absolute',
    left: 10,
    top: 64,
    zIndex: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  dockBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dockBtnActive: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dockTinyLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  dockBtnSmall: {
    width: 44,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rightOrganRailWrapper: {
    position: 'absolute',
    right: 10,
    top: 64,
    bottom: 185,
    zIndex: 15,
    width: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  rightOrganRailScroll: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  railOrganBtn: {
    width: 42,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 2,
  },
  railOrganLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  floatingCardWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    zIndex: 20,
  },
  minimizedCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  minimizedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimizedOrganName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  minimizedSystemText: {
    fontSize: 12,
    color: '#64748B',
  },
  floatingOrganCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 6,
  },
  organDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  systemPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconAction: {
    padding: 2,
  },
  cardOrganTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardLocationText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  cardFunctionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    marginBottom: 12,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  primaryActionBtn: {
    flex: 1.35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  touchedPartBanner: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 8,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  touchedPartLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  layersDrawerCard: {
    position: 'absolute',
    top: 70,
    left: 64,
    right: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  layersDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  layersDrawerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  layersList: {
    paddingVertical: 8,
    gap: 8,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  layerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  layerCyclePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  layerCycleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  layerTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 42,
    alignItems: 'center',
  },
  layerTogglePillOn: {
    backgroundColor: '#DCFCE7',
  },
  layerTogglePillOff: {
    backgroundColor: '#F1F5F9',
  },
  layerToggleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  layerToggleTextOn: {
    color: '#16A34A',
  },
  layerToggleTextOff: {
    color: '#94A3B8',
  },
  resetLayersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  resetLayersText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});
