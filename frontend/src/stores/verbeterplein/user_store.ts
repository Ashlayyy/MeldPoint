import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import {
  GetAllUsers,
  SearchUsers,
  GetUsersByRole,
  GetUsersByDepartment,
  DeleteUser,
  UpdateUserDepartment,
  GetAllUsersFilters
} from '@/API/user';
import { useNotificationStore } from './notification_store';
const notification = useNotificationStore();

// Add interface for User type
interface User {
  id: string;
  Email: string;
  Name: string;
  Department: any | null;
  lastLogin: string;
  CreatedAt: string;
  UpdatedAt: string;
  userPermissions: Array<{
    id: string;
    userId: string;
    permissionId: string;
    assignedAt: string;
    permission: {
      id: string;
      name: string;
      description: string;
      action: string;
      resourceType: string;
      createdAt: string;
      updatedAt: string;
      userId: string | null;
    };
  }>;
  userRoles: any[];
  userGroups: any[];
}

interface FilterUser {
  id: string;
  Name: string;
}

// Add interface for pagination
interface PaginatedResponse {
  users: User[];
  total: number;
  pages: number;
  currentPage: number;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    currentUsers: [] as User[],
    filterUsers: [] as FilterUser[],
    isLoading: false,
    error: null,
    pagination: {
      total: 0,
      pages: 0,
      currentPage: 1
    }
  }),

  actions: {
    async fetchUsers(params?: { page?: number; limit?: number }) {
      this.isLoading = true;
      try {
        const response = await GetAllUsers(params);
        if (response.status === 200) {
          const data = response.data as PaginatedResponse;
          this.users = data.users || [];
          this.pagination = {
            total: data.total,
            pages: data.pages,
            currentPage: data.currentPage
          };
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
        this.users = [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchFilterUsers() {
      this.isLoading = true;
      try {
        const response = await GetAllUsersFilters();
        if (response.status === 200) {
          const data = response.data as FilterUser[];
          this.filterUsers = data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
        this.filterUsers = [];
      } finally {
        this.isLoading = false;
      }
    },

    async searchUsers(params: { query?: string; role?: string; department?: string; status?: string }) {
      this.isLoading = true;
      try {
        const response = await SearchUsers(params);
        if (response.status === 200) {
          this.currentUsers = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async getUsersByRole(roleId: string) {
      this.isLoading = true;
      try {
        const response = await GetUsersByRole(roleId);
        if (response.status === 200) {
          this.currentUsers = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async getUsersByDepartment(department: string) {
      this.isLoading = true;
      try {
        const response = await GetUsersByDepartment(department);
        if (response.status === 200) {
          this.currentUsers = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async deleteUser(userId: string) {
      this.isLoading = true;
      try {
        await DeleteUser(userId);
        await this.fetchUsers();
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async updateUserDepartment(userId: string, department: string) {
      notification.promise({
        message: t('admin.users.department_updated')
      });
      this.isLoading = true;
      try {
        const response = await UpdateUserDepartment(userId, department);
        if (response.status === 200) {
          await this.fetchUsers({ limit: 20000 });
          notification.resolvePromise({ message: t('admin.users.department_updated') });
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.rejectPromise({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    }
  },

  getters: {
    getUserById: (state) => (id: string) => state.users.find((user: User) => user.id === id),
    getUserByIdForPDCA: (state) => (id: string) => state.filterUsers.find((user: FilterUser) => user.id === id),
    getUserByIdFromFilterUsers: (state) => (id: string) => state.filterUsers.find((user: FilterUser) => user.id === id)
  }
});
