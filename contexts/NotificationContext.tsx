import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications, savePushToken } from '@/lib/pushNotifications';

interface NotificationContextType {
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LAST_VIEWED_KEY = '@notifications_last_viewed';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const router = useRouter();

  const refreshUnreadCount = async () => {
    try {
      const lastViewed = await AsyncStorage.getItem(LAST_VIEWED_KEY);

      const { data, error } = await supabase
        .from('notifications')
        .select('id, published_at')
        .order('published_at', { ascending: false });

      if (error) throw error;

      if (!lastViewed || !data) {
        setUnreadCount(data?.length || 0);
        return;
      }

      const lastViewedDate = new Date(lastViewed);
      const unread = data.filter(
        (notification) => new Date(notification.published_at) > lastViewedDate
      );

      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_VIEWED_KEY, now);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    refreshUnreadCount();

    const interval = setInterval(refreshUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let mounted = true;

    const setupPush = async () => {
      const token = await registerForPushNotifications();
      if (!mounted || !token) return;

      setExpoPushToken(token);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await savePushToken(session.user.id, token);
      }
    };

    setupPush();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const actionType = data?.push_action_type as string | undefined;
      const actionTarget = data?.push_action_target as string | undefined;

      if (actionType === 'url' && actionTarget) {
        Linking.openURL(actionTarget);
      } else if (actionType === 'deal' && actionTarget) {
        router.push(`/deal/${actionTarget}` as any);
      } else if (actionType === 'tab' && actionTarget) {
        router.push(`/(tabs)/${actionTarget}` as any);
      } else {
        router.push('/(tabs)/notifications');
      }
    });

    return () => {
      mounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !expoPushToken) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && expoPushToken) {
        (async () => {
          await savePushToken(session.user.id, expoPushToken);
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, [expoPushToken]);

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllAsRead, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
