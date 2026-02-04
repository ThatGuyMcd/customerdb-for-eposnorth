import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Database, LogOut, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from './Toast';

export default function Header() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, isLoggedIn, logout, logoutLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out');
    } catch (e: any) {
      showToast(e.message || 'Logout failed');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.panel, borderColor: theme.line }]}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Database size={20} color="#fff" />
        </View>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>CustomerDB</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Made for Epos North
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          {isDark ? (
            <Sun size={18} color={theme.accent} />
          ) : (
            <Moon size={18} color={theme.muted} />
          )}
        </TouchableOpacity>

        <View style={[styles.pill, { backgroundColor: theme.panel2, borderColor: theme.line }]}>
          <Text style={[styles.pillText, { color: theme.muted }]}>
            {isLoggedIn && user
              ? `${user.username} • ${user.admin ? 'ADMIN' : 'USER'}`
              : 'Not logged in'}
          </Text>
          {isLoggedIn && (
            <TouchableOpacity
              onPress={handleLogout}
              disabled={logoutLoading}
              style={[styles.logoutBtn, { borderColor: theme.line }]}
            >
              <LogOut size={14} color={theme.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38bdf8',
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    marginLeft: 12,
  },
  themeBtn: {
    padding: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    flexShrink: 1,
  },
  logoutBtn: {
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
});
