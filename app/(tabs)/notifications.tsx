import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Bell, Package, Calendar, Megaphone } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface Notification {
  id: number;
  type: 'order' | 'event' | 'announcement' | 'general';
  title: string;
  preview: string;
  time: string;
  unread: boolean;
}

export default function NotificationsScreen() {
  const notifications: Notification[] = [
    {
      id: 1,
      type: 'order',
      title: 'Order Shipped!',
      preview: 'Your Limited Edition Tech Deck is on its way. Track your package...',
      time: '2h ago',
      unread: true,
    },
    {
      id: 2,
      type: 'event',
      title: 'Friday Night Session',
      preview: 'This Friday at 7 PM. Free entry, prizes for best trick!',
      time: '5h ago',
      unread: true,
    },
    {
      id: 3,
      type: 'announcement',
      title: 'New Flash Deal Dropping Soon',
      preview: 'Get ready! Tomorrow we\'re dropping an exclusive deck at 50% off...',
      time: '1d ago',
      unread: true,
    },
    {
      id: 4,
      type: 'general',
      title: 'Welcome to 6Skates!',
      preview: 'Thanks for joining the crew. Check out our latest deals and...',
      time: '3d ago',
      unread: true,
    },
  ];

  const getIcon = (type: string, unread: boolean) => {
    const color = unread ? Colors.primary : Colors.midGrey;
    const size = 20;

    switch (type) {
      case 'order':
        return <Package size={size} color={color} />;
      case 'event':
        return <Calendar size={size} color={color} />;
      case 'announcement':
        return <Megaphone size={size} color={color} />;
      default:
        return <Bell size={size} color={color} />;
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>4 new</Text>
        </View>
      </View>

      <View style={styles.notificationsList}>
        {notifications.map((notification) => (
          <TouchableOpacity key={notification.id} style={styles.notificationCard} activeOpacity={0.8}>
            <View style={[styles.iconContainer, notification.unread && styles.iconContainerUnread]}>
              {getIcon(notification.type, notification.unread)}
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={[styles.notificationTitle, notification.unread && styles.notificationUnread]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              <Text style={styles.notificationPreview} numberOfLines={2}>
                {notification.preview}
              </Text>
            </View>

            {notification.unread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Stay in the Loop</Text>
        <Text style={styles.infoText}>
          Get notified about flash deals, event updates, and order confirmations.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.hero,
    color: Colors.white,
  },
  badge: {
    backgroundColor: Colors.accent,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.captionBold,
    color: Colors.white,
  },
  notificationsList: {
    marginBottom: Spacing.xl,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#021B3D',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerUnread: {
    backgroundColor: Colors.primary + '15',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
    flex: 1,
    marginRight: Spacing.sm,
  },
  notificationUnread: {
    color: Colors.primary,
  },
  notificationTime: {
    ...Typography.small,
    color: Colors.midGrey,
  },
  notificationPreview: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.sm,
    alignSelf: 'center',
  },
  infoBox: {
    backgroundColor: '#021B3D',
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
    color: Colors.white,
    lineHeight: 24,
  },
});
