import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../lib/redux/hooks';
import { useLoginMutation } from '../lib/redux/api/authApi';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputScale = useSharedValue(1);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    try {
      await login({ username, password }).unwrap();
      // Router redirection is handled in _layout.tsx based on state
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.data?.detail || 'Authentication failed. Please try again.');
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: inputScale.value }],
    };
  });

  const onPressIn = () => {
    inputScale.value = withSpring(0.98);
  };

  const onPressOut = () => {
    inputScale.value = withSpring(1);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <Animated.View 
            entering={FadeInDown.delay(200).duration(1000).springify()}
            style={styles.header}
          >
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Zap size={32} color={colorScheme === 'light' ? '#FFF' : '#000'} fill={colorScheme === 'light' ? '#FFF' : '#000'} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>SmartLight</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>TECHNICIAN PORTAL</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(400).duration(1000).springify()}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>System Access</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>Enter your credentials to manage local grid nodes</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.input }]}>
                  <Mail size={20} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your username"
                    placeholderTextColor={colors.muted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <View style={[styles.inputContainer, { borderColor: colors.inputBorder, backgroundColor: colors.input }]}>
                  <Lock size={20} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.muted} />
                    ) : (
                      <Eye size={20} color={colors.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {error && (
                <Animated.View entering={FadeInDown} style={styles.errorContainer}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </Animated.View>
              )}

              <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={[styles.loginButton, { backgroundColor: colors.primary }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colorScheme === 'light' ? '#FFF' : '#000'} />
                  ) : (
                    <>
                      <Text style={[styles.loginButtonText, { color: colorScheme === 'light' ? '#FFF' : '#000' }]}>
                        Authorize Access
                      </Text>
                      <ChevronRight size={20} color={colorScheme === 'light' ? '#FFF' : '#000'} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(600).duration(1000).springify()}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: colors.muted }]}>
              Authorized Personnel Only. All actions are logged and audited for security compliance.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    opacity: 0.7,
  },
});
