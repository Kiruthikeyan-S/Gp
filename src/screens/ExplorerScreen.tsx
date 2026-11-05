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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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

export const ExplorerScreen: React.FC = () => {
  const navigation = useNavigation<ExplorerNavProp>();
  const route = useRoute<ExplorerRouteProp>();

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

  const [viewMode, setViewMode] = useState<ViewMode3D>('body');
  const [selectedSubPartId, setSelectedSubPartId] = useState<string | null>(
    null
  );
  const [shellMode, setShellMode] = useState<ShellMode>('xray');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showSkeletal, setShowSkeletal] = useState<boolean>(false);
  const [showMuscular, setShowMuscular] = useState<boolean>(false);
  const [showVascular, setShowVascular] = useState<boolean>(true);
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
      setViewMode('body');
      setZoomLevel(100);
    }
  }, [route.params, selectOrgan, selectSystem]);

  const visibleOrgans = ORGANS.filter((organ) => {
    if (selectedSystemId === 'all') return true;
    return organ.systemId === selectedSystemId;
  });

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
          animatePhysiology={animatePhysiology}
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
                  color={showSystemsFilter ? '#38BDF8' : '#E2E8F0'}
                />
                <Text
                  style={[
                    styles.contentsBtnText,
                    showSystemsFilter && { color: '#38BDF8' },
                  ]}
                >
                  {selectedSystemId === 'all'
                    ? 'Systems'
                    : selectedSystemId.toUpperCase()}
                </Text>
              </TouchableOpacity>

              {/* 2-Mode 3D Switcher: Full Body vs Isolate Organ */}
              <View style={styles.modeSegmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.modeSegmentBtn,
                    viewMode === 'body' && styles.modeSegmentBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedSubPartId(null);
                    setViewMode('body');
                    setZoomLevel(100);
                  }}
                >
                  <MaterialCommunityIcons
                    name="human"
                    size={15}
                    color={viewMode === 'body' ? '#0B0F19' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.modeSegmentText,
                      viewMode === 'body' && styles.modeSegmentTextActive,
                    ]}
                  >
                    Full Body
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeSegmentBtn,
                    viewMode === 'isolate' && styles.modeSegmentBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedSubPartId(null);
                    setViewMode('isolate');
                    setZoomLevel(100);
                  }}
                >
                  <MaterialCommunityIcons
                    name="cube-scan"
                    size={15}
                    color={viewMode === 'isolate' ? '#0B0F19' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.modeSegmentText,
                      viewMode === 'isolate' && styles.modeSegmentTextActive,
                    ]}
                  >
                    Solo 3D
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Hide UI Button */}
              <TouchableOpacity
                style={styles.iconGlassBtn}
                onPress={() => setHideInterface(true)}
              >
                <Ionicons name="eye-off-outline" size={18} color="#E2E8F0" />
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
                  onPress={() => {
                    selectSystem('all');
                    setViewMode('body');
                  }}
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
                      onPress={() => {
                        selectSystem(sys.id);
                        setViewMode('body');
                      }}
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
              <View style={styles.touchedPartBanner}>
                <View
                  style={[
                    styles.organDot,
                    { backgroundColor: activeSubPart.color },
                  ]}
                />
                <Text style={styles.touchedPartLabel} numberOfLines={1}>
                  {activeSubPart.name.toUpperCase()}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedSubPartId(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={17} color="#94A3B8" />
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
                color="#38BDF8"
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
                  color={shellMode !== 'hidden' ? '#38BDF8' : '#64748B'}
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
                  color={showVascular ? '#F87171' : '#64748B'}
                />
                <Text style={styles.dockTinyLabel}>VESSEL</Text>
              </TouchableOpacity>
            )}

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
              <Ionicons name="add" size={19} color="#E2E8F0" />
            </TouchableOpacity>

            {/* Zoom Out */}
            <TouchableOpacity
              style={styles.dockBtnSmall}
              onPress={() => setZoomLevel((z) => Math.max(z - 20, 60))}
            >
              <Ionicons name="remove" size={19} color="#E2E8F0" />
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
                color="#38BDF8"
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
                <Ionicons name="chevron-up" size={18} color="#38BDF8" />
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
                    style={styles.secondaryActionBtn}
                    onPress={() => {
                      setViewMode((m) => (m === 'body' ? 'isolate' : 'body'));
                      setSelectedSubPartId(null);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        viewMode === 'body' ? 'cube-scan' : 'human-male-height'
                      }
                      size={16}
                      color="#38BDF8"
                    />
                    <Text style={styles.secondaryActionText}>
                      {viewMode === 'body' ? 'Solo 3D' : 'Full Body'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryActionBtn,
                      { backgroundColor: activeOrgan.accentColor },
                    ]}
                    onPress={() =>
                      navigation.navigate('OrganDetails', {
                        organId: activeOrgan.id,
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  viewportContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0B0F19',
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    gap: 6,
  },
  contentsBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
  },
  contentsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  modeSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  modeSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    gap: 4,
  },
  modeSegmentBtnActive: {
    backgroundColor: '#38BDF8',
  },
  modeSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeSegmentTextActive: {
    color: '#0B0F19',
    fontWeight: '700',
  },
  iconGlassBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    marginRight: 6,
  },
  sysChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  sysChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
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
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#38BDF8',
    gap: 6,
  },
  restoreUiText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  leftFloatingDock: {
    position: 'absolute',
    left: 10,
    top: 64,
    zIndex: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    alignItems: 'center',
    gap: 5,
  },
  dockBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
  },
  dockBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  dockTinyLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  dockBtnSmall: {
    width: 44,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
  },
  rightOrganRailWrapper: {
    position: 'absolute',
    right: 10,
    top: 64,
    bottom: 185,
    zIndex: 15,
    width: 54,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    paddingVertical: 6,
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
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 2,
  },
  railOrganLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94A3B8',
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
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  minimizedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimizedOrganName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  minimizedSystemText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  floatingOrganCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
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
    color: '#F8FAFC',
    marginBottom: 2,
  },
  cardLocationText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  cardFunctionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#CBD5E1',
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
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
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
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginTop: 8,
    gap: 8,
  },
  touchedPartLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.4,
  },
});
