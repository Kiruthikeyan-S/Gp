import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { ORGANS, BODY_SYSTEMS } from '../data/anatomyData';
import { useAnatomyStore, CameraPreset } from '../state/useAnatomyStore';
import { SystemBadge } from '../components/SystemBadge';
import { RootStackParamList, TabParamList, BodySystemId } from '../types';

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

  // If passed from params, select target organ or system
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

  const cameraAngles: { label: string; preset: CameraPreset; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { label: 'Front', preset: 'front', icon: 'human' },
    { label: 'Side', preset: 'side', icon: 'human-male' },
    { label: 'Back', preset: 'back', icon: 'human-child' },
    { label: '3D Iso', preset: 'isometric', icon: 'axis-arrow' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Top Bar with System Filter Selector */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>3D Anatomy Explorer</Text>
          <View style={styles.zoomBadge}>
            <Text style={styles.zoomText}>Zoom: {zoomLevel}%</Text>
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

      {/* Main 3D Viewport Staging Area */}
      <View style={styles.viewport}>
        {/* Viewport Overlay Controls (Camera Angles & Zoom) */}
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
                  size={18}
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

        <View style={styles.viewportControlsRight}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.min(z + 10, 180))}
          >
            <Ionicons name="add" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.max(z - 10, 50))}
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

        {/* 3D Staging Canvas & Active Mesh Focus */}
        <View style={styles.canvasContainer}>
          <View style={styles.gridBackground}>
            <View style={styles.gridCircleOuter} />
            <View style={styles.gridCircleInner} />
          </View>

          {/* Model representation with active mesh focus */}
          <View style={styles.modelPlaceholderBox}>
            <View
              style={[
                styles.highlightGazeRing,
                { borderColor: activeOrgan.accentColor },
              ]}
            >
              <MaterialCommunityIcons
                name={activeOrgan.icon as any}
                size={64}
                color={activeOrgan.accentColor}
              />
            </View>
            <View style={styles.meshTag}>
              <View style={[styles.statusDot, { backgroundColor: activeOrgan.accentColor }]} />
              <Text style={styles.meshNameText}>Selected: {activeOrgan.meshName}</Text>
            </View>
            <Text style={styles.viewAngleHint}>
              Perspective: {cameraPreset.toUpperCase()} • Scale: {(zoomLevel / 100).toFixed(1)}x
            </Text>
            <Text style={styles.gestureHint}>
              Phase 1 Staging • Drag to rotate 360° • Pinch to zoom
            </Text>
          </View>
        </View>

        {/* Quick Horizontal Organ Selector Carousel */}
        <View style={styles.organSelectorBar}>
          <Text style={styles.organSelectorTitle}>Selectable Organs ({visibleOrgans.length})</Text>
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
                    size={16}
                    color={organ.accentColor}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.organChipText,
                      isSelected && { color: organ.accentColor, fontWeight: '700' },
                    ]}
                  >
                    {organ.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
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
            onPress={() => navigation.navigate('OrganDetails', { organId: activeOrgan.id })}
          >
            <Text style={styles.exploreMoreText}>View Deep Anatomy & Facts</Text>
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
    paddingTop: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  zoomBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  zoomText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewport: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  viewportControlsLeft: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: theme.borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  viewControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  viewControlBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  viewControlText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  viewControlTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewportControlsRight: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  zoomBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...theme.shadows.card,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCircleOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  gridCircleInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modelPlaceholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  highlightGazeRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.hover,
  },
  meshTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  meshNameText: {
    ...theme.typography.small,
    color: theme.colors.textPrimary,
    fontFamily: 'monospace',
  },
  viewAngleHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  gestureHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  organSelectorBar: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  organSelectorTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 4,
  },
  organChipsScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
  },
  organChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: 8,
  },
  organChipText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  bottomDrawer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    ...theme.shadows.hover,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerOrganName: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  drawerBookmark: {
    padding: 4,
  },
  drawerFunction: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
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
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  exploreMoreText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 6,
  },
});
