import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { BodySystemId } from '../types';

interface SystemBadgeProps {
  systemId: BodySystemId;
  label?: string;
  size?: 'sm' | 'md';
}

export const SystemBadge: React.FC<SystemBadgeProps> = ({
  systemId,
  label,
  size = 'md',
}) => {
  const color = (theme.colors.systems as Record<string, string>)[systemId] || theme.colors.primary;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}18`,
          borderColor: `${color}40`,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 8 : 10,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSm ? 11 : 12,
          },
        ]}
      >
        {label || systemId.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
