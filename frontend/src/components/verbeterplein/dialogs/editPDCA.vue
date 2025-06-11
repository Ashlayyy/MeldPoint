<template>
  <v-dialog v-model="dialogVisible" :max-width="800" :retain-focus="false">
    <v-card>
      <v-card-title class="bg-secondary text-white pa-4">
        {{ t('verbeterplein.edit_pdca.title') }}
      </v-card-title>
      <v-card-text class="pa-4">
        <div class="d-flex flex-column gap-4 mt-4">
          <!-- Action Holder -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-account-outline</v-icon>
              <v-select
                v-model="actiehouder"
                :items="actiehouderStore.actiehouders"
                :label="t('verbeterplein.edit_pdca.labels.action_holder')"
                item-title="Name"
                return-object
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-select>
            </div>
          </div>

          <!-- Deadline -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-calendar-outline</v-icon>
              <div class="datepicker-container flex-grow-1">
                <Datepicker
                  v-if="!loading"
                  :disabled-dates="disabledDates"
                  v-model="Deadline"
                  :open-date="new Date(validDate(clickedItem.Preventief.Deadline) ? clickedItem.Preventief.Deadline : new Date())"
                  :monday-first="true"
                  :enableTimePicker="false"
                  format="dd-MM-yyyy"
                  class="flex-grow-1"
                >
                  <template #default="{ inputValue, toggleDatepicker }">
                    <v-text-field
                      :model-value="inputValue"
                      @click="toggleDatepicker"
                      :label="t('verbeterplein.edit_pdca.labels.deadline')"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      readonly
                      placeholder="Kies een deadline"
                      class="flex-grow-1"
                    ></v-text-field>
                  </template>
                </Datepicker>
              </div>
            </div>
          </div>

          <!-- Team Members -->
          <div class="d-flex flex-column" v-if="props.clickedItem?.Preventief?.rootCauseLevel !== 1">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-account-group-outline</v-icon>
              <v-select
                v-model="teamleden"
                :items="actiehouderStore.actiehouders.filter((teamlid: any) => teamlid?.id !== actiehouder?.id)"
                :label="t('verbeterplein.edit_pdca.labels.team_members')"
                item-title="Name"
                multiple
                chips
                clearable
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
                return-object
              ></v-select>
            </div>
          </div>

          <!-- Title -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-text-box-outline</v-icon>
              <v-text-field
                v-model="title"
                :label="t('verbeterplein.edit_pdca.labels.title')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-text-field>
            </div>
          </div>

          <!-- Status -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-flag-outline</v-icon>
              <v-select
                v-model="selectedStatus"
                :items="statussen"
                :label="t('verbeterplein.edit_pdca.labels.status')"
                item-title="StatusNaam"
                return-object
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-select>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="closeDialog" :disabled="PDCAbuttonClicked">{{ t('cancel') }}</v-btn>
        <v-btn color="secondary" variant="flat" @click="savePDCAData" :loading="PDCAbuttonClicked">
          {{ t('save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Datepicker from 'vuejs3-datepicker';
import { validDate } from '@/utils/helpers/dateHelpers';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useI18n } from 'vue-i18n';

const props = defineProps(['clickedItem', 'statussen', 'rawStatussen']);
const emit = defineEmits(['update', 'close']);

const notification = useNotificationStore();
const actiehouderStore = useActiehouderStore();
const preventiefStore = usePreventiefStore();

const dialogVisible = ref(false);
const actiehouder = ref<any>({});
const teamleden = ref<any>([]);
const Preventief = ref({ Oorzaak: '' });
const Deadline = ref(null);
const selectedStatus = ref<any>({});
const PDCAbuttonClicked = ref(false);
const disabledDates = ref({});
const loading = ref(false);
const title = ref('');

const { t } = useI18n();

onMounted(async () => {
  if (actiehouderStore.actiehouders.length === 0) {
    await actiehouderStore.fetchActiehouders();
  }
});

watch(actiehouder, () => {
  teamleden.value = teamleden.value.filter((teamlid: any) => teamlid?.id !== actiehouder.value?.id);
});

watch(
  () => props.clickedItem,
  () => {
    if (props.clickedItem) {
      actiehouder.value = actiehouderStore.getActiehouderById(props.clickedItem.Preventief?.User?.id) || {};
      if (props.clickedItem.Preventief?.Teamleden?.IDs) {
        teamleden.value = props.clickedItem.Preventief.Teamleden.IDs.map((teamlid: any) => actiehouderStore.getActiehouderById(teamlid));
      }
      Preventief.value.Oorzaak = props.clickedItem.Preventief?.Oorzaak || '';
      Deadline.value = props.clickedItem.Preventief?.Deadline || null;
      selectedStatus.value = props.clickedItem.Preventief?.Status || '';
      title.value = props.clickedItem.Preventief?.Title || '';
    }
  },
  { immediate: true, deep: true }
);

const closeDialog = () => {
  emit('close');
};

const savePDCAData = async () => {
  PDCAbuttonClicked.value = true;

  notification.promise({
    title: t('notifications.saving'),
    message: t('notifications.saving')
  });

  let data: Record<string, any> = {};

  let teamledenIDS = teamleden.value.map((teamlid: { id: string }) => teamlid.id);

  // Status
  if (selectedStatus.value.StatusNaam !== props.clickedItem.Preventief?.Status?.StatusNaam) {
    const response = await preventiefStore.linkStatus(props.clickedItem.Preventief.id, selectedStatus.value.id);

    if (response?.status !== 200) {
      notification.rejectPromise({
        title: t('notifications.update_failed'),
        message: t('notifications.update_failed')
      });
    }
  }

  // Teamleden
  if (
    !props.clickedItem.Preventief?.Teamleden ||
    props.clickedItem.Preventief?.Teamleden?.length !== teamledenIDS.length ||
    (teamledenIDS !== props.clickedItem.Preventief?.Teamleden &&
      teamledenIDS.length > 0 &&
      teamledenIDS !== undefined &&
      teamledenIDS !== null)
  ) {
    data = {
      Teamleden: {
        IDs: teamledenIDS
      }
    };
  }

  // Actiehouder
  if (actiehouder.value.Name !== props.clickedItem.Preventief.Actiehouder?.Name) {
    if (!actiehouder.value || actiehouder.value.length === 0) {
      notification.rejectPromise({
        title: t('notifications.empty_field', { field: 'Actiehouder' }),
        message: t('notifications.empty_field', { field: 'Actiehouder' })
      });
      PDCAbuttonClicked.value = false;
      return;
    }

    const response = await preventiefStore.linkActiehouder(props.clickedItem.Preventief.id, actiehouder.value.id);

    if (response?.status !== 200) {
      notification.rejectPromise({
        title: t('notifications.update_failed'),
        message: t('notifications.update_failed')
      });
    }
  }

  // Deadline
  if (
    Deadline.value !== props.clickedItem.Preventief.Deadline &&
    validDate(Deadline.value) &&
    Deadline.value !== undefined &&
    Deadline.value !== null
  ) {
    data = {
      ...data,
      Deadline: Deadline.value
    };
  }

  // Title
  if (title.value !== props.clickedItem.Preventief?.Title) {
    data = {
      ...data,
      Title: title.value
    };
  }

  // If no data is changed
  if (Object.keys(data).length === 0) {
    PDCAbuttonClicked.value = false;
    notification.rejectPromise({
      title: t('notifications.no_changes'),
      message: t('notifications.no_changes')
    });
    return;
  }

  const response = await preventiefStore.updatePreventief(props.clickedItem.Preventief.id, data);

  if (response?.status === 200) {
    emit('update', [true, true]);
    notification.resolvePromise({
      title: t('notifications.update_success'),
      message: t('notifications.update_success')
    });
  } else {
    emit('update', [true, true]);
    notification.rejectPromise({
      title: t('notifications.update_failed'),
      message: t('notifications.update_failed')
    });
  }

  PDCAbuttonClicked.value = false;
  closeDialog();
  emit('update', [true, true]);
};
</script>

<style scoped lang="scss">
:deep(.v-dialog) {
  z-index: 1500 !important;
  overflow: visible !important;
}

:deep(.v-card) {
  overflow: visible !important;
}

:deep(.v-card-text) {
  overflow: scroll !important;
}

:deep(.v-overlay__content) {
  z-index: 1500 !important;
  overflow: visible !important;
}

:deep(.v-overlay__scrim) {
  z-index: 1499 !important;
}

:deep(.dp__outer_menu_wrap) {
  z-index: 1501 !important;
  position: fixed !important;
}

:deep(.dp__main) {
  position: fixed !important;
}

:deep(.dp__overlay) {
  position: fixed !important;
}

.datepicker-container {
  position: static !important;
}
</style>
