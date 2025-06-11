<template>
  <v-dialog v-model="dialogVisible" :max-width="800" :retain-focus="false">
    <v-card>
      <v-card-title class="bg-secondary text-white pa-4">
        {{ editMode ? 'Bijwerken Correctief' : 'Voeg Correctief Toe' }}
      </v-card-title>
      <v-card-text class="pa-4">
        <div class="d-flex flex-column gap-4">
          <!-- Actiehouder -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-account-outline</v-icon>
              <v-select
                :items="actiehouders"
                v-model="actiehouder"
                label="Actiehouder"
                item-title="Name"
                item-value="id"
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
                  v-model="deadline"
                  :open-date="new Date(deadline)"
                  :monday-first="true"
                  :prevent-disable-date-selection="true"
                  format="dd-MM-yyyy"
                  class="flex-grow-1"
                >
                  <template #default="{ inputValue, toggleDatepicker }">
                    <v-text-field
                      :model-value="inputValue"
                      @click="toggleDatepicker"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      readonly
                      label="Deadline"
                      placeholder="Kies een deadline"
                      class="flex-grow-1"
                    >
                    </v-text-field>
                  </template>
                </Datepicker>
              </div>
            </div>
          </div>

          <!-- Oplossing -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-text-box-outline</v-icon>
              <v-textarea
                v-model="oplossing"
                label="Oplossing"
                auto-grow
                rows="3"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-textarea>
            </div>
          </div>

          <!-- Faalkosten -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-currency-eur</v-icon>
              <v-text-field
                v-model="faalkosten"
                label="Faalkosten"
                type="number"
                variant="outlined"
                density="comfortable"
                hide-details
                prefix="€"
                class="flex-grow-1"
              ></v-text-field>
            </div>
          </div>

          <!-- Status -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-flag-outline</v-icon>
              <v-select
                :items="statussen"
                v-model="status"
                label="Status"
                item-title="StatusNaam"
                item-value="Name"
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
        <v-btn variant="text" @click="dialogVisible = false" :disabled="loading">Annuleren</v-btn>
        <v-btn :color="editMode ? 'secondary' : 'primary'" variant="flat" @click="saveCorrectief" :loading="loading">
          {{ editMode ? 'Bijwerken' : 'Opslaan' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCorrectiefStore } from '@/stores/verbeterplein/correctief_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import Datepicker from 'vuejs3-datepicker';

const { t } = useI18n();

const correctiefStore = useCorrectiefStore();
const actiehouderStore = useActiehouderStore();
const statusStore = useStatusStore();
const meldingStore = useMeldingStore();
const notification = useNotificationStore();
const emit = defineEmits(['update']);
const props = defineProps<{
  modelValue: boolean;
}>();

const dialogVisible = ref(props.modelValue);

const editMode = ref(false);
const correctief = ref<any>({});
const actiehouder = ref<any>({});
const status = ref<any>({});
const faalkosten = ref<any>({});
const oplossing = ref<any>({});
const deadline = ref<any>({});

const initialDeadline = ref<any>(null);

onMounted(async () => {
  await statusStore.fetchStatussen('reparatieloop');
  await actiehouderStore.fetchActiehouders();
  const report = meldingStore.getReportById(meldingStore.selectedFormId);
  if (report?.Correctief && report?.Correctief?.id) {
    correctief.value.Faalkosten = report?.Correctief?.Faalkosten;
    correctief.value.Status = report?.Correctief?.Status;
    correctief.value.Oplossing = report?.Correctief?.Oplossing;
    correctief.value.Actiehouder = report?.Correctief?.User;
    correctief.value.Deadline = report?.Correctief?.Deadline;

    deadline.value = report?.Correctief?.Deadline;
    faalkosten.value = report?.Correctief?.Faalkosten;
    oplossing.value = report?.Correctief?.Oplossing;
    status.value = report?.Correctief?.Status;
    actiehouder.value = report?.Correctief?.User;
  }
});

const disabledDates = ref<any>(null);

const actiehouders = computed(() => actiehouderStore.actiehouders);
const statussen = computed(() => statusStore.statussen);

const loading = ref(false);

const saveCorrectief = async () => {
  loading.value = true;
  notification.promise({
    message: t('notifications.saving_correctief')
  });
  if (editMode.value === true) {
    try {
      const report: any = meldingStore.getReportById(meldingStore.selectedFormId);
      if (report?.Correctief && report?.Correctief?.id) {
        await correctiefStore.updateCorrectief(report?.Correctief?.id, {
          ...(faalkosten.value >= 0 &&
            faalkosten.value !== report?.Correctief?.Faalkosten &&
            faalkosten.value >= 0 && { Faalkosten: Number(faalkosten.value) }),
          ...(oplossing.value && oplossing.value !== report?.Correctief?.Oplossing && { Oplossing: oplossing.value }),
          ...(deadline.value && deadline.value !== report?.Correctief?.Deadline && { Deadline: new Date(deadline.value) }),
          ...(status.value && status.value !== report?.Correctief?.Status && { StatusID: status.value.id }),
          ...(actiehouder.value && actiehouder.value !== report?.Correctief?.Actiehouder && { UserID: actiehouder.value.id })
        });

        await Promise.all([correctiefStore.fetchCorrectief(), meldingStore.fetchReports(true)]);
        meldingStore.selectedFormId = report.id;
        emit('update', [true, true]);

        notification.resolvePromise({ message: t('notifications.correctief_saved') });
      } else {
        throw new Error(t('errors.correctief_correctief_not_found'));
      }
    } catch (error: any) {
      notification.rejectPromise({ message: t('errors.correctief_error', { error: error }) });
    } finally {
      loading.value = false;
    }
  } else {
    notification.promise({
      message: t('notifications.creating_correctief')
    });
    try {
      if (correctief.value.Faalkosten >= 0) {
        const status = correctief.value.Status
          ? correctief.value.Status.id
          : statusStore.statussen.find((s: any) => s.StatusNaam === 'Open');
        correctiefStore.createCorrectief({
          ...correctief.value,
          Status: status
        });
        emit('update', [true, true]);
        notification.resolvePromise({ message: t('notifications.correctief_created') });
      } else {
        throw new Error(t('errors.correctief_error_faalkosten'));
      }
    } catch (error: any) {
      notification.rejectPromise({ message: t('errors.correctief_error', { error: error }) });
    } finally {
      loading.value = false;
    }
  }
};

watch(
  () => props.modelValue,
  (newVal) => {
    dialogVisible.value = newVal;
    loading.value = true;
    if (newVal) {
      const report = meldingStore.getReportById(meldingStore.selectedFormId);
      if (report?.Correctief && report?.Correctief?.id) {
        correctief.value = report?.Correctief;
        initialDeadline.value = correctief.value.Deadline;

        correctief.value.Faalkosten = report?.Correctief?.Faalkosten;
        correctief.value.Status = report?.Correctief?.Status;
        correctief.value.Oplossing = report?.Correctief?.Oplossing;
        correctief.value.Actiehouder = report?.Correctief?.User;
        correctief.value.Deadline = report?.Correctief?.Deadline;

        deadline.value = report?.Correctief?.Deadline;
        faalkosten.value = report?.Correctief?.Faalkosten;
        oplossing.value = report?.Correctief?.Oplossing;
        status.value = report?.Correctief?.Status;
        actiehouder.value = report?.Correctief?.User;

        editMode.value = true;

        disabledDates.value = {
          // to: new Date(new Date(initialDeadline.value).getTime() - 24 * 60 * 60 * 1000)
          to: new Date(Date.now() - 24 * 60 * 60 * 1000)
        };

        loading.value = false;
      } else {
        disabledDates.value = {
          to: new Date(Date.now() - 24 * 60 * 60 * 1000)
        };
        editMode.value = false;
        loading.value = false;
      }
    }
  }
);
</script>

<style scoped lang="scss">
:deep(.v-dialog) {
  z-index: 1500 !important;
  overflow: visible !important;
}

:deep(.v-card-text) {
  overflow: visible !important;
}

:deep(.dp__outer_menu_wrap) {
  z-index: 1501 !important;
  position: fixed !important;
}

:deep(.v-overlay__content) {
  z-index: 1500 !important;
  overflow: visible !important;
}

:deep(.v-overlay__scrim) {
  z-index: 1499 !important;
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
