import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'disabled';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading || variant === 'disabled';

  if (variant === 'disabled') {
    return (
      <View style={[styles.button, fullWidth && styles.fullWidth, styles.disabledButtonWrapper]}>
        <LinearGradient
          colors={['#2C2C2E', '#1C1C1E', '#2C2C2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.disabledGradient}
        >
          <View style={styles.stripeContainer}>
            <View style={styles.stripe} />
            <View style={styles.stripe} />
            <View style={styles.stripe} />
            <View style={styles.stripe} />
          </View>
          <Text style={styles.disabledButtonText}>{title}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'secondary' && styles.secondaryButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: Colors.cardBg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: Colors.cardBg,
  },
  disabledButtonWrapper: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  stripeContainer: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    transform: [{ rotate: '-45deg' }],
    opacity: 0.15,
  },
  stripe: {
    width: 40,
    height: '200%',
    backgroundColor: '#48484A',
  },
  buttonText: {
    ...Typography.bodyBold,
    fontSize: 17,
  },
  primaryButtonText: {
    color: Colors.black,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  disabledButtonText: {
    color: '#8E8E93',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
