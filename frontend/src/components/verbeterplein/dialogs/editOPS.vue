<template>
  <v-dialog v-model="dialogVisible" :max-width="800" :retain-focus="false">
    <v-card>
      <v-card-title class="bg-secondary text-white pa-4">
        {{ t('verbeterplein.edit_ops.title') }}
      </v-card-title>
      <v-card-text class="pa-4">
        <div class="d-flex flex-column gap-4">
          <!-- Project -->
          <div class="d-flex flex-column mt-4">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-folder-outline</v-icon>
              <v-combobox
                clearable
                v-model="project"
                :items="projects"
                :label="t('verbeterplein.edit_ops.labels.project')"
                type="number"
                item-title="NumberID"
                return-object
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-combobox>
            </div>
          </div>

          <!-- Deelorder -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-file-document-outline</v-icon>
              <v-combobox
                v-model="deelorder"
                :items="deelorders"
                :label="t('verbeterplein.edit_ops.labels.part_order')"
                type="number"
                item-title="NumberID"
                return-object
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-combobox>
            </div>
          </div>

          <!-- Project Team -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-account-group-outline</v-icon>
              <v-select
                v-model="projectleider"
                :items="projectleiders"
                :label="t('verbeterplein.edit_ops.labels.project_team')"
                type="text"
                item-title="Name"
                return-object
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-select>
            </div>
          </div>

          <!-- Obstacle -->
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-alert-circle-outline</v-icon>
              <v-textarea
                v-model="obstakel"
                :label="t('verbeterplein.edit_ops.labels.obstacle')"
                auto-grow
                rows="3"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              ></v-textarea>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="closeDialog" :disabled="OpsButton">Annuleren</v-btn>
        <v-btn
          color="secondary"
          variant="flat"
          @click="saveOPS"
          :loading="OpsButton"
        >
          Opslaan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useProjectleiderStore } from '@/stores/verbeterplein/projectleider_store';

const { t } = useI18n();

const meldingStore = useMeldingStore();
const actiehouderStore = useActiehouderStore();
const statusStore = useStatusStore();
const projectStore = useProjectStore();
const projectleiderStore = useProjectleiderStore();

const actiehouders = ref<any>([]);
const statussen = ref<any>([]);
const projects = ref<any>([]);
const deelorders = ref<any>([]);
const projectleiders = ref<any>([]);

const project = ref<any>(null);
const deelorder = ref<any>(null);
const projectleider = ref<any>(null);
const obstakel = ref<any>(null);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const onOpen = async () => {
  await meldingStore.fetchReports();
  await projectStore.fetchProjects();
  await projectleiderStore.fetchProjectleiders();
  await actiehouderStore.fetchActiehouders();
  await statusStore.fetchStatussen();

  const id = meldingStore.selectedFormId;
  const melding = meldingStore.getReportById(id);

  obstakel.value = melding?.Obstakel || '';
  project.value = melding?.Project;
  projectStore.currentProject = project.value;
  deelorder.value = melding?.Deelorder;
  projectleider.value = projectStore.currentProject?.ProjectLeider;

  actiehouders.value = actiehouderStore.actiehouders;
  statussen.value = statusStore.statussen;
  projects.value = projectStore.projects;
  deelorders.value = projectStore.currentProject?.Deelorders || [];
  projectleiders.value = projectleiderStore.projectleiders;

  setTimeout(() => {
    deelorder.value = melding?.Deelorder;
  }, 100);
};

const emit = defineEmits(['save']);

watch(
  () => props.modelValue,
  async (newVal: boolean) => {
    await onOpen();
    dialogVisible.value = newVal;
  }
);

watch(project, () => {
  projectStore.currentProject = project.value;
  deelorders.value = projectStore.currentProject?.Deelorders || [];
  deelorder.value = null;
  
  // Update projectleider when project changes
  if (project.value?.ProjectLeider && project.value.ProjectLeider !== projectleider.value) {
    projectleider.value = project.value.ProjectLeider;
  }
});

const dialogVisible = ref(props.modelValue);
const OpsButton = ref(false);
const closeDialog = () => {
  dialogVisible.value = false;
};

const saveOPS = async () => {
  OpsButton.value = true;
  try {
    emit('save', {
      project: project.value ? {
        id: project.value.NumberID || project.value.id,
        ...project.value
      } : null,
      deelorder: deelorder.value,
      projectleider: projectleider.value ? {
        id: projectleider.value.id,
        ...projectleider.value
      } : null,
      obstakel: obstakel.value?.trim() || ''
    });
  } finally {
    OpsButton.value = false;
  }
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
  overflow: visible !important;
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
