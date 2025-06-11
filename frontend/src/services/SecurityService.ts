import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';
import { useSocket } from '@/composables/useSocket';
import { RegisterDevice } from '@/API/security';
import { GetLoginHistory, GetActiveDevices, RevokeDevice } from '@/API/loginHistory';

export const SECURITY_ROOM = 'security';

const DEBUG = false;

function getTimestamp(): string {
  return new Date().toISOString();
}

function debug(...args: any[]) {
  if (DEBUG) {
    console.log(`[${getTimestamp()}][SecurityService]`, ...args);
  }
}

function debugError(...args: any[]) {
  if (DEBUG) {
    console.log(`[${getTimestamp()}][SecurityService][ERROR]`, ...args);
  }
}

function debugWarn(...args: any[]) {
  if (DEBUG) {
    console.log(`[${getTimestamp()}][SecurityService][WARN]`, ...args);
  }
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  lastActive: Date;
  currentlyActive: boolean;
  userId?: string;
}

interface LoginHistoryFilters {
  page?: number;
  limit?: number;
  status?: string;
}

interface LoginHistoryResponse {
  status: string;
  data: {
    data: Array<{
      id: string;
      deviceId: string;
      createdAt: Date;
      deviceInfo: {
        deviceId: string;
        browser: string;
        os: string;
      };
      currentDeviceInfo: {
        deviceId: string;
        deviceName: string;
        browser: string;
        os: string;
        lastActive: Date;
        currentlyActive: boolean;
      } | null;
      status: string;
      ipAddress: string;
    }>;
    total: number;
    page: number;
    limit: number;
  };
}

