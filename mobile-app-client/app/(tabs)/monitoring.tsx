import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Dimensions, 
  Animated,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { 
  Search, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Lightbulb, 
  Filter, 
  X, 
  Zap, 
  Activity, 
  Sun, 
  Cpu, 
  MapPin, 
  Calendar 
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

// Mock Data
const MOCK_NODES = [
  { 
    id: '1', 
    name: 'Main St. #01', 
    device_id: 'SL-BR-001', 
    status: 'active' as StatusType, 
    isOnline: true,
    voltage: 231.4,
    current: 0.45,
    power: 104.1,
    light: 450,
    model: 'SmartLight-V2 Pro',
    lat: 14.5995,
    long: 120.9842,
    installed: '2023-11-12'
  },
  { id: '2', name: 'Park Ave. #42', device_id: 'SL-PA-042', status: 'faulty' as StatusType, isOnline: true },
  { id: '3', name: 'Bridge Rd. #15', device_id: 'SL-BR-015', status: 'maintenance' as StatusType, isOnline: false },
  { id: '4', name: 'Sunset Blvd. #07', device_id: 'SL-SB-007', status: 'active' as StatusType, isOnline: false },
  { id: '5', name: 'Oak St. #22', device_id: 'SL-OK-022', status: 'inactive' as StatusType, isOnline: false },
  { id: '6', name: 'Highwood Dr. #88', device_id: 'SL-HD-088', status: 'active' as StatusType, isOnline: true },
  { id: '7', name: 'River Walk #03', device_id: 'SL-RW-003', status: 'active' as StatusType, isOnline: true },
  { id: '8', name: 'Station Sq. #11', device_id: 'SL-SS-011', status: 'faulty' as StatusType, isOnline: false },
];

const MOCK_LOGS = [
  { id: '1', time: '12:45:01 PM', v: 231.4, a: 0.45, w: 104.1, l: 450 },
  { id: '2', time: '12:40:00 PM', v: 230.8, a: 0.44, w: 101.5, l: 442 },
  { id: '3', time: '12:35:05 PM', v: 232.1, a: 0.46, w: 106.7, l: 455 },
  { id: '4', time: '12:30:12 PM', v: 231.0, a: 0.45, w: 103.9, l: 448 },
  { id: '5', time: '12:25:00 PM', v: 229.7, a: 0.43, w: 98.6, l: 435 },
];

const PulseDot = ({ isOnline }: { isOnline: boolean }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, pulseAnim]);

  return (
    <View style={styles.statusDotContainer}>
      {isOnline && (
        <Animated.View 
          style={[
            styles.pulseDot,
            { transform: [{ scale: pulseAnim }], opacity: 0.4 }
          ]} 
        />
      )}
      <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#9CA3AF' }]} />
    </View>
  );
};

const NodeCard = ({ node, theme, onPress }: { node: any, theme: any, onPress: (node: any) => void }) => (
  <TouchableOpacity 
    activeOpacity={0.7}
    onPress={() => onPress(node)}
    style={[styles.nodeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.iconBox, { backgroundColor: node.isOnline ? `${theme.success}20` : `${theme.muted}20` }]}>
        <Lightbulb size={20} color={node.isOnline ? theme.success : theme.muted} />
      </View>
      <PulseDot isOnline={node.isOnline} />
    </View>

    <View style={styles.cardContent}>
      <ThemedText style={styles.nodeName} numberOfLines={1}>{node.name}</ThemedText>
      <ThemedText style={styles.nodeId} numberOfLines={1}>{node.device_id}</ThemedText>
    </View>

    <View style={styles.cardFooter}>
      <StatusBadge status={node.status} />
      <View style={styles.connectivityInfo}>
        {node.isOnline ? (
          <Wifi size={12} color="#10B981" />
        ) : (
          <WifiOff size={12} color="#EF4444" />
        )}
        <ThemedText style={[styles.onlineText, { color: node.isOnline ? '#10B981' : '#EF4444' }]}>
          {node.isOnline ? 'ON' : 'OFF'}
        </ThemedText>
      </View>
    </View>
  </TouchableOpacity>
);

const MetricCard = ({ label, value, unit, icon, color, theme }: any) => (
  <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
    <View style={styles.metricHeader}>
      {icon}
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
    </View>
    <View style={styles.metricValueRow}>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
      <ThemedText style={styles.metricUnit}>{unit}</ThemedText>
    </View>
  </View>
);

