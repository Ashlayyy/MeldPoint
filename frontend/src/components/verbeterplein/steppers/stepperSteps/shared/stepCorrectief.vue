<template>
  <v-card variant="outlined" class="card-hover-border bg-lightprimary">
    <v-card-text>
      <div class="d-flex align-start mb-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-flash</v-icon>
          <h3>REPARATIELOOP</h3>
        </div>
      </div>

      <div class="text-body-2 text-medium-emphasis mb-4">
        Beschrijf hier de directe acties die ondernomen moeten worden om het obstakel op te lossen. Dit is de correctieve oplossing die
        ervoor zorgt dat het project door kan gaan.
      </div>

      <v-divider class="mb-4" thickness="2"></v-divider>

      <v-row>
        <v-col cols="12">
          <div class="form-fields-container">
            <div class="field-group">
              <div class="text-h5">Actiehouder</div>
              <v-select
                v-model="user"
                :items="users"
                item-title="Name"
                return-object
                variant="outlined"
                density="comfortable"
                class="input-field"
                placeholder="Selecteer wie verantwoordelijk is voor de reparatie"
                :error-messages="error === 5 ? 'Actiehouder is verplicht' : ''"
              ></v-select>

              <div class="text-h5 mt-4">Deadline</div>
              <div class="date-picker-wrapper">
                <Datepicker
                  class="date-picker-field"
                  :disabled-dates="disabled"
                  v-model="deadline"
                  format="dd-MM-yyyy"
                  :error="error === 6"
                  placeholder="                        "
                ></Datepicker>
              </div>
              <small class="error--text" v-if="error === 6">Deadline is verplicht!</small>
            </div>
          </div>
        </v-col>

        <v-col cols="12">
          <div class="form-fields-container">
            <div class="field-group">
              <div class="text-h5">Status</div>
              <v-select
                v-model="status"
                :items="statuses"
                item-title="StatusNaam"
                return-object
                variant="outlined"
                density="comfortable"
                class="input-field"
                placeholder="Geef de huidige status van de reparatie aan"
                :error-messages="error === 8 ? 'Status is verplicht' : ''"
              ></v-select>

              <div class="text-h5 mt-4">Faalkosten</div>
              <v-text-field
                v-model="faalkosten"
                prefix="€"
                type="number"
                variant="outlined"
                density="comfortable"
                class="input-field"
                :max="1000000"
                :min="0"
                placeholder="Geschatte kosten"
                @update:model-value="validateFaalkosten"
              ></v-text-field>
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row class="gap-8">
        <div class="text-h5">Oplossing</div>
        <v-textarea
          v-model="oplossing"
          variant="outlined"
          rows="4"
          auto-grow
          class="input-field"
          placeholder="Beschrijf de voorgestelde oplossing in detail"
          :error-messages="error === 7 ? 'Oplossing is verplicht' : ''"
        ></v-textarea>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.card-hover-border {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  &:hover {
    border-color: rgb(var(--v-theme-primary));
  }
}

.bg-lightprimary {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.text-h5 {
  font-size: 0.875rem !important;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.87);
  margin-bottom: 0.5rem;
}

h3 {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.date-picker-wrapper {
  width: 100%;
  max-width: 200px;

  @media (max-width: 600px) {
    max-width: 100%;
  }
}

.input-hint {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  margin-left: 16px;
}

.error--text {
  color: rgb(var(--v-theme-error));
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.input-field {
  :deep(.v-field) {
    border-radius: 10px !important;
    background-color: rgb(var(--v-theme-background)) !important;

    &.v-field--focused {
      border-color: rgb(var(--v-theme-primary));
    }
  }
}

.gap-8 {
  gap: 2rem;
}

.v-col {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.text-subtitle-1 {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
}

ul {
  margin: 0;
  li {
    margin-bottom: 0.25rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.form-fields-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;

  .field-group {
    flex: 1;
    min-width: 200px;

    @media (max-width: 600px) {
      flex: 0 0 100%;
    }
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Datepicker from 'vuejs3-datepicker';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { disabledDates } from '@/utils/helpers/disabled';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';

const createMeldingStore = useCreateMeldingStore();

const userStore = useActiehouderStore();
const actiehouderStore = useStatusStore();

const users = ref<any>([]);
const statuses = ref<any>([]);

const user = ref<any>('');
const deadline = ref<any>('');
const oplossing = ref<any>('');
const status = ref<any>('');
const faalkosten = ref<any>('');
const error = ref<any>(null);
const disabled = disabledDates();

const props = defineProps<{
  errors: any;
}>();

// Add emit
const emit = defineEmits(['step-complete']);

onMounted(async () => {
  await userStore.fetchActiehouders();
  await actiehouderStore.fetchStatussen('reparatieloop');

  users.value = userStore.actiehouders;
  statuses.value = actiehouderStore.statussen;
  status.value = statuses.value.find((status: any) => status.StatusNaam.toLowerCase() === 'open');
});

watch([user, deadline, oplossing, status, faalkosten], () => {
  createMeldingStore.correctief.user = user.value;
  createMeldingStore.correctief.deadline = deadline.value;
  createMeldingStore.correctief.oplossing = oplossing.value;
  createMeldingStore.correctief.status = status.value;
  createMeldingStore.correctief.faalkosten = faalkosten.value;

  if (user.value && deadline.value && oplossing.value && status.value) {
    emit('step-complete', 4, true);
  } else {
    emit('step-complete', 4, false);
  }
});

watch(
  () => props.errors,
  (newVal: any) => {
    error.value = newVal;
  }
);

watch(
  () => user.value,
  (newVal: any) => {
    if (newVal?.length > 0 && error.value === 1) {
      error.value = null;
    }
  }
);

watch(
  () => deadline.value,
  (newVal: any) => {
    if (newVal?.length > 0 && error.value === 2) {
      error.value = null;
    }
  }
);

watch(
  () => oplossing.value,
  (newVal: any) => {
    if (newVal?.length > 0 && error.value === 4) {
      error.value = null;
    }
  }
);

watch(
  () => status.value,
  (newVal: any) => {
    if (newVal?.length > 0 && error.value === 5) {
      error.value = null;
    }
  }
);

const validateFaalkosten = (value: string) => {
  const numValue = Number(value);
  if (numValue < 0) faalkosten.value = '0';
  if (numValue > 1000000) faalkosten.value = '1000000';
  if (isNaN(numValue) || /[a-zA-Z]/.test(value)) {
    faalkosten.value = '0';
  }
};
</script>
