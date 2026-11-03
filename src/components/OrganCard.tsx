import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Organ } from '../types';
import { SystemBadge } from './SystemBadge';

interface OrganCardProps {
  organ: Organ;
  isSelected?: boolean;
  onPress: () => void;
  onBookmarkToggle?: () => void;
  isBookmarked?: boolean;
}

export const OrganCard: React.FC<OrganCardProps> = ({
  organ,
  isSelected,
  onPress,
  onBookmarkToggle,
  isBookmarked,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${organ.accentColor}18` }]}>
          <MaterialCommunityIcons
            name={organ.icon as any}
            size={24}
            color={organ.accentColor}
          />
        </View>
        <SystemBadge systemId={organ.systemId} label={organ.systemName} size="sm" />
      </View>

      <Text style={styles.name}>{organ.name}</Text>
      <Text style={styles.functionText} numberOfLines={2}>
        {organ.function}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.locationText} numberOfLines={1}>
          📍 {organ.location}
        </Text>
        {onBookmarkToggle && (
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={onBookmarkToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? theme.colors.warning : theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  functionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle,
  },
  locationText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    flex: 1,
  },
  bookmarkButton: {
    padding: 2,
  },
});
