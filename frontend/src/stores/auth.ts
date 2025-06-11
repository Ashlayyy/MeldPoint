import { defineStore } from 'pinia';
import { router } from '@/router';
import { GetCurrentUser, Logout } from '@/API/user';
import { getCsrfToken } from '@/utils/csrf';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useRequestStore } from '@/stores/verbeterplein/request_store';
import i18n from '@/main';
import { SecurityService } from '@/services/SecurityService';

type Permission = {
  action: string;
  resourceType: string;
};

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  csrfToken: string | null;
  currentDevice: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: () =>
    <AuthState>{
      user: null,
      isAuthenticated: false,
      isLoading: true,
      permissions: [],
      csrfToken: null,
      currentDevice: null
    },

  actions: {
    async getCurrentUser() {
      const request = useRequestStore();
      return request.executeRequest('auth', 'getCurrentUser', async () => {
        return GetCurrentUser();
      });
    },

    async initializeAuth() {
      this.isLoading = true;
      try {
        const user = await this.getCurrentUser();

        if (!user || !user.data) {
          this.logout();
          return false;
        }

        this.user = user.data;
        this.isAuthenticated = true;
        await this.refreshPermissions();
        return true;
      } catch (error) {
        console.error('Error initializing auth:', error);
        this.logout();
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async login() {
      try {
        const apiKey = import.meta.env.VITE_API_KEY;
        const apiKeyHash = btoa(apiKey);

        const csrfToken = await getCsrfToken();
        const urlParams = new URLSearchParams();
        urlParams.set('apiKey', apiKeyHash);
        if (csrfToken) {
          this.csrfToken = csrfToken;
          urlParams.set('csrfToken', csrfToken);
        }

        // Get device ID from security service
        const securityService = new SecurityService();
        const deviceId = securityService.deviceId;
        if (deviceId) {
          urlParams.set('x-device-id', deviceId);
        }

        window.location.href = `${import.meta.env.VITE_API_URL}/user/auth/microsoft?${urlParams.toString()}`;
      } catch (error: any) {
        const notification = useNotificationStore();
        const t = i18n.global.t;
        notification.error({
          message: t('errors.login_error', { error: error || 'Login failed' })
        });
      }
    },

    async checkAuth() {
      try {
        const response = await this.getCurrentUser();

        if (response.data === null) {
          this.logout();
          return false;
        }

        if (response.status !== 200 || !response.data) {
          this.logout();
          return false;
        }

        this.user = response.data;
        this.isAuthenticated = true;
        this.permissions = await this.formatPermissions();
        return true;
      } catch (error: any) {
        const notification = useNotificationStore();
        const t = i18n.global.t;
        notification.error({
          message: t('errors.check_auth_failed', { error: error || 'Check auth failed' })
        });
        this.logout();
        return false;
      }
    },

    async setUser() {
      const response = await this.getCurrentUser();
      if (response.status !== 200) {
        this.logout();
        return false;
      }

      this.user = response.data;
      this.isAuthenticated = true;
      this.permissions = await this.formatPermissions();
    },

    async logout() {
      try {
        // Call server-side logout endpoint
        await Logout();

        // Clear local state
        this.user = null;
        this.isAuthenticated = false;
        this.permissions = [];
        this.csrfToken = null;
        this.currentDevice = null;

        // Redirect to login page
        router.push('/auth/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Even if server logout fails, clear local state
        this.user = null;
        this.isAuthenticated = false;
        this.permissions = [];
        this.csrfToken = null;
        this.currentDevice = null;
        router.push('/auth/login');
      }
    },

    clearCsrfToken() {
      this.csrfToken = null;
    },

    async formatPermissions() {
      // Direct user permissions
      const userPermissions =
        this.user?.userPermissions?.map((up: any) => ({
          action: up?.permission?.action,
          resourceType: up?.permission?.resourceType
        })) || [];

      // Permissions from user roles
      const rolePermissions =
        this.user?.userRoles?.flatMap(
          (userRole: any) =>
            userRole?.role?.rolePermissions?.map((rp: any) => ({
              action: rp?.permission?.action,
              resourceType: rp?.permission?.resourceType
            })) || []
        ) || [];

      // Permissions from role permission groups
      const roleGroupPermissions =
        this.user?.userRoles?.flatMap(
          (userRole: any) =>
            userRole?.role?.rolePermissionGroups?.flatMap(
              (rpg: any) =>
                rpg?.group?.permissions?.map((p: any) => ({
                  action: p?.permission?.action,
                  resourceType: p?.permission?.resourceType
                })) || []
            ) || []
        ) || [];

      // Permissions from user groups
      const groupPermissions =
        this.user?.userGroups?.flatMap(
          (ug: any) =>
            ug?.group?.permissions?.map((p: any) => ({
              action: p?.permission?.action,
              resourceType: p?.permission?.resourceType
            })) || []
        ) || [];

      // Combine all permissions
      const allPermissions = [...userPermissions, ...rolePermissions, ...roleGroupPermissions, ...groupPermissions].filter(
        (permission) => permission?.action && permission?.resourceType
      );

      // Remove duplicates
      const uniquePermissions = [...new Map(allPermissions.map((item) => [`${item.action}:${item.resourceType}`, item])).values()];

      this.permissions = uniquePermissions;
      return uniquePermissions;
    },

    async refreshPermissions() {
      try {
        const response = await this.getCurrentUser();
        if (response.status === 200 && response.data) {
          this.user = response.data;
          this.permissions = await this.formatPermissions();
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.logout();
        }
      }
    }
  }
});
