<template>
  <div class="filters">
    <v-row dense>
      <!-- Management Group -->
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" color="primary" class="mr-1">mdi-format-list-bulleted</v-icon>
            <span class="text-caption font-weight-medium">Melding Details</span>
          </div>
          <v-text-field
            v-model="selectedVolgNummer"
            label="Volgnummer"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            @update:model-value="filterItems"
          ></v-text-field>
          <v-select
            v-model="selectedAkoord"
            :items="[
              { text: 'Ja', value: true },
              { text: 'Nee', value: false }
            ]"
            label="Akkoord"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            item-title="text"
            return-object
            clearable
            @update:model-value="filterItems"
          ></v-select>
          <v-text-field
            v-model="selectedTitle"
            label="PDCA Titel"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            @update:model-value="filterItems"
          ></v-text-field>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" color="primary" class="mr-1">mdi-folder-outline</v-icon>
            <span class="text-caption font-weight-medium">Project Details</span>
          </div>
          <v-combobox
            v-model="selectedProject"
            :items="projects"
            label="Project"
            item-title="NumberID"
            return-object
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            @change="filterItems"
          ></v-combobox>
          <v-text-field
            v-model="selectedProjectNaam"
            label="Project Naam"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            @update:model-value="filterItems"
          ></v-text-field>
          <v-text-field
            v-model="selectedDeelorder"
            label="Deelorder"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            @update:model-value="filterItems"
          ></v-text-field>
          <v-select
            v-model="selectedProjectleider"
            :items="projectleiders"
            label="ProjectTeam"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            item-title="Name"
            return-object
            @change="filterItems"
          ></v-select>
        </v-card>
      </v-col>

      <!-- Actiehouders Group -->
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" color="primary" class="mr-1">mdi-account-outline</v-icon>
            <span class="text-caption font-weight-medium">Actiehouders</span>
          </div>
          <v-select
            v-model="selectedDepartment"
            :items="departments"
            label="Afdeling"
            item-title="name"
            return-object
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            @update:model-value="filterItems"
          ></v-select>
          <v-select
            v-model="selectedActiehouderCorrectief"
            :items="actiehouders"
            label="Correctief"
            variant="outlined"
            hide-details
            class="mb-2"
            clearable
            item-title="Name"
            return-object
            @change="filterItems"
          ></v-select>
          <v-select
            v-model="selectedActiehouderPreventief"
            :items="actiehouders"
            label="Preventief"
            variant="outlined"
            hide-details
            clearable
            item-title="Name"
            return-object
            class="mb-2"
            @change="filterItems"
          ></v-select>
        </v-card>
      </v-col>

      <!-- Status Group -->
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
          <div class="d-flex align-center mb-2">
            <v-icon size="small" color="primary" class="mr-1">mdi-flag-outline</v-icon>
            <span class="text-caption font-weight-medium">Status</span>
          </div>
          <v-select
            v-model="selectedStatusCorrectief"
            :items="correctiefStatussen"
            label="Correctief"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            item-title="StatusNaam"
            clearable
            return-object
            @change="filterItems"
          ></v-select>
          <v-select
            v-model="selectedStatusPreventief"
            :items="statussen"
            label="Preventief"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="mb-2"
            item-title="StatusNaam"
            return-object
            @change="filterItems"
          ></v-select>
          <v-select
            v-model="selectedPDCA_status"
            :items="PDCA_status"
            label="PDCA Status"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="mb-2"
            item-title="StatusNaam"
            return-object
            @change="filterItems"
          ></v-select>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useProjectleiderStore } from '@/stores/verbeterplein/projectleider_store';
import { useFilterStore } from '@/stores/verbeterplein/filter_store';
import { useDepartmentStore } from '@/stores/verbeterplein/department_store';
const projectStore = useProjectStore();
const actiehouderStore = useActiehouderStore();
const statusStore = useStatusStore();
const projectleiderStore = useProjectleiderStore();
const filterStore = useFilterStore();
const departmentStore = useDepartmentStore();

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const PDCA_status = ref(['O', 'P', 'D', 'C', 'A']);

const filterMode = computed({
  get: () => ({
    title: filterStore.filters.filterMode === 'AND' ? 'Alle' : 'Enkele',
    value: filterStore.filters.filterMode || 'OR',
    subtitle: filterStore.filters.filterMode === 'AND' ? 'Alle filters moeten overeenkomen' : 'Één of meer filters moeten overeenkomen'
  }),
  set: (value) => filterStore.setFilters({ ...filterStore.filters, filterMode: value.value })
});

onMounted(async () => {
  await projectleiderStore.initializeData();
  await actiehouderStore.initializeData();
  await statusStore.initializeData();
  await projectStore.fetchProjects();
  await departmentStore.fetchDepartments();
});

