<template>
  <div class="page">
    <v-expansion-panels v-model="filterStore.expandedPanel" class="filter-panels">
      <v-expansion-panel :theme="isDark ? 'dark' : 'light'">
        <v-expansion-panel-title class="py-2">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-filter-variant</v-icon>
              <span class="text-caption text-medium-emphasis mr-2">Match</span>
              <v-btn-toggle
                v-model="filterStore.filters.filterMode"
                mandatory
                density="comfortable"
                color="primary"
                class="filter-mode-toggle mr-2"
                @click.stop
              >
                <v-btn :value="'OR'" size="x-small" :color="filterStore.filters.filterMode === 'OR' ? 'secondary' : undefined">
                  Enkele
                </v-btn>
                <v-btn :value="'AND'" size="x-small" :color="filterStore.filters.filterMode === 'AND' ? 'primary' : undefined">
                  Alle
                </v-btn>
              </v-btn-toggle>

              <span class="text-subtitle-2">{{ $t('verbeterplein.filters.title') }} </span>
            </div>
            <div class="d-flex align-center">
              <v-chip
                v-if="filterStore.voorMijFilterActive"
                color="secondary"
                size="x-small"
                class="mr-2"
                variant="flat"
                @click.stop="filterStore.applyFilterLogin(actiehouder, projectleider)"
                :disabled="!filterStore.voorMijFilterActive && inDev"
              >
                Voor mij
              </v-chip>
              <v-chip v-if="activeFilterCount > 0" color="primary" size="x-small" class="mr-4" variant="flat">
                {{ $t('verbeterplein.filters.active_count', { count: activeFilterCount }) }}
              </v-chip>
              <v-btn
                v-if="activeFilterCount > 0"
                color="error"
                variant="text"
                density="compact"
                size="small"
                @click.stop="handleClearFilters"
              >
                <v-icon size="small" class="mr-1">mdi-close</v-icon>
                {{ $t('verbeterplein.filters.clear') }}
              </v-btn>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="filters-container">
            <Filters @filter="applyFilters" :page="props.mode" />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div class="mt-8 something" :style="tableContainerStyle">
      <VerbeterItemTable
        :items="filteredTableItems"
        :handleArchive="openArchivingDialog"
        :RowClicked="rowClicked"
        :getPDCAStep="getPDCAStep"
        :mode="props.mode as HeaderMode"
        :showArchiving="showArchiving"
        @update:selected="selectedItems = $event"
        :page-size="dynamicPageSize"
      />
    </div>

    <ShowItem
      v-if="!openingArchivingDialog"
      v-model="showItemDialog"
      :item="meldingStore.selectedForm"
      :show-correspondence="true"
      :show-pdca="true"
      :show-correctief-correspondence="true"
      :editingButton="true"
      :initialTab="activeTab"
      :openedFromMode="props.mode"
      @update="handleUpdate"
      @open:correctiefEdit="openAddCorrectiefDialog"
      @open:correspondence="openAddCorrespondenceDialog"
      @open:correspondence:pdca="openPDCACorrespondenceDialog"
      @open:pdca="openAddPDCADialog"
      @open:openEditObstakel="openEditObstakel"
      @open:editPdca="openEditDialogFunction"
      @open:imageGallery="openImageGalleryDialogFunction"
      @open:item="openItem"
    />

    <EditPDCA
      v-if="!openingArchivingDialog"
      v-model="openEditPDCADialog"
      :clicked-item="meldingStore.selectedForm"
      :actiehouders="actiehouders"
      :statussen="statussen"
      @update="handleUpdate"
      @close="handleClosing"
    />

    <ShowImage
      v-if="!openingArchivingDialog"
      v-model="openImageGalleryDialog"
      :clicked-item="meldingStore.selectedForm"
      :initialIndex="currentImageIndex"
      :images="imageFiles"
    />

    <AddCorrectief
      v-if="!openingArchivingDialog"
      v-model="addCorrectiefDialog"
      :item="meldingStore.selectedForm"
      @update="
        addCorrectiefDialog = false;
        handleUpdate([true, true]);
      "
    />

    <AddCorrespondence
      v-if="!openingArchivingDialog"
      v-model="addCorrespondenceDialog"
      :item="meldingStore.selectedForm"
      :isPDCA="false"
      @update="handleUpdate"
      @close="addCorrespondenceDialog = false"
    />

    <AddCorrespondence
      v-if="!openingArchivingDialog"
      v-model="addPDCACorrespondenceDialog"
      :item="meldingStore.selectedForm"
      :isPDCA="true"
      @update="handleUpdate"
      @close="addPDCACorrespondenceDialog = false"
    />

    <AddPDCA
      v-if="!openingArchivingDialog"
      :model-value="addPDCADialog"
      @update:model-value="addPDCADialog = $event"
      :clicked-item="meldingStore.selectedForm"
      @update="handleUpdate"
      @close="addPDCADialog = false"
      @openClone="openClonePDCADialog"
    />

    <editOPS
      v-if="!openingArchivingDialog"
      v-model="openEditObstakelDialog"
      @save="handleOPSSave"
      @close="openEditObstakelDialog = false"
    />

    <AskPDCA v-if="!openingArchivingDialog" v-model="askPDCA" @response="handlePDCAResponse" />

    <Archiving v-model="archivingDialog" :selectedItems="selectedItems" @archive="handleArchive" :archiveMode="archiveMode" />

    <AddMeldingToPDCA
      v-if="!openingArchivingDialog"
      v-model="addMeldingToPDCA"
      @update="handleUpdate"
      @close="
        addMeldingToPDCA = false;
        openEditObstakelDialog = false;
        addCorrespondenceDialog = false;
        addCorrectiefDialog = false;
        addPDCADialog = false;
        askPDCA = false;
        handleUpdate([true, true]);
      "
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { push } from 'notivue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';
import Fuse from 'fuse.js';

