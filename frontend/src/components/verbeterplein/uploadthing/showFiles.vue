<template>
  <v-container fluid :key="clickedItem?.id">
    <!-- Loading State -->
    <v-row v-if="isLoading">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="6" lg="6" class="pa-2">
        <v-card class="file-card" elevation="1">
          <v-skeleton-loader type="image, article" height="200"></v-skeleton-loader>
        </v-card>
      </v-col>
    </v-row>

    <!-- Files Display -->
    <v-row v-else-if="filesArray.length > 0">
      <v-col v-for="file in filesArray" :key="file?.key" cols="12" sm="6" md="6" lg="6" class="pa-2">
        <v-card class="file-card" v-if="file" elevation="1">
          <!-- File Preview with Loading -->
          <div class="preview-section">
            <div v-if="file?.type?.startsWith('image/')" class="file-preview">
              <v-img
                :src="file?.url"
                :height="200"
                :width="400"
                @click="openImageGallery(file)"
                v-if="setup === false"
                class="image-preview"
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
              <v-img v-else :src="file?.url" :height="200" :width="400" class="image-preview">
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
            </div>
            <div v-else class="file-icon-preview">
              <v-icon
                :icon="
                  file?.type === 'application/pdf'
                    ? 'mdi-file-pdf-box'
                    : file?.type?.startsWith('video/')
                      ? 'mdi-file-video'
                      : 'mdi-file-question'
                "
                size="64"
                color="error"
              ></v-icon>
            </div>
          </div>

          <!-- File Info -->
          <v-card-text class="file-info pa-3">
            <div class="text-truncate font-weight-medium">{{ file.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ formatFileSize(file.size) }}
            </div>
          </v-card-text>

          <!-- Actions -->
          <v-card-actions class="pa-3 pt-0 card-actions">
            <v-btn variant="text" density="comfortable" size="small" color="primary" prepend-icon="mdi-eye" @click="downloadFile(file)">
              View
            </v-btn>
            <v-btn
              variant="text"
              density="comfortable"
              size="small"
              color="error"
              prepend-icon="mdi-delete"
              @click="PDCA ? deletePreventiefFile(file) : setup ? deleteSetupFile(file) : deleteFile(file)"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else>
      <v-col cols="12" class="text-center pa-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-file-upload-outline</v-icon>
        <div class="text-h6 text-grey">No files uploaded yet</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { DeleteFile as deleteFileAPI } from '@/API/melding';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();

const isLoading = ref(true);
const imageFiles = ref([]);
const currentImageIndex = ref(0);

const meldingStore = useMeldingStore();
const preventiefStore = usePreventiefStore();
const notification = useNotificationStore();

const props = defineProps({
  PDCA: {
    required: false,
    type: Boolean
  },
  files: {
    type: Array,
    required: false
  },
  clickedItem: {
    type: Object,
    required: false
  },
  setup: {
    type: Boolean,
    required: false,
    default: false
  }
});

const emit = defineEmits(['openImageGallery', 'update', 'updateFiles']);

const filesArray = ref<any>([]);
const clickedItem = ref(props.clickedItem);

const updateFiles = async () => {
  isLoading.value = true;
  try {
    if (props.files) {
      filesArray.value = props.files;
    } else if (clickedItem.value) {
      if (props.PDCA === true) {
        if (!clickedItem.value?.Preventief?.CorrespondenceIDs?.IDs) {
          filesArray.value = [];
        } else {
          filesArray.value = JSON.parse(clickedItem.value?.Preventief?.CorrespondenceIDs?.IDs);
        }
      } else {
        if (!clickedItem.value?.CorrespondenceIDs?.IDs) {
          filesArray.value = [];
        } else {
          filesArray.value = JSON.parse(clickedItem.value?.CorrespondenceIDs?.IDs);
        }
      }
    } else {
      filesArray.value = [];
    }
  } catch (error) {
    notification.error({ message: 'Error loading files' });
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 200);
  }
};

// Watch for changes to the clickedItem prop
watch(() => props.clickedItem, async (newVal) => {
  clickedItem.value = newVal;
  await updateFiles();
}, { deep: true });

onMounted(async () => {
  await updateFiles();
});

