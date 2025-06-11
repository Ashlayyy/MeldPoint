<template>
  <v-container fluid>
    <!-- <div class="header">
      <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    </div> -->

    <v-card>
      <v-col cols="12">
        <v-btn color="primary" @click="handleDialogOpen" size="large" elevation="3" v-if="isMobile" block>
          <v-icon start icon="mdi-plus"></v-icon>
          {{ $t('verbeterplein.buttons.new_report') }}
        </v-btn>
        <!-- <br /><br /> -->
        <v-tabs fixed-tabs v-model="activeTab" background-color="primary" outline dark>

          <v-tab>
            <v-icon size="20" class="v-icon--start">mdi-inbox-arrow-down-outline</v-icon>
            <span v-if="!isMobile">{{ $t('verbeterplein.tabs.ops') }}</span>
            <v-badge :content="opsReports" class="mr-2 ml-2" color="#d02d00" floating></v-badge>
          </v-tab>
          <v-tab>
            <v-icon size="20" class="v-icon--start">mdi-flash-outline</v-icon>
            <span v-if="!isMobile">{{ $t('verbeterplein.tabs.correctief') }}</span>
            <v-badge :content="CorrectiefReports" class="mr-2 ml-2" color="primary" floating></v-badge>
          </v-tab>
          <v-tab>
            <v-icon class="v-icon--start">mdi-shield-outline</v-icon>
            <span v-if="!isMobile">{{ $t('verbeterplein.tabs.pdca') }}</span>
            <v-badge :content="pdcaReports" class="mr-2 ml-2" color="secondary" floating></v-badge>
          </v-tab>
          <v-tab>
            <v-icon size="20" class="v-icon--start">mdi-view-list</v-icon>
            <span v-if="!isMobile">{{ $t('verbeterplein.tabs.all') }}</span>
            <v-badge :content="allReports" class="mr-2 ml-2" color="#d8d8d8" floating></v-badge>
          </v-tab>
          <v-tab>
            <v-icon class="v-icon--start">mdi-archive-outline</v-icon>
            <span v-if="!isMobile">{{ $t('verbeterplein.tabs.archived') }}</span>
            <v-badge :content="archivedReports" class="mr-2 ml-2" color="black" floating></v-badge>
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" disabled :touch="false" class="mt-5" transition="fade-transition">
          <v-window-item :value="0">
            <Suspense>
              <VerbeterTabView :openItem="openItem" mode="OPS" @update="updateReportCounts"></VerbeterTabView>
              <template #fallback>{{ $t('general.fallback.loading') }}</template>
            </Suspense>
          </v-window-item>

          <v-window-item :value="1">
            <Suspense>
              <VerbeterTabView :openItem="openItem" mode="CORRECTIEF" @update="updateReportCounts"></VerbeterTabView>
              <template #fallback>{{ $t('general.fallback.loading') }}</template>
            </Suspense>
          </v-window-item>

          <v-window-item :value="2">
            <Suspense>
              <VerbeterTabView
                :openItem="openItem"
                mode="PDCA"
                @update="updateReportCounts"
                :openActiveItem="openActiveItem"
                @remove:state="openActiveItem = false"
              ></VerbeterTabView>
              <template #fallback>{{ $t('general.fallback.loading') }}</template>
            </Suspense>
          </v-window-item>

          <v-window-item :value="3">
            <Suspense>
              <VerbeterTabView :openItem="openItem" mode="ALL" @update="updateReportCounts"></VerbeterTabView>
              <template #fallback>{{ $t('general.fallback.loading') }}</template>
            </Suspense>
          </v-window-item>          

          <v-window-item :value="4">
            <Suspense>
              <VerbeterTabView :openItem="openItem" mode="ARCHIVE" :openActiveItem="openActiveItem" @remove:state="openActiveItem = false"></VerbeterTabView>
              <template #fallback>{{ $t('general.fallback.loading') }}</template>
            </Suspense>
          </v-window-item>
        </v-window>
      </v-col>
    </v-card>

    <v-btn color="primary" @click="handleDialogOpen" class="floating-btn" size="large" elevation="3" v-if="!isMobile">
      <v-icon start icon="mdi-plus"></v-icon>
      {{ $t('verbeterplein.buttons.new_report') }}
    </v-btn>

    <v-dialog
      v-model="dialog"
      :fullscreen="isMobile"
      :width="isMobile ? '100%' : '80%'"
      :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'"
      class="dialog-container"
    >
      <component
        :is="isMobile ? MeldingStepperMobile : MeldingStepper"
        @closeDialog="handleDialogClose"
        @update="handleUpdate"
        class="stepper-content"
      />
    </v-dialog>
  </v-container>
  <br /><br />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import VerbeterTabView from '@/views/verbeterplein/VerbeterTabView.vue';
