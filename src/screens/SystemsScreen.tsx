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
import { BODY_SYSTEMS, ORGANS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { RootStackParamList, TabParamList, BodySystemId } from '../types';

type SystemsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'SystemsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const SystemsScreen: React.FC = () => {
  const navigation = useNavigation<SystemsNavProp>();
  const {
    selectedSystemId,
    selectSystem,
    selectOrgan,
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

  const handleOrganPress = (organId: string) => {
    selectOrgan(organId);
    navigation.navigate('ExplorerTab', { targetOrganId: organId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Anatomical Catalog</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Atlas</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Select a system or individual organ to inspect in 3D
        </Text>

        {/* Clean Segmented Switcher */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentPill,
              catalogMode === 'systems' && styles.segmentPillActive,
            ]}
            onPress={() => setCatalogMode('systems')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="human-male-height"
              size={16}
              color={catalogMode === 'systems' ? '#0B0F19' : '#94A3B8'}
            />
            <Text
              style={[
                styles.segmentText,
                catalogMode === 'systems' && styles.segmentTextActive,
              ]}
            >
              Systems ({BODY_SYSTEMS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentPill,
              catalogMode === 'organs' && styles.segmentPillActive,
            ]}
            onPress={() => setCatalogMode('organs')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="cube-scan"
              size={15}
              color={catalogMode === 'organs' ? '#0B0F19' : '#94A3B8'}
            />
            <Text
              style={[
                styles.segmentText,
                catalogMode === 'organs' && styles.segmentTextActive,
              ]}
            >
              Organs ({ORGANS.length})
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
                      { backgroundColor: `${system.color}20` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={system.icon as any}
                      size={24}
                      color={system.color}
                    />
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text style={styles.systemName}>{system.name}</Text>
                    <Text style={styles.organCount}>
                      {systemOrgans.length > 0
                        ? `${systemOrgans.length} Organs`
                        : 'Structural Framework'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.view3DBtn,
                      { backgroundColor: `${system.color}20`, borderColor: `${system.color}40` },
                    ]}
                    onPress={() => handleSystemPress(system.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="cube-scan" size={14} color={system.color} />
                    <Text style={[styles.view3DBtnText, { color: system.color }]}>3D View</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.description}>{system.description}</Text>

                {systemOrgans.length > 0 && (
                  <View style={styles.organsChipsWrap}>
                    {systemOrgans.map((organ) => (
                      <TouchableOpacity
                        key={organ.id}
                        style={[
                          styles.organChip,
                          {
                            borderColor: `${system.color}35`,
                            backgroundColor: `${system.color}15`,
                          },
                        ]}
                        onPress={() => handleOrganPress(organ.id)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={organ.icon as any}
                          size={14}
                          color={system.color}
                        />
                        <Text style={[styles.organChipText, { color: system.color }]}>
                          {organ.name}
                        </Text>
                        <Ionicons name="chevron-forward" size={12} color={system.color} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          /* All Organs Grid List */
          <View style={styles.organsGrid}>
            {ORGANS.map((organ) => (
              <TouchableOpacity
                key={organ.id}
                style={styles.organListCard}
                onPress={() => handleOrganPress(organ.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.organListIconWrap,
                    { backgroundColor: `${organ.accentColor}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={organ.icon as any}
                    size={28}
                    color={organ.accentColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.organListName}>{organ.name}</Text>
                  <Text style={styles.organListSystem}>{organ.systemName}</Text>
                  <Text style={styles.organListLocation} numberOfLines={1}>
                    📍 {organ.location}
                  </Text>
                </View>
                <View style={styles.organListAction}>
                  <MaterialCommunityIcons name="cube-scan" size={16} color="#38BDF8" />
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#0B0F19',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  segmentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  segmentPillActive: {
    backgroundColor: '#38BDF8',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#0B0F19',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  systemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  systemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  organCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  view3DBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  view3DBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
    marginBottom: 12,
  },
  organsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  organChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  organChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  organsGrid: {
    gap: 10,
  },
  organListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  organListIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organListName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  organListSystem: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 1,
  },
  organListLocation: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  organListAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 6,
  },
});
