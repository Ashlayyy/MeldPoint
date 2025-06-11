<template>
  <div class="filters">
    <v-expansion-panels v-model="filtersPanelOpen">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex justify-space-between align-center w-100">
            <span>Filters</span>
            <div class="d-flex align-center">
              <v-chip v-if="hasActiveFilters" color="primary" size="x-small" class="mr-4" variant="flat"> Actieve filters </v-chip>
              <v-btn v-if="hasActiveFilters" color="error" variant="text" density="compact" size="small" @click.stop="clearFilters">
                <v-icon size="small" class="mr-1">mdi-close</v-icon>
                Wis filters
              </v-btn>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense>
            <!-- Action Type Group -->
            <v-col cols="12" sm="6" md="3" lg="3">
              <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
                <div class="d-flex align-center mb-1">
                  <v-icon size="small" color="primary" class="mr-1">mdi-format-list-bulleted</v-icon>
                  <span class="text-caption font-weight-medium">Taak Details</span>
                </div>
                <v-select
                  v-model="selectedActionType"
                  :items="[
                    { text: 'Actie', value: 'task' },
                    { text: 'Melding', value: 'traject' }
                  ]"
                  label="Type"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-1"
                  clearable
                  item-title="text"
                  item-value="value"
                  @update:model-value="updateFilters"
                ></v-select>
                <v-select
                  v-model="selectedCategory"
                  :items="[
                    { text: 'Correctief', value: 'correctief' },
                    { text: 'Preventief', value: 'preventief' }
                  ]"
                  label="Categorie"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-1"
                  clearable
                  item-title="text"
                  item-value="value"
                  @update:model-value="updateFilters"
                ></v-select>
              </v-card>
            </v-col>

            <!-- Status Group -->
            <v-col cols="12" sm="6" md="3" lg="3">
              <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
                <div class="d-flex align-center mb-1">
                  <v-icon size="small" color="primary" class="mr-1">mdi-flag-outline</v-icon>
                  <span class="text-caption font-weight-medium">Item Status</span>
                </div>
                <!-- <v-select
                  v-if="hasTrajectSelected"
                  v-model="selectedItemStatus"
                  :items="itemStatuses"
                  label="Status"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-1"
                  clearable
                  item-title="StatusNaam"
                  item-value="id"
                  @update:model-value="updateFilters"
                ></v-select> -->
                <v-select
                  v-model="selectedMeldingStatus"
                  :items="meldingStatuses"
                  label="Meldingstatus"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-1"
                  :disabled="selectedActionType === 'task'"
                  clearable
                  @update:model-value="updateFilters"
                ></v-select>
                <v-select
                  v-model="selectedFinished"
                  :items="[
                    { text: 'Voltooid', value: true },
                    { text: 'Niet voltooid', value: false }
                  ]"
                  label="Taakstatus"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-1"
                  item-title="text"
                  item-value="value"
                  clearable
                  :disabled="hasTrajectSelected"
                  @update:model-value="updateFilters"
                ></v-select>
              </v-card>
            </v-col>

            <!-- Date Range Group -->
            <v-col cols="12" sm="6" md="3" lg="3">
              <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
                <div class="d-flex align-center mb-1">
                  <v-icon size="small" color="primary" class="mr-1">mdi-calendar-outline</v-icon>
                  <span class="text-caption font-weight-medium">Datum</span>
                </div>

                <div class="d-flex gap-2 mb-1">
                  <v-menu v-model="startDateMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto">
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        v-model="startDateFormatted"
                        label="Van"
                        density="compact"
                        variant="outlined"
                        hide-details
                        readonly
                        clearable
                        @click:clear="
                          startDate = null;
                          updateFilters();
                        "
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="startDate"
                      @update:model-value="
                        startDateMenu = false;
                        updateFilters();
                      "
                    ></v-date-picker>
                  </v-menu>
                </div>

                <div class="d-flex gap-2">
                  <v-menu v-model="endDateMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto">
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        v-model="endDateFormatted"
                        label="Tot"
                        density="compact"
                        variant="outlined"
                        hide-details
                        readonly
                        clearable
                        @click:clear="
                          endDate = null;
                          updateFilters();
                        "
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="endDate"
                      @update:model-value="
                        endDateMenu = false;
                        updateFilters();
                      "
                    ></v-date-picker>
                  </v-menu>
                </div>
              </v-card>
            </v-col>

            <!-- User Selection Group -->
            <v-col cols="12" sm="6" md="3" lg="3" v-permission="[{ action: 'manage', resourceType: 'user' }]">
              <v-card variant="outlined" class="filter-group pa-2" :theme="isDark ? 'dark' : 'light'">
                <div class="d-flex align-center mb-1">
                  <v-icon size="small" color="primary" class="mr-1">mdi-account-outline</v-icon>
                  <span class="text-caption font-weight-medium">Gebruiker</span>
                </div>
                <v-select
                  v-model="selectedUserId"
                  :items="userStore.filterUsers"
                  label="Gebruiker"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-1"
                  clearable
                  item-title="Name"
                  item-value="id"
                  :loading="userStore.isLoading"
                  @update:model-value="updateFilters"
                ></v-select>
              </v-card>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useUserStore } from '@/stores/verbeterplein/user_store';

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);
const statusStore = useStatusStore();
const userStore = useUserStore();

