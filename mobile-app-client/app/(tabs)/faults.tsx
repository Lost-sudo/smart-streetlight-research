import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Dimensions, 
  ScrollView, 
  Modal, 
  Pressable
} from 'react-native';
import { 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Info, 
  RefreshCw, 
  UserPlus, 
  ChevronRight, 
  MapPin,
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

// Mock Data
const MOCK_FAULTS = [
  {
    id: '1',
    node: 'Main St. #01',
    faultType: 'Voltage Surge',
    priority: 'high' as StatusType,
    dateDetected: '2026-04-10',
    timeDetected: '10:15 AM',
    suggestedAction: 'Check voltage regulator and capacitor health.',
    explanation: 'System detected a sudden 15% increase in voltage levels, exceeding safety thresholds of 240V.',
    status: 'pending',
    location: 'Sector 4, Main District',
  },
  {
    id: '2',
    node: 'Bridge Rd. #15',
    faultType: 'Connectivity Loss',
    priority: 'medium' as StatusType,
    dateDetected: '2026-04-10',
    timeDetected: '09:42 AM',
    suggestedAction: 'Power cycle the communication module.',
    explanation: 'Node has been unresponsive for over 10 minutes despite active power supply.',
    status: 'assigned',
    assignedTo: 'Tech #12',
    location: 'Bridge Sector, North Entrance',
  },
  {
    id: '3',
    node: 'Park Ave. #42',
    faultType: 'Photocell Failure',
    priority: 'low' as StatusType,
    dateDetected: '2026-04-10',
    timeDetected: '08:20 AM',
    suggestedAction: 'Clean or replace the LDR sensor.',
    explanation: 'Light intensity readings remained static (0 lux) for 24 hours despite clear weather.',
    status: 'in_progress',
    assignedTo: 'You',
    location: 'Parkside, Central Square',
  },
  {
    id: '4',
    node: 'Market St. #09',
    faultType: 'Current Leakage',
    priority: 'high' as StatusType,
    dateDetected: '2026-04-09',
    timeDetected: '11:55 PM',
    suggestedAction: 'Inspect wiring insulation and grounding terminals.',
    explanation: 'Ground fault detected. Current leakage exceeds 30mA safety limit.',
    status: 'pending',
    location: 'Market Quarter, South Wall',
  },
];

const StatCard = ({ label, value, icon, color, theme }: any) => (
  <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
      {React.cloneElement(icon, { color, size: 20 })}
    </View>
    <View>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  </View>
);

const FaultCard = ({ fault, theme, onPress }: { fault: any, theme: any, onPress: (fault: any) => void }) => (
  <TouchableOpacity 
    activeOpacity={0.7}
    onPress={() => onPress(fault)}
    style={[styles.faultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
  >
    <View style={styles.faultCardMain}>
      <View style={styles.faultCardHeader}>
        <View style={styles.nodeInfo}>
          <ThemedText style={styles.nodeName}>{fault.node}</ThemedText>
          <View style={styles.faultTypeRow}>
            <AlertTriangle size={12} color={fault.priority === 'high' ? '#EF4444' : fault.priority === 'medium' ? '#F59E0B' : '#EAB308'} />
            <ThemedText style={styles.faultTypeText}>{fault.faultType}</ThemedText>
          </View>
        </View>
        <StatusBadge status={fault.priority} />
      </View>
      
      <View style={styles.faultCardFooter}>
        <View style={styles.timeInfo}>
          <Clock size={12} color={theme.muted} />
          <ThemedText style={styles.timeText}>{fault.timeDetected}</ThemedText>
        </View>
        <View style={styles.assigneeInfo}>
          {fault.assignedTo ? (
            <View style={styles.assigneeBox}>
              <View style={styles.assigneeDot} />
              <ThemedText style={styles.assigneeText}>{fault.assignedTo}</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.unassignedText}>Unassigned</ThemedText>
          )}
          <ChevronRight size={16} color={theme.muted} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const FaultDetailModal = ({ visible, fault, onClose, theme }: { visible: boolean, fault: any, onClose: () => void, theme: any }) => {
  if (!fault) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.modalHeaderInfo}>
              <Wrench size={24} color={theme.tint} />
              <View>
                <ThemedText style={styles.modalTitle}>Fault Diagnosis</ThemedText>
                <ThemedText style={styles.modalSubtitle}>{fault.node}</ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBadgeRow}>
              <StatusBadge status={fault.priority} />
              <View style={styles.modalMetaItem}>
                <Clock size={14} color={theme.muted} />
                <ThemedText style={styles.modalMetaText}>{fault.dateDetected} • {fault.timeDetected}</ThemedText>
              </View>
            </View>

            <View style={styles.locationContainer}>
              <MapPin size={16} color={theme.muted} />
              <ThemedText style={styles.locationText}>{fault.location}</ThemedText>
            </View>

            <View style={[styles.diagnosisBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <Info size={16} color="#3B82F6" />
                <ThemedText style={styles.sectionTitle}>System Explanation</ThemedText>
              </View>
              <ThemedText style={styles.sectionContent}>{fault.explanation}</ThemedText>
            </View>

            <View style={[styles.actionBox, { backgroundColor: `${theme.tint}08`, borderColor: `${theme.tint}20` }]}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 size={16} color={theme.tint} />
                <ThemedText style={[styles.sectionTitle, { color: theme.tint }]}>Suggested Action</ThemedText>
              </View>
              <ThemedText style={[styles.sectionContent, { fontWeight: '600' }]}>{fault.suggestedAction}</ThemedText>
            </View>

            <View style={styles.workLogContainer}>
              <ThemedText style={styles.inputLabel}>Repair Log Notes</ThemedText>
              <TextInput 
                placeholder="Describe steps taken for repair..."
                placeholderTextColor={theme.muted}
                multiline
                numberOfLines={4}
                style={[styles.workLogInput, { backgroundColor: theme.surface, borderColor: theme.cardBorder, color: theme.text }]}
              />
            </View>

            <View style={styles.modalActions}>
              {fault.status === 'pending' ? (
                <TouchableOpacity style={[styles.primaryAction, { backgroundColor: '#10B981' }]}>
                  <UserPlus size={20} color="white" />
                  <ThemedText style={styles.actionText}>Claim Task</ThemedText>
                </TouchableOpacity>
              ) : fault.status === 'assigned' ? (
                <TouchableOpacity style={[styles.primaryAction, { backgroundColor: '#3B82F6' }]}>
                  <Wrench size={20} color="white" />
                  <ThemedText style={styles.actionText}>Start Repair</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.primaryAction, { backgroundColor: '#10B981' }]}>
                  <CheckCircle2 size={20} color="white" />
                  <ThemedText style={styles.actionText}>Complete Repair</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function FaultsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [search, setSearch] = useState('');
  const [selectedFault, setSelectedFault] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredFaults = useMemo(() => {
    return MOCK_FAULTS.filter(f => {
      const matchesSearch = f.node.toLowerCase().includes(search.toLowerCase()) || 
                           f.faultType.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'pending' ? f.status === 'pending' : f.status !== 'pending';
      return matchesSearch && matchesTab;
    });
  }, [search, activeTab]);

  const stats = useMemo(() => {
    const pending = MOCK_FAULTS.filter(f => f.status === 'pending').length;
    const active = MOCK_FAULTS.filter(f => f.status === 'assigned' || f.status === 'in_progress').length;
    return { pending, active, resolved: 12 }; // Hardcoded resolved today
  }, []);

  const handleFaultPress = (fault: any) => {
    setSelectedFault(fault);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainHeader}>
        <View>
          <ThemedText type="title">Fault Monitoring</ThemedText>
          <ThemedText style={styles.subtitle}>Reactive task management</ThemedText>
        </View>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.surface }]}>
          <RefreshCw size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="#3B82F6" theme={theme} />
        <StatCard label="Active" value={stats.active} icon={<Wrench />} color="#F59E0B" theme={theme} />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="#10B981" theme={theme} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Search size={20} color={theme.muted} />
          <TextInput
            placeholder="Search faults or nodes..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <Pressable 
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && { borderBottomColor: theme.tint }]}
        >
          <ThemedText style={[styles.tabText, activeTab === 'pending' && { color: theme.tint, fontWeight: '700' }]}>
            Pending ({stats.pending})
          </ThemedText>
        </Pressable>
        <Pressable 
          onPress={() => setActiveTab('active')}
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: theme.tint }]}
        >
          <ThemedText style={[styles.tabText, activeTab === 'active' && { color: theme.tint, fontWeight: '700' }]}>
            Active ({stats.active})
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={filteredFaults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FaultCard fault={item} theme={theme} onPress={handleFaultPress} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={48} color={theme.muted} />
            <ThemedText style={styles.emptyText}>All systems nominal. No {activeTab} tasks found.</ThemedText>
          </View>
        }
      />

      <FaultDetailModal 
        visible={modalVisible} 
        fault={selectedFault} 
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
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 64) / 3,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    opacity: 0.6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  faultCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  faultCardMain: {
    flex: 1,
  },
  faultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  faultTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  faultTypeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  faultCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.5,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assigneeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  assigneeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  unassignedText: {
    fontSize: 11,
    opacity: 0.4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
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
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalMetaText: {
    fontSize: 12,
    opacity: 0.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.6,
  },
  diagnosisBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  actionBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  workLogContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  workLogInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  modalActions: {
    gap: 12,
  },
  primaryAction: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
