<template>
  <div>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:model-value', $event)" max-width="700">
      <v-card>
        <v-card-title class="bg-secondary text-white pa-4 d-flex align-center">
          PDCA Toewijzen
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" density="comfortable" @click="emit('close')"></v-btn>
        </v-card-title>

        <v-card-text class="pa-6 dialog-content">
          <!-- Mode Toggle at Top -->
          <div class="text-h3 text-primary text-center mb-2">Kies:</div>
          <div class="mode-toggle-container mb-6">
            <v-btn-toggle v-model="selectedMode" mandatory color="primary" class="mode-toggle">
              <v-btn :value="'link'">
                <v-icon start>mdi-link-variant</v-icon>
                Koppel bestaande PDCA
              </v-btn>
              <v-btn :value="'create_pdca'">
                <v-icon start>mdi-rotate-360</v-icon>
                Maak PDCA
              </v-btn>
              <v-btn :value="'create_pd'">
                <v-icon start>mdi-lightning-bolt</v-icon>
                Maak PD
              </v-btn>
            </v-btn-toggle>
          </div>

          <v-row class="content-row">
            <v-col v-show="selectedMode === 'link'" :cols="12" class="panel-container">
              <div class="panel-content panel-active">
                <v-text-field
                  v-model="searchQuery"
                  label="Zoek bestaande PDCAs..."
                  variant="outlined"
                  density="comfortable"
                  class="mb-2"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  @update:model-value="searchPDCAs"
                />

                <div class="existing-pdcas-list">
                  <div v-if="loading" class="d-flex justify-center align-center pa-8">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </div>
                  <div v-else-if="filteredPDCAs.length === 0" class="empty-state">
                    <v-icon size="48" color="medium-emphasis" class="mb-2">mdi-alert</v-icon>
                    <div class="text-medium-emphasis mb-4">Geen PDCAs gevonden</div>
                    <v-btn color="primary" @click="selectedMode = 'create_pdca'">
                      <v-icon start>mdi-plus-circle</v-icon>
                      Maak nieuwe PDCA
                    </v-btn>
                  </div>
                  <v-list v-else lines="two" class="existing-pdcas-container">
                    <v-list-item
                      v-for="pdca in filteredPDCAs"
                      :key="pdca.id"
                      :active="selectedPDCA?.id === pdca.id"
                      @click="confirmLinkToPDCA(pdca)"
                      :class="{ 'selected-pdca': selectedPDCA?.id === pdca.id }"
                    >
                      <v-list-item-title class="text-subtitle-1 mb-1">{{ pdca.Title }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <div class="d-flex align-center justify-space-between">
                          <span class="text-medium-emphasis">{{ pdca.User?.Name }}</span>
                          <span class="text-caption text-medium-emphasis">
                            {{ pdca.Deadline ? formatDate(pdca.Deadline) : 'Geen deadline' }}
                          </span>
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>
              </div>
            </v-col>

            <!-- Create New Panel -->
            <v-col v-show="selectedMode !== 'link'" :cols="12" class="panel-container">
              <div class="panel-content panel-active">
                <div class="d-flex align-center mb-6">
                  <v-icon color="primary" size="24" class="mr-2">mdi-information-outline</v-icon>
                  <h3 class="text-h6 mb-0">Gegevens</h3>
                </div>

                <v-text-field v-model="Title" label="Type onderzoekstitel..." variant="outlined" density="comfortable" class="mb-4" />

                <v-select
                  v-model="actiehouder"
                  :items="actiehouders"
                  item-title="Name"
                  label="Selecteer actiehouder"
                  variant="outlined"
                  density="comfortable"
                  return-object
                  class="mb-4"
                />

                <div class="mb-4">
                  <label class="text-subtitle-1 font-weight-medium mb-2 d-block">Deadline:</label>
                  <Datepicker
                    v-model="Deadline"
                    :disabled-dates="disabledDates"
                    :openDate="validDate(Deadline) ? Deadline : new Date()"
                    :mondayFirst="true"
                    name="Deadline"
                    class="date-picker"
                  />
                </div>

                <v-select
                  v-model="teamleden"
                  v-if="selectedMode === 'create_pdca'"
                  :items="filteredTeamleden"
                  item-title="Name"
                  item-value="id"
                  label="Selecteer teamleden (optioneel)"
                  variant="outlined"
                  density="comfortable"
                  multiple
                  chips
                  :disabled="!actiehouder"
                  :hint="!actiehouder ? 'Selecteer eerst een actiehouder' : ''"
                  persistent-hint
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            v-if="selectedMode !== 'link'"
            @click="startPDCA"
            color="secondary"
            :loading="loadingPDCAButton"
            size="large"
            class="px-6"
            variant="elevated"
          >
            Voltooien
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Enhanced Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-secondary text-white pa-4 d-flex align-center">
          Bevestig PDCA-koppeling
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" density="comfortable" @click="cancelConfirmation"></v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="d-flex align-center mb-6">
            <div class="flex-grow-1">
              <div class="text-h3 mb-2">{{ pendingPDCA?.Title }}</div>
            </div>

            <!-- PDCA Circle -->
            <div class="ml-4">
              <PDCACircle :step="getPDCAStep(pendingPDCA)" :size="48" />
            </div>
          </div>

          <v-list density="compact" class="pa-0 mb-4 bg-grey-lighten-4 rounded-lg">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary" size="small">mdi-calendar</v-icon>
              </template>
              <v-list-item-title>
                {{ pendingPDCA?.Deadline ? formatDate(pendingPDCA.Deadline) : 'Geen deadline' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary" size="small">mdi-account-group</v-icon>
              </template>
              <v-list-item-title class="d-flex align-center flex-wrap gap-1">
                <!-- Always show the main user -->
                <v-chip size="x-small" color="primary" variant="flat">
                  {{ pendingPDCA?.User?.Name }}
                </v-chip>
                <!-- Show additional team members if present -->
                <v-chip v-for="teamlid in pendingPDCA?.Teamleden?.IDs || []" :key="teamlid" size="x-small" color="primary" variant="flat">
                  {{ getTeamlidName(teamlid) }}
                </v-chip>
              </v-list-item-title>
            </v-list-item>

            <v-list-item v-if="pendingPDCA?.Status">
              <template v-slot:prepend>
                <v-icon color="primary" size="small">mdi-flag</v-icon>
              </template>
              <v-list-item-title>
                <v-chip size="small" :color="pendingPDCA.Status.StatusColor">
                  {{ pendingPDCA.Status.StatusNaam }}
                </v-chip>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="cancelConfirmation">Annuleren</v-btn>
          <v-btn color="secondary" @click="confirmAndLink" :loading="loadingPDCAButton" variant="elevated"> Koppelen </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import Datepicker from 'vuejs3-datepicker';
import PDCACircle from '@/components/verbeterplein/shared/PDCACircle.vue';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { formatDate } from '@/utils/helpers/dateHelpers';

const { t } = useI18n();
const notification = useNotificationStore();
const rootCauseLevel = ref(2);

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  clickedItem: {
    type: Object,
    required: false
  },
  actiehouders: {
    type: Array,
    default: () => []
  }
});

interface Emits {
  (e: 'update:model-value', value: boolean): void;
  (e: 'update', value: [boolean, boolean]): void;
  (e: 'close'): void;
}

const emit = defineEmits<Emits>();

const preventiefStore = usePreventiefStore();
const meldingStore = useMeldingStore();
const actiehouderStore = useActiehouderStore();
const statusStore = useStatusStore();
const loadingPDCAButton = ref(false);
const loading = ref(false);

const status: any = computed(() => statusStore.statussen.find((status: any) => status.StatusNaam.toLowerCase() === 'open'));
const Deadline = ref<any>(null);
const actiehouder: any = ref(null);
const actiehouders = ref<any>([]);
const Title = ref('');
const disabledDates = ref({
  to: new Date(Date.now() - 86400000) // Yesterday
});

const teamleden = ref<any[]>([]);
const selectedMode = ref<'link' | 'create_pdca' | 'create_pd'>('link');
const searchQuery = ref('');
const existingPDCAs = ref<any[]>([]);
const selectedPDCA = ref<any>(null);
const showConfirmDialog = ref(false);
const pendingPDCA = ref<any>(null);

const validDate = (date: any) => {
  return date instanceof Date && !isNaN(date.getTime());
};

const filteredTeamleden = computed(() => {
  if (!actiehouder.value) return actiehouders.value;
  return actiehouders.value.filter((member: any) => member.id !== actiehouder.value.id);
});

const filteredPDCAs = computed(() => {
  if (!searchQuery.value) return existingPDCAs.value;
  const query = searchQuery.value.toLowerCase();
  return [...new Set(existingPDCAs.value)].filter(
    (pdca) =>
      pdca.rootCauseLevel === 0 &&
      pdca.Melding[0].Archived === false &&
      (pdca.Title?.toLowerCase().includes(query) || pdca.User?.Name?.toLowerCase().includes(query))
  );
});

const loadExistingPDCAs = async () => {
  loading.value = true;
  try {
    const response = await preventiefStore.getAllPreventief();
    if (response?.status === 200) {
      existingPDCAs.value = response.data;
    }
  } catch (error) {
    notification.error({
      message: t('errors.fetch_pdcas_failed')
    });
  } finally {
    loading.value = false;
  }
};

watch(actiehouder, (newValue) => {
  if (newValue && teamleden.value) {
    teamleden.value = teamleden.value.filter((member: any) => member.id !== newValue.id);
  }
});

watch(
  selectedMode,
  (newMode, oldMode) => {
    if (newMode === 'create_pdca') {
      rootCauseLevel.value = 2;
      selectedPDCA.value = null;
    } else if (newMode === 'create_pd') {
      rootCauseLevel.value = 1;
      selectedPDCA.value = null;
    } else if (newMode === 'link') {
      if (oldMode !== 'link') {
        loadExistingPDCAs();
      }
    }
  },
  { immediate: true }
);

const searchPDCAs = () => {};

const confirmLinkToPDCA = (pdca: any) => {
  pendingPDCA.value = pdca;
  showConfirmDialog.value = true;
};

const cancelConfirmation = () => {
  showConfirmDialog.value = false;
  pendingPDCA.value = null;
};

const confirmAndLink = async () => {
  if (!pendingPDCA.value) return;
  await linkToPDCA(pendingPDCA.value);
  showConfirmDialog.value = false;
  pendingPDCA.value = null;
};

const linkToPDCA = async (pdca: any) => {
  // Show an info notification before proceeding
  notification.info({
    message: t('notifications.linking_pdca', { title: pdca.Title })
  });

  selectedPDCA.value = pdca;
  notification.promise({
    message: t('notifications.linking_to_pdca')
  });
  loadingPDCAButton.value = true;

  try {
    // Update the report's PDCA status and link it to the selected PDCA
    await meldingStore.updateReport(props.clickedItem?.id, {
      PDCA: true,
      PreventiefID: pdca.id
    });

    // Force a complete refresh of all data
    await Promise.all([meldingStore.fetchReports(true), meldingStore.updateCurrentForm(true)]);

    // Update store data with fresh copies to trigger reactivity
    meldingStore.$patch({ reports: [...meldingStore.reports] });

    // Close dialog and show success message
    emit('close');
    notification.resolvePromise({
      message: t('notifications.link_pdca_success')
    });

    // Force a UI update
    emit('update', [true, true]);
  } catch (error) {
    notification.rejectPromise({
      message: t('notifications.link_pdca_failed', { error })
    });
  } finally {
    loadingPDCAButton.value = false;
  }
};

const startPDCA = async () => {
  notification.promise({
    message: t('notifications.create_pdca')
  });
  loadingPDCAButton.value = true;
  if (!Deadline.value || !actiehouder.value || !Title.value) {
    notification.rejectPromise({
      message: t('errors.required_parameters')
    });
    loadingPDCAButton.value = false;
    return;
  }

  try {
    const testroot = rootCauseLevel.value;
    console.log('testroot');
    console.log(testroot);
    const prevInputData = {
      Title: Title.value,
      Deadline: Deadline.value,
      ActiehouderID: actiehouder.value.id,
      MeldingID: props?.clickedItem?.id,
      RootCauseLevel: rootCauseLevel.value,
      ...(status.value && { StatusID: status.value?.id }),
      ...(teamleden.value.length > 0 && selectedMode.value === 'create_pdca' && { Teamleden: { IDs: teamleden.value } })
    };
    console.log('prevInputData');
    console.log(prevInputData);
    const newPreventief = await preventiefStore.createPreventief(prevInputData);
    console.log('newPreventief');
    console.log(newPreventief);
    if (newPreventief?.status === 201) {
      // Update the report's PDCA status
      await meldingStore.updateReport(props?.clickedItem?.id, { PDCA: true });

      // Force a complete refresh of all data
      await Promise.all([meldingStore.fetchReports(true), meldingStore.updateCurrentForm(true)]);

      // Update store data with fresh copies to trigger reactivity
      meldingStore.$patch({ reports: [...meldingStore.reports] });

      // Reset the form values
      Title.value = '';
      Deadline.value = null;
      actiehouder.value = null;
      teamleden.value = [];

      // Close dialog and show success message
      emit('close');
      notification.resolvePromise({
        message: t('notifications.create_pdca_success')
      });

      // Force a UI update with both parameters true
      emit('update', [true, true]);
    } else {
      throw new Error(t('errors.wrong_status'));
    }
  } catch (error) {
    notification.rejectPromise({
      message: t('notifications.create_pdca_failed', { error: error })
    });
  } finally {
    loadingPDCAButton.value = false;
  }
};

const getPDCAStep = (pdca: any) => {
  if (!pdca?.Steps) return 1;
  const steps = pdca.Steps;

  if (steps.Finished?.Finished) return 5;
  if (steps.Act?.Finished) return 5;
  if (steps.Check?.Finished) return 4;
  if (steps.Do?.Finished) return 3;
  if (steps.Plan?.Finished) return 2;
  if (steps.Obstakel?.Finished) return 1;
  return 1;
};

const getTeamlidName = (teamlidId: string | number): string => {
  const teamlid = actiehouders.value.find((member: any) => member.id === teamlidId);
  return teamlid?.Name || 'N/A';
};

onMounted(async () => {
  Title.value = '';
  Deadline.value = null;
  actiehouder.value = null;
  teamleden.value = [];

  await actiehouderStore.fetchActiehouders();
  await statusStore.fetchStatussen();
  actiehouders.value = actiehouderStore.actiehouders;
  if (props.clickedItem?.Actiehouder?.Name) {
    actiehouder.value = props.clickedItem.Actiehouder;
  }

  // Load existing PDCAs if starting in link mode (which is the default)
  if (selectedMode.value === 'link') {
    loadExistingPDCAs();
  }
});
</script>

<style lang="scss" scoped>
.dialog-content {
  height: 100%;
  min-height: 700px;
  display: flex;
  flex-direction: column;
}

.mode-toggle-container {
  display: flex;
  justify-content: center;
}

.mode-toggle {
  .v-btn {
    min-width: 200px;
  }
}

.content-row {
  flex: 1;
  min-height: 0;
  position: relative;
}

.panel-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(30px);
  pointer-events: none;

  &:not([style*='display: none']) {
    opacity: 1;
    transform: translateX(0);
    pointer-events: all;
  }
}

.panel-content {
  position: relative;
  z-index: 0;
  height: 100%;
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);

  &.panel-active {
    border: 2px solid rgba(var(--v-theme-primary), 0.1);
  }
}

.existing-pdcas-container {
  max-height: 350px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.date-picker {
  width: 100%;
}

.selected-pdca {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.v-list {
  position: relative;
  z-index: 1;
}

.v-list-item {
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  z-index: 1;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.05);
    border-color: rgba(var(--v-theme-secondary), 0.1);
    transform: translateX(4px);
  }

  &.selected-pdca {
    background: rgba(var(--v-theme-primary), 0.1) !important;
    border: 1px solid rgba(var(--v-theme-primary), 0.2);
  }
}

// Custom scrollbar styling
.existing-pdcas-container {
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(var(--v-theme-surface), 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.3);
    }
  }
}
</style>
