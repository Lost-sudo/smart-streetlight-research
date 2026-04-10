import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type StatusType = 'assigned' | 'in_progress' | 'completed' | 'urgent' | 'high' | 'medium' | 'low' | 'active' | 'inactive' | 'faulty' | 'maintenance';

interface StatusBadgeProps {
  status: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const getStyles = () => {
    switch (status) {
      case 'urgent':
      case 'high':
      case 'faulty':
        return {
          backgroundColor: `${theme.error}20`,
          borderColor: theme.error,
          textColor: theme.error,
          label: status.toUpperCase(),
        };
      case 'in_progress':
      case 'medium':
      case 'maintenance':
        return {
          backgroundColor: `${theme.warning}20`,
          borderColor: theme.warning,
          textColor: theme.warning,
          label: status.replace('_', ' ').toUpperCase(),
        };
      case 'completed':
      case 'low':
      case 'active':
        return {
          backgroundColor: `${theme.success}20`,
          borderColor: theme.success,
          textColor: theme.success,
          label: status.toUpperCase(),
        };
      default:
        return {
          backgroundColor: `${theme.muted}20`,
          borderColor: theme.muted,
          textColor: theme.muted,
          label: status.toUpperCase(),
        };
    }
  };

  const { backgroundColor, borderColor, textColor, label } = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }]}>
      <ThemedText style={[styles.text, { color: textColor }]}>{label}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    // Removed letterSpacing to prevent clipping on some devices
  },
});
