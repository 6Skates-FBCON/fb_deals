// app/_layout.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// 🔧 IMPORTANT: disable native screens to avoid the setSheetLargestUndimmedDetent crash
import { enableScreens } from 'react-native-screens';
enableScreens(false);

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[ROOT ERROR BOUNDARY] Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.title}>FB Deals – App Error</Text>
          <Text style={styles.message}>
            Something went wrong while loading the app.
          </Text>
          {this.state.message && (
            <Text style={styles.details}>{this.state.message}</Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="deal/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="success/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="error/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </RootErrorBoundary>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A6DFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  details: {
    fontSize: 12,
    color: '#E6E6E6',
    textAlign: 'center',
  },
});
