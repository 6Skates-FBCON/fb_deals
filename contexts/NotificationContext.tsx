import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface NotificationContextType {
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LAST_VIEWED_KEY = '@notifications_last_viewed';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

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
