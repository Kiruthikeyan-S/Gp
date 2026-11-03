import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { ORGANS } from '../data/anatomyData';
import { useAnatomyStore } from '../state/useAnatomyStore';
import { SystemBadge } from '../components/SystemBadge';
import { Header } from '../components/Header';
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
  const bookmarked = isBookmarked(organ.id);

  const relatedOrgans = ORGANS.filter((o) =>
    organ.relatedOrganIds.includes(o.id)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={organ.name}
        subtitle={organ.systemName}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: bookmarked ? 'bookmark' : 'bookmark-outline',
          color: bookmarked ? theme.colors.warning : theme.colors.textPrimary,
          onPress: () => toggleBookmark(organ.id),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Organ Visual Banner & 3D Jump Action */}
        <View style={styles.bannerCard}>
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: `${organ.accentColor}18` },
            ]}
          >
            <MaterialCommunityIcons
              name={organ.icon as any}
              size={56}
              color={organ.accentColor}
            />
          </View>
          <Text style={styles.organTitle}>{organ.name}</Text>
          <SystemBadge systemId={organ.systemId} label={organ.systemName} />

          <View style={styles.meshCodeBadge}>
            <Text style={styles.meshCodeText}>3D Mesh: {organ.meshName}</Text>
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
            <MaterialCommunityIcons name="axis-arrow" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.jumpTo3dText}>Isolate in 3D Explorer</Text>
          </TouchableOpacity>
        </View>

        {/* Anatomical Location Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Anatomical Location</Text>
          </View>
          <Text style={styles.cardBody}>{organ.location}</Text>
        </View>

        {/* Main Function Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.cardTitle}>Primary Function</Text>
          </View>
          <Text style={styles.cardBody}>{organ.function}</Text>
        </View>

        {/* How It Works Detailed Mechanism */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cog-outline" size={20} color={theme.colors.warning} />
            <Text style={styles.cardTitle}>Physiological Mechanism</Text>
          </View>
          <Text style={styles.cardBody}>{organ.howItWorks}</Text>
        </View>

        {/* Verified Facts */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={theme.colors.success} />
            <Text style={styles.cardTitle}>Key Biological Facts</Text>
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

        {/* Related Organs Network */}
        {relatedOrgans.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-network-outline" size={20} color={theme.colors.primaryDark} />
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
                >
                  <MaterialCommunityIcons
                    name={rel.icon as any}
                    size={16}
                    color={rel.accentColor}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.relatedName}>{rel.name}</Text>
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
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  bannerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  organTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  meshCodeBadge: {
    marginTop: 8,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
  },
  meshCodeText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  jumpTo3dBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
  },
  jumpTo3dText: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  cardBody: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  factsList: {
    gap: 10,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  factBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginTop: 8,
    marginRight: 10,
  },
  factText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 21,
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
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  relatedName: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
