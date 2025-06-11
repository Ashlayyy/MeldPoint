<template>
  <v-card variant="outlined" class="card-hover-border bg-gray100">
    <v-card-text>
      <div class="d-flex align-start mb-6">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-office-building</v-icon>
          <h3>PROJECTGEGEVENS</h3>
        </div>
      </div>

      <p class="text-subtitle-1 mb-6">
        Selecteer het project waar het obstakel zich in bevindt. Als er geen projectleider is toegewezen, kun je er een selecteren.
      </p>

      <v-divider class="mt-4 mb-6" thickness="2"></v-divider>

      <v-row>
        <v-col cols="12">
          <div class="form-fields-container">
            <div class="field-group">
              <div class="text-h5">Project</div>
              <v-combobox
                v-model="project"
                :items="projects"
                item-title="NumberID"
                return-object
                variant="outlined"
                density="comfortable"
                type="number"
                class="input-field"
                placeholder="Selecteer project..."
                :error-messages="error === 2 ? 'Project nummer is verplicht' : ''"
                @update:search="handleProjectSearch"
                @update:model-value="handleProjectChange"
              ></v-combobox>
            </div>

            <div class="field-group" v-if="shouldShowProjectleider">
              <div class="text-h5">Projectteam</div>
              <v-select
                v-model="projectleider"
                :items="projectleiders"
                item-title="Name"
                return-object
                variant="outlined"
                density="comfortable"
                class="input-field"
                placeholder="Selecteer projectteam..."
                :error-messages="error === 4 ? 'Projectteam is verplicht' : ''"
              ></v-select>
            </div>
          </div>
        </v-col>

        <v-col cols="12">
          <div class="field-group">
            <div class="text-h5">Deelorder</div>
            <v-combobox
              v-model="deelorder"
              :items="deelorders"
              item-title="NumberID"
              type="number"
              return-object
              variant="outlined"
              density="comfortable"
              class="input-field"
              placeholder="Selecteer deelorder..."
              :error-messages="error === 3 ? 'Deelorder is verplicht' : ''"
              @update:search="handleDeelorderInput"
            ></v-combobox>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';
import { useProjectleiderStore } from '@/stores/verbeterplein/projectleider_store';

const createMeldingStore = useCreateMeldingStore();
const projectStore = useProjectStore();
const projectleiderStore = useProjectleiderStore();
const projects = ref<any>([]);
const deelorders = ref<any>([]);
const projectleiders = ref<any>([]);
const project = ref<any>(null);
const deelorder = ref<any>(null);
const projectleider = ref<any>(null);
const error = ref<any>(null);

const props = defineProps<{
  errors: any;
}>();

const emit = defineEmits(['step-complete']);

onMounted(async () => {
  await projectStore.fetchProjects();
  await projectleiderStore.fetchProjectleiders();
  projects.value = projectStore.projects;
  projectleiders.value = projectleiderStore.projectleiders;
});

const shouldShowProjectleider = computed(() => {
  // Only show if we have a project number
  if (project.value?.NumberID === undefined || project.value?.NumberID === null) return false;

  // Find if this is an existing project
  const foundProject = projectStore.projects.find((p: { NumberID: number; ProjectLeider: any }) => p.NumberID === project.value.NumberID);

  // Show for:
  // 1. New projects (not found in existing projects)
  // 2. Existing projects without a projectleider
  return !foundProject || (foundProject && !foundProject.ProjectLeider);
});

const handleProjectChange = (newVal: any) => {
  if (!newVal) return;

  // Find exact match by project number
  const foundProject = projectStore.projects.find((p: any) => p?.NumberID === newVal.NumberID);

  projectStore.currentProject = foundProject || newVal;

  // Clear related fields and set new values
  deelorders.value = foundProject ? foundProject.Deelorders || [] : [];
  projectleider.value = foundProject ? foundProject.ProjectLeider : null;

  updateCreateMeldingStore();
};

const handleProjectSearch = (searchText: string) => {
  if (!searchText) return;

  // Look for exact match by project number
  const matchingProject = projectStore.projects.find((p: any) => p.NumberID?.toString() === searchText);

  if (matchingProject) {
    project.value = matchingProject;
  } else {
    // Create new project with just the number
    project.value = {
      NumberID: parseInt(searchText),
      ProjectNaam: `Project-${searchText}`,
      Deelorders: [],
      ProjectLeider: null
    };
  }

  handleProjectChange(project.value);
};

const handleDeelorderInput = (newDeelorder: string) => {
  if (!newDeelorder) return;
  deelorder.value = newDeelorder;
  updateCreateMeldingStore();
};

const updateCreateMeldingStore = () => {  
  createMeldingStore.project = {
    projectnummer: project.value?.NumberID,
    projectnaam: project.value?.ProjectNaam || `Project-${project.value?.NumberID}`,
    deelorder: typeof deelorder.value === 'string' ? deelorder.value : deelorder.value?.toString(),
    ProjectLeider: projectStore.currentProject?.ProjectLeider || projectleider.value
  };
  createMeldingStore.projectleider = projectStore.currentProject?.ProjectLeider || projectleider.value;
  createMeldingStore.rawproject = project.value;

  // Check if we have both a project number and either a deelorder value or a selected deelorder object
  const hasValidProject = project.value?.NumberID !== undefined && project.value?.NumberID !== null;
  const hasValidDeelorder = deelorder.value !== null && deelorder.value !== undefined && deelorder.value !== '';

  // Only require projectleider if the field is shown
  let projectLeiderValid = true;
  if (shouldShowProjectleider.value) {
    projectLeiderValid = Boolean(projectStore.currentProject?.ProjectLeider || projectleider.value);
  }

  const isComplete = hasValidProject && hasValidDeelorder && projectLeiderValid;


  emit('step-complete', 2, isComplete);
};

watch([project, deelorder, projectleider], () => {
  updateCreateMeldingStore();
});

watch(
  () => props.errors,
  (newVal: any) => {
    error.value = newVal;
  }
);
</script>

<style lang="scss" scoped>
.card-hover-border {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  &:hover {
    border-color: rgb(var(--v-theme-primary));
  }
}

.bg-gray100 {
  background-color: rgb(var(--v-theme-surface));
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

.form-fields-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;

  .field-group {
    flex: 1;
    min-width: 200px;

    @media (max-width: 1000px) {
      flex: 0 0 100%;
    }
  }
}
</style>