import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useCorrectiefStore } from '@/stores/verbeterplein/correctief_store';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useFilterStore } from '@/stores/verbeterplein/filter_store';
import { useProjectleiderStore } from '@/stores/verbeterplein/projectleider_store';
import { useAuthStore } from '@/stores/auth';
import ShowItem from '@/components/verbeterplein/meldingItem.vue';
import AddCorrectief from '@/components/verbeterplein/dialogs/addCorrectief.vue';
import AddCorrespondence from '@/components/verbeterplein/dialogs/addCorrespondence.vue';
import AddPDCA from '@/components/verbeterplein/dialogs/AddPDCA.vue';
import EditPDCA from '@/components/verbeterplein/dialogs/editPDCA.vue';
import editOPS from '@/components/verbeterplein/dialogs/editOPS.vue';
import Archiving from '@/components/verbeterplein/dialogs/archiving.vue';
import AskPDCA from '@/components/verbeterplein/dialogs/AskPDCA.vue';
import AddMeldingToPDCA from '@/components/verbeterplein/dialogs/AddMeldingToPDCA.vue';
import VerbeterItemTable from '@/components/verbeterplein/table/VerbeterItemTable.vue';
import ShowImage from '@/components/verbeterplein/dialogs/showImage.vue';
import Filters from '@/components/verbeterplein/table/VerbeterItemTableFilters.vue';
import { HeaderMode } from '@/components/verbeterplein/table/types/type';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();
const meldingStore = useMeldingStore();
const statusStore = useStatusStore();
const actiehouderStore = useActiehouderStore();
const correctiefStore = useCorrectiefStore();
const projectStore = useProjectStore();
const filterStore = useFilterStore();
const projectleiderStore = useProjectleiderStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const selectedItems = ref<any[]>([]);
const showItemDialog = ref(false);
const addCorrectiefDialog = ref(false);
const addCorrespondenceDialog = ref(false);
const addPDCADialog = ref(false);
const openEditObstakelDialog = ref(false);
const archivingDialog = ref(false);
const askPDCA = ref(false);
const openingArchivingDialog = ref(false);
const addMeldingToPDCA = ref(false);
const openEditPDCADialog = ref(false);
const actiehouders = ref<any[]>([]);
const statussen = ref<any[]>([]);
const openImageGalleryDialog = ref(false);
const currentImageIndex = ref(0);
const imageFiles = ref<any[]>([]);
const addPDCACorrespondenceDialog = ref(false);
const debounceTimer = ref<NodeJS.Timeout | null>(null);
const actiehouder = ref<any>(null);
const projectleider = ref<any>(null);
const activeTab = ref('melding');
const archiveMode = ref(true);

