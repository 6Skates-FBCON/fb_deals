import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Button } from '@/components/Button';

export default function SuccessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBackHome = () => {
    router.replace('/');
  };

  const handleViewDeals = () => {
    router.replace('/deals');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color={Colors.primary} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Purchase Complete!</Text>

        <Text style={styles.message}>
          Thanks for shopping with 6Skates! You'll receive a confirmation email shortly with all the details.
        </Text>

        <Text style={styles.subMessage}>
          Keep an eye on your inbox for shipping updates and tracking info.
        </Text>

        <View style={styles.buttonContainer}>
          <Button title="Back to Home" onPress={handleBackHome} fullWidth />
          <View style={styles.buttonSpacer} />
          <Button title="View More Deals" onPress={handleViewDeals} variant="secondary" fullWidth />
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
