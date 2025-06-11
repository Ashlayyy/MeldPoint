<template>
  <Dialog persistent v-model="dialogVisible" title="Start PDCA?" :show-actions="false" max-width="500">
    <v-card-text>
      <p>
        Hier kan je een melding toevoegen aan een bestaande PDCA. <br /><br />
        LET OP: WIP
      </p>
      <br /><br />
      <v-select
        rounded="none"
        return-object
        v-model="selectedPDCA"
        :items="preventieven"
        item-title="title"
        item-value="id"
        label="Selecteer een PDCA"
        max-width="400"
      />
    </v-card-text>
    <v-card-actions>
      <v-btn @click="$emit('close')" color="gray"> Cancel </v-btn>
      <v-spacer></v-spacer>
      <v-btn @click="addPDCA" color="primary" variant="tonal" :loading="isLoading"> Add </v-btn>
    </v-card-actions>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import Dialog from '@/components/verbeterplein/dialogs/dialog.vue';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useI18n } from 'vue-i18n';

const notification = useNotificationStore();
const preventiefStore = usePreventiefStore();
const meldingStore = useMeldingStore();
const t = useI18n().t;
const dialogVisible = ref(false);
const selectedPDCA = ref<any>(null);
const preventieven = ref<any>([]);
const isLoading = ref(false);

const emit = defineEmits(['close', 'update']);

const addPDCA = async () => {
  if (!selectedPDCA.value) {
    notification.error({
      message: t('errors.required')
    });
    return;
  }

  isLoading.value = true;
  notification.promise({
    message: t('notifications.linking_pdca')
  });

  try {
    const response = await meldingStore.addMeldingToPDCA(selectedPDCA.value.id);

    if (!response) {
      notification.rejectPromise({
        message: t('errors.wrong_status')
      });
      return;
    }

    if (response.status === 200 && response.data) {
      await meldingStore.updateReport(meldingStore.selectedFormId, {
        PDCA: true,
        Archived: true,
        ClonedTo: response.data.id,
        PreventiefID: selectedPDCA.value.id
      });
      await meldingStore.addCloneID(response.data.id, meldingStore.selectedFormId);
      notification.resolvePromise({
        message: t('notifications.linking_pdca_success')
      });
      emit('close');
      emit('update', [true, true]);
    } else {
      throw new Error(t('errors.wrong_status'));
    }
  } catch (error) {
    notification.rejectPromise({
      message: t('errors.fetch_error', { error: error })
    });
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    await preventiefStore.getAllPreventief();
    preventieven.value = preventiefStore.preventieven
      .filter((p: any) => p.Title)
      .map((p: any) => ({
        title: `${p.Title.length > 20 ? p.Title.substring(0, 20) + '...' : p.Title}`,
        id: p.id
      }));
  } catch (error) {
    notification.rejectPromise({
      message: t('errors.fetch_error', { error: error })
    });
  }
});
</script>
