import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { ShoppingBag, MapPin, ClipboardList, Bell, UserCircle, Globe } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

function TabBarIcon({ Icon, color, size, badge }: { Icon: any; color: string; size: number; badge?: number }) {
  return (
    <View style={styles.iconContainer}>
      <Icon size={size} color={color} strokeWidth={2} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#e6e6e6',
        tabBarStyle: {
          backgroundColor: Colors.cardBg,
          borderTopWidth: 2,
          borderTopColor: Colors.primary,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Deals',
          tabBarIcon: ({ size, color }) => (
            <TabBarIcon Icon={ShoppingBag} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          tabBarIcon: ({ size, color }) => (
            <TabBarIcon Icon={MapPin} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => (
            <TabBarIcon Icon={ClipboardList} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => (
            <TabBarIcon Icon={Bell} size={size} color={color} badge={4} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <TabBarIcon Icon={UserCircle} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="website"
        options={{
          title: 'Website',
          tabBarIcon: ({ size, color }) => (
            <TabBarIcon Icon={Globe} size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => Linking.openURL('https://www.6skates.com')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
