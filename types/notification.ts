export type NotificationType = 'event' | 'announcement' | 'general';

export type PushActionType = 'tab' | 'deal' | 'url';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  preview: string;
  published_at: string;
  expires_at: string | null;
  push_action_type: PushActionType;
  push_action_target: string;
  created_at: string;
  updated_at: string;
}
