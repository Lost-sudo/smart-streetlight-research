import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Animated, 
  Platform,
  Alert
} from 'react-native';
import { 
  Bell, 
  Moon, 
  LogOut, 
  ChevronRight, 
  Shield, 
  Globe, 
  RefreshCw,
  Info,
  Clock,
  CircleCheck as CheckCircle2
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SettingRow = ({ icon, label, subLabel, value, onValueChange, isSwitch, isDestructive, theme, isLast }: any) => (
  <View style={[styles.rowContainer, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.rowLeft}>
      <View style={[styles.iconBox, { backgroundColor: isDestructive ? '#EF444415' : `${theme.tint}10` }]}>
        {React.cloneElement(icon, { color: isDestructive ? '#EF4444' : theme.tint, size: 20 })}
      </View>
      <View style={styles.labelBox}>
        <ThemedText style={[styles.rowLabel, isDestructive && { color: '#EF4444', fontWeight: '700' }]}>{label}</ThemedText>
        {subLabel && <ThemedText style={styles.rowSubLabel}>{subLabel}</ThemedText>}
      </View>
    </View>
    <View style={styles.rowRight}>
      {isSwitch ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          trackColor={{ false: '#767577', true: theme.tint }}
          thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : value ? theme.tint : '#F4F3F4'}
        />
      ) : (
        <ChevronRight size={18} color={theme.muted} />
      )}
    </View>
  </View>
);

const SettingsGroup = ({ title, children, theme }: any) => (
  <View style={styles.group}>
    <ThemedText style={styles.groupTitle}>{title}</ThemedText>
    <View style={[styles.groupContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {children}
    </View>
  </View>
);

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  // States
  const [notifications, setNotifications] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const spinValue = React.useRef(new Animated.Value(0)).current;

  const startSync = () => {
    setIsSyncing(true);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Simulate sync
    setTimeout(() => {
      setIsSyncing(false);
      spinValue.setValue(0);
      Alert.alert("Sync Complete", "Fault data and technician tasks have been synchronized.");
    }, 2000);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to disconnect? You will need to re-authenticate to access fault monitoring.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => console.log("Logout triggered") }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
          <ThemedText style={styles.subtitle}>Manage your technician workspace</ThemedText>
        </View>

        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.avatarText}>JP</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.profileName}>John Patrick</ThemedText>
              <ThemedText style={styles.profileRole}>ID: TECH-7729 • Senior Technician</ThemedText>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: `${theme.success}15` }]}>
            <CheckCircle2 size={12} color={theme.success} />
            <ThemedText style={[styles.badgeText, { color: theme.success }]}>Online</ThemedText>
          </View>
        </View>

        {/* Connectivity */}
        <SettingsGroup title="Data & Connectivity" theme={theme}>
          <TouchableOpacity activeOpacity={0.7} onPress={startSync} style={styles.syncRow}>
             <View style={styles.rowLeft}>
               <View style={[styles.iconBox, { backgroundColor: `${theme.tint}10` }]}>
                 <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <RefreshCw color={theme.tint} size={20} />
                 </Animated.View>
               </View>
               <View style={styles.labelBox}>
                 <ThemedText style={styles.rowLabel}>Synchronize Data</ThemedText>
                 <ThemedText style={styles.rowSubLabel}>Last sync: 12 minutes ago</ThemedText>
               </View>
             </View>
             {isSyncing ? (
               <ThemedText style={[styles.syncingText, { color: theme.tint }]}>Syncing...</ThemedText>
             ) : (
               <ChevronRight size={18} color={theme.muted} />
             )}
          </TouchableOpacity>
        </SettingsGroup>

        {/* Notifications */}
        <SettingsGroup title="Notifications" theme={theme}>
          <SettingRow 
            icon={<Bell />} 
            label="Push Alerts" 
            subLabel="Real-time fault & maintenance alerts"
            isSwitch 
            value={notifications}
            onValueChange={setNotifications}
            theme={theme}
          />
          <SettingRow 
            icon={<Clock />} 
            label="Quiet Hours" 
            subLabel="Mute alerts during off-duty"
            isSwitch 
            value={false}
            onValueChange={() => {}}
            theme={theme}
            isLast
          />
        </SettingsGroup>

        {/* Appearance */}
        <SettingsGroup title="Preferences" theme={theme}>
          <SettingRow 
            icon={<Moon />} 
            label="Theme Mode" 
            subLabel={colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            theme={theme}
          />
          <SettingRow 
            icon={<Globe />} 
            label="Language" 
            subLabel="English (Philippines)"
            theme={theme}
            isLast
          />
        </SettingsGroup>

        {/* Support */}
        <SettingsGroup title="Support & System" theme={theme}>
          <SettingRow icon={<Shield />} label="Privacy Policy" theme={theme} />
          <SettingRow icon={<Info />} label="App Version" subLabel="v1.0.2 (Build 22)" theme={theme} isLast />
        </SettingsGroup>

        {/* Red Zone */}
        <View style={styles.destructGroup}>
          <TouchableOpacity 
            onPress={handleLogout}
            style={[styles.logoutBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <LogOut size={20} color="#EF4444" />
            <ThemedText style={styles.logoutText}>Disconnect Account</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.footerText}>Smart Streetlight Infrastructure Project © 2026</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  profileCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  group: {
    marginBottom: 28,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 32,
    marginBottom: 10,
  },
  groupContent: {
    marginHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBox: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  syncingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  destructGroup: {
    marginTop: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 11,
    opacity: 0.3,
    textAlign: 'center',
  },
});
