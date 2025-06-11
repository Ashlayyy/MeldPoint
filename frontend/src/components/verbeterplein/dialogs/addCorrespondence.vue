<template>
  <Dialog v-model="dialogVisible" :title="'Voeg Bijlagen Toe'" :show-actions="false">
    <v-card-text>
      <uploadThing @uploaded="handleUpload" @error="handleError" />
      <v-alert v-if="uploadErrors.length > 0" type="error" class="mt-4">
        Er zijn fouten opgetreden tijdens het uploaden:
        <ul>
          <li v-for="error in uploadErrors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>
      <v-row>
        <v-col cols="12">
          <strong>Bestanden toegevoegd: </strong> {{ uploadedFiles.length }}
          <br />
          <v-chip v-for="file in uploadedFiles" :key="file.name" color="success" dark>
            {{ file.name }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn text="Annuleer" @click="closeDialog">Annuleer</v-btn>
      <v-spacer></v-spacer>
      <v-btn
        @click.prevent="saveCorrespondence"
        :loading="isUploading"
        :disabled="uploadedFiles.length === 0"
        variant="tonal"
        color="primary"
      >
        Opslaan
      </v-btn>
    </v-card-actions>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Dialog from '@/components/verbeterplein/dialogs/dialog.vue';
import uploadThing from '@/components/verbeterplein/uploadthing/components.vue';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const props = defineProps<{
  isPDCA: boolean;
}>();

const emit = defineEmits(['close', 'update']);

const meldingStore = useMeldingStore();
const preventiefStore = usePreventiefStore();
const notification = useNotificationStore();
const { t } = useI18n();
const dialogVisible = ref(false);
const uploadedFiles = ref<any[]>([]);
const uploadErrors = ref<string[]>([]);
const isUploading = ref(false);

const handleUpload = (files: any[]) => {
  uploadedFiles.value.push(...files);
};

const handleError = (errors: string[]) => {
  uploadErrors.value = errors;
};

const closeDialog = () => {
  dialogVisible.value = false;
  uploadedFiles.value = [];
  uploadErrors.value = [];
  emit('close');
};

const saveCorrespondence = async () => {
  isUploading.value = true;
  notification.promise({
    message: t('notifications.saving_correspondence')
  });
  try {
    const data = uploadedFiles.value;

    const clickedItemId = meldingStore.selectedFormId;
    const isPDCA = props.isPDCA;

    console.log('clickedItemId', clickedItemId);
    console.log('isPDCA', isPDCA);
    let response;

    if (isPDCA) {
      const selectedItem = meldingStore.getReportById(clickedItemId);
      if (selectedItem?.Preventief?.id) {
        response = await preventiefStore.addCorrespondence(selectedItem.Preventief.id, data);
      } else {
        notification.rejectPromise({ message: t('errors.correctief_not_saved') });
      }
    } else {
      response = await meldingStore.addCorrespondence(clickedItemId, data);
    }

    if (response) {
      notification.resolvePromise({ message: t('notifications.correspondence_saved') });
      closeDialog();
      emit('update', [true, true]);
    } else {
      notification.rejectPromise({ message: t('errors.correspondence_error', { error: t('errors.wrong_status') }) });
    }
  } catch (error: any) {
    notification.rejectPromise({ message: t('errors.correspondence_error', { error: error }) });
  } finally {
    isUploading.value = false;
  }
};
</script>
