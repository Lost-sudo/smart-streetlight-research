import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Dimensions, 
  ScrollView, 
  Modal, 
} from 'react-native';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  BrainCircuit, 
  Info, 
  RefreshCw, 
  ChevronRight, 
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { Colors, Layout, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { height } = Dimensions.get('window');

// Mock Data
const MOCK_TASKS = [
  {
    id: '1',
    node: 'Main St. #01',
    alertType: 'Voltage Surge',
    sourceType: 'FAULT',
    priority: 'high' as StatusType,
    status: 'assigned',
    explanation: 'System detected a sudden 15% increase in voltage levels, exceeding safety thresholds of 240V.',
    suggestedAction: 'Check voltage regulator and capacitor health.',
  },
  {
    id: '2',
    node: 'Bridge Rd. #15',
    alertType: 'Degradation Warning',
    sourceType: 'PREDICTIVE',
    priority: 'medium' as StatusType,
    status: 'in_progress',
    explanation: 'LSTM Model predicts 85% probability of driver failure within 72 hours based on flickering patterns.',
    suggestedAction: 'Preventively replace the LED driver unit.',
  },
  {
    id: '3',
    node: 'Highwood Dr. #88',
    alertType: 'System Anomaly',
    sourceType: 'PREDICTIVE',
    priority: 'low' as StatusType,
    status: 'assigned',
    explanation: 'Abnormal power dissipation patterns detected during non-peak hours.',
    suggestedAction: 'Inspect for loose wiring or parasitic loads.',
  },
];

const COMPLETED_TASKS = [
  { id: '101', node: 'Sunset Blvd. #07', alertType: 'Bulb Outage', date: '2026-04-10' },
  { id: '102', node: 'Oak St. #22', alertType: 'Connectivity Loss', date: '2026-04-09' },
  { id: '103', node: 'River Walk #03', alertType: 'Vulnerability Detected', date: '2026-04-09' },
];

const TaskCard = ({ task, theme, onPress, onStart }: { task: any, theme: any, onPress: (task: any) => void, onStart: (id: string) => void }) => {
  const isFault = task.sourceType === 'FAULT';
  
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => onPress(task)}
      style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
    >
      <View style={styles.taskCardHeader}>
        <View style={styles.taskBadgeRow}>
          <View style={[styles.sourceBadge, { backgroundColor: isFault ? '#EF444415' : '#8B5CF615' }]}>
            {isFault ? (
              <AlertTriangle size={12} color="#EF4444" />
            ) : (
              <BrainCircuit size={12} color="#8B5CF6" />
            )}
            <ThemedText style={[styles.sourceLabel, { color: isFault ? '#EF4444' : '#8B5CF6' }]}>
              {task.sourceType}
            </ThemedText>
          </View>
          <StatusBadge status={task.priority} />
        </View>
        <StatusBadge status={task.status as StatusType} />
      </View>

      <View style={styles.taskCardBody}>
        <ThemedText style={styles.nodeName}>{task.node}</ThemedText>
        <ThemedText style={styles.alertType}>{task.alertType}</ThemedText>
      </View>

      <View style={styles.taskCardFooter}>
        {task.status === 'assigned' ? (
          <TouchableOpacity 
            onPress={() => onStart(task.id)}
            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
          >
            <Clock size={14} color="white" />
            <ThemedText style={styles.actionBtnText}>Start Repair</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.inProgressInfo}>
            <View style={styles.pulseDot} />
            <ThemedText style={styles.inProgressText}>Working on this</ThemedText>
          </View>
        )}
        <View style={styles.viewDetailsRow}>
          <ThemedText style={styles.viewDetailsText}>Details</ThemedText>
          <ChevronRight size={14} color={theme.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TaskExecutionModal = ({ visible, task, onClose, theme }: { visible: boolean, task: any, onClose: () => void, theme: any }) => {
  const [notes, setNotes] = useState('');
  
  if (!task) return null;

  const isFault = task.sourceType === 'FAULT';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.modalHeaderInfo}>
              <View style={[styles.modalIconBox, { backgroundColor: isFault ? '#EF444415' : '#8B5CF615' }]}>
                {isFault ? (
                  <AlertTriangle size={24} color="#EF4444" />
                ) : (
                  <BrainCircuit size={24} color="#8B5CF6" />
                )}
              </View>
              <View>
                <ThemedText style={styles.modalTitle}>Execution Log</ThemedText>
                <ThemedText style={styles.modalSubtitle}>{task.node}</ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <Info size={16} color={theme.tint} />
                <ThemedText style={styles.sectionTitle}>Diagnosis</ThemedText>
              </View>
              <ThemedText style={styles.sectionContent}>{task.explanation}</ThemedText>
            </View>

            <View style={[styles.actionBox, { backgroundColor: `${theme.tint}08`, borderColor: `${theme.tint}20` }]}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 size={16} color={theme.tint} />
                <ThemedText style={[styles.sectionTitle, { color: theme.tint }]}>Suggested Repair</ThemedText>
              </View>
              <ThemedText style={[styles.sectionContent, { fontWeight: '600' }]}>{task.suggestedAction}</ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Repair Documentation</ThemedText>
              <TextInput 
                placeholder="Describe work performed, parts replaced, etc..."
                placeholderTextColor={theme.muted}
                multiline
                numberOfLines={6}
                style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.cardBorder, color: theme.text }]}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity 
              disabled={!notes}
              style={[styles.finalizeBtn, { backgroundColor: notes ? '#10B981' : theme.muted + '40' }]}
              onPress={onClose}
            >
              <CheckCircle2 size={20} color="white" />
              <ThemedText style={styles.finalizeBtnText}>Finalize Repair</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function MyTasksScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTaskPress = (task: any) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">My Tasks</ThemedText>
          <ThemedText style={styles.subtitle}>Assignments & repair history</ThemedText>
        </View>
        <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: theme.surface }]}>
          <RefreshCw size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={styles.sectionHeading}>Active Assignments</ThemedText>
            <View style={styles.countBadge}>
              <ThemedText style={styles.countText}>{MOCK_TASKS.length}</ThemedText>
            </View>
          </View>
          
          {MOCK_TASKS.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              theme={theme} 
              onPress={handleTaskPress}
              onStart={() => {}}
            />
          ))}
        </View>

        <View style={styles.historySection}>
          <ThemedText style={styles.sectionHeading}>Recently Completed</ThemedText>
          <View style={[styles.historyContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            {COMPLETED_TASKS.map((task, idx) => (
              <View key={task.id} style={[styles.historyItem, idx === COMPLETED_TASKS.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.historyMain}>
                  <ThemedText style={styles.historyNode}>{task.node}</ThemedText>
                  <ThemedText style={styles.historyType}>{task.alertType}</ThemedText>
                </View>
                <View style={styles.historyRight}>
                  <ThemedText style={styles.historyDate}>{task.date}</ThemedText>
                  <CheckCircle2 size={16} color="#10B981" />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TaskExecutionModal 
        visible={modalVisible} 
        task={selectedTask} 
        onClose={() => setModalVisible(false)} 
        theme={theme} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginTop: 10,
    marginBottom: Layout.spacingLg,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B82F6',
  },
  taskCard: {
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
    padding: Layout.cardPadding,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskCardBody: {
    marginBottom: 20,
  },
  nodeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 14,
    opacity: 0.6,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  inProgressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    opacity: 0.4,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: 20,
  },
  historyContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  historyMain: {
    flex: 1,
  },
  historyNode: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyType: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyDate: {
    fontSize: 10,
    opacity: 0.4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.9,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
    paddingBottom: 60,
  },
  infoBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  actionBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    height: 160,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  finalizeBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  finalizeBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});
