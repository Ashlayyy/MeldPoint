import { defineStore } from 'pinia';
import { ref } from 'vue';
import { NotificationService } from '@/services/NotificationService';

interface Notification {
  id: string;
  type: 'system' | 'toast';
  message: string;
  data?: any;
  url?: string;
  read: boolean;
  createdAt: Date;
  isBroadcast?: boolean;
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: ref<Notification[]>([]),
    service: NotificationService.getInstance()
  }),

  getters: {
    unreadCount: (state: any) => state.notifications.filter((n: any) => !n.read).length,
    systemNotifications: (state: any) => state.notifications.filter((n: any) => n.type === 'system'),
    toastNotifications: (state: any) => state.notifications.filter((n: any) => n.type === 'toast')
  },

  actions: {
    async connect(userId: string) {
      await this.service.connect(userId);
    },

    disconnect() {
      this.service.disconnect();
      this.notifications = [];
    },

    addNotification(notification: Notification) {
      this.notifications.unshift(notification);
    },

    async markAsRead(notificationId: string) {
      const notification = this.notifications.find((n: any) => n.id === notificationId);
      if (!notification || notification.read) return;

      const success = await this.service.markAsRead(notificationId);
      if (success) {
        notification.read = true;
      }
    },

    async markAllAsRead() {
      const unreadNotifications = this.notifications.filter((n: any) => !n.read);
      if (unreadNotifications.length === 0) return;

      const notificationIds = unreadNotifications.map(n => n.id);
      const success = await this.service.markMultipleAsRead(notificationIds);
      
      if (success) {
        unreadNotifications.forEach(notification => {
          notification.read = true;
        });
      }
    },

    removeNotification(notificationId: string) {
      const index = this.notifications.findIndex((n: any) => n.id === notificationId);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    }
  }
});
