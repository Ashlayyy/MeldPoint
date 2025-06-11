<template>
  <v-card class="mb-6 tasks-card" elevation="0">
    <!-- Filters -->
    <div class="px-4 pt-4">
      <TodoFilters @update-filters="handleFiltersUpdate" :initial-filters="localFilters" :status-cache="statusCache" />
    </div>

    <v-tabs v-model="activeTab" class="mt-2">
      <v-tab value="open">Openstaand</v-tab>
      <v-tab value="completed">Afgerond </v-tab>
      <!-- <v-tab value="completed">Afgerond ({{ completedTasks.length }})</v-tab> -->
    </v-tabs>

    <v-card-text class="pa-0 tasks-scroll-container">
      <v-window v-model="activeTab">
        <!-- Open Tasks Tab -->
        <v-window-item value="open">
          <div class="tasks-container">
            <!-- Overdue Tasks Section -->
            <template v-if="exceedingTasks.length > 0">
              <TodoTaskSegment
                title="Overschreden deadlines"
                segment-class="exceeding-segment"
                header-class="exceeding-header"
                icon="mdi-alert-circle"
                icon-color="error"
                :tasks="exceedingTasks"
                ref="exceedingSegmentRef"
              >
                <div class="tasks-section">
                  <TodoTaskItem
                    v-for="task in exceedingTasks"
                    :key="task.id"
                    :task="task"
                    :status-cache="statusCache"
                    :show-deadline="true"
                    :expanded-task-id="expandedTaskId"
                    @toggle-status="toggleTaskStatus"
                    @open-melding="openMeldingItem"
                    @open-url="openMeldingUrl"
                    @more-menu="openMoreMenu"
                    @expand-task="handleTaskExpand"
                  />
                </div>
              </TodoTaskSegment>
            </template>

            <!-- Regular Tasks Section -->
            <TodoTaskSegment
              title="Aankomende deadlines"
              segment-class="upcoming-segment"
              header-class="upcoming-header"
              icon="mdi-clock-fast"
              icon-color="warning"
              :tasks="upcomingTasks"
              ref="upcomingSegmentRef"
            >
              <div class="date-groups">
                <template v-for="(taskGroup, date) in nonExceedingGroupedTasks" :key="date">
                  <TodoDateGroup
                    :date="date"
                    :is-today="isToday(date)"
                    :is-selected="isSelectedDate(date)"
                    :formatted-date="formatDateHeader(date)"
                  >
                    <TodoTaskItem
                      v-for="task in taskGroup"
                      :key="task.id"
                      :task="task"
                      :status-cache="statusCache"
                      :is-highlighted="isSelectedDate(task.deadline)"
                      :expanded-task-id="expandedTaskId"
                      @toggle-status="toggleTaskStatus"
                      @open-melding="openMeldingItem"
                      @open-url="openMeldingUrl"
                      @more-menu="openMoreMenu"
                      @expand-task="handleTaskExpand"
                    />
                  </TodoDateGroup>
                </template>
              </div>
            </TodoTaskSegment>
          </div>
        </v-window-item>

        <!-- Completed Tasks Tab -->
        <v-window-item value="completed">
          <div class="tasks-container">
            <div class="task-segment completed-segment">
              <!-- Group completed tasks by date -->
              <template v-for="(taskGroup, date) in completedGroupedTasks" :key="date">
                <TodoDateGroup
                  :date="date"
                  :is-today="isToday(date)"
                  :is-selected="isSelectedDate(date)"
                  :formatted-date="formatDateHeader(date)"
                >
                  <TodoTaskItem
                    v-for="task in taskGroup"
                    :key="task.id"
                    :task="task"
                    :status-cache="statusCache"
                    :expanded-task-id="expandedTaskId"
                    @toggle-status="toggleTaskStatus"
                    @open-melding="openMeldingItem"
                    @open-url="openMeldingUrl"
                    @more-menu="openMoreMenu"
                    @expand-task="handleTaskExpand"
                  />
                </TodoDateGroup>
              </template>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import TodoTaskItem from './TodoTaskItem.vue';