export class SecurityService {
  private socket: Socket | null = null;
  private _deviceId: string;
  private isRegistered: boolean = false;
  private securityToken: string | null = null;
  private retryCount: number = 0;
  private readonly TIMEOUT_DURATION = 15000;
  private offlineTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this._deviceId = this.generateDeviceId();
    debug('Initialized with deviceId:', this._deviceId);
  }

  get deviceId(): string {
    return this._deviceId;
  }

  private generateDeviceId(): string {
    const storedId = localStorage.getItem('device_id');
    if (storedId) {
      debug('Retrieved existing deviceId:', storedId);
      return storedId;
    }

    const newId = crypto.randomUUID();
    localStorage.setItem('device_id', newId);
    debug('Generated new deviceId:', newId);
    return newId;
  }

  private get authStore() {
    return useAuthStore();
  }

  private get deviceInfo(): DeviceInfo {
    const info = {
      deviceId: this._deviceId,
      deviceName: this.getDeviceName(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      lastActive: new Date(),
      currentlyActive: document.visibilityState === 'visible',
      userId: this.authStore.user?.id
    };
    debug('Current device info:', info);
    return info;
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    return `${platform} - ${userAgent.split(') ')[0]})`;
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    let browser = 'Unknown';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return browser;
  }

  private getOSInfo(): string {
    const ua = navigator.userAgent;
    let os = 'Unknown';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return os;
  }

  private async waitForEvent(eventName: string, timeoutMs: number = this.TIMEOUT_DURATION): Promise<any> {
    if (!this.socket) throw new Error('Socket not connected');

    debug(`Waiting for event: ${eventName} with timeout: ${timeoutMs}ms`);
    return new Promise((resolve, reject) => {
      const socket = this.socket!;
      const timeout = setTimeout(() => {
        socket.off(eventName);
        const error = new Error(`Timeout waiting for ${eventName}`);
        debugError(`Event timeout: ${eventName}`, error);
        reject(error);
      }, timeoutMs);

      socket.once(eventName, (data: any) => {
        clearTimeout(timeout);
        debug(`Received event: ${eventName}`, data);
        resolve(data);
      });
    });
  }

  private async registerDevice(): Promise<void> {
    try {
      debug('Starting device registration via REST API');
      const deviceInfo = this.deviceInfo;

      const response = await RegisterDevice({
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        currentlyActive: deviceInfo.currentlyActive
      });

      debug('Registration response:', response);

      if (response.status === 201 && response.data?.securityToken) {
        this.securityToken = response.data?.securityToken;
        this.isRegistered = true;
        debug('Device registered successfully, received security token');
      } else {
        throw new Error('Invalid response from registration endpoint');
      }
    } catch (error) {
      debugError('Device registration failed:', error);
      throw error;
    }
  }

  async connect() {
    debug('Attempting to connect...');
    debug('Current state:', {
      socketConnected: this.socket?.connected,
      isRegistered: this.isRegistered,
      retryCount: this.retryCount
    });

    // Check if we're already fully connected
    if (this.socket?.connected && this.isRegistered) {
      debug('Already connected and registered');
      return;
    }

    const userId = this.authStore.user?.id;
    if (!userId) {
      debugError('Connection failed: User not authenticated');
      throw new Error('User not authenticated');
    }

    // Register device first to get security token
    if (!this.isRegistered) {
      try {
        await this.registerDevice();
      } catch (error) {
        debugError('Registration failed:', error);
        throw error;
      }
    }

    // Use shared socket connection
    const { socket } = useSocket();

    // Set auth parameters including security token
    socket.auth = {
      deviceId: this._deviceId,
      userId,
      securityToken: this.securityToken,
      type: 'security'
    };

    this.socket = socket;
    debug('Using shared socket connection with security token');

    this.setupSocketListeners();

    try {
      // Only join room after successful connection
      debug('Joining security room');
      this.socket.emit('join', SECURITY_ROOM);
    } catch (error) {
      debugError('Connection failed:', error);
      this.isRegistered = false;
      throw error;
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    debug('Setting up socket listeners');

    this.socket.on('connect', async () => {
      debug('Socket connected');
    });

    this.socket.on('security:error', (error: any) => {
      debugError('Security error:', error);
      if (error.message === 'Not authenticated') {
        debug('Device not authenticated');
        this.isRegistered = false;
        debugWarn('Authentication failed - not attempting reconnection');
        this.socket?.emit('security:authentication:failed', error);
      } else {
        debugWarn('Authentication failed - not attempting reconnection');
      }
    });

    this.socket.on('error', (error: any) => {
      debugError('Socket.io error:', error);
    });

    this.socket.on('connect_error', (error: any) => {
      debugError('Socket.io connect error:', error);
    });

    this.socket.on('security:device:updated', ({ device }) => {
      debug('Device updated:', device);
    });

    this.socket.on('disconnect', (reason: string) => {
      debug('Socket disconnected, reason:', reason);
      this.isRegistered = false;
      // No need to leave rooms as they are automatically cleared on disconnect
    });

    this.socket.on('security:device:revoked', () => {
      debug('Device revoked, logging out');
      this.disconnect();
      this.authStore.logout();
      window.location.href = '/auth/login';
    });

    // Removed to see if this was the issue of people logging out while inactive
    /*
    document.addEventListener('visibilitychange', () => {
      const isVisible = document.visibilityState === 'visible';
      debug('Visibility changed:', { isVisible });

      // Clear any existing timeout
      if (this.offlineTimeout) {
        clearTimeout(this.offlineTimeout);
        this.offlineTimeout = null;
      }

      if (isVisible) {
        // If becoming visible, update immediately
        if (this.isRegistered && this.socket?.connected) {
          const info = this.deviceInfo;
          debug('Updating device status to online:', info);
          this.socket.emit('security:device:update', info);
        }
      } else {
        // If becoming hidden, set a timeout before marking as offline
        this.offlineTimeout = setTimeout(() => {
          if (this.isRegistered && this.socket?.connected) {
            const info = {
              ...this.deviceInfo,
              currentlyActive: false
            };
            debug('Updating device status to offline after delay:', info);
            this.socket.emit('security:device:update', info);
          }
        }, 30000); // 30 seconds delay
      }
    });
    */
  }

  async getActiveDevices(): Promise<DeviceInfo[]> {
    const userId = this.authStore.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      debug('Fetching active devices');
      const response = await GetActiveDevices(userId);
      return response.data;
    } catch (error) {
      debugError('Failed to fetch active devices:', error);
      throw error;
    }
  }

  async getLoginHistory(filters: LoginHistoryFilters = {}): Promise<LoginHistoryResponse> {
    const userId = this.authStore.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      debug('Fetching login history', filters);
      const response = await GetLoginHistory(userId, filters.page, filters.limit);
      return {
        status: response.data.status,
        data: {
          data: response.data.data,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit
        }
      };
    } catch (error) {
      debugError('Failed to fetch login history:', error);
      throw error;
    }
  }

  async revokeDevice(deviceId: string): Promise<void> {
    const userId = this.authStore.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      debug('Revoking device:', deviceId);
      await RevokeDevice(userId, deviceId);
      debug('Device revoked successfully');
    } catch (error) {
      debugError('Failed to revoke device:', error);
      throw error;
    }
  }

  async revokeAllDevices(): Promise<void> {
    debug('Revoking all devices');
    if (!this.socket?.connected || !this.isRegistered) {
      debug('Not connected or registered, connecting first');
      await this.connect();
    }

    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('security:revoke-all');
    debug('Waiting for revoke all confirmation');

    try {
      await this.waitForEvent('security:devices:revoked:all:success');
      debug('All devices revoked successfully');
    } catch (error) {
      debugError('Failed to revoke all devices:', error);
      if (error instanceof Error && error.message === 'Not authenticated') {
        this.isRegistered = false;
        throw new Error('Device not authenticated. Please try again.');
      }
      throw error;
    }
  }

  disconnect() {
    debug('Disconnecting...', {
      wasConnected: this.socket?.connected,
      wasRegistered: this.isRegistered
    });

    // Clear offline timeout if it exists
    if (this.offlineTimeout) {
      clearTimeout(this.offlineTimeout);
      this.offlineTimeout = null;
    }

    if (this.socket) {
      // Leave the security room
      this.socket.emit('leave', SECURITY_ROOM);
      // Don't disconnect the shared socket
      this.socket = null;
    }
    this.isRegistered = false;
    this.securityToken = null;
    this.retryCount = 0;
    debug('Disconnected from security service');
  }
}

export const securityService = new SecurityService();
