<template>
  <ag-grid-vue
    style="height: 100%; width: 100%"
    :loading="meldingStore.loading.all"
    :rowData="items"
    :columnDefs="headers[mode]"
    :theme="theme"
    :gridOptions="gridOptions"
    @grid-ready="onGridReady"
    @cellClicked="cellClicked"
  >
  </ag-grid-vue>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz, GridOptions, GridReadyEvent, GridApi } from 'ag-grid-community';
import { colorSchemeLightCold } from 'ag-grid-community';
import { useMeldingStore } from '../../../stores/verbeterplein/melding_store';
import { useCustomizerStore } from '@/stores/customizer';
import { debounce } from '@/utils/debounce';
import { OPS_headers, CORRECTIEF_headers, PDCA_headers, ARCHIVE_headers, ALL_headers } from './headers';

//All custom components
import CheckmarkRenderer from './CustomComponents/CheckmarkRenderer.vue';
import StatusRenderer from './CustomComponents/StatusRenderer.vue';
import ActionRenderer from './CustomComponents/ActionRenderer.vue';
import CustomLoading from './CustomComponents/Customloading.vue';
import PDCACircleRenderer from './CustomComponents/PDCACircleRenderer.vue';
import ActionRendererArchive from './CustomComponents/ActionRendererArchive.vue';

import { HeaderMode } from './types/type';

const props = defineProps({
  mode: {
    type: String as () => HeaderMode,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  handleArchive: {
    type: Function,
    required: true
  },
  getPDCAStep: {
    type: Function,
    required: false
  },
  RowClicked: {
    type: Function,
    required: true
  },
  showArchiving: {
    type: Boolean,
    required: false
  },
  pageSize: {
    type: Number,
    default: 20 // Default page size if prop not provided
  }
});

const headerColor = ref({
  OPS: '#fff',
  CORRECTIEF: '#093f96',
  PDCA: '#87368b',
  ARCHIVE: '#fff',
  ALL: '#fff'
});

const textColor = ref({
  OPS: 'rgb(0,0,0)',
  CORRECTIEF: '#fff',
  PDCA: '#fff',
  ARCHIVE: 'rgb(0,0,0)',
  ALL: 'rgb(0,0,0)'
});

const theme = themeQuartz.withPart(colorSchemeLightCold).withParams({
  headerTextColor: textColor.value[props.mode],
  headerBackgroundColor: headerColor.value[props.mode],
  headerColumnResizeHandleColor: 'rgb(0, 0, 0)',
  spacing: 12
});

const paginationPageSizeSelector = ref<number[] | boolean>([10, 20, 50, 100]);
const meldingStore = useMeldingStore();
const customizerStore = useCustomizerStore();
const gridApi = ref<GridApi | null>(null);
const resizeColumns = () => {
  if (gridApi.value) {
    gridApi.value.sizeColumnsToFit();
  }
};
const debouncedResizeColumns = debounce(resizeColumns, 75);

const openArchivePreview = (itemIdsToPreview: string[] | number[]) => {
  props.handleArchive({ itemIdsToPreview, archive: true });
};
const openUnArchivePreview = (itemIdsToPreview: string[] | number[]) => {
  props.handleArchive({ itemIdsToPreview, archive: false });
};

const headers: { [key in HeaderMode]: any[] } = {
  OPS: OPS_headers,
  CORRECTIEF: CORRECTIEF_headers,
  PDCA: PDCA_headers,
  ARCHIVE: ARCHIVE_headers,
  ALL: ALL_headers
};

const loadingOverlayComponentParams = ref({
  loadingMessage: 'Loading...'
});

const gridComponent = ref<any>({
  CheckmarkRenderer,
  StatusRenderer,
  ActionRenderer,
  PDCACircleRenderer,
  CustomLoading,
  ActionRendererArchive
});

// --- Define Grid Options --- computed
const gridOptions = computed<GridOptions>(() => ({
  context: {
    openArchivePreview: openArchivePreview,
    openUnArchivePreview: openUnArchivePreview
  },
  components: gridComponent.value,
  loadingOverlayComponent: CustomLoading,
  loadingOverlayComponentParams: loadingOverlayComponentParams.value,
  pagination: true,
  paginationPageSize: props.pageSize,
  paginationPageSizeSelector: paginationPageSizeSelector.value,
  rowSelection: {
    mode: 'multiRow',
    headerCheckbox: true
  },
  headerHeight: 50,
  autoSizeStrategy: { type: 'fitGridWidth' }
}));

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
  debouncedResizeColumns();
};

const emit = defineEmits(['update:selected']);

const selectedItems = ref<any>([]);

watch(selectedItems, (newVal: any) => {
  emit('update:selected', newVal);
});

const cellClicked = (event: any) => {
  if (event.colDef.field === 'action') return;
  props.RowClicked(event);
};

// --- Lifecycle Hooks for Resizing ---
onMounted(() => {
  window.addEventListener('resize', debouncedResizeColumns);
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResizeColumns);
});

// --- Watch for sidebar changes ---
watch(
  () => customizerStore.mini_sidebar,
  () => {
    setTimeout(debouncedResizeColumns, 50);
  }
);

// Watch for pageSize prop changes
watch(
  () => props.pageSize,
  (newPageSize) => {
    if (gridApi.value && newPageSize) {
      gridApi.value.setGridOption('paginationPageSize', Number(newPageSize));
    }
  }
);
</script>

<style scoped lang="scss">
.blacktext {
  color: black;
}

.v-data-table {
  // Remove default padding/margins
  :deep(.v-table) {
    width: 100%;
    padding: 0;
    margin: 0;
  }

  // Make table use full width of container
  :deep(.v-table__wrapper) {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  // Ensure container takes full width
  :deep(.v-container) {
    max-width: 100%;
    padding: 0;
  }

  // Align table cells consistently
  th,
  td {
    padding: 0.75rem 1rem;
    vertical-align: middle;
  }

  // Center align specific columns if needed
  .text-center {
    text-align: center;
  }

  // Right align numeric columns
  .text-right {
    text-align: right;
  }

  // Fix header alignment
  .v-data-table-header {
    th {
      font-weight: 500;
      white-space: nowrap;
    }
  }

  // Ensure consistent row heights
  .v-data-table-row {
    height: 48px;
  }
}

// Add these styles to ensure proper centering
.d-flex.justify-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