// Props for initial state
const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => null
  },
  statusCache: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update-filters']);

// Expansion panel state
const filtersPanelOpen = ref(1); // Open by default

// Filter values
const selectedActionType = ref<string | null>(null);
const selectedCategory = ref<string | null>(null);
const selectedItemStatus = ref<string | null>(null);
const selectedMeldingStatus = ref<string | null>(null);
const selectedFinished = ref<boolean | null>(null);
const startDate = ref<string | null>(null);
const endDate = ref<string | null>(null);
const selectedUserId = ref<string | null>(null);

// Set initial values if provided
watch(
  () => props.initialFilters,
  (newFilters) => {
    if (newFilters) {
      selectedActionType.value = newFilters.actionType ?? null;
      selectedCategory.value = newFilters.category ?? null;
      selectedItemStatus.value = newFilters.itemStatus ?? null;
      selectedMeldingStatus.value = newFilters.meldingStatus ?? null;
      selectedFinished.value = newFilters.finished ?? null;
      startDate.value = newFilters.startDate ?? null;
      endDate.value = newFilters.endDate ?? null;
      selectedUserId.value = newFilters.userId ?? null;
    }
  },
  { immediate: true }
);

// Date picker menu states
const startDateMenu = ref(false);
const endDateMenu = ref(false);

// Formatted dates for display
const startDateFormatted = computed(() => {
  if (!startDate.value) return '';
  const date = new Date(startDate.value);
  return date.toLocaleDateString('nl-NL');
});

const endDateFormatted = computed(() => {
  if (!endDate.value) return '';
  const date = new Date(endDate.value);
  return date.toLocaleDateString('nl-NL');
});

// Computed for Traject/Task filtering logic
const hasTrajectSelected = computed(() => selectedActionType.value === 'traject');

// Extract unique status names from statusCache
const meldingStatuses = computed(() => {
  const uniqueStatuses = new Set<string>();

  // Extract unique StatusNaam values from the statusCache
  Object.values(props.statusCache).forEach((status: any) => {
    if (status && status.StatusNaam) {
      uniqueStatuses.add(status.StatusNaam);
    }
  });

  // Convert Set to array and sort alphabetically
  return Array.from(uniqueStatuses).sort();
});

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(
    selectedActionType.value ||
    selectedCategory.value ||
    selectedItemStatus.value ||
    selectedMeldingStatus.value ||
    selectedFinished.value !== null ||
    startDate.value ||
    endDate.value
  );
});

// Fetch users when component mounts
onMounted(() => {
  if (!userStore.filterUsers || userStore.filterUsers.length === 0) {
    userStore.fetchFilterUsers();
  }
});

// Update the filters when something changes
function updateFilters() {
  emit('update-filters', {
    actionType: selectedActionType.value,
    category: selectedCategory.value,
    itemStatus: selectedItemStatus.value,
    meldingStatus: selectedMeldingStatus.value,
    finished: selectedFinished.value,
    startDate: startDate.value,
    endDate: endDate.value,
    userId: selectedUserId.value
  });
}

// Clear all filters
function clearFilters(e: Event) {
  e.stopPropagation(); // Prevent panel from toggling
  selectedActionType.value = null;
  selectedCategory.value = null;
  selectedItemStatus.value = null;
  selectedMeldingStatus.value = null;
  selectedFinished.value = null;
  startDate.value = null;
  endDate.value = null;
  selectedUserId.value = null;
  updateFilters();
}
</script>

<style scoped lang="scss">
.filters {
  margin-bottom: 16px;

  :deep(.v-expansion-panel-title) {
    min-height: 44px;
    padding: 8px 16px;
  }

  :deep(.v-expansion-panel-text__wrapper) {
    padding: 12px;
  }

  .filter-group {
    border-radius: 4px;

    :deep(.v-field) {
      border-radius: 4px !important;
    }

    :deep(.v-field__input) {
      min-height: 28px !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }

    :deep(.v-field__append-inner) {
      padding-top: 4px !important;
    }

    :deep(.v-label) {
      font-size: 0.8rem;
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
}
</style>
