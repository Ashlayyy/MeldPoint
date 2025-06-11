<template>
  <v-container>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
      <v-col cols="12">
        <UiParentCard title="Permissions">
          <template v-slot:action>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
              {{ $t('admin.permissions.add_permission') }}
            </v-btn>
          </template>

          <v-data-table :headers="headers" :items="permissionStore.permissions" :loading="permissionStore.isLoading" hover>
            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn icon variant="text" color="secondary" size="small" @click="editPermission(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="error" size="small" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Create/Edit Permission Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ isEditing ? 'Edit Permission' : 'Create Permission' }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="form" @submit.prevent="savePermission">
            <v-text-field
              rounded="none"
              v-model="formData.name"
              :label="$t('admin.permissions.table.name')"
              required
              :rules="[(v) => !!v || $t('admin.permissions.rules.name_required')]"
            ></v-text-field>
            <v-text-field
              rounded="none"
              v-model="formData.description"
              :label="$t('admin.permissions.table.description')"
              required
              :rules="[(v) => !!v || $t('admin.permissions.rules.description_required')]"
            ></v-text-field>
            <v-select
              rounded="none"
              v-model="formData.action"
              :items="permissionTypes"
              item-title="name"
              item-value="value"
              :label="$t('admin.permissions.table.permission_action')"
              required
              :rules="[(v) => !!v || $t('admin.permissions.rules.permission_action_required')]"
            ></v-select>
            <v-select
              rounded="none"
              v-model="formData.resourceType"
              :items="resourceTypes"
              item-title="name"
              item-value="value"
              :label="$t('admin.permissions.table.resource_type')"
              required
              :rules="[(v) => !!v || $t('admin.permissions.rules.resource_type_required')]"
            ></v-select>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">
            {{ $t('general.actions.cancel') }}
          </v-btn>
          <v-btn color="primary" @click="savePermission" :loading="saving">
            {{ $t('general.actions.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ $t('admin.permissions.delete_confirmation') }}
        </v-card-title>
        <v-card-text class="pa-4">
          {{ $t('admin.permissions.delete_confirmation_text') }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog = false">
            {{ $t('general.actions.cancel') }}
          </v-btn>
          <v-btn color="error" @click="deletePermission" :loading="deleting">
            {{ $t('general.actions.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePermissionsStore } from '@/stores/verbeterplein/permissions_store';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();
const notification = useNotificationStore();

const permissionStore = usePermissionsStore();
const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const deleting = ref(false);
const form = ref(null);

const page = ref({ title: t('admin.permissions.title') });
const breadcrumbs = ref([
  {
    title: t('admin.title'),
    disabled: false,
    href: '/'
  },
  {
    title: t('admin.permissions.title'),
    disabled: true,
    href: '#'
  }
]);

const headers: any = [
  { title: t('admin.permissions.table.name'), key: 'name', sortable: true },
  { title: t('admin.permissions.table.description'), key: 'description', sortable: true },
  {
    title: t('admin.permissions.table.permission_action'),
    key: 'action',
    value: (item: any) => item.action.charAt(0) + item.action.slice(1).toLowerCase(),
    sortable: true
  },
  {
    title: t('admin.permissions.table.resource_type'),
    key: 'resourceType',
    value: (item: any) => item.resourceType.charAt(0) + item.resourceType.slice(1).toLowerCase(),
    sortable: true
  },
  { title: t('admin.permissions.table.created_at'), key: 'createdAt', sortable: true },
  { title: t('admin.permissions.table.actions'), key: 'actions', sortable: false, align: 'end' }
];

const permissionTypes = ref([
  {
    name: t('admin.permissions.permission_types.read'),
    value: 'READ'
  },
  {
    name: t('admin.permissions.permission_types.create'),
    value: 'CREATE'
  },
  {
    name: t('admin.permissions.permission_types.update'),
    value: 'UPDATE'
  },
  {
    name: t('admin.permissions.permission_types.delete'),
    value: 'DELETE'
  },
  {
    name: t('admin.permissions.permission_types.manage'),
    value: 'MANAGE'
  }
]);

const resourceTypes = ref([
  {
    name: t('admin.permissions.resource_types.all'),
    value: 'ALL'
  },
  {
    name: t('admin.permissions.resource_types.finance'),
    value: 'FINANCE'
  },
  {
    name: t('admin.permissions.resource_types.melding'),
    value: 'MELDING'
  },
  {
    name: t('admin.permissions.resource_types.idee'),
    value: 'IDEE'
  },
  {
    name: t('admin.permissions.resource_types.project'),
    value: 'PROJECT'
  },
  {
    name: t('admin.permissions.resource_types.schade'),
    value: 'SCHADE'
  },
  {
    name: t('admin.permissions.resource_types.projectleider'),
    value: 'PROJECTLEIDER'
  },
  {
    name: t('admin.permissions.resource_types.status'),
    value: 'STATUS'
  },
  {
    name: t('admin.permissions.resource_types.user'),
    value: 'USER'
  },
  {
    name: t('admin.permissions.resource_types.correctief'),
    value: 'CORRECTIEF'
  },
  {
    name: t('admin.permissions.resource_types.actiehouders'),
    value: 'ACTIEHOUDER'
  },
  {
    name: t('admin.permissions.resource_types.preventief'),
    value: 'PREVENTIEF'
  },
  {
    name: t('admin.permissions.resource_types.chat'),
    value: 'CHAT'
  },
  {
    name: t('admin.permissions.resource_types.archive'),
    value: 'ARCHIVE'
  },
  {
    name: t('admin.permissions.resource_types.history'),
    value: 'HISTORY'
  },
  {
    name: t('admin.permissions.resource_types.audit'),
    value: 'AUDIT'
  },
  {
    name: t('admin.permissions.resource_types.settings'),
    value: 'SETTINGS'
  },
  {
    name: t('admin.permissions.resource_types.department'),
    value: 'DEPARTMENT'
  }
]);

const formData = ref<any>({
  name: '',
  description: '',
  action: '',
  resourceType: ''
});

onMounted(async () => {
  await permissionStore.fetchPermissions();
});

const openCreateDialog = () => {
  isEditing.value = false;
  formData.value = {
    name: '',
    description: '',
    action: '',
    resourceType: ''
  };
  dialog.value = true;
};

const editPermission = (permission: any) => {
  isEditing.value = true;
  formData.value = { ...permission };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  formData.value = {
    name: '',
    description: '',
    action: '',
    resourceType: ''
  };
};

const savePermission = async () => {
  saving.value = true;
  try {
    if (!formData.value.name || !formData.value.description) {
      throw new Error(t('admin.permissions.rules.name_required'));
    }
    if (!formData.value.action || !formData.value.resourceType) {
      throw new Error(t('admin.permissions.rules.resource_type_required'));
    }
    if (isEditing.value) {
      await permissionStore.updatePermission(formData.value.id, formData.value);
    } else {
      await permissionStore.createPermission(formData.value);
    }
    await permissionStore.fetchPermissions();
    closeDialog();
  } catch (error) {
    notification.error({
      message: t('errors.save_error', { error: error || 'Save error' })
    });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (permission: any) => {
  formData.value = { ...permission };
  deleteDialog.value = true;
};

const deletePermission = async () => {
  deleting.value = true;
  try {
    await permissionStore.deletePermission(formData.value.id);
    await permissionStore.fetchPermissions();
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
