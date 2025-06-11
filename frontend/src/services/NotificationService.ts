import { Socket } from 'socket.io-client';
import { useSocket } from '@/composables/useSocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotificationStore as useVerbeterpleinNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useAuthStore } from '@/stores/auth';
import axios from '@/utils/axios';

interface NotificationData {
  id: string;
  type: 'system' | 'toast';
  message: string;
  data?: any;
  url?: string;
  createdAt: string;
  isBroadcast?: boolean;
}

type NotificationStore = ReturnType<typeof useNotificationStore>;
type VerbeterpleinNotificationStore = ReturnType<typeof useVerbeterpleinNotificationStore>;

export class NotificationService {
  private static instance: NotificationService | null = null;
  private socket: Socket | null = null;
  private isConnected = false;
  private userId: string | null = null;
  private store: NotificationStore | null = null;
  private toastStore: VerbeterpleinNotificationStore | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private isReconnecting = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private getStore(): NotificationStore {
    if (!this.store) {
      this.store = useNotificationStore();
    }
    return this.store;
  }

  private getToastStore(): VerbeterpleinNotificationStore {
    if (!this.toastStore) {
      this.toastStore = useVerbeterpleinNotificationStore();
    }
    return this.toastStore;
  }

  public async connect(userId: string, isReconnectAttempt = false): Promise<void> {
    if (this.isConnected && this.userId === userId) {
      return;
    }

    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Prevent multiple reconnection attempts at the same time
    if (this.isReconnecting) {
      console.warn('[NotificationService] Reconnection already in progress');
      return;
    }

    this.userId = userId;

    // Only reset reconnect attempts on fresh connections, not reconnection attempts
    if (!isReconnectAttempt) {
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    }

    try {
      // Get deviceId from localStorage or generate a new one
      const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
      if (!localStorage.getItem('device_id')) {
        localStorage.setItem('device_id', deviceId);
      }

      // Initialize socket with auth parameters
      const { socket } = useSocket();

      // Check for API key in localStorage
      const apiKey = localStorage.getItem('api_key');

      // Set auth parameters based on connection type
      socket.auth = {
        userId,
        deviceId,
        type: 'notifications',
        ...(apiKey && { apiKey })
      };

      this.socket = socket;

      if (!this.socket) {
        throw new Error('Socket initialization failed');
      }

      this.setupEventListeners();

      // Set a connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('[NotificationService] Connection timeout');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, 10000);

      this.isConnected = true;
      // Fetch existing notifications
      await this.fetchNotifications();
    } catch (error) {
      console.error('[NotificationService] Connection failed:', error);
      this.handleConnectionError(error);
      throw error;
    }
  }

  private handleConnectionError(error: any): void {
    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.isConnected = false;
    if (this.socket) {
      this.removeEventListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on('notifications:system', this.handleSystemNotification);
    this.socket.on('notifications:toast', this.handleToastNotification);
    this.socket.on('notifications:error', this.handleError);
  }

  private removeEventListeners(): void {
    if (!this.socket) return;

    this.socket.off('notifications:system', this.handleSystemNotification);
    this.socket.off('notifications:toast', this.handleToastNotification);
    this.socket.off('notifications:error', this.handleError);
  }

  private handleSystemNotification = (data: NotificationData): void => {
    try {
      // Add to notification dropdown
      this.getStore().addNotification({
        id: data.id,
        type: 'system',
        message: data.message,
        data: data.data,
        url: data.url,
        read: false,
        createdAt: new Date(data.createdAt),
        isBroadcast: data.isBroadcast
      });

      // Show system notification
      this.getToastStore().system({
        message: data.message,
        data: data.data,
        url: data.url,
        id: data.id
      });
    } catch (error) {
      console.error('❌ [NotificationService] Failed to handle system notification:', error);
    }
  };

  private handleToastNotification = (data: NotificationData): void => {
    try {
      // Add to notification dropdown
      this.getStore().addNotification({
        id: data.id,
        type: 'toast',
        message: data.message,
        data: data.data,
        url: data.url,
        read: false,
        createdAt: new Date(data.createdAt),
        isBroadcast: data.isBroadcast
      });

      this.getToastStore().info({
        message: data.message,
        id: data.id,
        url: data.url,
        duration: 5000
      });
    } catch (error) {
      console.error('❌ [NotificationService] Failed to handle toast notification:', error);
    }
  };

  private handleError = async (error: any): Promise<void> => {
    console.error('❌ [NotificationService] Notification error:', {
      error,
      timestamp: new Date().toISOString(),
      details: error?.message || 'No error details available'
    });

    // Don't attempt reconnection if we've hit the max attempts
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('[NotificationService] Max reconnection attempts reached');
      this.isReconnecting = false;
      return;
    }

    // Handle specific error cases
    if (error?.message === 'User ID not found' || error?.message === 'Not authenticated') {
      if (!this.isReconnecting) {
        this.isReconnecting = true;
        this.reconnectAttempts++;

        try {
          // Check auth status
          const authStore = useAuthStore();
          const isAuthenticated = await authStore.checkAuth();

          if (isAuthenticated && authStore.user?.id) {
            // Disconnect current socket
            this.disconnect();
            // Wait a bit before reconnecting with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
            await new Promise((resolve) => setTimeout(resolve, delay));
            // Pass true to indicate this is a reconnection attempt
            await this.connect(authStore.user.id, true);
            console.log('[NotificationService] Reconnected successfully');
          } else {
            console.error('[NotificationService] Failed to reconnect - User not authenticated');
            // Clear connection state on authentication failure
            this.handleConnectionError(new Error('Authentication failed'));
          }
        } catch (reconnectError) {
          console.error('[NotificationService] Failed to reconnect:', reconnectError);
          this.handleConnectionError(reconnectError);
        } finally {
          this.isReconnecting = false;
        }
      } else {
        console.warn('[NotificationService] Reconnection already in progress');
      }
    }
  };

  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      console.debug('[NotificationService] Marking notification as read:', notificationId);
      const response = await axios.post('/notifications/mark-read', {
        notificationIds: [notificationId]
      });
      console.debug('[NotificationService] Successfully marked notification as read');
      return response.status === 200;
    } catch (error) {
      console.error('[NotificationService] Failed to mark notification as read:', error);
      return false;
    }
  }

  public async markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      console.debug('[NotificationService] Marking multiple notifications as read:', notificationIds);
      const response = await axios.post('/notifications/mark-read', {
        notificationIds
      });
      console.debug('[NotificationService] Successfully marked notifications as read');
      return response.status === 200;
    } catch (error) {
      console.error('[NotificationService] Failed to mark notifications as read:', error);
      return false;
    }
  }

  public async fetchNotifications(): Promise<void> {
    try {
      const response = await axios.get('/notifications');
      const notifications = response.data.data;

      notifications.forEach((notification: NotificationData) => {
        this.getStore().addNotification({
          id: notification.id,
          type: notification.type,
          message: notification.message,
          data: notification.data ? JSON.parse(notification.data) : undefined,
          url: notification.url,
          read: false,
          createdAt: new Date(notification.createdAt),
          isBroadcast: notification.isBroadcast
        });
      });
    } catch (error) {
      console.error('[NotificationService] Failed to fetch notifications:', error);
    }
  }

  public disconnect(): void {
    if (!this.isConnected) return;

    this.isConnected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.removeEventListeners();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export a singleton instance
export const notificationService = NotificationService.getInstance();
