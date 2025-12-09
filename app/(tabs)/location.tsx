import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Phone, ExternalLink } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/Button';

export default function LocationScreen() {
  const shopAddress = '1936 Danforth Ave, Toronto, ON M4C 1J4';
  const shopHours = [
    { day: 'Wednesday - Friday', hours: '3:00 PM - 7:00 PM' },
    { day: 'Saturday', hours: '2:00 PM - 7:00 PM' },
    { day: 'Sunday', hours: '2:00 PM - 7:00 PM' },
  ];

  const handleGetDirections = () => {
    const url = `https://maps.google.com/?q=${encodeURIComponent('6Skates Toronto')}`;
    Linking.openURL(url);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${shopPhone.replace(/[^0-9]/g, '')}`);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Visit Us</Text>
        <Text style={styles.subtitle}>6Skates Fingerboard Shop & Park</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconHeader}>
          <MapPin size={24} color={Colors.primary} />
          <Text style={styles.cardTitle}>Location</Text>
        </View>
        <Text style={styles.address}>{shopAddress}</Text>
        <Button title="Get Directions" onPress={handleGetDirections} fullWidth />
      </View>

      <View style={styles.card}>
        <View style={styles.iconHeader}>
          <Clock size={24} color={Colors.primary} />
          <Text style={styles.cardTitle}>Hours</Text>
        </View>
        {shopHours.map((schedule, index) => (
          <View key={index} style={styles.hoursRow}>
            <Text style={styles.dayText}>{schedule.day}</Text>
            <Text style={styles.hoursText}>{schedule.hours}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.iconHeader}>
          <Phone size={24} color={Colors.primary} />
          <Text style={styles.cardTitle}>Contact</Text>
        </View>
        <Text style={styles.phoneText}>{shopPhone}</Text>
        <Button title="Call Shop" onPress={handleCall} variant="secondary" fullWidth />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Come Through!</Text>
        <Text style={styles.infoText}>
          Stop by to check out our full selection of decks, wheels, obstacles, and more.
          Our park is open for sessions during business hours.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.hero,
    color: Colors.white,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.heading,
    color: Colors.white,
  },
  address: {
    ...Typography.body,
    color: Colors.white,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  dayText: {
    ...Typography.body,
    color: Colors.white,
  },
  hoursText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  phoneText: {
    ...Typography.title,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  infoTitle: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.body,
    color: Colors.lightGrey,
    lineHeight: 24,
  },
});
