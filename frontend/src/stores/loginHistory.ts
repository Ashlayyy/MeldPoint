import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LoginHistoryEntry } from '@/API/loginHistory';
import { useAuthStore } from './auth';
import { securityService } from '@/services/SecurityService';
import { SECURITY_ROOM } from '@/services/SecurityService';

interface LoginHistoryResponse {
  status: string;
  data: {
    data: LoginHistoryEntry[];
    total: number;
    page: number;
    limit: number;
  };
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  lastActive: Date;
  currentlyActive: boolean;
}

export const useLoginHistoryStore = defineStore('loginHistory', () => {
  const authStore = useAuthStore();
  const loginHistory = ref<LoginHistoryEntry[]>([]);
  const activeDevices = ref<DeviceInfo[]>([]);
  const isLoading = ref(false);
  const totalEntries = ref(0);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);

  async function fetchLoginHistory(page?: number, forced = false) {
    if (!authStore.user?.id) return;

    isLoading.value = true;
    try {
      const response = await securityService.getLoginHistory({
        page: page || currentPage.value,
        limit: itemsPerPage.value
      });

      // Transform the response to match LoginHistoryEntry type
      loginHistory.value = response.data.data.map((entry) => ({
        id: entry.id,
        userId: authStore.userId,
        deviceId: entry.deviceId,
        browser: entry.deviceInfo.browser,
        os: entry.deviceInfo.os,
        ipAddress: entry.ipAddress,
        status: entry.status,
        createdAt: new Date(entry.createdAt),
        deviceInfo: entry.deviceInfo,
        currentDeviceInfo: entry.currentDeviceInfo
      }));

      totalEntries.value = response.data.total;
      currentPage.value = page || currentPage.value;
    } catch (error) {
      console.error('Failed to fetch login history:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchActiveDevices(forced = false) {
    if (!authStore.user?.id) return;

    isLoading.value = true;
    try {
      // Initialize websocket connection if not already connected
      securityService.connect();

      // Get active devices through websocket
      const devices = await securityService.getActiveDevices();
      activeDevices.value = devices;
    } catch (error) {
      console.error('Failed to fetch active devices:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function revokeDevice(deviceId: string) {
    if (!authStore.user?.id) return;

    try {
      await securityService.revokeDevice(deviceId);
      await fetchActiveDevices(true); // Force refresh after revoke
    } catch (error) {
      console.error('Failed to revoke device:', error);
      throw error;
    }
  }

  async function revokeAllDevices() {
    if (!authStore.user?.id) return;

    try {
      // Initialize websocket connection if not already connected
      await securityService.connect();

      // Revoke all devices through websocket
      await new Promise<void>((resolve, reject) => {
        if (!securityService['socket']) {
          reject(new Error('Socket not connected'));
          return;
        }

        // Send revoke all request through the room
        securityService['socket'].emit('message', {
          room: SECURITY_ROOM,
          type: 'revoke-all',
          data: {}
        });

        const handleSuccess = () => {
          resolve();
        };

        const handleError = (error: any) => {
          reject(error);
        };

        securityService['socket'].on('security:devices:revoked:all:success', handleSuccess);
        securityService['socket'].on('security:error', handleError);

        // Add timeout
        setTimeout(() => {
          if (securityService['socket']) {
            securityService['socket'].off('security:devices:revoked:all:success', handleSuccess);
            securityService['socket'].off('security:error', handleError);
          }
          reject(new Error('Timeout waiting for revoke all devices'));
        }, 5000);
      });

      await fetchActiveDevices(true); // Force refresh after revoke
    } catch (error) {
      console.error('Failed to revoke all devices:', error);
      throw error;
    }
  }

  return {
    loginHistory,
    activeDevices,
    isLoading,
    totalEntries,
    currentPage,
    itemsPerPage,
    fetchLoginHistory,
    fetchActiveDevices,
    revokeDevice,
    revokeAllDevices
  };
});
