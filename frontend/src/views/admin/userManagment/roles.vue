<template>
  <v-container>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
      <v-col cols="12">
        <UiParentCard title="Roles">
          <template v-slot:action>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateRoleDialog">
              {{ $t('admin.roles.add_role') }}
            </v-btn>
          </template>
          <v-data-table :headers="headers" :items="permissionStore.roles" :loading="permissionStore.isLoading">
            <template #item.permissionsCount="{ item }">
              {{ item.rolePermissions?.length || 0 }}
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn icon variant="text" color="secondary" size="small" @click="editRole(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="info" size="small" @click="manageRolePermissions(item)">
                  <v-icon>mdi-shield-account</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="error" size="small" @click="confirmDeleteRole(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </UiParentCard>
      </v-col>

      <v-col cols="12">
        <UiParentCard title="Groups">
          <template v-slot:action>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog"> Add Group </v-btn>
          </template>
          <v-data-table :headers="headers" :items="permissionStore.groups" :loading="permissionStore.isLoading">
            <template #item.permissionsCount="{ item }">
              {{ item.permissions?.length || 0 }}
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn icon variant="text" color="secondary" size="small" @click="editGroup(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="info" size="small" @click="manageGroupPermissions(item)">
                  <v-icon>mdi-shield-account</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="error" size="small" @click="confirmDeleteGroup(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Group Dialog -->
    <v-dialog v-model="groupDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ isEditingGroup ? t('admin.roles.edit_group') : t('admin.roles.create_group') }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="groupForm" @submit.prevent="saveGroup">
            <v-text-field
              rounded="none"
              v-model="groupFormData.name"
              :label="t('admin.roles.table.name')"
              required
              :rules="[(v) => !!v || t('errors.required')]"
            ></v-text-field>
            <v-text-field
              rounded="none"
              v-model="groupFormData.description"
              :label="t('admin.roles.table.description')"
              required
              :rules="[(v) => !!v || t('errors.required')]"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="groupDialog = false"> {{ $t('general.actions.cancel') }} </v-btn>
          <v-btn color="primary" @click="saveGroup" :loading="saving"> {{ $t('general.actions.save') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Dialog -->
    <v-dialog v-model="roleDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ isEditingRole ? t('admin.roles.edit_role') : t('admin.roles.create_role') }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="roleForm" @submit.prevent="saveRole">
            <v-text-field
              rounded="none"
              v-model="roleFormData.name"
              :label="t('admin.roles.table.name')"
              required
              :rules="[(v) => !!v || t('errors.required')]"
            ></v-text-field>
            <v-text-field
              rounded="none"
              v-model="roleFormData.description"
              :label="t('admin.roles.table.description')"
              required
              :rules="[(v) => !!v || t('errors.required')]"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="roleDialog = false"> {{ $t('general.actions.cancel') }} </v-btn>
          <v-btn color="primary" @click="saveRole" :loading="saving"> {{ $t('general.actions.save') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Permissions Assignment Dialog -->
    <v-dialog v-model="permissionsDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ isManagingRole ? t('admin.roles.manage_role') : t('admin.roles.manage_group') }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-select
            rounded="none"
            v-model="selectedPermissions"
            :items="permissionStore.permissions"
            item-title="name"
            item-value="id"
            multiple
            chips
            :label="t('admin.roles.permissions')"
          ></v-select>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="permissionsDialog = false"> {{ $t('general.actions.cancel') }} </v-btn>
          <v-btn color="primary" @click="savePermissions" :loading="saving"> {{ $t('general.actions.save') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ $t(`admin.roles.delete_${isManagingRole ? 'role' : 'group'}`) }}
        </v-card-title>
        <v-card-text class="pa-4">
          {{ $t(`admin.roles.delete_confirmation_${isManagingRole ? 'role' : 'group'}`) }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog = false"> {{ $t('general.actions.cancel') }} </v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="deleting"> {{ $t('general.actions.delete') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePermissionsStore } from '@/stores/verbeterplein/permissions_store';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { Permission, PermissionGroup, Role } from '@/types/verbeterplein/roles';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();
const permissionStore = usePermissionsStore();
const notification = useNotificationStore();
const groupDialog = ref(false);
const roleDialog = ref(false);
const permissionsDialog = ref(false);
const deleteDialog = ref(false);
const isEditingGroup = ref(false);
const isEditingRole = ref(false);
const isManagingRole = ref(false);
const saving = ref(false);
const deleting = ref(false);
const selectedPermissions = ref<any>([]);

const page = ref({ title: t('admin.roles.title') });
const breadcrumbs = ref([
  {
    title: t('admin.title '),
    disabled: false,
    href: '/'
  },
  {
    title: t('admin.roles.title'),
    disabled: true,
    href: '#'
  }
]);

const headers: any = [
  { title: t('admin.roles.table.name'), key: 'name', sortable: true, width: '25%' },
  { title: t('admin.roles.table.description'), key: 'description', sortable: true, width: '25%' },
  { title: t('admin.roles.table.permissions'), key: 'permissionsCount', sortable: true, width: '25%' },
  { title: t('admin.roles.table.created_at'), key: 'createdAt', sortable: true, width: '25%' },
  { title: t('admin.roles.table.actions'), key: 'actions', sortable: false, width: '25%' }
];

const groupFormData = ref<any>({
  name: '',
  description: '',
  id: ''
});

const roleFormData = ref<any>({
  name: '',
  description: '',
  id: ''
});

onMounted(async () => {
  await permissionStore.fetchGroups();
  await permissionStore.fetchRoles();
  await permissionStore.fetchPermissions();
});

// Group Management
const openCreateDialog = () => {
  isEditingGroup.value = false;
  groupFormData.value = { name: '', description: '' };
  groupDialog.value = true;
};

const editGroup = (group: any) => {
  isEditingGroup.value = true;
  groupFormData.value = { ...group };
  groupDialog.value = true;
};

const saveGroup = async () => {
  saving.value = true;
  try {
    if (isEditingGroup.value) {
      await permissionStore.updateGroup(groupFormData.value.id, groupFormData.value);
    } else {
      await permissionStore.createGroup(groupFormData.value);
    }
    await permissionStore.fetchGroups();
    groupDialog.value = false;
  } catch (error: any) {
    notification.error({
      message: t('errors.save_error', { error: error || 'Save error' })
    });
  } finally {
    saving.value = false;
  }
};

// Role Management
const openCreateRoleDialog = () => {
  isEditingRole.value = false;
  roleFormData.value = { name: '', description: '' };
  roleDialog.value = true;
};

const editRole = (role: any) => {
  isEditingRole.value = true;
  roleFormData.value = { ...role };
  roleDialog.value = true;
};

const saveRole = async () => {
  saving.value = true;
  try {
    if (isEditingRole.value) {
      await permissionStore.updateRole(roleFormData.value.id, roleFormData.value);
    } else {
      await permissionStore.createRole(roleFormData.value);
    }
    await permissionStore.fetchRoles();
    roleDialog.value = false;
  } catch (error: any) {
    notification.error({
      message: t('errors.save_error', { error: error || 'Save error' })
    });
  } finally {
    saving.value = false;
  }
};

// Permissions Management
const manageGroupPermissions = async (group: PermissionGroup) => {
  isManagingRole.value = false;
  groupFormData.value = { ...group };
  selectedPermissions.value = group.permissions?.map((p) => p.permission.id) || [];
  permissionsDialog.value = true;
};

const manageRolePermissions = async (role: Role) => {
  isManagingRole.value = true;
  roleFormData.value = { ...role };
  selectedPermissions.value = role.rolePermissions?.map((p) => p.permission.id) || [];
  permissionsDialog.value = true;
};

const savePermissions = async () => {
  saving.value = true;
  try {
    const targetId = isManagingRole.value ? roleFormData.value.id : groupFormData.value.id;
    const currentPermissions = isManagingRole.value
      ? roleFormData.value.rolePermissions?.map((p: { permission: Permission }) => p.permission.id) || []
      : groupFormData.value.permissions?.map((p: { permission: Permission }) => p.permission.id) || [];

    const permissionsToAdd = selectedPermissions.value.filter((id: string) => !currentPermissions.includes(id));
    const permissionsToRemove = currentPermissions.filter((id: string) => !selectedPermissions.value.includes(id));

    if (isManagingRole.value) {
      for (const permissionId of permissionsToAdd) {
        await permissionStore.assignToRole(targetId, permissionId);
      }
      for (const permissionId of permissionsToRemove) {
        await permissionStore.removeFromRole(targetId, permissionId);
      }
    } else {
      for (const permissionId of permissionsToAdd) {
        await permissionStore.assignToGroup(targetId, permissionId);
      }
      for (const permissionId of permissionsToRemove) {
        await permissionStore.removeFromGroup(targetId, permissionId);
      }
    }

    await permissionStore.fetchGroups();
    await permissionStore.fetchRoles();
    permissionsDialog.value = false;
  } catch (error: any) {
    notification.error({
      message: t('errors.save_error', { error: error || 'Save error' })
    });
  } finally {
    saving.value = false;
  }
};

// Delete Management
const confirmDeleteGroup = (group: any) => {
  isManagingRole.value = false;
  groupFormData.value = { ...group };
  deleteDialog.value = true;
};

const confirmDeleteRole = (role: any) => {
  isManagingRole.value = true;
  roleFormData.value = { ...role };
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    if (isManagingRole.value) {
      await permissionStore.deleteRole(roleFormData.value.id);
      await permissionStore.fetchRoles();
    } else {
      await permissionStore.deleteGroup(groupFormData.value.id);
      await permissionStore.fetchGroups();
    }
    deleteDialog.value = false;
  } catch (error: any) {
    notification.error({
      message: t('errors.delete_error', { error: error || 'Delete error' })
    });
  } finally {
    deleting.value = false;
  }
};
</script>
