import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationService } from '@/services/NotificationService'; // Import the real service

// Mock the NotificationService
vi.mock('@/services/NotificationService', () => {
  const mockInstance = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    markAsRead: vi.fn(),
    markMultipleAsRead: vi.fn()
  };
  return {
    NotificationService: {
      getInstance: vi.fn(() => mockInstance)
    }
  };
});

// Helper function to create a mock notification
const createMockNotification = (id: string, read = false, type: 'system' | 'toast' = 'system'): any => ({
  id,
  type,
  message: `Message ${id}`,
  read,
  createdAt: new Date()
});

describe('Notification Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset mocks before each test
    vi.clearAllMocks();
    // Re-mock getInstance to return a fresh mock instance for each test
    const mockInstance = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      markAsRead: vi.fn(),
      markMultipleAsRead: vi.fn()
    };
    (NotificationService.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);
  });

  it('initializes with empty notifications and gets service instance', () => {
    const store = useNotificationStore();
    expect(store.notifications).toEqual([]);
    expect(NotificationService.getInstance).toHaveBeenCalledTimes(1);
    expect(store.service).toBeDefined();
  });

  describe('Getters', () => {
    it('unreadCount returns correct count', () => {
      const store = useNotificationStore();
      store.notifications = [createMockNotification('1', true), createMockNotification('2', false), createMockNotification('3', false)];
      expect(store.unreadCount).toBe(2);
    });

    it('systemNotifications returns only system notifications', () => {
      const store = useNotificationStore();
      store.notifications = [
        createMockNotification('1', false, 'system'),
        createMockNotification('2', false, 'toast'),
        createMockNotification('3', false, 'system')
      ];
      expect(store.systemNotifications.length).toBe(2);
      expect(store.systemNotifications.every((n: any) => n.type === 'system')).toBe(true);
    });

    it('toastNotifications returns only toast notifications', () => {
      const store = useNotificationStore();
      store.notifications = [
        createMockNotification('1', false, 'system'),
        createMockNotification('2', false, 'toast'),
        createMockNotification('3', false, 'system')
      ];
      expect(store.toastNotifications.length).toBe(1);
      expect(store.toastNotifications[0].type).toBe('toast');
      expect(store.toastNotifications[0].id).toBe('2');
    });
  });

  describe('Actions', () => {
    it('addNotification adds a notification to the beginning of the list', () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1');
      const notification2 = createMockNotification('2');

      store.addNotification(notification1);
      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0]).toStrictEqual(notification1);

      store.addNotification(notification2);
      expect(store.notifications.length).toBe(2);
      expect(store.notifications[0]).toStrictEqual(notification2); // Should be added to the beginning
      expect(store.notifications[1]).toStrictEqual(notification1);
    });

    it('removeNotification removes the correct notification', () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1');
      const notification2 = createMockNotification('2');
      const notification3 = createMockNotification('3');
      store.notifications = [notification1, notification2, notification3];

      store.removeNotification('2');
      expect(store.notifications.length).toBe(2);
      expect(store.notifications.find((n) => n.id === '2')).toBeUndefined();
      expect(store.notifications[0]).toStrictEqual(notification1);
      expect(store.notifications[1]).toStrictEqual(notification3);

      // Test removing non-existent notification
      store.removeNotification('4');
      expect(store.notifications.length).toBe(2);
    });

    it('connect calls service.connect', async () => {
      const store = useNotificationStore();
      const userId = 'user-123';
      await store.connect(userId);
      expect(store.service.connect).toHaveBeenCalledTimes(1);
      expect(store.service.connect).toHaveBeenCalledWith(userId);
    });

    it('disconnect calls service.disconnect and clears notifications', () => {
      const store = useNotificationStore();
      store.notifications = [createMockNotification('1')]; // Add a notification
      expect(store.notifications.length).toBe(1);

      store.disconnect();

      expect(store.service.disconnect).toHaveBeenCalledTimes(1);
      expect(store.notifications.length).toBe(0);
    });

    it('markAsRead calls service.markAsRead and updates notification if successful', async () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1', false);
      store.notifications = [notification1];
      (store.service.markAsRead as any).mockResolvedValue(true); // Mock successful service call

      await store.markAsRead('1');

      expect(store.service.markAsRead).toHaveBeenCalledTimes(1);
      expect(store.service.markAsRead).toHaveBeenCalledWith('1');
      expect(notification1.read).toBe(true);
    });

    it('markAsRead does nothing if service call fails', async () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1', false);
      store.notifications = [notification1];
      (store.service.markAsRead as any).mockResolvedValue(false); // Mock failed service call

      await store.markAsRead('1');

      expect(store.service.markAsRead).toHaveBeenCalledTimes(1);
      expect(store.service.markAsRead).toHaveBeenCalledWith('1');
      expect(notification1.read).toBe(false);
    });

    it('markAsRead does nothing if notification not found or already read', async () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1', true); // Already read
      store.notifications = [notification1];

      await store.markAsRead('1'); // Already read
      expect(store.service.markAsRead).not.toHaveBeenCalled();
      expect(notification1.read).toBe(true);

      await store.markAsRead('2'); // Not found
      expect(store.service.markAsRead).not.toHaveBeenCalled();
    });

    it('markAllAsRead calls service.markMultipleAsRead and updates notifications if successful', async () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1', false);
      const notification2 = createMockNotification('2', true); // Already read
      const notification3 = createMockNotification('3', false);
      store.notifications = [notification1, notification2, notification3];
      (store.service.markMultipleAsRead as any).mockResolvedValue(true); // Mock successful service call

      await store.markAllAsRead();

      expect(store.service.markMultipleAsRead).toHaveBeenCalledTimes(1);
      // Check if called with IDs of unread notifications
      expect(store.service.markMultipleAsRead).toHaveBeenCalledWith(['1', '3']);
      expect(notification1.read).toBe(true);
      expect(notification2.read).toBe(true); // Stays read
      expect(notification3.read).toBe(true);
    });

    it('markAllAsRead does nothing if service call fails', async () => {
      const store = useNotificationStore();
      const notification1 = createMockNotification('1', false);
      const notification3 = createMockNotification('3', false);
      store.notifications = [notification1, createMockNotification('2', true), notification3];
      (store.service.markMultipleAsRead as any).mockResolvedValue(false); // Mock failed service call

      await store.markAllAsRead();

      expect(store.service.markMultipleAsRead).toHaveBeenCalledTimes(1);
      expect(store.service.markMultipleAsRead).toHaveBeenCalledWith(['1', '3']);
      expect(notification1.read).toBe(false);
      expect(notification3.read).toBe(false);
    });

    it('markAllAsRead does nothing if no unread notifications exist', async () => {
      const store = useNotificationStore();
      store.notifications = [createMockNotification('1', true), createMockNotification('2', true)];

      await store.markAllAsRead();

      expect(store.service.markMultipleAsRead).not.toHaveBeenCalled();
    });
  });
});
