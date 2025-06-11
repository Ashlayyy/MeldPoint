import { defineStore } from 'pinia';
import i18n from '@/main';
import { push } from 'notivue';

interface NotificationOptions {
  title?: string;
  message: string;
  duration?: number;
  id?: string;
  url?: string;
}

interface PromiseNotificationOptions {
  title?: string;
  message: string;
}

interface SystemNotificationOptions {
  title?: string;
  message: string;
  data?: any;
  id?: string;
  url?: string;
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    currentNotification: '',
    currentPromise: null as any,
    defaultDuration: 3000,
    activeNotifications: new Set<string>()
  }),

  actions: {
    error(options: NotificationOptions) {
      const t = i18n?.global?.t;
      if (options.id) {
        this.activeNotifications.add(options.id);
      }
      console.log('🔴 [NotificationStore] Error notification:', options);
      push.error({
        title: options.title || t('notifications.error'),
        message: options.message,
        duration: options.duration || this.defaultDuration
      });
    },

    info(options: NotificationOptions) {
      if (this.currentNotification !== options.message) {
        const t = i18n?.global?.t;
        this.currentNotification = options.message;
        if (options.id) {
          this.activeNotifications.add(options.id);
        }
        push.info({
          title: options.title || t('notifications.info'),
          message: options.message,
          duration: options.duration || this.defaultDuration
        });
      }
    },

    promise(options: PromiseNotificationOptions) {
      const t = i18n?.global?.t;
      if (this.currentPromise) {
        this.currentPromise.reject({
          title: t('notifications.promise_canceled'),
          duration: 1500
        });
        this.currentPromise = null;
      }
      this.currentPromise = push.promise({
        title: options.title || t('notifications.promise'),
        message: options.message,
        duration: 5000
      });
    },

    resolvePromise(options: NotificationOptions) {
      if (this.currentPromise) {
        const t = i18n?.global?.t;
        this.currentPromise.resolve({
          title: options.title || t('notifications.promise_success'),
          message: options.message,
          duration: options.duration || this.defaultDuration
        });
        this.currentPromise = null;
      }
    },

    rejectPromise(options: NotificationOptions) {
      if (this.currentPromise) {
        const t = i18n?.global?.t;
        this.currentPromise.reject({
          title: options.title || t('notifications.promise_error'),
          message: options.message,
          duration: options.duration || this.defaultDuration
        });
        this.currentPromise = null;
      }
    },

    removeNotifications(notificationIds: string[]) {
      notificationIds.forEach((id) => {
        this.activeNotifications.delete(id);
      });
    },

    clearAll() {
      this.activeNotifications.clear();
      this.currentNotification = '';
      if (this.currentPromise) {
        this.currentPromise.reject({
          title: i18n?.global?.t('notifications.promise_canceled'),
          duration: 1500
        });
        this.currentPromise = null;
      }
    },

    async system(options: SystemNotificationOptions) {
      const showToastInstead = () => {
        push.info({
          title: options.title || i18n?.global?.t('notifications.system'),
          message: options.message,
          duration: this.defaultDuration
        });
        if (options.id) {
          this.activeNotifications.add(options.id);
        }
      };

      if (!('Notification' in window)) {
        console.warn('❌ [NotificationStore] This browser does not support system notifications, falling back to toast');
        showToastInstead();
        return;
      }

      try {
        let permission = Notification.permission;

        if (permission === 'granted') {
          const t = i18n?.global?.t;
          const notification = new Notification(options.title || t('notifications.system'), {
            body: options.message,
            data: options.data,
            tag: options.id,
            icon: '/favicon.png'
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          if (options.id) {
            this.activeNotifications.add(options.id);
          }
        } else {
          console.warn('❌ [NotificationStore] Notification permission not granted:', permission);
          showToastInstead();
        }
      } catch (error) {
        console.error('❌ [NotificationStore] Failed to show system notification:', error);
        showToastInstead();
      }
    }
  }
});
