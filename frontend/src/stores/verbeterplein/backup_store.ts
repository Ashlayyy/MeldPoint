import { notificationService } from './../../services/NotificationService';
import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { CreateBackup, ListBackups, DownloadBackup, DeleteBackup, RestoreBackup } from '@/API/backup';
import { useNotificationStore } from './notification_store';

const notification = useNotificationStore();

// Debug logger
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Backup Store]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Backup Store Error]', ...args);
    }
  }
};

interface BackupFile {
  id: string;
  fileName: string;
  size: number;
  createdAt: string;
  createdBy: string;
}

interface ProgressState {
  status: string;
  progress: number;
}

export const useBackupStore = defineStore('backup', {
  state: () => ({
    backups: [] as BackupFile[],
    loading: false,
    currentOperation: '',
    restoreProgress: {
      status: '',
      progress: 0
    } as ProgressState,
    createProgress: {
      status: '',
      progress: 0
    } as ProgressState
  }),

  actions: {
    async listBackups() {
      debug.log('Listing backups...');
      this.loading = true;
      this.currentOperation = 'listing';

      try {
        const response = await ListBackups();
        debug.log('List backups response:', response);
        if (response.status === 200) {
          try {
            this.backups = response.data?.sort(
              (a: BackupFile, b: BackupFile) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          } catch (error) {
            this.backups = [];
          }
          debug.log('Backups sorted and stored:', this.backups);
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        debug.error('Error listing backups:', error);
        if (error.response?.status === 404 && error.response?.data?.error === 'No backups found') {
          this.backups = [];
        } else {
          notification.error({ message: t('errors.fetch_error', { error: error }) });
        }
      } finally {
        this.loading = false;
        this.currentOperation = '';
      }
    },

    async createBackup() {
      debug.log('Starting backup creation...');
      notification.promise({
        message: t('admin.backup.create_backup')
      });
      this.loading = true;
      this.currentOperation = 'creating';
      this.createProgress = { status: '', progress: 0, message: '' };

      try {
        await CreateBackup((update) => {
          this.createProgress = {
            status: update.status,
            progress: update.progress,
            message: update.message
          };

          if (update.status === 'completed' && update.backup) {
            this.listBackups();
            notification.resolvePromise({
              message: t('admin.backup.backup_created')
            });
          }
        });
      } catch (error: any) {
        debug.error('Error during backup creation:', error);
        notification.rejectPromise({
          message: t('errors.backup_create_error', { error: error })
        });
      } finally {
        this.loading = false;
        this.currentOperation = '';
      }
    },

    async downloadBackup(id: string) {
      if (!id) return;
      notification.promise({
        message: t('admin.backup.download_backup')
      });
      debug.log('Starting backup download:', id);

      this.loading = true;
      this.currentOperation = 'downloading';

      try {
        const response = await DownloadBackup(id);
        debug.log('Download response:', response);
        if (response.status === 200) {
          const blob = new Blob([JSON.stringify(response.data, null, 2)], {
            type: 'application/json'
          });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `backup-${id}.json`;
          document.body.appendChild(link);
          link.click();

          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
          debug.log('Download completed successfully');
          notification.resolvePromise({ message: t('admin.backup.download_success') });
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        debug.error('Error downloading backup:', error);
        notification.rejectPromise({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.loading = false;
        this.currentOperation = '';
      }
    },

    async deleteBackup(id: string) {
      if (!id) return;
      notification.promise({
        message: t('admin.backup.delete_backup')
      });
      debug.log('Starting backup deletion:', id);

      this.loading = true;
      this.currentOperation = 'deleting';

      try {
        const response = await DeleteBackup(id);
        debug.log('Delete response:', response);
        if (response.status === 200) {
          notification.resolvePromise({ message: t('admin.backup.delete_success') });
          await this.listBackups();
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        debug.error('Error deleting backup:', error);
        notification.rejectPromise({ message: t('errors.delete_error', { error: error }) });
      } finally {
        this.loading = false;
        this.currentOperation = '';
      }
    },

    async restoreBackup(id: string) {
      if (!id) return;
      debug.log('Starting backup restore:', id);

      this.loading = true;
      this.currentOperation = 'restoring';
      this.restoreProgress = { status: '', progress: 0 };

      try {
        notification.promise({
          message: t('admin.backup.restore_backup')
        });
        const response = await RestoreBackup(id);
        debug.log('Restore initial response:', response);
        const reader = response.data?.body?.getReader();

        if (!reader) {
          throw new Error('No response stream available');
        }

        debug.log('Starting to read restore stream...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            debug.log('Restore stream reading completed');
            break;
          }

          const text = new TextDecoder().decode(value);
          debug.log('Received restore chunk:', text);
          const lines = text.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const update = JSON.parse(line);
              debug.log('Parsed restore update:', update);
              if (update.status && typeof update.progress === 'number') {
                this.restoreProgress = {
                  status: t(`admin.backup.restore_status.${update.status}`),
                  progress: update.progress
                };
                debug.log('Restore progress updated:', this.restoreProgress);
              }

              if (update.error) {
                debug.error('Error in restore update:', update.error);
                throw new Error(update.error);
              }

              if (update.status === 'completed') {
                debug.log('Restore completed successfully');
                notification.resolvePromise({ message: t('admin.backup.restore_success') });
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
                return;
              }
            } catch (e) {
              debug.error('Failed to parse restore progress update:', e);
              console.error('Failed to parse progress update:', e);
            }
          }
        }
      } catch (error: any) {
        debug.error('Error restoring backup:', error);
        notification.rejectPromise({ message: t('errors.restore_error', { error: error }) });
      } finally {
        this.loading = false;
        this.currentOperation = '';
      }
    }
  }
});
