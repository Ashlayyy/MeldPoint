<template>
  <v-card variant="outlined" class="card-hover-border">
    <v-card-text>
      <div class="d-flex align-start mb-6">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-paperclip</v-icon>
          <h3>BIJLAGEN</h3>
        </div>
      </div>

      <p class="text-subtitle-1 mb-6">
        Voeg eventueel bestanden toe die het obstakel verduidelijken, zoals foto's, documenten of tekeningen. Dit is optioneel.
      </p>

      <v-card flat>
        <v-card-text>
          <UploadComponents @uploaded="handleUpload" @error="handleError" />
          <v-row v-if="uploadedFiles.length > 0" class="mt-4">
            <v-col cols="12">
              <strong>Bestanden toegevoegd: {{ uploadedFiles.length }}</strong>
              <showFiles :files="uploadedFiles" :setup="true" @updateFiles="overWriteFiles" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadComponents from '../../../uploadthing/components.vue';
import showFiles from '@/components/verbeterplein/uploadthing/showFiles.vue';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useI18n } from 'vue-i18n';

const t = useI18n().t;
const notification = useNotificationStore();
const createMeldingStore = useCreateMeldingStore();
const emit = defineEmits(['step-complete']);

const uploadedFiles = ref<any[]>([]);

const handleUpload = (files: any[]) => {
  uploadedFiles.value.push(...files);
  createMeldingStore.bijlagen = uploadedFiles.value;
  emit('step-complete', 3);
};

const overWriteFiles = (files: any[]) => {
  uploadedFiles.value = files;
  createMeldingStore.bijlagen = uploadedFiles.value;
};

const handleError = (error: Error) => {
  notification.error({
    message: t('errors.upload_error', { error: error.message })
  });
};
</script>
