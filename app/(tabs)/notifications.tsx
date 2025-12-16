import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Calendar, Megaphone } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/notification';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { markAllAsRead } = useNotifications();

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      markAllAsRead();
    }, [markAllAsRead])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIcon = (type: string) => {
    const color = Colors.primary;
    const size = 20;

    switch (type) {
      case 'event':
        return <Calendar size={size} color={color} />;
      case 'announcement':
        return <Megaphone size={size} color={color} />;
      default:
        return <Bell size={size} color={color} />;
    }
  };

  if (loading && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.length} total</Text>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>Check back later for updates about events and special drops</Text>
        </View>
      ) : (
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.iconContainer}>
                {getIcon(notification.type)}
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>{getTimeAgo(notification.published_at)}</Text>
                </View>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
              </View>

              <View style={styles.unreadDot} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Stay in the Loop</Text>
        <Text style={styles.infoText}>
          Get notified about flash deals, events, and exclusive drops.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorBanner: {
    backgroundColor: '#EF4444',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    ...Typography.body,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
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
  notificationTime: {
    ...Typography.small,
    color: Colors.midGrey,
  },
  notificationMessage: {
    ...Typography.caption,
    color: Colors.white,
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
