<script setup lang="ts">
import { onMounted, computed, watch } from 'vue';
import { useBackupStore } from '../../stores/verbeterplein/backup_store';
import { IconDatabase, IconDownload, IconTrash, IconRefresh } from '@tabler/icons-vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const backupStore = useBackupStore();
const { t } = useI18n();

const isCreating = computed(() => backupStore.loading && backupStore.currentOperation === 'creating');
const isDownloading = computed(() => backupStore.loading && backupStore.currentOperation === 'downloading');
const isDeleting = computed(() => backupStore.loading && backupStore.currentOperation === 'deleting');
const createProgress = computed(() => backupStore.createProgress);

// Watch for completion and hide progress after 5 seconds
watch(
  () => backupStore.createProgress,
  (newProgress) => {
    if (newProgress.status === 'completed') {
      setTimeout(() => {
        backupStore.createProgress = { status: '', progress: 0, message: '' };
      }, 2000);
    }
  },
  { deep: true }
);

onMounted(() => {
  backupStore.listBackups();
});

const createNewBackup = () => {
  backupStore.createBackup();
};

const downloadBackup = (key: string) => {
  backupStore.downloadBackup(key);
};

const deleteBackup = async (id: string) => {
  if (confirm(t('admin.backup.confirm_delete'))) {
    await backupStore.deleteBackup(id);
  }
};

const navigateToRestore = (backupId: string) => {
  router.push({
    name: 'backup-restore',
    params: { selectedBackupId: backupId }
  });
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};
</script>

<template>
  <v-container>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ $t('admin.backup.title') }}</span>
        <v-btn color="primary" @click="createNewBackup" :loading="isCreating" :disabled="backupStore.loading">
          <IconDatabase class="mr-2" />
          {{ $t('admin.backup.create_backup') }}
        </v-btn>
      </v-card-title>
      <Transition name="fade">
        <v-card-text v-if="createProgress.status">
          <v-progress-linear :model-value="createProgress.progress" color="primary" height="20" striped>
            <template #default>
              <span class="white--text">{{ createProgress.message }} - {{ createProgress.progress }}%</span>
            </template>
          </v-progress-linear>
        </v-card-text>
      </Transition>
    </v-card>

    <v-card>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>{{ $t('admin.backup.table.backup_name') }}</th>
              <th>{{ $t('admin.backup.table.created_at') }}</th>
              <th>{{ $t('admin.backup.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="backup in backupStore.backups" :key="backup.id">
              <td>{{ backup.fileName }}</td>
              <td>{{ formatDate(backup.createdAt) }}</td>
              <td class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="text"
                  size="small"
                  @click="downloadBackup(backup.id)"
                  :loading="isDownloading"
                  :disabled="backupStore.loading"
                >
                  <IconDownload class="mr-1" />
                  {{ $t('admin.backup.download') }}
                </v-btn>
                <v-btn
                  color="error"
                  variant="text"
                  size="small"
                  @click="deleteBackup(backup.id)"
                  :loading="isDeleting"
                  :disabled="backupStore.loading"
                >
                  <IconTrash class="mr-1" />
                  {{ $t('admin.backup.delete') }}
                </v-btn>
                <v-btn color="warning" variant="text" size="small" @click="navigateToRestore(backup.id)" :disabled="backupStore.loading">
                  <IconRefresh class="mr-1" />
                  {{ $t('admin.backup.restore') }}
                </v-btn>
              </td>
            </tr>
            <tr v-if="!backupStore.backups.length">
              <td colspan="3" class="text-center">{{ $t('admin.backup.no_backups') }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
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