const emit = defineEmits(['filter']);

defineProps({
  page: {
    type: String,
    required: true
  }
});

const selectedProject = computed({
  get: () => filterStore.filters.project,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, project: value })
});
const selectedDeelorder = computed({
  get: () => filterStore.filters.deelorder,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, deelorder: value })
});
const selectedAkoord = computed({
  get: () => filterStore.filters.akoord,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, akoord: value })
});
const selectedActiehouderCorrectief = computed({
  get: () => filterStore.filters.actiehouderCorrectief,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, actiehouderCorrectief: value })
});
const selectedActiehouderPreventief = computed({
  get: () => filterStore.filters.actiehouderPreventief,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, actiehouderPreventief: value })
});
const selectedProjectleider = computed({
  get: () => filterStore.filters.projectleider,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, projectleider: value })
});
const selectedDepartment = computed({
  get: () => filterStore.filters.department,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, department: value })
});
const selectedStatusCorrectief = computed({
  get: () => filterStore.filters.statusCorrectief,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, statusCorrectief: value })
});
const selectedStatusPreventief = computed({
  get: () => filterStore.filters.statusPreventief,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, statusPreventief: value })
});
const selectedProjectNaam = computed({
  get: () => filterStore.filters.projectNaam,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, projectNaam: value })
});
const selectedVolgNummer = computed({
  get: () => filterStore.filters.volgNummer,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, volgNummer: value })
});
const selectedTitle = computed({
  get: () => filterStore.filters.title,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, title: value })
});
const selectedPDCA_status = computed({
  get: () => filterStore.filters.PDCA_status,
  set: (value) => filterStore.setFilters({ ...filterStore.filters, PDCA_status: value })
});

const projects = computed(() => projectStore.projects);
const actiehouders = computed(() => actiehouderStore.actiehouders);
const projectleiders = computed(() => projectleiderStore.projectleiders);
const statussen = computed(() => statusStore.statussen);
const correctiefStatussen = computed(() => statusStore.statusListCorrectief);
const departments = computed(() => departmentStore.departments);

const filterItems = () => {
  const filters = {
    project: selectedProject.value,
    projectNaam: selectedProjectNaam.value,
    volgNummer: selectedVolgNummer.value,
    deelorder: selectedDeelorder.value,
    actiehouderCorrectief: selectedActiehouderCorrectief.value,
    actiehouderPreventief: selectedActiehouderPreventief.value,
    projectleider: selectedProjectleider.value,
    statusCorrectief: selectedStatusCorrectief.value,
    statusPreventief: selectedStatusPreventief.value,
    akoord: selectedAkoord.value,
    title: selectedTitle.value,
    PDCA_status: selectedPDCA_status.value,
    department: selectedDepartment.value,
    filterMode: filterMode.value.value
  };

  emit('filter', filters);
};

watch(
  [
    selectedProject,
    selectedProjectNaam,
    selectedVolgNummer,
    selectedDeelorder,
    selectedActiehouderCorrectief,
    selectedActiehouderPreventief,
    selectedProjectleider,
    selectedStatusCorrectief,
    selectedStatusPreventief,
    selectedAkoord,
    selectedTitle,
    selectedPDCA_status,
    selectedDepartment
  ],
  filterItems
);
</script>

<style scoped lang="scss">
.filters {
  .filter-group {
    border-radius: 4px;

    :deep(.v-field) {
      border-radius: 4px !important;
    }

    :deep(.v-field__input) {
      min-height: 32px !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }

    :deep(.v-field__append-inner) {
      padding-top: 6px !important;
    }

    :deep(.v-label) {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    // Dark mode improvements
    &[theme='dark'] {
      background-color: rgba(var(--v-theme-surface-variant), 0.85) !important;
      border-color: rgba(var(--v-theme-outline-variant), 0.25) !important;

      :deep(.v-field) {
        background-color: rgba(var(--v-theme-surface), 0.7) !important;
        border-color: rgba(var(--v-theme-outline-variant), 0.25) !important;
      }

      :deep(.v-label) {
        opacity: 0.85; // Improved label visibility in dark mode
      }

      :deep(.v-field--focused) {
        background-color: rgba(var(--v-theme-surface), 0.9) !important;
      }
    }
  }

  .filter-mode {
    border-radius: 4px;

    .filter-mode-select {
      max-width: 120px;

      :deep(.v-field) {
        border-radius: 4px !important;
      }

      :deep(.v-field__input) {
        min-height: 32px !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      :deep(.v-field__append-inner) {
        padding-top: 6px !important;
      }
    }
  }
}
</style>
