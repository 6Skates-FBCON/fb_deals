export type NotificationType = 'event' | 'announcement' | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  preview: string;
  published_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