const NodeDetailModal = ({ visible, node, onClose, theme }: { visible: boolean, node: any, onClose: () => void, theme: any }) => {
  if (!node) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.modalHeaderInfo}>
              <View style={[styles.modalIconBox, { backgroundColor: node.isOnline ? `${theme.success}20` : `${theme.muted}20` }]}>
                <Lightbulb size={24} color={node.isOnline ? theme.success : theme.muted} />
              </View>
              <View>
                <ThemedText style={styles.modalTitle}>{node.name}</ThemedText>
                <View style={styles.modalSubtitleRow}>
                  <ThemedText style={styles.modalSubtitle}>{node.device_id}</ThemedText>
                  <View style={styles.dotSeparator} />
                  <StatusBadge status={node.status} />
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <MetricCard 
                label="Voltage" 
                value={node.voltage?.toFixed(1) || '231.4'} 
                unit="V" 
                icon={<Zap size={14} color="#3b82f6" />} 
                theme={theme} 
              />
              <MetricCard 
                label="Current" 
                value={node.current?.toFixed(2) || '0.45'} 
                unit="A" 
                icon={<Activity size={14} color="#10b981" />} 
                theme={theme} 
              />
              <MetricCard 
                label="Power" 
                value={node.power?.toFixed(1) || '104.1'} 
                unit="W" 
                icon={<Zap size={14} color="#f59e0b" />} 
                theme={theme} 
              />
              <MetricCard 
                label="Light" 
                value={node.light || '450'} 
                unit="lux" 
                icon={<Sun size={14} color="#f97316" />} 
                theme={theme} 
              />
            </View>

            {/* Technical Details */}
            <View style={[styles.detailsSection, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <View style={styles.detailItem}>
                <Cpu size={18} color={theme.muted} />
                <ThemedText style={styles.detailText}>{node.model || 'SmartLight-V2 Pro'}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <MapPin size={18} color={theme.muted} />
                <ThemedText style={styles.detailText}>{node.lat || '14.5995'}, {node.long || '120.9842'}</ThemedText>
              </View>
              <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
                <Calendar size={18} color={theme.muted} />
                <ThemedText style={styles.detailText}>Installed {node.installed || 'Nov 12, 2023'}</ThemedText>
              </View>
            </View>

            {/* Recent Readings Table */}
            <ThemedText style={styles.sectionTitle}>Recent Readings</ThemedText>
            <View style={[styles.tableContainer, { borderColor: theme.cardBorder }]}>
              <View style={[styles.tableHeader, { backgroundColor: theme.surface }]}>
                <ThemedText style={[styles.tableHead, { flex: 1.5 }]}>Time</ThemedText>
                <ThemedText style={styles.tableHead}>V</ThemedText>
                <ThemedText style={styles.tableHead}>A</ThemedText>
                <ThemedText style={styles.tableHead}>W</ThemedText>
                <ThemedText style={styles.tableHead}>lux</ThemedText>
              </View>
              {MOCK_LOGS.map((log) => (
                <View key={log.id} style={[styles.tableRow, { borderBottomColor: theme.cardBorder }]}>
                  <ThemedText style={[styles.tableCell, { flex: 1.5, fontWeight: '600' }]}>{log.time}</ThemedText>
                  <ThemedText style={styles.tableCell}>{log.v}</ThemedText>
                  <ThemedText style={styles.tableCell}>{log.a}</ThemedText>
                  <ThemedText style={styles.tableCell}>{log.w}</ThemedText>
                  <ThemedText style={styles.tableCell}>{log.l}</ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function MonitoringScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredNodes = useMemo(() => {
    return MOCK_NODES.filter(node => 
      node.name.toLowerCase().includes(search.toLowerCase()) || 
      node.device_id.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleNodePress = (node: any) => {
    setSelectedNode(node);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Node Monitoring</ThemedText>
          <ThemedText style={styles.subtitle}>Real-time telemetry & grid health</ThemedText>
        </View>
        <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: theme.surface }]} onPress={handleRefresh}>
          <RefreshCw size={20} color={theme.text} className={isRefreshing ? 'animate-spin' : ''} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Search size={20} color={theme.muted} />
          <TextInput
            placeholder="Search nodes by ID or name..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.surface }]}>
          <Filter size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNodes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <NodeCard node={item} theme={theme} onPress={handleNodePress} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>No nodes found matching your search.</ThemedText>
          </View>
        }
      />

      <NodeDetailModal 
        visible={modalVisible} 
        node={selectedNode} 
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
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flex: 1,
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
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nodeCard: {
    width: COLUMN_WIDTH,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  cardContent: {
    marginBottom: 16,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  nodeId: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    opacity: 0.5,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectivityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
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
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: (width - 60) / 2,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: 12,
    opacity: 0.4,
  },
  detailsSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  tableContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  tableHead: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
  },
});

