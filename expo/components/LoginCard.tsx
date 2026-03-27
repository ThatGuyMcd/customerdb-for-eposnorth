import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { User, Lock, Zap, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from './Toast';
import { api } from '@/services/api';

export default function LoginCard() {
  const { theme } = useTheme();
  const { login, loginLoading, ping, pingLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let mounted = true;
    
    const checkServerSafe = async () => {
      if (!mounted) return;
      setServerStatus('checking');
      const isOnline = await api.checkServerStatus();
      if (!mounted) return;
      console.log('[LoginCard] Server status check result:', isOnline);
      setServerStatus(isOnline ? 'online' : 'offline');
    };
    
    checkServerSafe();
    
    const interval = setInterval(() => {
      checkServerSafe();
    }, 15000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const checkServer = async () => {
    setServerStatus('checking');
    try {
      const isOnline = await api.checkServerStatus();
      console.log('[LoginCard] Manual server check result:', isOnline);
      setServerStatus(isOnline ? 'online' : 'offline');
    } catch (e) {
      console.log('[LoginCard] Manual server check error:', e);
      setServerStatus('offline');
    }
  };

  const handlePing = async () => {
    try {
      const result = await ping();
      setServerStatus('online');
      showToast(`pong ${result.ts?.slice(11, 19) || ''}`);
    } catch (e: any) {
      setServerStatus('offline');
      showToast(e.message || 'Ping failed');
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !passcode.trim()) {
      showToast('Enter username and passcode');
      return;
    }
    try {
      await login({ username: username.trim(), passcode: passcode.trim() });
      setServerStatus('online');
      showToast('Logged in');
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('network') || e.message?.toLowerCase().includes('fetch')) {
        setServerStatus('offline');
      }
      showToast(e.message || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.panel, borderColor: theme.line }]}>
          <View style={[styles.header, { backgroundColor: theme.panelHd, borderColor: theme.line }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Login</Text>
          </View>

          <View style={styles.body}>
            {serverStatus === 'offline' && (
              <View style={[styles.serverAlert, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                <AlertTriangle size={18} color="#ef4444" />
                <View style={styles.serverAlertContent}>
                  <Text style={styles.serverAlertTitle}>Server Unavailable</Text>
                  <Text style={[styles.serverAlertText, { color: theme.muted }]}>
                    Cannot connect to the server. Please check your connection or try again later.
                  </Text>
                </View>
                <TouchableOpacity onPress={checkServer} style={styles.retryBtn}>
                  <RefreshCw size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
            )}

            {serverStatus === 'checking' && (
              <View style={[styles.serverAlert, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.4)' }]}>
                <ActivityIndicator size="small" color="#38bdf8" />
                <Text style={[styles.serverCheckingText, { color: theme.muted }]}>Checking server status...</Text>
              </View>
            )}
            <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <User size={14} color={theme.muted} />
                    <Text style={[styles.label, { color: theme.muted }]}>Username</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.line,
                        color: theme.text,
                      },
                    ]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Ross"
                    placeholderTextColor={theme.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Lock size={14} color={theme.muted} />
                    <Text style={[styles.label, { color: theme.muted }]}>Passcode</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.line,
                        color: theme.text,
                      },
                    ]}
                    value={passcode}
                    onChangeText={setPasscode}
                    placeholder="••••"
                    placeholderTextColor={theme.muted}
                    secureTextEntry
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={handleLogin}
                    disabled={loginLoading || serverStatus !== 'online'}
                  >
                    {loginLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.btnTextPrimary}>Login</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary, { borderColor: theme.line }]}
                    onPress={handlePing}
                    disabled={pingLoading}
                  >
                    {pingLoading ? (
                      <ActivityIndicator size="small" color={theme.text} />
                    ) : (
                      <>
                        <Zap size={14} color={theme.text} />
                        <Text style={[styles.btnText, { color: theme.text }]}>Ping</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.help, { color: theme.muted }]}>
              Uses data\USERS\USERS.csv. Databases shown are restricted by ALLOWED_DATABASE
              fields unless your user is ADMIN.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 50,
    elevation: 8,
  },
  header: {
    padding: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  body: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: 'rgba(56,189,248,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.55)',
  },
  btnSecondary: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  btnTextPrimary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#38bdf8',
  },
  help: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
  },
  serverAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  serverAlertContent: {
    flex: 1,
  },
  serverAlertTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ef4444',
    marginBottom: 2,
  },
  serverAlertText: {
    fontSize: 12,
    lineHeight: 16,
  },
  serverCheckingText: {
    fontSize: 13,
  },
  retryBtn: {
    padding: 8,
  },
});
