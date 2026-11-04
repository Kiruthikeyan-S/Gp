import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ORGANS } from '../data/anatomyData';
import { REAL_GLB_ORGAN_SPECS } from '../models/realGlbLoader';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { RootStackParamList } from '../types';

type DetailsRouteProp = RouteProp<RootStackParamList, 'OrganDetails'>;
type DetailsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const OrganDetailsScreen: React.FC = () => {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<DetailsNavProp>();
  const { organId } = route.params;

  const {
    selectOrgan,
    toggleBookmark,
    isBookmarked,
  } = useAnatomyStore();

  const organ = ORGANS.find((o) => o.id === organId) || ORGANS[0];
  const glbSpec = REAL_GLB_ORGAN_SPECS.find((s) => s.organId === organ.id);
  const bookmarked = isBookmarked(organ.id);

  const relatedOrgans = ORGANS.filter((o) =>
    organ.relatedOrganIds.includes(o.id)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{organ.name}</Text>
          <Text style={styles.headerSubtitle}>{organ.systemName}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => toggleBookmark(organ.id)}
        >
          <MaterialCommunityIcons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? '#FBBF24' : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Organ Visual Card & 3D Action */}
        <View style={styles.bannerCard}>
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: `${organ.accentColor}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={organ.icon as any}
              size={52}
              color={organ.accentColor}
            />
          </View>
          <Text style={styles.organTitle}>{organ.name}</Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.systemBadge,
                { backgroundColor: `${organ.accentColor}20` },
              ]}
            >
              <Text
                style={[styles.systemBadgeText, { color: organ.accentColor }]}
              >
                {organ.systemName.toUpperCase()}
              </Text>
            </View>

            <View style={styles.scanBadge}>
              <View style={styles.scanDot} />
              <Text style={styles.scanBadgeText}>3D Medical Model</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.jumpTo3dBtn, { backgroundColor: organ.accentColor }]}
            activeOpacity={0.85}
            onPress={() => {
              selectOrgan(organ.id);
              navigation.navigate('MainTabs' as any, {
                screen: 'ExplorerTab',
                params: { targetOrganId: organ.id },
              });
            }}
          >
            <MaterialCommunityIcons
              name="cube-scan"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.jumpTo3dText}>Explore in 3D Atlas</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>

          {glbSpec && (
            <TouchableOpacity
              style={styles.sketchfabRefBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(glbSpec.sketchfabReferenceUrl)}
            >
              <MaterialCommunityIcons
                name="open-in-new"
                size={14}
                color="#38BDF8"
              />
              <Text style={styles.sketchfabRefText}>
                Verified Medical Scan Reference
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Anatomical Location Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={18} color="#38BDF8" />
            <Text style={styles.cardTitle}>Anatomical Location</Text>
          </View>
          <Text style={styles.cardBody}>{organ.location}</Text>
        </View>

        {/* Primary Function Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={18} color="#FBBF24" />
            <Text style={styles.cardTitle}>Primary Function</Text>
          </View>
          <Text style={styles.cardBody}>{organ.function}</Text>
        </View>

        {/* Physiological Mechanism */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-network-outline" size={18} color="#34D399" />
            <Text style={styles.cardTitle}>Physiological Mechanism</Text>
          </View>
          <Text style={styles.cardBody}>{organ.howItWorks}</Text>
        </View>

        {/* Key Biological Facts */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={18}
              color="#F472B6"
            />
            <Text style={styles.cardTitle}>Key Medical Facts</Text>
          </View>
          <View style={styles.factsList}>
            {organ.facts.map((fact, index) => (
              <View key={index} style={styles.factRow}>
                <View style={styles.factBullet} />
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Related Interconnected Organs */}
        {relatedOrgans.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="connection"
                size={18}
                color="#A78BFA"
              />
              <Text style={styles.cardTitle}>Interconnected Organs</Text>
            </View>
            <View style={styles.relatedRow}>
              {relatedOrgans.map((rel) => (
                <TouchableOpacity
                  key={rel.id}
                  style={styles.relatedChip}
                  onPress={() => {
                    selectOrgan(rel.id);
                    navigation.push('OrganDetails', { organId: rel.id });
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={rel.icon as any}
                    size={16}
                    color={rel.accentColor}
                  />
                  <Text style={styles.relatedName}>{rel.name}</Text>
                  <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  bannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  organTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  systemBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  systemBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  scanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  scanBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BAE6FD',
  },
  jumpTo3dBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  jumpTo3dText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sketchfabRefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
    paddingVertical: 6,
  },
  sketchfabRefText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94A3B8',
  },
  factsList: {
    gap: 8,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  factBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
    marginTop: 7,
  },
  factText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
    flex: 1,
  },
  relatedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  relatedName: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
});
