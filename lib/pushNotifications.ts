import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007bff',
    });
  }

  const projectId = '02437a51-f86e-4f71-bb97-762c09aee0ea';
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const platform = Platform.OS as string;
  const deviceName = Device.deviceName || `${Platform.OS} device`;

  const { data: existing } = await supabase
    .from('push_tokens')
    .select('id, user_id')
    .eq('expo_push_token', token)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('push_tokens')
      .update({
        user_id: userId,
        device_name: deviceName,
        platform,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('push_tokens')
      .insert({
        user_id: userId,
        expo_push_token: token,
        device_name: deviceName,
        platform,
        active: true,
      });
  }
}

export async function removePushToken(token: string): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('expo_push_token', token);
}
