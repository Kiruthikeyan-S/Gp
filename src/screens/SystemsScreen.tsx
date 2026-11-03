import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { BODY_SYSTEMS, ORGANS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { OrganCard } from '../components/OrganCard';
import { RootStackParamList, TabParamList, BodySystemId } from '../types';

type SystemsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'SystemsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const SystemsScreen: React.FC = () => {
  const navigation = useNavigation<SystemsNavProp>();
  const {
    selectedSystemId,
    selectedOrganId,
    selectSystem,
    selectOrgan,
    toggleBookmark,
    isBookmarked,
  } = useAnatomyStore();

  const [catalogMode, setCatalogMode] = useState<'systems' | 'organs'>(
    'systems'
  );

  const handleSystemPress = (systemId: BodySystemId) => {
    selectSystem(systemId);
    const matchingOrgans = ORGANS.filter((o) => o.systemId === systemId);
    if (matchingOrgans.length > 0) {
      selectOrgan(matchingOrgans[0].id);
    }
    navigation.navigate('ExplorerTab', { targetSystemId: systemId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anatomical Atlas</Text>
        <Text style={styles.headerSubtitle}>
          Explore physiological systems or inspect individual 3D organs.
        </Text>

        {/* Segmented Mode Switcher (Systems vs Organs — inspired by Reference Image 2) */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentPill,
              catalogMode === 'systems' && styles.segmentPillActive,
            ]}
            onPress={() => setCatalogMode('systems')}
          >
            <Text
              style={[
                styles.segmentText,
                catalogMode === 'systems' && styles.segmentTextActive,
              ]}
            >
              Body Systems ({BODY_SYSTEMS.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentPill,
              catalogMode === 'organs' && styles.segmentPillActive,
            ]}
            onPress={() => setCatalogMode('organs')}
          >
            <Text
              style={[
                styles.segmentText,
                catalogMode === 'organs' && styles.segmentTextActive,
              ]}
            >
              Explore Organs ({ORGANS.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {catalogMode === 'systems' ? (
          BODY_SYSTEMS.map((system) => {
            const isSelected = selectedSystemId === system.id;
            const systemOrgans = ORGANS.filter((o) => o.systemId === system.id);

            return (
              <View
                key={system.id}
                style={[
                  styles.systemCard,
                  isSelected && {
                    borderColor: system.color,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: `${system.color}15` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={system.icon as any}
                      size={26}
                      color={system.color}
                    />
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text style={styles.systemName}>{system.name}</Text>
                    <Text style={styles.organCount}>
                      {systemOrgans.length > 0
                        ? `${systemOrgans.length} Key Visceral Organs`
                        : '3D Structural & Motor Layer'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.description}>{system.description}</Text>

                {systemOrgans.length > 0 && (
                  <View style={styles.organsContainer}>
                    <Text style={styles.organsLabel}>
                      Core Anatomical Structures:
                    </Text>
                    <View style={styles.organsChipsWrap}>
                      {systemOrgans.map((organ) => (
                        <TouchableOpacity
                          key={organ.id}
                          style={[
                            styles.organChip,
                            {
                              borderColor: `${system.color}40`,
                              backgroundColor: `${system.color}10`,
                            },
                          ]}
                          onPress={() => {
                            selectOrgan(organ.id);
                            navigation.navigate('OrganDetails', {
                              organId: organ.id,
                            });
                          }}
                        >
                          <MaterialCommunityIcons
                            name={organ.icon as any}
                            size={14}
                            color={system.color}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.organChipText,
                              { color: system.color },
                            ]}
                          >
                            {organ.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.exploreBtn, { backgroundColor: system.color }]}
                  activeOpacity={0.85}
                  onPress={() => handleSystemPress(system.id)}
                >
                  <Text style={styles.exploreBtnText}>
                    Explore in 3D Viewport
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          /* Explore Individual Organs Catalog */
          <View>
            {ORGANS.map((organ) => (
              <OrganCard
                key={organ.id}
                organ={organ}
                isSelected={selectedOrganId === organ.id}
                isBookmarked={isBookmarked(organ.id)}
                onBookmarkToggle={() => toggleBookmark(organ.id)}
                onPress={() => {
                  selectOrgan(organ.id);
                  navigation.navigate('OrganDetails', { organId: organ.id });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
  },
  segmentPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  segmentText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  systemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  systemName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  organCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  organsContainer: {
    marginBottom: theme.spacing.md,
  },
  organsLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  organsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  organChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  organChipText: {
    ...theme.typography.small,
    fontWeight: '600',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  exploreBtnText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 6,
  },
});