const emit = defineEmits(['update', 'remove:state', 'set:active:tab']);

const props = defineProps({
  mode: {
    type: String as () => HeaderMode,
    required: true
  },
  openActiveItem: {
    type: Boolean,
    default: false
  },
  openItem: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();

const inDev = import.meta.env.VITE_NODE_ENV === 'development';

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

onMounted(async () => {
  await meldingStore.initializeData();
  await Promise.all([
    statusStore.initializeData(),
    actiehouderStore.initializeData(),
    correctiefStore.fetchCorrectief(),
    projectStore.fetchProjects(),
    projectleiderStore.initializeData()
  ]);
  actiehouders.value = actiehouderStore.actiehouders;
  statussen.value = statusStore.statussen;

  actiehouder.value = actiehouderStore.actiehouders.find((actiehouder: any) => actiehouder.id === authStore.user.id);
  projectleider.value = projectleiderStore.projectleiders.find((projectleider: any) => projectleider.id === authStore.user.id);

  if (actiehouder.value || projectleider.value) {
    filterStore.voorMijFilterActive = true;
  } else {
    filterStore.voorMijFilterActive = false;
  }
});

// Move watch outside onMounted and improve it
watch(
  [() => props.openItem, () => route.params.id, () => route.query.id],
  async ([newOpenItem, newParamId, newQueryId]) => {
    if (newOpenItem && (newParamId || newQueryId)) {
      const reportVolgNummer = (newParamId || newQueryId) as string;
      const tabParam = route.params.tab as string | undefined;

      let report = await meldingStore.fetchSingleReport(reportVolgNummer);
      if (!report) {
        push.error({
          message: t('errors.report_not_found', { volgnummer: reportVolgNummer })
        });
      } else {
        meldingStore.setSelectedFormId(report.id);
        meldingStore.setSelectedForm(report);
        activeTab.value = typeof tabParam === 'string' ? tabParam : 'melding';
        await nextTick();
        showItemDialog.value = true;
      }

      await router.replace('/verbeterplein/overzicht');

      if (!meldingStore.initialized) {
        meldingStore.initializeData();
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.openActiveItem,
  (newVal: boolean) => {
    if (newVal === true) {
      openShowItemDialog(meldingStore.selectedFormId);
      emit('remove:state');
    }
  }
);

watch(
  () => filterStore.filters,
  async () => {
    if (debounceTimer.value) clearTimeout(debounceTimer.value);
    debounceTimer.value = setTimeout(async () => {
      await meldingStore.fetchReports();
      await correctiefStore.fetchCorrectief();
      meldingStore.$patch({ reports: [...meldingStore.reports] });
      correctiefStore.$patch({ correctiefItems: [...correctiefStore.correctiefItems] });
    }, 300);
  },
  { deep: true }
);

const filteredReports = computed(() => {
  if (props.mode.toUpperCase() === 'OPS') {
    return meldingStore.reports?.filter(
      (report: any) =>
        (report.Correctief?.AkoordOPS === false && report.Archived === false && report.PDCA === false && report.Type === 'Melding') ||
        (report.Correctief?.AkoordOPS === false && report.Archived === false && report.PDCA === true && report.Type === 'Melding') ||
        (report.Correctief?.AkoordOPS === true && report.Archived === false && report.PDCA === false && report.Type === 'Melding')
    );
  }
  if (props.mode.toUpperCase() === 'CORRECTIEF') {
    return correctiefStore.correctiefItems;
  }
  if (props.mode.toUpperCase() === 'PDCA') {
    return meldingStore.pdcaReports;
  }
  if (props.mode.toUpperCase() === 'ARCHIVE') {
    return meldingStore.reports?.filter((report: any) => report.Archived === true);
  }
  if (props.mode.toUpperCase() === 'ALL') {
    return meldingStore.reports?.filter((report: any) => report);
  }
  return [];
});

const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  keys: ['Preventief.Title', 'Project.ProjectNaam']
};

const filteredTableItems = computed(() => {
  const baseFilteredReports = filteredReports.value;

  // If no filters are active, return all items
  const hasActiveFilters = Object.values(filterStore.filters).some(
    (filter) => filter !== null && filter !== '' && filter !== undefined && filter !== 'OR' && filter !== 'AND'
  );

  if (!hasActiveFilters) {
    return baseFilteredReports;
  }

  return baseFilteredReports.filter((item: any) => {
    const matches = [];

    // Only push to matches array if the filter is active
    if (filterStore.filters.projectNaam) {
      const fuse = new Fuse([item], {
        ...fuseOptions,
        keys: ['Project.ProjectNaam']
      });
      matches.push(fuse.search(filterStore.filters.projectNaam).length > 0);
    }

    if (filterStore.filters.volgNummer) {
      matches.push(
        String(item.VolgNummer || '')
          .toLowerCase()
          .includes(String(filterStore.filters.volgNummer).toLowerCase())
      );
    }

    if (filterStore.filters.title) {
      const fuse = new Fuse([item], {
        ...fuseOptions,
        keys: ['Preventief.Title']
      });
      matches.push(fuse.search(filterStore.filters.title).length > 0);
    }

    if (filterStore.filters.deelorder) {
      matches.push(
        String(item.Deelorder || '')
          .toLowerCase()
          .includes(String(filterStore.filters.deelorder).toLowerCase())
      );
    }

    if (filterStore.filters.project) {
      matches.push(
        Number(item.Project?.NumberID) === Number(filterStore.filters.project.NumberID) ||
          String(item.Project?.NumberID || '')
            .toLowerCase()
            .includes(String(filterStore.filters.project.NumberID).toLowerCase())
      );
    }

    if (filterStore.filters.actiehouderCorrectief) {
      matches.push(
        String(item.Correctief?.User?.Name || '').toLowerCase() ===
          String(filterStore.filters.actiehouderCorrectief.Name || '').toLowerCase()
      );
    }

    if (filterStore.filters.actiehouderPreventief) {
      matches.push(
        String(item.Preventief?.User?.Name || '').toLowerCase() ===
          String(filterStore.filters.actiehouderPreventief.Name || '').toLowerCase()
      );
    }

    if (filterStore.filters.projectleider) {
      matches.push(
        String(item.Project?.ProjectLeider?.Name.toLowerCase()) === String(filterStore.filters.projectleider.Name.toLowerCase())
      );
    }

    if (filterStore.filters.statusCorrectief) {
      matches.push(String(item.Correctief?.Status?.StatusNaam) === String(filterStore.filters.statusCorrectief.StatusNaam));
    }

    if (filterStore.filters.statusPreventief) {
      matches.push(String(item.Preventief?.Status?.StatusNaam) === String(filterStore.filters.statusPreventief.StatusNaam));
    }

    if (filterStore.filters.PDCA_status) {
      matches.push(String(getPDCAStep(item)) === String(getPDCAStepFromFlow(filterStore.filters.PDCA_status)));
    }

    if (filterStore.filters.akoord !== undefined && filterStore.filters.akoord !== null) {
      matches.push(item.Correctief?.AkoordOPS === filterStore.filters.akoord.value);
    }

    if (filterStore.filters.department) {
      if (props.mode.toUpperCase() === 'OPS') {
        matches.push(
          String(item.Correctief?.User?.Department?.id || '').toLowerCase() ===
            String(filterStore.filters.department.id || '').toLowerCase()
        );
      } else if (props.mode.toUpperCase() === 'CORRECTIEF') {
        matches.push(
          String(item.Correctief?.User?.Department?.id || '').toLowerCase() ===
            String(filterStore.filters.department.id || '').toLowerCase()
        );
      } else if (props.mode.toUpperCase() === 'PDCA') {
        matches.push(
          String(item.Preventief?.User?.Department?.id || '').toLowerCase() ===
            String(filterStore.filters.department.id || '').toLowerCase()
        );
      } else if (props.mode.toUpperCase() === 'ARCHIVE') {
        matches.push(
          String(item.Correctief?.User?.Department?.id || '').toLowerCase() ===
            String(filterStore.filters.department.id || '').toLowerCase() ||
            String(item.Preventief?.User?.Department?.id || '').toLowerCase() ===
              String(filterStore.filters.department.id || '').toLowerCase()
        );
      }
    }

    // Return based on filter mode
    return filterStore.filters.filterMode === 'AND'
      ? matches.every((match) => match === true) // All filters must match
      : matches.some((match) => match === true); // Any filter can match
  });
});

const showArchiving = computed(() => {
  return props.mode.toUpperCase() !== 'ARCHIVE';
});

const getPDCAStep = (item: any) => {
  if (!item?.Preventief?.Steps) return 0;

  const steps = item.Preventief.Steps;
  const stepOrder = ['Obstakel', 'Plan', 'Do', 'Check', 'Act', 'Finished'];

  for (let i = 0; i < stepOrder.length; i++) {
    if (!steps[stepOrder[i]]?.Finished) {
      return i + 1;
    }
  }

  return stepOrder.length;
};

const getPDCAStepFromFlow = (item: any) => {
  if (!item) return 0;

  const stepOrder = ['O', 'P', 'D', 'C', 'A', 'F'];
  const index = stepOrder.findIndex((step) => step.toLowerCase() === item.toLowerCase());
  if (index === -1) {
    return 0;
  }
  return index;
};

const rowClicked = (event: any) => {
  if (openingArchivingDialog.value === true) return;
  if (archivingDialog.value) {
    archivingDialog.value = false;
  }
  openShowItemDialog(event.data.id);
};

const openShowItemDialog = async (itemId: string) => {
  if (openingArchivingDialog.value === true) return;
  if (showItemDialog.value) {
    showItemDialog.value = false;
  }
  meldingStore.setSelectedFormId(itemId);
  meldingStore.setSelectedForm(meldingStore.getReportById(itemId));
  await nextTick();
  showItemDialog.value = true;
};

const handleClosing = async (update = true) => {
  openEditPDCADialog.value = false;
  addCorrectiefDialog.value = false;
  addCorrespondenceDialog.value = false;
  addPDCADialog.value = false;
  openEditObstakelDialog.value = false;
  askPDCA.value = false;
  addMeldingToPDCA.value = false;
  if (update) {
    await handleUpdate([true, true]);
  }
};

const openAddCorrectiefDialog = async () => {
  if (openingArchivingDialog.value) return;
  if (addCorrectiefDialog.value) {
    addCorrectiefDialog.value = false;
  }
  await nextTick();
  addCorrectiefDialog.value = true;
};

const openClonePDCADialog = async () => {
  if (openingArchivingDialog.value) return;
  if (addMeldingToPDCA.value) {
    addMeldingToPDCA.value = false;
  }
  await nextTick();
  addMeldingToPDCA.value = true;
};

const openImageGalleryDialogFunction = async (event: any) => {
  if (openingArchivingDialog.value) return;
  if (openImageGalleryDialog.value) {
    openImageGalleryDialog.value = false;
  }
  currentImageIndex.value = event[0][0].value;
  imageFiles.value = event[0][1].value;
  await nextTick();
  openImageGalleryDialog.value = true;
};

const openAddCorrespondenceDialog = async () => {
  if (openingArchivingDialog.value) return;
  if (addCorrespondenceDialog.value) {
    addCorrespondenceDialog.value = false;
  }
  await nextTick();
  addCorrespondenceDialog.value = true;
};

const openPDCACorrespondenceDialog = async () => {
  if (openingArchivingDialog.value) return;
  if (addPDCACorrespondenceDialog.value) {
    addPDCACorrespondenceDialog.value = false;
  }
  await nextTick();
  addPDCACorrespondenceDialog.value = true;
};

const openAddPDCADialog = async () => {
  if (openingArchivingDialog.value) return;
  if (addPDCADialog.value) {
    addPDCADialog.value = false;
  }
  await nextTick();
  addPDCADialog.value = true;
};

const openEditObstakel = async () => {
  if (openingArchivingDialog.value) return;
  if (openEditObstakelDialog.value) {
    openEditObstakelDialog.value = false;
  }
  await nextTick();
  openEditObstakelDialog.value = true;
};

const openEditDialogFunction = async () => {
  if (openingArchivingDialog.value) return;
  if (openEditPDCADialog.value) {
    openEditPDCADialog.value = false;
  }
  await nextTick();
  openEditPDCADialog.value = true;
};

const openArchivingDialog = async ({ itemIdsToPreview, archive }: { itemIdsToPreview: any[]; archive: boolean }) => {
  archiveMode.value = archive;
  showItemDialog.value = false;
  openEditPDCADialog.value = false;
  openImageGalleryDialog.value = false;
  addCorrectiefDialog.value = false;
  addCorrespondenceDialog.value = false;
  addPDCACorrespondenceDialog.value = false;
  addPDCADialog.value = false;
  openEditObstakelDialog.value = false;
  askPDCA.value = false;
  addMeldingToPDCA.value = false;

  await nextTick();

  openingArchivingDialog.value = true;
  selectedItems.value = itemIdsToPreview;
  archivingDialog.value = true;
  archiveMode.value = archive;
  setTimeout(() => {
    openingArchivingDialog.value = false;
  }, 500);
};

const handleUpdate = async ([shouldEmit = true, forced = false]) => {
  try {
    // Prevent multiple simultaneous updates
    if (meldingStore.loading.all || meldingStore.loading.single || correctiefStore.isLoading) {
      return;
    }

    // Fetch latest data
    await Promise.all([
      meldingStore.fetchReports(),
      correctiefStore.fetchCorrectief(),
      forced ? meldingStore.updateCurrentForm(true) : Promise.resolve()
    ]);

    // Update store data with fresh copies to trigger reactivity
    meldingStore.$patch({ reports: [...meldingStore.reports] });
    correctiefStore.$patch({ correctiefItems: [...correctiefStore.correctiefItems] });

    // Explicitly update selectedForm with fresh data if it exists
    if (meldingStore.selectedFormId) {
      const updatedReport = await meldingStore.fetchReportById(meldingStore.selectedFormId);
      if (updatedReport) {
        meldingStore.setSelectedForm(updatedReport);
      }
    }

    // Only emit update if requested
    if (shouldEmit) {
      emit('update');
    }

    // Force a component update
    await nextTick();
  } catch (error: any) {
    console.error('Update failed:', error);
    push.error({
      message: t('errors.update_failed')
    });
  }
};

const handlePDCAResponse = async (response: boolean) => {
  if (response === true) {
    askPDCA.value = false;
    openAddPDCADialog();
  } else {
    push.info({
      message: t('notifications.pdca_info')
    });
    askPDCA.value = false;
    const report = meldingStore.selectedForm;
    if (report?.Correctief?.id) {
      const response = await correctiefStore.schedulePDCA(report.Correctief.id);
      if (response?.status === 200) {
        // Force a complete refresh after scheduling PDCA
        await Promise.all([meldingStore.fetchReports(true), correctiefStore.fetchCorrectief(), meldingStore.updateCurrentForm(true)]);

        // Update store data with fresh copies to trigger reactivity
        meldingStore.$patch({ reports: [...meldingStore.reports] });
        correctiefStore.$patch({ correctiefItems: [...correctiefStore.correctiefItems] });

        // Force a UI update
        await nextTick();
        handleUpdate([true, true]);
      }
      return response;
    } else {
      push.error({
        message: t('errors.correctief_not_found')
      });
    }
  }
};

const handleOPSSave = async (data: any) => {
  try {
    notificationStore.promise({
      message: t('notifications.saving')
    });
    const report = meldingStore.selectedForm;
    const updateData: any = {};
    let needsProjectUpdate = false;
    let needsProjectleiderUpdate = false;

    // Collect all updates
    if (data.obstakel !== undefined && data.obstakel !== report?.Obstakel) {
      updateData.Obstakel = data.obstakel;
    }

    if (data.deelorder && data.deelorder !== report?.Deelorder) {
      updateData.Deelorder = data.deelorder;
    }

    if (data.project?.id && data.project.id !== report?.Project?.NumberID) {
      updateData.ProjectID = data.project.id;
      needsProjectUpdate = true;
    }

    if (data.projectleider?.id && data.projectleider.id !== report?.Project?.ProjectLeider?.id) {
      needsProjectleiderUpdate = true;
    }

    // Perform updates in sequence
    try {
      // 1. First update the main report data
      if (Object.keys(updateData).length > 0) {
        const updateResponse = await meldingStore.updateReport(meldingStore.selectedFormId, updateData);
        if (!updateResponse || updateResponse.status !== 200) {
          throw new Error('Failed to update report');
        }
      }

      // 2. Update project leader if needed
      if (needsProjectleiderUpdate && data.project?.id) {
        const projectUpdateResponse = await projectStore.updateProject(data.project.id, {
          ProjectleiderID: data.projectleider.id
        });
        if (!projectUpdateResponse || projectUpdateResponse.status !== 200) {
          throw new Error('Failed to update project leader');
        }
      }

      // 3. Add deelorder to project if it's new
      if (data.deelorder && data.project?.id) {
        const project = projectStore.getProjectById(data.project.id);
        if (project && !project.Deelorders?.includes(data.deelorder)) {
          await projectStore.addDeelorder(data.project.id, data.deelorder);
        }
      }

      // 4. Refresh all data
      await Promise.all([meldingStore.fetchReports(true), projectStore.fetchProjects(), meldingStore.updateCurrentForm(true)]);

      // 5. Update the selected form with fresh data
      const updatedReport = meldingStore.getReportById(meldingStore.selectedFormId);
      if (updatedReport) {
        meldingStore.setSelectedForm(updatedReport);

        // 6. Force a UI update
        await nextTick();
        await handleUpdate([true, true]);

        notificationStore.resolvePromise({
          message: t('notifications.update_success')
        });
      }

      openEditObstakelDialog.value = false;
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  } catch (error: any) {
    notificationStore.rejectPromise({
      message: error.message || t('errors.ops_save_failed')
    });
  }
};

const handleArchive = async ({ itemIdsToArchive, archive }: { itemIdsToArchive: any[]; archive: boolean }) => {
  try {
    notificationStore.promise({
      message: t('notifications.saving')
    });
    selectedItems.value = [];
    const idsToArchive = Array.isArray(itemIdsToArchive) ? itemIdsToArchive : [];
    if (idsToArchive.length === 0) {
      console.warn('No valid item IDs received for archiving.');
      return;
    }

    const response = await meldingStore.archiveReport(idsToArchive, archive);
    if (response?.status === 200) {
      notificationStore.resolvePromise({
        message: t('notifications.archive_success')
      });
      const refreshData = async () => {
        await Promise.all([meldingStore.fetchReports(true), correctiefStore.fetchCorrectief()]);

        await nextTick();
        meldingStore.$patch({ reports: [...meldingStore.reports] });
        correctiefStore.$patch({ correctiefItems: [...correctiefStore.correctiefItems] });
      };

      await refreshData();
    }
  } catch (error: any) {
    notificationStore.rejectPromise({
      message: error || t('errors.archive_failed')
    });
  } finally {
    archivingDialog.value = false;
  }
};

const applyFilters = (newFilters: any) => {
  if (debounceTimer.value) clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    filterStore.setFilters(newFilters);
  }, 300);
};

const activeFilterCount = computed(() => {
  if (filterStore.filters) {
    return Object.values(filterStore.filters).filter((value) => value !== null && value !== '').length - 1;
  }
  return 0;
});

const handleClearFilters = () => {
  filterStore.clearFilters();
};

// Add this watcher to force updates when reports change
watch(
  [() => meldingStore.reports, () => correctiefStore.correctiefItems],
  async () => {
    await nextTick();
  },
  { deep: true }
);

const openItem = (id: string) => {
  router.push(`/verbeterplein/melding/${id}`);
};

const tableContainerStyle = computed(() => {
  const itemCount = filteredTableItems.value?.length || 0;
  const baseHeight = 70;
  const maxHeight = 300;
  const scaleThreshold = 50;

  let calculatedHeight = baseHeight + ((maxHeight - baseHeight) * Math.min(itemCount, scaleThreshold)) / scaleThreshold;

  // Clamp the height between min and max
  const finalHeight = Math.max(baseHeight, Math.min(calculatedHeight, maxHeight));

  return {
    minHeight: `${baseHeight}vh`,
    height: `${finalHeight}vh`,
    maxHeight: `${maxHeight}vh`,
    overflowY: 'auto' as 'auto'
  };
});

const dynamicPageSize = computed(() => {
  const itemCount = filteredTableItems.value?.length || 0;
  const baseHeight = 80;
  const maxHeight = 100;
  const scaleThreshold = 30;

  const minPageSize = 10;
  const maxPageSize = 30;

  let calculatedHeight = baseHeight + ((maxHeight - baseHeight) * Math.min(itemCount, scaleThreshold)) / scaleThreshold;
  const finalHeight = Math.max(baseHeight, Math.min(calculatedHeight, maxHeight));

  // Scale page size based on finalHeight
  let pageSize = minPageSize;
  if (finalHeight > baseHeight) {
    pageSize = minPageSize + ((maxPageSize - minPageSize) * (finalHeight - baseHeight)) / (maxHeight - baseHeight);
  }

  return Math.max(minPageSize, Math.min(Math.round(pageSize), maxPageSize));
});
</script>

<style scoped lang="scss">
.blacktext {
  color: black;
}

.filter-panels {
  :deep(.v-expansion-panel) {
    background-color: rgb(var(--v-theme-surface)) !important;
  }

  :deep(.v-expansion-panel-title) {
    min-height: 44px !important;

    .v-btn {
      pointer-events: auto;
    }

    .filter-mode-toggle {
      border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
      border-radius: 4px;
      height: 24px;
      margin-top: 1px;

      .v-btn {
        min-width: 48px !important;
        height: 22px !important;
        text-transform: none;
        font-size: 0.75rem;
        letter-spacing: 0;
        border-radius: 3px;
        opacity: 0.8;

        &.v-btn--active {
          opacity: 1;
          font-weight: 500;
        }

        &:not(:last-child) {
          border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
        }
      }
    }
  }
}

.filters-container {
  padding: 16px 0;
}
</style>