const openImageGallery = (file: any) => {
  if (props.PDCA === true) {
    if (JSON.parse(clickedItem.value?.Preventief?.CorrespondenceIDs?.IDs)[0]?.length > 1) {
      imageFiles.value = JSON.parse(clickedItem.value?.Preventief?.CorrespondenceIDs?.IDs)[0].filter((f: { type: string }) =>
        f.type.startsWith('image/')
      );
    } else {
      imageFiles.value = JSON.parse(clickedItem.value?.Preventief?.CorrespondenceIDs?.IDs).filter((f: { type: string }) =>
        f.type.startsWith('image/')
      );
    }
  } else {
    if (JSON.parse(clickedItem.value?.CorrespondenceIDs?.IDs)[0]?.length > 1) {
      imageFiles.value = JSON.parse(clickedItem.value?.CorrespondenceIDs?.IDs)[0].filter((f: { type: string }) =>
        f.type.startsWith('image/')
      );
    } else {
      imageFiles.value = JSON.parse(clickedItem.value?.CorrespondenceIDs?.IDs).filter((f: { type: string }) => f.type.startsWith('image/'));
    }
  }
  currentImageIndex.value = imageFiles.value.findIndex((f: { key: string }) => f.key === file.key);
  emit('openImageGallery', [currentImageIndex, imageFiles]);
};

const downloadFile = (file: any) => {
  window.open(file.url, '_blank');
};

const deleteFile = async (file: any) => {
  notification.promise({ message: 'Deleting file...' });
  try {
    const response = await meldingStore.removeCorrespondence(clickedItem.value?.id, file.key);
    if (response && clickedItem.value) {
      const report = await meldingStore.getReportById(clickedItem.value.id);
      if (report) {
        clickedItem.value = report;
      }
      emit('update', [true, true]);
      notification.resolvePromise({ message: t('notifications.delete_success') });
    } else {
      notification.rejectPromise({ message: t('errors.delete_error') });
    }
  } catch (error) {
    notification.rejectPromise({ message: t('errors.delete_error', { error: error }) });
  }
};

const deleteSetupFile = async (file: any) => {
  notification.promise({ message: 'Deleting file...' });
  try {
    const response = await deleteFileAPI(file.key);
    if (response) {
      const deletedFiles = filesArray.value.filter((f: any) => f.key !== file.key);
      filesArray.value = deletedFiles;
      emit('updateFiles', deletedFiles);
      notification.resolvePromise({ message: t('notifications.delete_success') });
    } else {
      notification.rejectPromise({ message: t('errors.delete_error') });
    }
  } catch (error) {
    notification.rejectPromise({ message: t('errors.delete_error', { error: error }) });
  }
};

const deletePreventiefFile = async (file: any) => {
  notification.promise({ message: 'Deleting file...' });
  try {
    const response = await preventiefStore.removeCorrespondence(clickedItem.value?.Preventief?.id, file.key);
    if (response && clickedItem.value) {
      const report = await meldingStore.getReportById(clickedItem.value.id);
      if (report) {
        clickedItem.value = report;
      }
      emit('update', [true, true]);
      notification.resolvePromise({ message: t('notifications.delete_success') });
    } else {
      notification.rejectPromise({ message: t('errors.delete_error') });
    }
  } catch (error) {
    notification.rejectPromise({ message: t('errors.delete_error', { error: error }) });
  }
};

// Add this function for formatting file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.file-card {
  border-radius: 8px;
  transition: all 0.2s ease;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

:deep(.v-card) {
  overflow: hidden !important;
  height: auto !important;
}

:deep(.v-card-text) {
  overflow: hidden !important;
  padding-bottom: 8px !important;
}

.preview-section {
  height: 200px;
  background: rgb(245, 245, 245);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.image-preview {
  cursor: pointer;
  height: 100%;
  width: 100%;
}

:deep(.v-img) {
  height: 100% !important;
  width: 100% !important;
}

:deep(.v-img__img) {
  object-fit: contain !important;
}

:deep(.v-img__img--cover) {
  object-fit: contain !important;
}

.file-info {
  flex-grow: 1;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 12px !important;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 600px) {
  .preview-section {
    aspect-ratio: 1/1;
  }
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}
</style>
