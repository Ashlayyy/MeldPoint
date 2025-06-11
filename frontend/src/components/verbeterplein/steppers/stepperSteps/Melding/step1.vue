<template>
  <div class="step-form">
    <v-card variant="outlined" class="card-hover-border">
      <v-card-text>
        <div class="d-flex align-start mb-6">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-alert-circle-outline</v-icon>
            <h3>OBSTAKEL TOEVOEGEN</h3>
          </div>
        </div>

        <p class="text-subtitle-1 mb-6">Geef een korte omschrijving van de obstakel.</p>

        <v-textarea
          :error-messages="error === 1 ? 'Omschrijving is verplicht' : ''"
          rounded="none"
          label="Omschrijving"
          v-model="obstakel"
          counter="1000"
          variant="outlined"
          :clearable="true"
          persistent-counter
          persistent-hint
          hide-details="auto"
          rows="5"
          class="elevation-0"
        ></v-textarea>
      </v-card-text>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
@import '../shared/stepStyles.scss';

.card-hover-border {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  &:hover {
    border-color: rgb(var(--v-theme-primary));
  }
}
</style>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';

const createMeldingStore = useCreateMeldingStore();

const props = defineProps<{
  errors: any;
}>();

const emit = defineEmits(['step-complete']);

const obstakel = ref('');
const error = ref<any>(null);

onMounted(() => {
  obstakel.value = createMeldingStore.obstakel;
});

watch(
  () => obstakel.value,
  (newVal: string) => {
    if (newVal?.length > 10) {
      setTimeout(() => {
        error.value = null;
        emit('step-complete', 1, true);
        createMeldingStore.obstakel = newVal;
      }, 300);
    } else {
      emit('step-complete', 1, false);
      createMeldingStore.obstakel = newVal;
    }
  }
);

watch(
  () => props.errors,
  (newVal: any) => {
    error.value = newVal;
  }
);
</script>
