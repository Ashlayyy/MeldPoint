<template>
  <div>
    <v-row align="center">
      <v-col cols="auto">
        <h4 v-if="loading && progress < 100">Compressing...</h4>
      </v-col>
      <v-col cols="auto">
        <v-progress-circular rounded v-if="loading" color="primary" height="20" class="mt-2" indeterminate></v-progress-circular>
      </v-col>
    </v-row>
    <span v-if="loading && progress < 100">Please wait while we compress your files. You should not exit this page.</span>
    <v-progress-linear rounded v-if="loading" color="secondary" height="20" class="mt-2" :model-value="progress">
      <template v-slot:default="{ value }">
        <strong>{{ Math.round(value) }}%</strong>
      </template>
    </v-progress-linear>
    <br />
    <UploadButton
      v-if="isMobile"
      :config="{
        config: {
          mode: 'auto',
          appendOnPaste: true
        },
        disabled: disabled,
        endpoint: 'videoImgPDF',
        onBeforeUploadBegin: (file) => {
          loading = true;
          return BEFOREUPLOAD(file);
        },
        onClientUploadComplete: (res) => {
          EmitEvent('uploaded', res);
          loading = false;
        },
        onUploadError: (error: any) => {
          EmitEvent('error', error);
          loading = false;
        }
      }"
    />
    <UploadDropzone
      v-if="!isMobile"
      :config="{
        config: {
          mode: 'auto',
          appendOnPaste: true
        },
        disabled: disabled,
        endpoint: 'videoImgPDF',
        onBeforeUploadBegin: (file) => {
          loading = true;
          return BEFOREUPLOAD(file);
        },
        onClientUploadComplete: (res) => {
          EmitEvent('uploaded', res);
          loading = false;
        },
        onUploadError: (error: any) => {
          EmitEvent('error', error);
          loading = false;
        }
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { UploadDropzone, UploadButton } from '@/utils/uploadthing/uploadthing';
import imageCompression from 'browser-image-compression';
import { transcodeVideo } from '@/utils/uploadthing/transcodeVideo';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();
const notification = useNotificationStore();
const emit = defineEmits(['uploaded', 'error']);
const loading = ref(false);
const disabled = ref(false);
const progress = ref(0);
const progressChecking = ref(0);

const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);

const FILE_LIMITS: { [key: string]: { maxSize: number; maxFiles: number } } = {
  image: { maxSize: 16, maxFiles: 100 },
  video: { maxSize: 64, maxFiles: 4 },
  pdf: { maxSize: 16, maxFiles: 100 },
  default: { maxSize: 16, maxFiles: 100 }
};

async function BEFOREUPLOAD(files: File[]) {
  notification.promise({ message: t('notifications.uploading_files') });
  const uploadFiles: File[] = [];
  if (files.length > 0) {
    disabled.value = true;
    progressChecking.value = 1;

    const filesByType: { [key: string]: File[] } = {};
    files.forEach((file) => {
      if (file.type) {
        const type = file.type.split('/')[0];
        if (!filesByType[type]) filesByType[type] = [];
        filesByType[type].push(file);
      }
    });

    for (const [type, typeFiles] of Object.entries(filesByType)) {
      const limit = FILE_LIMITS[type] || FILE_LIMITS.default;

      setTimeout(() => {
        progressChecking.value = (progressChecking.value / Object.keys(filesByType).length) * 50;
      }, 125);

      if (typeFiles.length > limit.maxFiles) {
        notification.rejectPromise({
          message: t('errors.upload_error_max_files', { maxFiles: limit.maxFiles })
        });
        disabled.value = false;
        return [];
      }

      const oversizedFiles = typeFiles.filter((file) => {
        progressChecking.value = (progressChecking.value / Object.keys(filesByType).length) * 50;
        return file.size > limit.maxSize * 1024 * 1024;
      });
      if (oversizedFiles.length > 0) {
        notification.rejectPromise({
          message: t('errors.upload_error_max_size', { maxSize: limit.maxSize })
        });
        disabled.value = false;
        return [];
      }
    }

    for (let i = 0; i < files.length; i++) {
      progress.value = (i / files.length) * 100;
      if (files[i].type?.startsWith('image')) {
        const compressedImage = await imageCompression(files[i], {
          maxSizeMB: 16,
          useWebWorker: true
        });
        uploadFiles.push(compressedImage);
      } else if (files[i].type?.startsWith('video')) {
        await transcodeVideo({
          inputFile: files[i],
          format: 'mp4'
        })
          .then((res) => {
            const videoFile = new File([res.outputFile], files[i].name, { type: 'video/mp4' });
            uploadFiles.push(videoFile);
          })
          .catch((error) => {
            notification.rejectPromise({ message: t('errors.transcoding_error', { error: error.message }) });
          });
      } else {
        uploadFiles.push(files[i]);
      }
    }
    progress.value = 100;
    progressChecking.value = 100;
    notification.resolvePromise({ message: t('notifications.upload_success') });
  }
  disabled.value = false;
  loading.value = false;
  return uploadFiles;
}

function EmitEvent(event: any, data: any) {
  emit(event, data);
}
</script>
