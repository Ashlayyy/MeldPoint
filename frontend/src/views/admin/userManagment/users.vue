<template>
  <v-container>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
      <v-col cols="12">
        <UiParentCard :title="$t('admin.users.title')">
          <template v-slot:action>
            <v-row class="align-center" justify="end">
              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="searchValue"
                  hide-details
                  density="compact"
                  :placeholder="$t('admin.users.table.search')"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  color="primary"
                ></v-text-field>
              </v-col>
            </v-row>
          </template>
          <v-data-table
            :headers="headers"
            :items="filteredUsers"
            :search="searchValue"
            :loading="userStore.isLoading"
            hover
            show-select
            v-model="selectedUsers"
            item-value="id"
          >
            <template #[`item.avatar`]="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="40" class="mr-3">
                  <div class="user-avatar">{{ userNameSplit(item) }}</div>
                </v-avatar>
                <div>
                  <h6 class="text-subtitle-1">{{ item.Name }}</h6>
                </div>
              </div>
            </template>

            <template #[`item.actions`]="{ item }">
              <div class="d-flex gap-2">
                <v-btn icon variant="text" color="secondary" size="small" @click="openAssignDialog(item)">
                  <v-icon>mdi-account-cog</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="error" size="small" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>

            <template #[`item.lastLogin`]="{ item }">
              {{ formatDate(item.lastLogin) }}
            </template>

            <template #[`item.CreatedAt`]="{ item }">
              {{ formatDate(item.CreatedAt) }}
            </template>

            <template #[`item.Department`]="{ item }">
              <span>{{ item.Department?.name || 'Not Assigned' }}</span>
            </template>
          </v-data-table>
        </UiParentCard>
      </v-col>
    </v-row>
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ $t('admin.users.delete_user') }}
        </v-card-title>
        <v-card-text class="pa-4">
          {{ $t('admin.users.delete_confirmation_user') }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog = false">
            {{ $t('general.actions.cancel') }}
          </v-btn>
          <v-btn color="error" @click="deleteUser" :loading="deleting"> {{ $t('general.actions.delete') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Assign Dialog -->
    <v-dialog v-model="assignDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ $t('admin.users.manage_user_access') }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-tabs v-model="activeTab">
            <v-tab value="roles">{{ $t('admin.users.dialog.roles') }}</v-tab>
            <v-tab value="groups">{{ $t('admin.users.dialog.groups') }}</v-tab>
            <v-tab value="permissions">{{ $t('admin.users.dialog.permissions') }}</v-tab>
            <v-tab value="department">{{ $t('admin.users.dialog.department') }}</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="mt-4">
            <v-window-item value="roles">
              <v-select
                rounded="none"
                v-model="selectedRoles"
                :items="permissionStore.roles"
                item-title="name"
                item-value="id"
                multiple
                chips
                :label="$t('admin.users.dialog.selectRoles')"
              ></v-select>
            </v-window-item>

            <v-window-item value="groups">
              <v-select
                rounded="none"
                v-model="selectedGroups"
                :items="permissionStore.groups"
                item-title="name"
                item-value="id"
                multiple
                chips
                :label="$t('admin.users.dialog.selectGroups')"
              ></v-select>
            </v-window-item>

            <v-window-item value="permissions">
              <v-select
                rounded="none"
                v-model="selectedPermissions"
                :items="permissionStore.permissions"
                item-title="name"
                item-value="id"
                multiple
                chips
                :label="$t('admin.users.dialog.selectPermissions')"
              ></v-select>
            </v-window-item>

            <v-window-item value="department">
              <v-select
                rounded="none"
                v-model="selectedDepartment"
                :items="availableDepartments"
                item-title="title"
                item-value="value"
                :label="$t('admin.users.dialog.selectDepartment')"
              ></v-select>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="assignDialog = false">
            {{ $t('general.actions.cancel') }}
          </v-btn>
          <v-btn color="primary" @click="saveAssignments" :loading="saving"> {{ $t('general.actions.save') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/verbeterplein/user_store';
import { usePermissionsStore } from '@/stores/verbeterplein/permissions_store';
import { useDepartmentStore } from '@/stores/verbeterplein/department_store';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import userNameSplit from '@/utils/userNameSplit';

const { t } = useI18n();
const userStore = useUserStore();
const permissionStore = usePermissionsStore();
const departmentStore = useDepartmentStore();
const notification = useNotificationStore();
const searchValue = ref('');
const deleteDialog = ref(false);
const deleting = ref(false);
const selectedUsers = ref([]);
const assignDialog = ref(false);
const activeTab = ref('roles');
const selectedRoles = ref<any>([]);
const selectedGroups = ref<any>([]);
const selectedPermissions = ref<any>([]);
const saving = ref(false);
const selectedDepartment = ref('');

const page = ref({ title: t('admin.users.pageTitle') });
const breadcrumbs = ref([
  {
    title: t('admin.title'),
    disabled: false,
    href: '/'
  },
  {
    title: t('admin.users.pageTitle'),
    disabled: true,
    href: '#'
  }
]);

const headers = computed(() => [
  {
    title: t('admin.users.table.user'),
    key: 'avatar',
    align: 'start' as const,
    sortable: false
  },
  {
    title: t('admin.users.table.email'),
    key: 'Email',
    align: 'start' as const,
    sortable: true
  },
  {
    title: t('admin.users.table.department'),
    key: 'Department',
    align: 'start' as const,
    sortable: true
  },
  {
    title: t('admin.users.table.lastLogin'),
    key: 'lastLogin',
    align: 'start' as const,
    sortable: true
  },
  {
    title: t('admin.users.table.createdAt'),
    key: 'CreatedAt',
    align: 'start' as const,
    sortable: true
  },
  {
    title: t('admin.users.table.actions'),
    key: 'actions',
    align: 'start' as const,
    sortable: false
  }
]);

const formData = ref<any>({});

const filteredUsers = computed(() => {
  if (!Array.isArray(userStore.users)) {
    return [];
  }
  return userStore.users.filter((user) => {
    if (!user) return false;
    const searchLower = searchValue.value.toLowerCase();
    return (
      (user.Name?.toLowerCase() || '').includes(searchLower) ||
      (user.Email?.toLowerCase() || '').includes(searchLower) ||
      (user.Department?.toLowerCase() || '').includes(searchLower)
    );
  });
});

onMounted(async () => {
  await userStore.fetchUsers({ limit: 20000 });
  await permissionStore.fetchRoles();
  await permissionStore.fetchGroups();
  await permissionStore.fetchPermissions();
  await departmentStore.initializeData();
});

const confirmDelete = (user: any) => {
  formData.value = { ...user };
  deleteDialog.value = true;
};

const deleteUser = async () => {
  deleting.value = true;
  try {
    await userStore.deleteUser(formData.value.id);
    deleteDialog.value = false;
  } catch (error: any) {
    console.warn(error);
    notification.error({
      message: t('errors.delete_error', { error: error || 'Delete error' })
    });
  } finally {
    deleting.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const availableDepartments = computed(() => {
  return departmentStore.departments.map(dept => ({
    title: dept.name,
    value: dept.id
  }));
});

const openAssignDialog = async (user: any) => {
  formData.value = { ...user };
  selectedRoles.value = user.userRoles?.map((r: any) => r.roleId) || [];
  selectedGroups.value = user.userGroups?.map((g: any) => g.groupId) || [];
  selectedPermissions.value = user.userPermissions?.map((p: any) => p.permissionId) || [];
  selectedDepartment.value = user.Department?.id || '';
  assignDialog.value = true;
};

const saveAssignments = async () => {
  saving.value = true;
  try {
    // Handle roles
    const currentRoles = formData.value.userRoles?.map((r: any) => r.roleId) || [];
    const rolesToAdd = selectedRoles.value.filter((id: number) => !currentRoles.includes(id));
    const rolesToRemove = currentRoles.filter((id: number) => !selectedRoles.value.includes(id));

    for (const roleId of rolesToAdd) {
      await permissionStore.assignRoleToUser(roleId, formData.value.id);
    }
    for (const roleId of rolesToRemove) {
      await permissionStore.removeRoleFromUser(roleId, formData.value.id);
    }

    // Handle groups
    const currentGroups = formData.value.userGroups?.map((g: any) => g.groupId) || [];
    const groupsToAdd = selectedGroups.value.filter((id: number) => !currentGroups.includes(id));
    const groupsToRemove = currentGroups.filter((id: number) => !selectedGroups.value.includes(id));

    for (const groupId of groupsToAdd) {
      await permissionStore.assignGroupToUser(groupId, formData.value.id);
    }
    for (const groupId of groupsToRemove) {
      await permissionStore.removeGroupFromUser(groupId, formData.value.id);
    }

    // Handle permissions
    const currentPermissions = formData.value.userPermissions?.map((p: any) => p.permissionId) || [];
    const permissionsToAdd = selectedPermissions.value.filter((id: number) => !currentPermissions.includes(id));
    const permissionsToRemove = currentPermissions.filter((id: number) => !selectedPermissions.value.includes(id));

    for (const permissionId of permissionsToAdd) {
      await permissionStore.assignToUser(formData.value.id, permissionId);
    }
    for (const permissionId of permissionsToRemove) {
      await permissionStore.removeFromUser(formData.value.id, permissionId);
    }

    // Handle department update
    const currentDepartment = departmentStore.departments.find(d => d.name === formData.value.Department);
    if (selectedDepartment.value !== currentDepartment?.id && selectedDepartment.value !== '' && selectedDepartment.value !== null) {
      await userStore.updateUserDepartment(formData.value.id, selectedDepartment.value);
      await departmentStore.fetchDepartments(); // Refresh departments after update
    }

    await userStore.fetchUsers({ limit: 20000 });
    await permissionStore.fetchRoles();
    await permissionStore.fetchGroups();
    await permissionStore.fetchPermissions();
    await departmentStore.fetchDepartments();
    assignDialog.value = false;
  } catch (error: any) {
    notification.error({
      message: t('errors.save_error', { error: error || 'Save error' })
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
.v-data-table {
  border-radius: 8px;
}

.user-avatar {
  height: 30px;
  width: 30px;
  background-color: #e99901;
  font-size: 1.1rem;
  border-radius: 50%;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
