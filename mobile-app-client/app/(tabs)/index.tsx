import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Briefcase, CheckCircle, AlertCircle, Wrench, ChevronRight, MapPin, Clock } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

// Mock Data
const SUMMARY_STATS = [
  { label: 'Assigned', count: 12, icon: Briefcase, color: '#3B82F6' },
  { label: 'In Progress', count: 3, icon: Wrench, color: '#F59E0B' },
  { label: 'Completed', count: 45, icon: CheckCircle, color: '#10B981' },
];

const RECENT_TASKS = [
  {
    id: '1',
    title: 'Replace LED Module',
    location: 'Main St. - Block 4',
    priority: 'high' as StatusType,
    status: 'assigned' as StatusType,
    time: '2h ago',
  },
  {
    id: '2',
    title: 'Wiring Repair',
    location: 'Central Park North',
    priority: 'medium' as StatusType,
    status: 'in_progress' as StatusType,
    time: '5h ago',
  },
  {
    id: '3',
    title: 'Routine Maintenance',
    location: 'Bridge Road Junction',
    priority: 'low' as StatusType,
    status: 'completed' as StatusType,
    time: '1d ago',
  },
];

const ALERTS = [
  {
    id: 'a1',
    message: 'Short circuit detected in Node ST-042',
    type: 'critical',
  },
];

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <ThemedView style={styles.header}>
          <View>
            <ThemedText style={styles.greetingText}>Hello, Technician</ThemedText>
            <ThemedText type="title" style={styles.welcomeText}>System Overview</ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={24} color={theme.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </ThemedView>

        {/* Alerts Section */}
        {ALERTS.map((alert) => (
          <TouchableOpacity key={alert.id} style={styles.alertCard}>
            <AlertCircle size={20} color="#EF4444" />
            <ThemedText style={styles.alertText}>{alert.message}</ThemedText>
            <ChevronRight size={16} color="#EF4444" />
          </TouchableOpacity>
        ))}

        {/* Summary Grid */}
        <View style={styles.summaryGrid}>
          {SUMMARY_STATS.map((stat, index) => (
            <ThemedView key={index} style={styles.summaryCard}>
              <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                <stat.icon size={20} color={stat.color} />
              </View>
              <ThemedText style={styles.summaryCount}>{stat.count}</ThemedText>
              <ThemedText style={styles.summaryLabel}>{stat.label}</ThemedText>
            </ThemedView>
          ))}
        </View>

        {/* Active Tasks Section */}
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle">Active Tasks</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <View style={styles.tasksList}>
          {RECENT_TASKS.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleRow}>
                  <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
                  <StatusBadge status={task.priority} />
                </View>
                <ThemedText style={styles.taskTime}>{task.time}</ThemedText>
              </View>
              
              <View style={styles.taskFooter}>
                <View style={styles.taskInfoItem}>
                  <MapPin size={14} color="#6B7280" />
                  <ThemedText style={styles.taskInfoText}>{task.location}</ThemedText>
                </View>
                <StatusBadge status={task.status} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips or Info */}
        <ThemedView style={styles.infoCard}>
          <ThemedText style={styles.infoTitle}>Technician Tip</ThemedText>
          <ThemedText style={styles.infoDescription}>
            Always verify the power source isolation before performing any wiring repairs.
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 10,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  tasksList: {
    gap: 16,
    marginBottom: 32,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleRow: {
    flex: 1,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  taskTime: {
    fontSize: 12,
    opacity: 0.4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  taskInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskInfoText: {
    fontSize: 12,
    opacity: 0.6,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
});
