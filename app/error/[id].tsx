import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { XCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Button } from '@/components/Button';

export default function ErrorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleRetry = () => {
    router.replace(`/checkout/${id}`);
  };

  const handleBackHome = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <XCircle size={80} color={Colors.accent} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Oops, Something Went Wrong</Text>

        <Text style={styles.message}>
          We couldn't complete your purchase. This could be because the deal sold out or there was a connection issue.
        </Text>

        <Text style={styles.subMessage}>
          Don't worry, no charges were made. Want to try again?
        </Text>

        <View style={styles.buttonContainer}>
          <Button title="Try Again" onPress={handleRetry} fullWidth />
          <View style={styles.buttonSpacer} />
          <Button title="Back to Home" onPress={handleBackHome} variant="secondary" fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.hero,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    ...Typography.body,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  subMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  buttonSpacer: {
    height: Spacing.md,
  },
});
