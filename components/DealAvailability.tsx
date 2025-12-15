import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface DealAvailabilityProps {
  availabilityPercent: number;
}

export function DealAvailability({ availabilityPercent }: DealAvailabilityProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const clampedPercent = Math.max(0, Math.min(100, availabilityPercent));

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: clampedPercent,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [clampedPercent]);

  const getProgressColor = () => {
    if (clampedPercent >= 70) return '#0A6DFF';
    if (clampedPercent >= 40) return '#2DD4BF';
    return '#EF4444';
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deal Details</Text>
      <Text style={styles.label}>Availability</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.percentText}>{Math.round(clampedPercent)}% LEFT</Text>
      </View>

      {clampedPercent < 40 && (
        <Text style={styles.helperText}>Selling fast</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161616',
    padding: 20,
    borderRadius: 18,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 12,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 70,
    textAlign: 'right',
  },
  helperText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.7,
  },
});