import MeldingStepper from '@/components/verbeterplein/steppers/MeldingStepper.vue';
import MeldingStepperMobile from '@/components/verbeterplein/steppers/MeldingStepperMobile.vue';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { usePageStore } from '@/stores/pageStore';

const route = useRoute();
const { t } = useI18n();
const { mobile } = useDisplay();
const pageStore = usePageStore();

const reportStore = useMeldingStore();
const projectStore = useProjectStore();
const actiehouderStore = useActiehouderStore();
const statusStore = useStatusStore();

// State refs
const activeTab = ref('melding');
const dialog = ref(false);
const reportType = ref('melding');
const opsReports = ref(0);
const allReports = ref(0);
const CorrectiefReports = ref(0);
const pdcaReports = ref(0);
const financedReports = ref(0);
const archivedReports = ref(0);
const showConfirmButton = ref(true);
const prematurelyClosed = ref(false);
const openActiveItem = ref(false);
const openItem = ref(false);

// Computed properties
const isMobile = computed(() => mobile.value);

const extraTitle = computed(() => {
  switch (activeTab.value) {
    case 'melding':
      return `- ${t('verbeterplein.tabs.ops')}`;
    case 'correctief':
      return `- ${t('verbeterplein.tabs.correctief')}`;
    case 'pdca':
      return `- ${t('verbeterplein.tabs.pdca')}`;
    case 'archived':
      return `- ${t('verbeterplein.tabs.archived')}`;
    default:
      return '';
  }
});

// Methods
const handleDialogOpen = () => {
  if (dialog.value) {
    dialog.value = false;
  }
  setTimeout(() => {
    reportType.value = 'melding';
    dialog.value = true;
  }, 25);
};

const handleDialogClose = (force = false) => {
  if (force) {
    dialog.value = false;
    return;
  }
  dialog.value = false;
  nextTick(() => {
    reportType.value = 'melding';
    showConfirmButton.value = true;
  });
};

const handleUpdate = async () => {
  await init();
};

// Watchers
watch(activeTab, () => {
  pageStore.setPageInfo(`Verbeterplein ${extraTitle.value}`, [
    { title: t('verbeterplein.breadcrumbs.home'), href: '/' },
    { title: t('verbeterplein.breadcrumbs.verbeterplein'), href: '/verbeterplein/overzicht' }
  ]);
});

// Update the watch for route changes
watch(
  () => route.params,
  async (newParams) => {
    if (newParams.id) {
      openItem.value = true;
    }
  },
  { immediate: true }
);

// Lifecycle hooks
onMounted(async () => {
  await init();
  showConfirmButton.value = true;
  
  // Set initial page info
  pageStore.setPageInfo(`Verbeterplein ${extraTitle.value}`, [
    { title: t('verbeterplein.breadcrumbs.home'), href: '/' },
    { title: t('verbeterplein.breadcrumbs.verbeterplein'), href: '/verbeterplein/overzicht' }
  ]);

  setTimeout(() => {
    const dialogStepper = document.querySelector('.dialog-stepper');
    dialogStepper?.addEventListener('cancel', (e: any) => {
      prematurelyClosed.value = e.target !== dialogStepper;
    });
    dialogStepper?.addEventListener('close', (e) => {
      if (prematurelyClosed.value) {
        dialog.value = true;
        prematurelyClosed.value = false;
      }
    });
  }, 125);
});

async function init(force = false) {
  await reportStore.initializeData();
  updateReportCounts();
  await projectStore.fetchProjects();
  await actiehouderStore.initializeData();
  await statusStore.initializeData();

  if (force) {
    await reportStore.fetchReports();
  }
}

function updateReportCounts() {
  allReports.value = reportStore.lengths.all;
  opsReports.value = reportStore.lengths.ops;
  CorrectiefReports.value = reportStore.lengths.correctief;
  pdcaReports.value = reportStore.lengths.pdca;
  financedReports.value = reportStore.lengths.financed;
  archivedReports.value = reportStore.lengths.archived;
}
</script>

<style scoped lang="scss">
.mt-5 {
  margin-top: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.floating-btn {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
}

.dialog-container {
  :deep(.v-overlay__content) {
    display: flex;
    flex-direction: column;
    max-height: 90vh !important;
    overflow: hidden !important;
  }

  :deep(.stepper-content) {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.v-container {
  padding: 15;
}

.v-card {
  width: 100%;
}
</style>
