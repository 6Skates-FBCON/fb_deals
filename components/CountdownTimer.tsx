import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { getCountdownDisplay } from '@/utils/dealUtils';

interface CountdownTimerProps {
  endDate: string;
  onExpire?: () => void;
}

export function CountdownTimer({ endDate, onExpire }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(getCountdownDisplay(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdown = getCountdownDisplay(endDate);
      setCountdown(newCountdown);

      if (
        newCountdown.days === '00' &&
        newCountdown.hours === '00' &&
        newCountdown.minutes === '00' &&
        newCountdown.seconds === '00'
      ) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpire]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Deal Ends In</Text>
      <View style={styles.timerRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{countdown.days}</Text>
          <Text style={styles.timeLabel}>Days</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{countdown.hours}</Text>
          <Text style={styles.timeLabel}>Hours</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{countdown.minutes}</Text>
          <Text style={styles.timeLabel}>Mins</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{countdown.seconds}</Text>
          <Text style={styles.timeLabel}>Secs</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.captionBold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  timeBlock: {
    backgroundColor: Colors.darkBg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  timeValue: {
    ...Typography.title,
    color: Colors.primary,
    fontWeight: '700',
  },
  timeLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    ...Typography.title,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});
