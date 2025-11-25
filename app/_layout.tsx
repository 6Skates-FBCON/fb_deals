import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (loading || isNavigating) return;

    const inAuthGroup = segments[0] === 'auth';

    const navigate = async () => {
      setIsNavigating(true);
      try {
        if (!user && !inAuthGroup) {
          await router.replace('/auth/login');
        } else if (user && inAuthGroup) {
          await router.replace('/(tabs)');
        }
      } finally {
        setIsNavigating(false);
      }
    };

    navigate();
  }, [user, loading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="deal/[id]" />
        <Stack.Screen name="checkout/[id]" />
        <Stack.Screen name="success/[id]" />
        <Stack.Screen name="error/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
