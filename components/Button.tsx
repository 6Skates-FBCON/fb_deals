import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
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

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'disabled' && styles.disabledButton,
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
            variant === 'disabled' && styles.disabledButtonText,
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
    color: Colors.textSecondary,
  },
});
