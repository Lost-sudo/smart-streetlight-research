import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

export type StatusType = 'assigned' | 'in_progress' | 'completed' | 'urgent' | 'high' | 'medium' | 'low';

interface StatusBadgeProps {
  status: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'urgent':
      case 'high':
        return {
          container: styles.urgentContainer,
          text: styles.urgentText,
          label: status.toUpperCase(),
        };
      case 'in_progress':
      case 'medium':
        return {
          container: styles.warningContainer,
          text: styles.warningText,
          label: status.replace('_', ' ').toUpperCase(),
        };
      case 'completed':
      case 'low':
        return {
          container: styles.successContainer,
          text: styles.successText,
          label: status.toUpperCase(),
        };
      default:
        return {
          container: styles.defaultContainer,
          text: styles.defaultText,
          label: status.toUpperCase(),
        };
    }
  };

  const { container, text, label } = getStyles();

  return (
    <View style={[styles.badge, container]}>
      <ThemedText style={[styles.text, text]}>{label}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  urgentContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  urgentText: {
    color: '#EF4444',
  },
  warningContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  warningText: {
    color: '#F59E0B',
  },
  successContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  successText: {
    color: '#10B981',
  },
  defaultContainer: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#6B7280',
  },
  defaultText: {
    color: '#6B7280',
  },
});
