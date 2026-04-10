import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../lib/redux/store';
import { setAuthenticated, setLoading } from '../lib/redux/slices/authSlice';
import { useAppSelector, useAppDispatch } from '../lib/redux/hooks';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const savedAuth = await AsyncStorage.getItem("smartlight_auth");
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          dispatch(setAuthenticated(authData));
        }
      } catch (e) {
        console.error("Failed to hydrate auth state", e);
      } finally {
        dispatch(setLoading(false));
      }
    };

    hydrateAuth();
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as any) === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutContent />
    </Provider>
  );
}
