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
import { theme } from '../theme';
import { ORGANS, BODY_SYSTEMS } from '../data/anatomyData';
import { useAnatomyStore, CameraPreset } from '../state/useAnatomyStore';
import { SystemBadge } from '../components/SystemBadge';
import { Anatomy3DViewport } from '../three/Anatomy3DViewport';
import { RootStackParamList, TabParamList } from '../types';

type ExplorerRouteProp = RouteProp<TabParamList, 'ExplorerTab'>;
type ExplorerNavProp = NativeStackNavigationProp<RootStackParamList>;

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

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showBodyShell, setShowBodyShell] = useState<boolean>(true);
  const [showSkeletal, setShowSkeletal] = useState<boolean>(true);
  const [showMuscular, setShowMuscular] = useState<boolean>(false);
  const [animatePhysiology, setAnimatePhysiology] = useState<boolean>(true);

  React.useEffect(() => {
    if (route.params?.targetOrganId) {
      selectOrgan(route.params.targetOrganId);
    }
    if (route.params?.targetSystemId) {
      selectSystem(route.params.targetSystemId);
    }
  }, [route.params, selectOrgan, selectSystem]);

  // Filter organs based on selected body system
  const visibleOrgans = ORGANS.filter((organ) => {
    if (selectedSystemId === 'all') return true;
    return organ.systemId === selectedSystemId;
  });

  const activeOrgan = ORGANS.find((o) => o.id === selectedOrganId) || ORGANS[0];
  const bookmarked = isBookmarked(activeOrgan.id);

  const cameraAngles: {
    label: string;
    preset: CameraPreset;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }[] = [
    { label: 'Front', preset: 'front', icon: 'human' },
    { label: 'Side', preset: 'side', icon: 'human-male' },
    { label: 'Back', preset: 'back', icon: 'human-child' },
    { label: '3D Iso', preset: 'isometric', icon: 'axis-arrow' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar with System Filter Selector */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>3D Human Body Explorer</Text>
          <View style={styles.meshBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: activeOrgan.accentColor },
              ]}
            />
            <Text style={styles.meshBadgeText}>{activeOrgan.meshName}</Text>
          </View>
        </View>

        {/* System Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedSystemId === 'all' && styles.filterPillActive,
            ]}
            onPress={() => selectSystem('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedSystemId === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Systems
            </Text>
          </TouchableOpacity>
          {BODY_SYSTEMS.map((system) => {
            const isActive = selectedSystemId === system.id;
            return (
              <TouchableOpacity
                key={system.id}
                style={[
                  styles.filterPill,
                  isActive && {
                    backgroundColor: system.color,
                    borderColor: system.color,
                  },
                ]}
                onPress={() => selectSystem(system.id)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {system.name.replace(' System', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main 3D Viewport Area */}
      <View style={styles.viewport}>
        {/* Real Interactive Three.js + Expo GL 3D Viewport */}
        <Anatomy3DViewport
          selectedOrganId={selectedOrganId}
          selectedSystemId={selectedSystemId}
          cameraPreset={cameraPreset}
          zoomLevel={zoomLevel}
          showBodyShell={showBodyShell}
          showSkeletal={showSkeletal}
          showMuscular={showMuscular}
          animatePhysiology={animatePhysiology}
          onSelectOrgan={(organId) => selectOrgan(organId)}
        />

        {/* Left Overlay: Camera Angle Presets */}
        <View style={styles.viewportControlsLeft}>
          {cameraAngles.map((cam) => {
            const isActive = cameraPreset === cam.preset;
            return (
              <TouchableOpacity
                key={cam.preset}
                style={[
                  styles.viewControlBtn,
                  isActive && styles.viewControlBtnActive,
                ]}
                onPress={() => setCameraPreset(cam.preset)}
              >
                <MaterialCommunityIcons
                  name={cam.icon as any}
                  size={16}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.viewControlText,
                    isActive && styles.viewControlTextActive,
                  ]}
                >
                  {cam.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Overlay: Zoom & Reset Controls */}
        <View style={styles.viewportControlsRight}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.min(z + 15, 180))}
          >
            <Ionicons name="add" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.max(z - 15, 60))}
          >
            <Ionicons name="remove" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => {
              setZoomLevel(100);
              setCameraPreset('front');
            }}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Bottom-of-Viewport Layer Visibility Toggles */}
        <View style={styles.layerBar}>
          <TouchableOpacity
            style={[
              styles.layerToggle,
              showBodyShell && styles.layerToggleActive,
            ]}
            onPress={() => setShowBodyShell((v) => !v)}
          >
            <MaterialCommunityIcons
              name="human-handsdown"
              size={14}
              color={showBodyShell ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.layerToggleText,
                showBodyShell && styles.layerToggleTextActive,
              ]}
            >
              Body Outline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.layerToggle,
              showSkeletal && styles.layerToggleActive,
            ]}
            onPress={() => setShowSkeletal((v) => !v)}
          >
            <MaterialCommunityIcons
              name="bone"
              size={14}
              color={showSkeletal ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.layerToggleText,
                showSkeletal && styles.layerToggleTextActive,
              ]}
            >
              Skeleton
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.layerToggle,
              showMuscular && styles.layerToggleActive,
            ]}
            onPress={() => setShowMuscular((v) => !v)}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={14}
              color={showMuscular ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.layerToggleText,
                showMuscular && styles.layerToggleTextActive,
              ]}
            >
              Muscles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.layerToggle,
              animatePhysiology && styles.layerToggleActive,
            ]}
            onPress={() => setAnimatePhysiology((v) => !v)}
          >
            <MaterialCommunityIcons
              name="heart-pulse"
              size={14}
              color={
                animatePhysiology ? theme.colors.danger : theme.colors.textMuted
              }
            />
            <Text
              style={[
                styles.layerToggleText,
                animatePhysiology && styles.layerToggleTextActive,
              ]}
            >
              Live Pulse
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Horizontal Organ Selector Carousel */}
      <View style={styles.organSelectorBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.organChipsScroll}
        >
          {visibleOrgans.map((organ) => {
            const isSelected = selectedOrganId === organ.id;
            return (
              <TouchableOpacity
                key={organ.id}
                style={[
                  styles.organChip,
                  isSelected && {
                    borderColor: organ.accentColor,
                    backgroundColor: `${organ.accentColor}18`,
                  },
                ]}
                onPress={() => selectOrgan(organ.id)}
              >
                <MaterialCommunityIcons
                  name={organ.icon as any}
                  size={15}
                  color={organ.accentColor}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.organChipText,
                    isSelected && {
                      color: organ.accentColor,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {organ.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Organ Information Bottom Drawer */}
      <View style={styles.bottomDrawer}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerTitleRow}>
            <Text style={styles.drawerOrganName}>{activeOrgan.name}</Text>
            <SystemBadge
              systemId={activeOrgan.systemId}
              label={activeOrgan.systemName}
              size="sm"
            />
          </View>
          <TouchableOpacity
            style={styles.drawerBookmark}
            onPress={() => toggleBookmark(activeOrgan.id)}
          >
            <MaterialCommunityIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarked ? theme.colors.warning : theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.drawerFunction} numberOfLines={2}>
          {activeOrgan.function}
        </Text>

        <View style={styles.drawerActions}>
          <TouchableOpacity
            style={styles.exploreMoreBtn}
            onPress={() =>
              navigation.navigate('OrganDetails', { organId: activeOrgan.id })
            }
          >
            <Text style={styles.exploreMoreText}>
              View Complete Organ Details & Facts
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  meshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  meshBadgeText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  viewport: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  viewportControlsLeft: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: theme.borderRadius.sm,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  viewControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  viewControlBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  viewControlText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginLeft: 5,
  },
  viewControlTextActive: {
    color: '#FFFFFF',
  },
  viewportControlsRight: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...theme.shadows.card,
  },
  layerBar: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  layerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 4,
  },
  layerToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#E0F2FE',
  },
  layerToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  layerToggleTextActive: {
    color: theme.colors.primaryDark,
  },
  organSelectorBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  organChipsScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
  },
  organChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: 7,
  },
  organChipText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  bottomDrawer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    ...theme.shadows.hover,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerOrganName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  drawerBookmark: {
    padding: 2,
  },
  drawerFunction: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: theme.spacing.sm,
  },
  drawerActions: {
    flexDirection: 'row',
  },
  exploreMoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
  },
  exploreMoreText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 6,
  },
});
