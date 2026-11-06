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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ANATOMY_MODEL_REGISTRY } from '../data/anatomyModelRegistry';

export const CreditsScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleOpenUrl = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Credits & 3D Model Sources</Text>
          <Text style={styles.headerSubtitle}>
            Attributions, open-access 3D scans & scientific references
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconWrap}>
            <MaterialCommunityIcons name="license" size={24} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Open-Access 3D Anatomy</Text>
            <Text style={styles.bannerText}>
              All 3D models integrated into 3D Human Anatomy Explorer originate from
              verified open-access biomedical repositories, Sketchfab open creators, and the
              National Institutes of Health (NIH) 3D Print Exchange under permissive
              Creative Commons (CC-BY 4.0 / CC0) licenses.
            </Text>
          </View>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>
          3D Model Registry & Attributions ({ANATOMY_MODEL_REGISTRY.length})
        </Text>

        {/* Models List */}
        {ANATOMY_MODEL_REGISTRY.map((m) => (
          <View key={m.modelId} style={styles.modelCard}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modelTitle}>{m.displayName}</Text>
                <Text style={styles.creatorText}>By {m.creatorName}</Text>
              </View>
              <View style={styles.licenseBadge}>
                <Text style={styles.licenseBadgeText}>{m.license}</Text>
              </View>
            </View>

            <Text style={styles.attributionText}>{m.attributionText}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{m.format}</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  ~{(m.polygonCountApprox / 1000).toFixed(0)}k polys
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  {m.bodySystem.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Links Row */}
            <View style={styles.linksRow}>
              {m.sketchfabUrl && m.sketchfabUrl.startsWith('http') && (
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => handleOpenUrl(m.sketchfabUrl)}
                >
                  <MaterialCommunityIcons name="cube-outline" size={14} color="#0284C7" />
                  <Text style={styles.linkBtnText}>Sketchfab Page</Text>
                  <Ionicons name="open-outline" size={12} color="#0284C7" />
                </TouchableOpacity>
              )}

              {m.sourceUrl && m.sourceUrl.startsWith('http') && (
                <TouchableOpacity
                  style={styles.linkBtnSecondary}
                  onPress={() => handleOpenUrl(m.sourceUrl)}
                >
                  <MaterialCommunityIcons name="download-outline" size={14} color="#64748B" />
                  <Text style={styles.linkBtnSecondaryText}>Asset Source</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Literature & Clinical Reference Standards */}
        <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
          Biomedical Reference Standards
        </Text>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>Gray's Anatomy (42nd Edition)</Text>
          <Text style={styles.referenceDesc}>
            Standard anatomical nomenclature, structural relationships, and regional
            topography referenced across all organ specification cards.
          </Text>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>NIH 3D Print Exchange & Visible Human</Text>
          <Text style={styles.referenceDesc}>
            High-resolution T2 MRI cross-sections and segmented voxel reconstructions
            supporting realistic organ dimensions and coordinate offsets.
          </Text>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>HuBMAP CCF 3D Reference Ontology (v1.2)</Text>
          <Text style={styles.referenceDesc}>
            Common Coordinate Framework defining standardized spatial coordinates for
            multimodal human organ mapping.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  backBtn: {
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
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  bannerCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#0C4A6E',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  modelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  modelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  creatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 2,
  },
  licenseBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  licenseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  attributionText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  linksRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  linkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  linkBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  linkBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  referenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  referenceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  referenceDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
