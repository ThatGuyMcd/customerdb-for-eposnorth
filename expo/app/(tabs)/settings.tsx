import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Moon, Trash2, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Toast, { showToast } from '@/components/Toast';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, isLoggedIn } = useAuth();

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear geocode cache and column preferences.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(
              (k) => k.startsWith('custdb:') || k.startsWith('customerdb_')
            );
            await AsyncStorage.multiRemove(cacheKeys);
            showToast('Cache cleared');
          } catch {
            showToast('Error clearing cache');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.panel, borderColor: theme.line }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={[styles.section, { backgroundColor: theme.panel, borderColor: theme.line }]}>
          <View style={[styles.sectionHeader, { borderColor: theme.line }]}>
            <Moon size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.switchHint, { color: theme.muted }]}>
                  Toggle dark/light theme
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.line, true: theme.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.panel, borderColor: theme.line }]}>
          <View style={[styles.sectionHeader, { borderColor: theme.line }]}>
            <Trash2 size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data</Text>
          </View>

          <View style={styles.sectionBody}>
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={handleClearCache}
            >
              <Trash2 size={14} color="#ef4444" />
              <Text style={styles.btnDangerText}>Clear Local Cache</Text>
            </TouchableOpacity>
            <Text style={[styles.hint, { color: theme.muted }]}>
              Clears geocode cache and column preferences
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.panel, borderColor: theme.line }]}>
          <View style={[styles.sectionHeader, { borderColor: theme.line }]}>
            <Info size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          </View>

          <View style={styles.sectionBody}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>Status</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {isLoggedIn && user
                  ? `Logged in as ${user.username} (${user.admin ? 'Admin' : 'User'})`
                  : 'Not logged in'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>App Version</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>1.0.0</Text>
            </View>

            <Text style={[styles.about, { color: theme.muted }]}>
              CustomerDB Mobile is a React Native client for CustomerDB Web. It provides browser
              CRUD functionality for your DATA.csv files with support for route planning and
              geocoding.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sectionBody: {
    padding: 14,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  btnDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  btnDangerText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  about: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
});
