export type NotificationType = 'return_due' | 'payment_pending' | 'maintenance' | 'verification' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
}
