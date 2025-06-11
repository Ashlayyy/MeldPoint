<template>
  <v-container>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
      <v-col cols="12">
        <UiParentCard title="API Keys">
          <template v-slot:action>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog"> Add API Key </v-btn>
          </template>

          <v-data-table :headers="headers" :items="apiKeysStore.apiKeys" :loading="apiKeysStore.isLoading" hover>
            <template #item.expiresAt="{ item }">
              <v-chip :color="getExpiryColor(item)" size="small">
                {{ formatExpiry(item) }}
              </v-chip>
            </template>

            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleDateString() }}
            </template>

            <template #item.lastUsedAt="{ item }">
              <span :class="{ 'text-warning': isOldKey(item) }">
                {{ item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString() : 'Never' }}
              </span>
            </template>

            <template #item.isActive="{ item }">
              <v-chip :color="item.isActive ? 'success' : 'error'" size="small" :class="{ 'pulse-animation': item.isExpiringSoon }">
                {{ item.isActive ? 'Active' : 'Revoked' }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn v-if="item.isActive" icon variant="text" color="secondary" size="small" @click="editApiKey(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn v-if="item.isActive" icon variant="text" color="error" size="small" @click="confirmRevoke(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Create API Key Dialog -->
    <v-dialog v-model="createDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4"> Create API Key </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="createForm" @submit.prevent="createApiKey">
            <v-text-field
              v-model="createFormData.name"
              label="Name"
              required
              :rules="[(v) => !!v || 'Name is required']"
              :rounded="false"
            ></v-text-field>

            <v-text-field
              v-model="createFormData.expiresAt"
              label="Expiration Date (Optional)"
              readonly
              clearable
              @click:clear="createFormData.expiresAt = null"
              :rounded="false"
              @click="menu = true"
              :append-inner-icon="'mdi-calendar'"
              @click:append-inner="menu = true"
            ></v-text-field>

            <v-dialog v-model="menu" width="auto" :close-on-content-click="false">
              <v-date-picker v-model="createFormData.expiresAt" @update:model-value="menu = false" :min="tomorrow"></v-date-picker>
            </v-dialog>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="createDialog = false"> Cancel </v-btn>
          <v-btn color="primary" @click="createApiKey" :loading="apiKeysStore.isLoading"> Create </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Show API Key Dialog -->
    <v-dialog v-model="showKeyDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4"> API Key Created </v-card-title>

        <v-card-text class="pa-4">
          <p class="mb-4">Please copy your API key now. You won't be able to see it again!</p>
          <v-text-field
            v-model="newApiKey"
            label="API Key"
            readonly
            append-icon="mdi-content-copy"
            @click:append="copyApiKey"
            class="monospace-font"
            :rounded="false"
            :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showApiKey = !showApiKey"
            :type="showApiKey ? 'text' : 'password'"
          ></v-text-field>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showKeyDialog = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit API Key Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pa-4"> Edit API Key </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="editForm" @submit.prevent="updateApiKey">
            <v-text-field
              v-model="editFormData.name"
              label="Name"
              required
              :rules="[(v) => !!v || 'Name is required']"
              :rounded="false"
            ></v-text-field>

            <v-text-field
              :value="editFormData.expiresAt ? new Date(editFormData.expiresAt).toLocaleDateString() : 'Never'"
              label="Expiration Date"
              readonly
              disabled
              :rounded="false"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="editDialog = false"> Cancel </v-btn>
          <v-btn color="primary" @click="updateApiKey" :loading="apiKeysStore.isLoading"> Save </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Revoke Confirmation Dialog -->
    <v-dialog v-model="revokeDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5 pa-4"> Revoke API Key </v-card-title>

        <v-card-text class="pa-4"> Are you sure you want to revoke this API key? This action cannot be undone. </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="revokeDialog = false"> Cancel </v-btn>
          <v-btn color="error" @click="revokeApiKey" :loading="apiKeysStore.isLoading"> Revoke </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApiKeysStore } from '@/stores/verbeterplein/api_keys_store';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import i18n from '@/main';

const t = i18n.global.t;
const apiKeysStore = useApiKeysStore();
const notification = useNotificationStore();

// Utility functions
const formatExpiry = (item: any) => {
  if (!item.expiresAt) return 'Never';
  if (item.isExpired) return 'Expired';
  if (item.isExpiringSoon) return `Expires in ${item.expiresIn} days`;
  return new Date(item.expiresAt).toLocaleDateString();
};

const getExpiryColor = (item: any) => {
  if (!item.expiresAt) return 'info';
  if (item.isExpired) return 'error';
  if (item.isExpiringSoon) return 'warning';
  return 'success';
};

const isOldKey = (item: any) => {
  if (!item.lastUsedAt) return false;
  const lastUsed = new Date(item.lastUsedAt);
  const now = new Date();
  const diffDays = Math.ceil((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 30;
};

// Headers with better information
const headers = [
  {
    title: 'Name',
    key: 'name',
    sortable: true,
    width: '25%'
  },
  {
    title: 'Created',
    key: 'createdAt',
    sortable: true,
    width: '15%'
  },
  {
    title: 'Last Used',
    key: 'lastUsedAt',
    sortable: true,
    width: '15%',
    tooltip: 'Keys unused for 30+ days are highlighted'
  },
  {
    title: 'Expires',
    key: 'expiresAt',
    sortable: true,
    width: '20%'
  },
  {
    title: 'Status',
    key: 'isActive',
    sortable: true,
    width: '15%'
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    width: '10%'
  }
];

// Dialogs
const createDialog = ref(false);
const editDialog = ref(false);
const revokeDialog = ref(false);
const showKeyDialog = ref(false);
const menu = ref(false);
const showApiKey = ref(false);

// Forms
const createForm = ref();
const editForm = ref();
const createFormData = ref({
  name: '',
  expiresAt: null as string | null
});
const editFormData = ref({
  id: '',
  name: '',
  expiresAt: null as Date | null
});
const newApiKey = ref('');

// Page metadata
const page = ref({ title: 'API Keys' });
const breadcrumbs = ref([
  {
    title: 'Admin',
    disabled: false,
    href: '/'
  },
  {
    title: 'API Keys',
    disabled: true,
    href: '#'
  }
]);

// Computed
const tomorrow = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
});

// Methods
const openCreateDialog = () => {
  createFormData.value = {
    name: '',
    expiresAt: null
  };
  createDialog.value = true;
};

const createApiKey = async () => {
  try {
    const result = await apiKeysStore.createApiKey(
      createFormData.value.name,
      createFormData.value.expiresAt ? new Date(createFormData.value.expiresAt) : undefined
    );
    createDialog.value = false;
    newApiKey.value = result.key;
    showKeyDialog.value = true;
  } catch (error) {
    // Error is handled by the store
  }
};

const editApiKey = (item: any) => {
  editFormData.value = {
    id: item.id,
    name: item.name,
    expiresAt: item.expiresAt
  };
  editDialog.value = true;
};

const updateApiKey = async () => {
  try {
    await apiKeysStore.updateApiKey(editFormData.value.id, editFormData.value.name);
    editDialog.value = false;
  } catch (error) {
    // Error is handled by the store
  }
};

const confirmRevoke = (item: any) => {
  editFormData.value = { ...item };
  revokeDialog.value = true;
};

const revokeApiKey = async () => {
  try {
    await apiKeysStore.revokeApiKey(editFormData.value.id);
    revokeDialog.value = false;
  } catch (error) {
    // Error is handled by the store
  }
};

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(newApiKey.value);
    notification.info({ message: t('success.copied_to_clipboard') });
  } catch (err) {
    notification.error({ message: t('errors.copy_failed') });
  }
};

onMounted(() => {
  apiKeysStore.fetchApiKeys();
});
</script>

<style scoped>
.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.text-warning {
  color: var(--v-warning-base);
}

.monospace-font {
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 1px;
}

.d-flex {
  display: flex;
}

.gap-2 {
  gap: 8px;
}
</style>
