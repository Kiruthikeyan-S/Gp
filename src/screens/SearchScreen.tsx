import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BodySystemId } from '../types';
import { ORGANS, BODY_SYSTEMS, LESSONS } from '../data/anatomyData';
import { ORGAN_SUB_PARTS } from '../data/organSubParts';
import { FLASHCARDS } from '../data/flashcardsData';
import { useAnatomyStore } from '../state/useAnatomyStore';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type SearchResultType = 'organ' | 'system' | 'subpart' | 'lesson' | 'flashcard';

interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  systemId?: BodySystemId;
  organId?: string;
  subPartId?: string;
  color: string;
  icon: string;
}

const POPULAR_SEARCHES = [
  'Heart',
  'Brain',
  'Cerebellum',
  'Lungs',
  'Alveoli',
  'Kidneys',
  'Nephron',
  'Femur',
  'Diaphragm',
  'Spleen',
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { selectOrgan, selectSystem } = useAnatomyStore();

  const [query, setQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | SearchResultType>('all');

  // Indexed searchable items
  const allSearchableItems: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];

    // 1. Organs
    ORGANS.forEach((org) => {
      list.push({
        id: `org_${org.id}`,
        type: 'organ',
        title: org.name,
        subtitle: `${org.systemName} • ${org.location}`,
        systemId: org.systemId,
        organId: org.id,
        color: org.accentColor,
        icon: org.icon || 'heart',
      });
    });

    // 2. Systems
    BODY_SYSTEMS.forEach((sys) => {
      list.push({
        id: `sys_${sys.id}`,
        type: 'system',
        title: sys.name,
        subtitle: sys.description,
        systemId: sys.id,
        color: sys.color,
        icon: sys.icon || 'human-male-height',
      });
    });

    // 3. Subparts
    Object.entries(ORGAN_SUB_PARTS).forEach(([orgId, parts]) => {
      const parentOrgan = ORGANS.find((o) => o.id === orgId);
      parts.forEach((sp) => {
        list.push({
          id: `sp_${sp.id}`,
          type: 'subpart',
          title: sp.name,
          subtitle: `Part of ${parentOrgan ? parentOrgan.name : orgId} • ${sp.description}`,
          organId: orgId,
          subPartId: sp.id,
          systemId: parentOrgan?.systemId,
          color: sp.color,
          icon: 'target',
        });
      });
    });

    // 4. Lessons
    LESSONS.forEach((les) => {
      list.push({
        id: `les_${les.id}`,
        type: 'lesson',
        title: les.title,
        subtitle: `Lesson (${les.readTimeMinutes} min) • ${les.summary}`,
        organId: les.organId,
        systemId: les.systemId,
        color: '#0284C7',
        icon: 'book-open-outline',
      });
    });

    // 5. Flashcards
    FLASHCARDS.forEach((fc) => {
      list.push({
        id: `fc_${fc.id}`,
        type: 'flashcard',
        title: fc.front,
        subtitle: `${fc.systemName} • ${fc.back.slice(0, 60)}...`,
        systemId: fc.systemId,
        color: '#10B981',
        icon: 'cards-outline',
      });
    });

    return list;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allSearchableItems.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
  }, [query, activeFilter, allSearchableItems]);

  const handleSelectItem = (item: SearchResultItem) => {
    switch (item.type) {
      case 'organ':
        if (item.organId) {
          selectOrgan(item.organId);
          navigation.navigate('OrganDetails', { organId: item.organId });
        }
        break;
      case 'subpart':
        if (item.organId) {
          selectOrgan(item.organId);
          navigation.navigate('OrganDetails', {
            organId: item.organId,
            subPartId: item.subPartId,
          });
        }
        break;
      case 'system':
        if (item.systemId) {
          selectSystem(item.systemId);
          (navigation as any).navigate('MainTabs', {
            screen: 'ExplorerTab',
            params: { targetSystemId: item.systemId },
          });
        }
        break;
      case 'lesson':
        if (item.organId) {
          navigation.navigate('OrganDetails', { organId: item.organId });
        }
        break;
      case 'flashcard':
        navigation.navigate('Flashcards', { systemId: item.systemId });
        break;
    }
  };

  const getBadgeLabel = (type: SearchResultType) => {
    switch (type) {
      case 'organ':
        return 'ORGAN';
      case 'system':
        return 'SYSTEM';
      case 'subpart':
        return 'PART';
      case 'lesson':
        return 'LESSON';
      case 'flashcard':
        return 'CARD';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#0284C7" />
          <TextInput
            style={styles.input}
            placeholder="Search organs, systems, structures..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(
            [
              { id: 'all', label: 'All Results' },
              { id: 'organ', label: 'Organs' },
              { id: 'subpart', label: 'Structures' },
              { id: 'system', label: 'Systems' },
              { id: 'lesson', label: 'Lessons' },
              { id: 'flashcard', label: 'Flashcards' },
            ] as const
          ).map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results or Empty Suggestions */}
      {!query.trim() ? (
        <ScrollView style={styles.suggestionsContainer}>
          <Text style={styles.sectionHeading}>Popular Searches</Text>
          <View style={styles.popularWrap}>
            {POPULAR_SEARCHES.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.popularChip}
                onPress={() => setQuery(term)}
              >
                <Ionicons name="search-outline" size={13} color="#0284C7" />
                <Text style={styles.popularText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
            Browse by 10 Body Systems
          </Text>
          <View style={styles.systemsGrid}>
            {BODY_SYSTEMS.map((sys) => (
              <TouchableOpacity
                key={sys.id}
                style={styles.systemBox}
                onPress={() => {
                  selectSystem(sys.id);
                  (navigation as any).navigate('MainTabs', {
                    screen: 'ExplorerTab',
                    params: { targetSystemId: sys.id },
                  });
                }}
              >
                <View
                  style={[
                    styles.systemBoxIcon,
                    { backgroundColor: `${sys.color}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={sys.icon as any}
                    size={22}
                    color={sys.color}
                  />
                </View>
                <Text style={styles.systemBoxTitle}>{sys.name}</Text>
                <Text style={styles.systemBoxCount}>
                  {sys.organIds.length} organs
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={52}
            color="#94A3B8"
          />
          <Text style={styles.emptyTitle}>No matching anatomy found</Text>
          <Text style={styles.emptySub}>
            Try searching for "heart", "cerebellum", "alveoli", or "femur".
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => handleSelectItem(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.resultIconCircle,
                  { backgroundColor: `${item.color}18` },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color={item.color}
                />
              </View>

              <View style={styles.resultInfo}>
                <View style={styles.resultTitleRow}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: `${item.color}18` },
                    ]}
                  >
                    <Text
                      style={[styles.typeBadgeText, { color: item.color }]}
                    >
                      {getBadgeLabel(item.type)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  filterWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  popularWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  systemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  systemBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  systemBoxIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  systemBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  systemBoxCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  resultsList: {
    padding: 14,
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  resultIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
});
