import api from '../lib/api';
import { Notification } from '../types/notification';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};