import TodoTaskSegment from './TodoTaskSegment.vue';
import TodoDateGroup from './TodoDateGroup.vue';
import TodoFilters from './TodoFilters.vue';

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  statusCache: {
    type: Object,
    required: true
  },
  selectedDate: {
    type: Date,
    default: undefined
  },
  activeFilters: {
    type: Object,
    default: () => null
  }
});

const emit = defineEmits(['toggle-task-status', 'open-melding', 'open-url', 'more-menu', 'task-updated']);

// Tab state
const activeTab = ref('open');

// Track which task is currently expanded
const expandedTaskId = ref<string | null>(null);

// Local filters state
const localFilters = ref(props.activeFilters);

// Handle filters update
function handleFiltersUpdate(filters: Record<string, any>) {
  localFilters.value = filters;
  emit('task-updated', localFilters.value);
}

// Segment refs for scrolling
const exceedingSegmentRef = ref<{ segmentRef: HTMLElement | null } | null>(null);
const upcomingSegmentRef = ref<{ segmentRef: HTMLElement | null } | null>(null);

// Filtered tasks
const filteredTasks = computed(() => {
  let tasks = props.tasks as Record<string, any>[];

  // Apply active filters from the filters component
  if (localFilters.value) {
    // Filter by action type
    if (localFilters.value.actionType) {
      tasks = tasks.filter((task) => task.actionType === localFilters.value.actionType);
    }

    // Filter by category
    if (localFilters.value.category) {
      tasks = tasks.filter((task) => task.category === localFilters.value.category);
    }

    // Filter by completion status
    if (localFilters.value.finished !== null && localFilters.value.finished !== undefined) {
      tasks = tasks.filter((task) => task.finished === localFilters.value.finished);
    }

    // Filter by item status (correctief/preventief status)
    if (localFilters.value.itemStatus) {
      tasks = tasks.filter((task) => {
        if (task.actionType !== 'traject') return true;

        // Get the status from the cached data
        const cacheKey = `${task.category}-${task.correctiefId || task.preventiefId}`;
        const statusData = props.statusCache[cacheKey];

        if (statusData) {
          return statusData.id === localFilters.value.itemStatus;
        }
        return false;
      });
    }

    // Filter by melding status (status name)
    if (localFilters.value.meldingStatus) {
      tasks = tasks.filter((task) => {
        // Get the status from the cached data
        const cacheKey = `${task.category}-${task.correctiefId || task.preventiefId}`;
        const statusData = props.statusCache[cacheKey];

        if (statusData) {
          return statusData.StatusNaam === localFilters.value.meldingStatus;
        }
        return false;
      });
    }

    // Filter by date range
    if (localFilters.value.startDate) {
      const startDate = new Date(localFilters.value.startDate);
      tasks = tasks.filter((task) => new Date(task.deadline) >= startDate);
    }

    if (localFilters.value.endDate) {
      const endDate = new Date(localFilters.value.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      tasks = tasks.filter((task) => new Date(task.deadline) <= endDate);
    }

    // Filter by status (exceeding/upcoming)
    if (localFilters.value.status) {
      const now = new Date();
      if (localFilters.value.status === 'exceeding') {
        tasks = tasks.filter((task) => new Date(task.deadline) < now);
      } else if (localFilters.value.status === 'upcoming') {
        tasks = tasks.filter((task) => new Date(task.deadline) >= now);
      }
    }
  }

  return tasks;
});

// Tasks by completion status
const completedTasks = computed(() => {
  return filteredTasks.value.filter((task: Record<string, any>) => task.finished);
});

const uncompletedTasks = computed(() => {
  return filteredTasks.value.filter((task: Record<string, any>) => {
    // Base check: task must not be marked as finished
    if (task.finished) {
      return false;
    }

    // Additional check for 'traject' tasks using statusCache
    if (task.actionType === 'traject') {
      const cacheKey = `${task.category}-${task.correctiefId || task.preventiefId}`;
      const statusData = props.statusCache[cacheKey];

      // If status is 'Afgerond' in the cache, consider it completed
      if (statusData && statusData.StatusNaam === 'Afgerond') {
        return false; // Filter out completed traject tasks
      }
    }

    // If not finished and not a completed traject task, keep it
    return true;
  });
});

// Exceeding tasks (overdue)
const exceedingTasks = computed(() => {
  const now = new Date();
  return uncompletedTasks.value
    .filter((task: Record<string, any>) => new Date(task.deadline) < now)
    .sort((a: Record<string, any>, b: Record<string, any>) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
});

// Upcoming tasks
const upcomingTasks = computed(() => {
  const now = new Date();
  return uncompletedTasks.value
    .filter((task: Record<string, any>) => new Date(task.deadline) >= now)
    .sort((a: Record<string, any>, b: Record<string, any>) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
});

// Grouped tasks
const nonExceedingGroupedTasks = computed(() => {
  const now = new Date();
  const tasks = filteredTasks.value
    .filter((task: Record<string, any>) => {
      // Only filter by date range, not by completion status
      const isNotExceeding = new Date(task.deadline) >= now;
      return isNotExceeding;
    })
    .sort((a: Record<string, any>, b: Record<string, any>) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return tasks.reduce((groups: Record<string, any[]>, task: Record<string, any>) => {
    const date = new Date(task.deadline).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});
});

const completedGroupedTasks = computed(() => {
  const tasks = completedTasks.value.sort(
    (a: Record<string, any>, b: Record<string, any>) =>
      new Date(b.completedAt || b.deadline).getTime() - new Date(a.completedAt || a.deadline).getTime()
  );

  return tasks.reduce((groups: Record<string, any[]>, task: Record<string, any>) => {
    const date = new Date(task.completedAt || task.deadline).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});
});

// Date helpers
function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}

function isSelectedDate(date: string) {
  return props.selectedDate && new Date(date).toDateString() === props.selectedDate.toDateString();
}

function formatDateHeader(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Action handlers
function toggleTaskStatus(task: any) {
  emit('toggle-task-status', task);
}

function openMeldingItem(task: any) {
  emit('open-melding', task);
}

function openMeldingUrl(url: string) {
  emit('open-url', url);
}

function openMoreMenu(task: any) {
  emit('more-menu', task);
}

// Scrolling functions
function scrollToExceedingTasks() {
  if (exceedingTasks.value.length === 0) return;

  activeTab.value = 'open';
  nextTick(() => {
    const scrollContainer = document.querySelector('.tasks-scroll-container');
    if (scrollContainer && exceedingSegmentRef.value?.segmentRef) {
      const segmentTop = exceedingSegmentRef.value.segmentRef.offsetTop;
      scrollContainer.scrollTo({
        top: segmentTop - 16,
        behavior: 'smooth'
      });
    }
  });
}

function scrollToUpcomingTasks() {
  if (upcomingTasks.value.length === 0) return;

  activeTab.value = 'open';
  nextTick(() => {
    const scrollContainer = document.querySelector('.tasks-scroll-container');
    if (scrollContainer && upcomingSegmentRef.value?.segmentRef) {
      const segmentTop = upcomingSegmentRef.value.segmentRef.offsetTop;
      scrollContainer.scrollTo({
        top: segmentTop - 16,
        behavior: 'smooth'
      });
    }
  });
}

// Expose scrolling methods and additional data
defineExpose({
  exceedingTasks,
  upcomingTasks,
  completedTasks,
  scrollToExceedingTasks,
  scrollToUpcomingTasks,
  showCompletedTasks
});

// Add method to switch to the completed tab
function showCompletedTasks() {
  activeTab.value = 'completed';
}

// Handle task expansion
function handleTaskExpand(taskId: string | null) {
  expandedTaskId.value = taskId;
}
</script>

<style scoped lang="scss">
.tasks-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 32px);
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: rgb(var(--v-theme-surface));
}

.tasks-scroll-container {
  flex: 1;
  overflow-y: auto;
  height: 100%;
  padding: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 4px;

    &:hover {
      background-color: rgba(var(--v-theme-on-surface), 0.3);
    }
  }
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.max-width-200 {
  max-width: 200px;
}

.date-groups {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.task-segment {
  &.completed-segment {
    background-color: rgb(var(--v-theme-surface));
    border-radius: 8px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    overflow: hidden;
    margin-bottom: 12px;
  }
}

.v-chip + .v-chip {
  margin-left: 2px;
}
</style>
