import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import {
  GetAllPermissions,
  GetAllGroups,
  GetAllRoles,
  CreatePermission,
  CreateGroup,
  CreateRole,
  UpdatePermission,
  UpdateGroup,
  UpdateRole,
  DeletePermission,
  DeleteGroup,
  DeleteRole,
  AssignToUser,
  AssignToRole,
  AssignToGroup,
  RemoveFromUser,
  RemoveFromRole,
  RemoveFromGroup,
  AssignRoleToUser,
  AssignGroupToUser,
  AssignGroupToRole,
  RemoveRoleFromUser,
  RemoveGroupFromUser,
  RemoveGroupFromRole
} from '@/API/permissions';
import { useNotificationStore } from './notification_store';

const notification = useNotificationStore();

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const usePermissionsStore = defineStore('permissions', {
  state: () => ({
    permissions: [] as any[],
    groups: [] as any[],
    roles: [] as any[],
    currentPermission: null as any,
    currentGroup: null as any,
    currentRole: null as any,
    isLoading: false,
    error: null
  }),

  actions: {
    // Fetch actions
    async fetchPermissions(params?: PaginationParams) {
      this.isLoading = true;
      try {
        const response = await GetAllPermissions(params);
        if (response.status === 200) {
          this.permissions = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchGroups(params?: PaginationParams) {
      this.isLoading = true;
      try {
        const response = await GetAllGroups(params);
        if (response.status === 200) {
          this.groups = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchRoles(params?: PaginationParams) {
      this.isLoading = true;
      try {
        const response = await GetAllRoles(params);
        if (response.status === 200) {
          this.roles = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    // Create actions
    async createPermission(data: any) {
      this.isLoading = true;
      try {
        const response = await CreatePermission(data);
        if (response.status === 201) {
          await this.fetchPermissions();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async createGroup(data: any) {
      this.isLoading = true;
      try {
        const response = await CreateGroup(data);
        if (response.status === 201) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async createRole(data: any) {
      this.isLoading = true;
      try {
        const response = await CreateRole(data);
        if (response.status === 201) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    // Update actions
    async updatePermission(id: string, data: any) {
      this.isLoading = true;
      try {
        const response = await UpdatePermission(id, data);
        if (response.status === 200) {
          await this.fetchPermissions();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async updateGroup(id: string, data: any) {
      this.isLoading = true;
      try {
        const response = await UpdateGroup(id, data);
        if (response.status === 200) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async updateRole(id: string, data: any) {
      this.isLoading = true;
      try {
        const response = await UpdateRole(id, data);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    // Delete actions
    async deletePermission(id: string) {
      this.isLoading = true;
      try {
        const response = await DeletePermission(id);
        if (response.status === 200) {
          await this.fetchPermissions();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.delete_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async deleteGroup(id: string) {
      this.isLoading = true;
      try {
        const response = await DeleteGroup(id);
        if (response.status === 200) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.delete_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRole(id: string) {
      this.isLoading = true;
      try {
        const response = await DeleteRole(id);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.delete_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    // Assignment actions
    async assignToUser(userId: string, permissionId: string) {
      this.isLoading = true;
      try {
        const response = await AssignToUser(userId, permissionId);
        if (response.status === 200) {
          await this.fetchPermissions();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async assignToRole(roleId: string, permissionId: string) {
      this.isLoading = true;
      try {
        const response = await AssignToRole(roleId, permissionId);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async assignToGroup(groupId: string, permissionId: string) {
      this.isLoading = true;
      try {
        const response = await AssignToGroup(groupId, permissionId);
        if (response.status === 200) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async assignRoleToUser(roleId: string, userId: string) {
      this.isLoading = true;
      try {
        const response = await AssignRoleToUser(userId, roleId);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async assignGroupToUser(groupId: string, userId: string) {
      this.isLoading = true;
      try {
        const response = await AssignGroupToUser(userId, groupId);
        if (response.status === 200) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async assignGroupToRole(groupId: string, roleId: string) {
      this.isLoading = true;
      try {
        const response = await AssignGroupToRole(roleId, groupId);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    // Remove assignment actions
    async removeFromUser(userId: string, permissionId: string) {
      this.isLoading = true;
      try {
        const response = await RemoveFromUser(userId, permissionId);
        if (response.status === 200) {
          await this.fetchPermissions();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async removeFromRole(permissionId: string, roleId: string) {
      this.isLoading = true;
      try {
        const response = await RemoveFromRole(roleId, permissionId);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async removeFromGroup(groupId: string, permissionId: string) {
      this.isLoading = true;
      try {
        const response = await RemoveFromGroup(groupId, permissionId);
        if (response.status === 200) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async removeRoleFromUser(roleId: string, userId: string) {
      this.isLoading = true;
      try {
        const response = await RemoveRoleFromUser(userId, roleId);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async removeGroupFromUser(groupId: string, userId: string) {
      this.isLoading = true;
      try {
        const response = await RemoveGroupFromUser(userId, groupId);
        if (response.status === 200) {
          await this.fetchGroups();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async removeGroupFromRole(groupId: string, roleId: string) {
      this.isLoading = true;
      try {
        const response = await RemoveGroupFromRole(roleId, groupId);
        if (response.status === 200) {
          await this.fetchRoles();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    }
  },

  getters: {
    getPermissionById: (state) => (id: string) => state.permissions.find((permission: any) => permission.id === id),
    getGroupById: (state) => (id: string) => state.groups.find((group: any) => group.id === id),
    getRoleById: (state) => (id: string) => state.roles.find((role: any) => role.id === id)
  }
});
