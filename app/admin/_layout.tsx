import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace('/(tabs)');
    }
  }, [user, isAdmin, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user || !isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>You must be an admin to access this area.</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.darkBg,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Deal Management',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add-deal"
        options={{
          title: 'Add New Deal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit-deal/[id]"
        options={{
          title: 'Edit Deal',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
