<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useBackupStore } from '../../stores/verbeterplein/backup_store';
import { useRoute } from 'vue-router';
import { IconRefresh, IconAlertTriangle, IconUpload } from '@tabler/icons-vue';
import { useI18n } from 'vue-i18n';
import { UploadBackup } from '@/API/backup';

interface Backup {
  id: string;
  fileName: string;
  createdAt: string;
}

const route = useRoute();
const backupStore = useBackupStore();
const { t } = useI18n();

const selectedBackup = ref<Backup | null>(null);
const restoreProgress = computed(() => backupStore.restoreProgress);
const isRestoring = computed(() => backupStore.loading && backupStore.currentOperation === 'restoring');
const uploadFile = ref<File | null>(null);
const isUploading = ref(false);

// Watch for completion and hide progress after 2 seconds
watch(
  () => backupStore.restoreProgress,
  (newProgress) => {
    if (newProgress.status === 'completed') {
      setTimeout(() => {
        backupStore.restoreProgress = { status: '', progress: 0 };
      }, 2000);
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (!backupStore.backups.length) {
    await backupStore.listBackups();
  }
  // If we have a selectedBackupId from the route, find and select that backup
  const routeBackupId = route.params.selectedBackupId as string;
  if (routeBackupId && backupStore.backups.length) {
    selectedBackup.value = backupStore.backups.find((b: Backup) => b.id === routeBackupId) || null;
  }
});

const startRestore = async () => {
  if (!selectedBackup.value?.id) {
    return;
  }

  if (!confirm(t('admin.backup.confirm_restore'))) {
    return;
  }

  await backupStore.restoreBackup(selectedBackup.value.id);
};

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return '';
  }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    uploadFile.value = target.files[0];
  }
};

const clearUpload = () => {
  uploadFile.value = null;
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (input) {
    input.value = '';
  }
};

const uploadAndRestore = async () => {
  if (!uploadFile.value) {
    return;
  }

  if (!confirm(t('admin.backup.confirm_restore'))) {
    return;
  }

  isUploading.value = true;
  try {
    const response = await UploadBackup(uploadFile.value);
    if (response.data.data?.id) {
      await backupStore.restoreBackup(response.data.data.id);
      clearUpload();
    } else {
      throw new Error('No backup ID received from server');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    backupStore.$state.restoreProgress = {
      status: 'error',
      progress: 0
    };
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <v-container>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ $t('admin.backup.restore_title') }}</span>
      </v-card-title>
      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          <div class="d-flex align-center">
            <IconAlertTriangle class="mr-2" />
            {{ $t('admin.backup.restore_warning') }}
          </div>
        </v-alert>

        <!-- Upload Section -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <IconUpload class="mr-2" />
            {{ $t('admin.backup.upload_title') }}
          </v-card-title>
          <v-card-text>
            <v-file-input
              v-model="uploadFile"
              :label="$t('admin.backup.select_file')"
              accept=".json,.backup"
              @change="handleFileUpload"
              prepend-icon=""
              class="mb-2"
            />
            <div v-if="uploadFile" class="d-flex align-center">
              <span class="text-body-2">{{ uploadFile.name }}</span>
              <v-btn color="error" variant="text" class="ml-2" @click="clearUpload">
                {{ $t('common.clear') }}
              </v-btn>
              <v-btn color="warning" :loading="isUploading" :disabled="!uploadFile" @click="uploadAndRestore" class="ml-2">
                <IconRefresh class="mr-2" />
                {{ $t('admin.backup.start_restore') }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Backup Selection -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title>{{ $t('admin.backup.select_backup') }}</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedBackup"
              :items="backupStore.backups"
              item-title="fileName"
              item-value="id"
              class="mb-4"
              :menu-props="{ maxHeight: '400px' }"
              rounded="none"
            >
              <template #selection="{ item }">
                <div v-if="item?.raw" class="d-flex flex-column">
                  <div class="text-subtitle-1">{{ item.raw.fileName }}</div>
                  <div class="text-caption">{{ formatDate(item.raw.createdAt) }}</div>
                </div>
              </template>
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #title>
                    <div class="d-flex flex-column">
                      <div>{{ item.raw.fileName }}</div>
                      <div class="text-caption">{{ formatDate(item.raw.createdAt) }}</div>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-card-text>
        </v-card>

        <v-btn color="warning" :loading="isRestoring" :disabled="!selectedBackup?.id" @click="startRestore" class="mb-4">
          <IconRefresh class="mr-2" />
          {{ $t('admin.backup.start_restore') }}
        </v-btn>

        <Transition name="fade">
          <div v-if="restoreProgress.status" class="mt-4">
            <v-progress-linear :model-value="restoreProgress.progress" color="warning" height="20" striped>
              <template #default>
                <span class="white--text">{{ restoreProgress.status }} - {{ restoreProgress.progress }}%</span>
              </template>
            </v-progress-linear>
          </div>
        </Transition>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.white--text {
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
