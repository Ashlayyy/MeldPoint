<template>
  <v-container fluid class="pa-4">
    <h5 v-if="selectedUserName" class="text-subtitle-1 text-medium-emphasis mb-4">Taken voor: {{ selectedUserName }}</h5>

    <div class="todos-page">
      <TodoKPISection class="hidden-sm-and-down" :kpi-items="kpiItems" @kpi-click="handleKpiClick" />

      <v-row>
        <v-col cols="12" md="5" lg="4" class="order-md-2">
          <TodoCalendarCard :tasks="currentUserTasks" @day-click="onDayClick" />
        </v-col>

        <!-- Left Column: Tasks List - Will appear second on mobile -->
        <v-col cols="12" md="7" lg="8" class="order-md-1">
          <!-- Show spinner while loading -->
          <div v-if="taskStore.loading || isLoading" class="d-flex justify-center align-center" style="height: 400px">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <!-- Main Tasks Card -->
          <TodoTasksCard
            v-else
            :tasks="currentUserTasks"
            :status-cache="statusCache"
            :selected-date="selectedDate || undefined"
            :active-filters="activeFilters"
            ref="tasksCardRef"
            @toggle-task-status="toggleTaskStatus"
            @open-melding="openMeldingItem"
            @open-url="openMeldingUrl"
            @more-menu="openMoreMenu"
            @task-updated="handleFiltersUpdate"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import i18n from '@/main';
import { useTaskStore } from '@/stores/task_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { Task } from '@/stores/task_store';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/verbeterplein/user_store';

import TodoCalendarCard from '@/components/tasks/TodoCalendarCard.vue';
import TodoKPISection from '@/components/tasks/TodoKPISection.vue';
import TodoTasksCard from '@/components/tasks/TodoTasksCard.vue';
import { usePageStore } from '@/stores/pageStore';

const isLoading = ref(false);
const t = i18n.global.t;
const taskStore = useTaskStore();
const actiehouderStore = useActiehouderStore();
const authStore = useAuthStore();
const pageStore = usePageStore();
const userStore = useUserStore();
const currentUserId = ref('');
const selectedUserIdFilter = ref<string | null>(null);
const statusCache = ref<Record<string, any>>({});
const selectedDate = ref<Date | null>(null);
const activeFilters = ref<Record<string, any>>({});

const tasksCardRef = ref<{
  scrollToExceedingTasks: () => void;
  scrollToUpcomingTasks: () => void;
  showCompletedTasks: () => void;
} | null>(null);

// Determine the target user ID based on filter or logged-in user
const targetUserId = computed(() => {
  return selectedUserIdFilter.value || currentUserId.value;
});

const currentUserTasks = computed(() => {
  if (!targetUserId.value) {
    console.log('No target user ID found');
    return [];
  }
  return taskStore.getTasksByUserId(targetUserId.value);
});

const totalTasks = computed(() => currentUserTasks.value.length);

const completedTodos = computed(() => currentUserTasks.value.filter((task: Task) => task.finished));

const exceedingTasks = computed(() => {
  const now = new Date();
  return currentUserTasks.value
    .filter((task: Task) => !task.finished && new Date(task.deadline) < now)
    .sort((a: Task, b: Task) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
});

const upcomingTasks = computed(() => {
  const now = new Date();
  return currentUserTasks.value
    .filter((task: Task) => !task.finished && new Date(task.deadline) >= now)
    .sort((a: Task, b: Task) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
});

// Computed properties for KPIs formatting for new display style
const kpiItems = computed(() => [
  {
    title: 'Overschreden',
    value: exceedingTasks.value.length,
    color: 'error',
    action: scrollToExceedingTasks,
    clickable: exceedingTasks.value.length > 0
  },
  {
    title: 'Aankomend',
    value: upcomingTasks.value.length,
    color: 'warning',
    action: scrollToUpcomingTasks,
    clickable: upcomingTasks.value.length > 0
  },
  {
    title: 'Afgerond',
    value: completedTodos.value.length,
    color: 'success',
    action: showCompletedTasks,
    clickable: completedTodos.value.length > 0
  },
  {
    title: 'Totaal',
    value: totalTasks.value,
    color: 'primary',
    action: null,
    clickable: false
  }
]);

// Computed property to get the selected user's name
const selectedUserName = computed(() => {
  if (!selectedUserIdFilter.value) {
    return null;
  }

  const userIdToFind = selectedUserIdFilter.value;
  const user = userStore.getUserByIdForPDCA(userIdToFind);

  if (user) {
    return user.Name;
  } else {
    return null;
  }
});

// Event handlers
function onDayClick(date: Date) {
  selectedDate.value = selectedDate.value && selectedDate.value.toDateString() === date.toDateString() ? null : date;

  // Scrolling to selected date is now handled by the tasks card component
  if (selectedDate.value) {
    scrollToSelectedDate();
  }
}

function scrollToSelectedDate() {
  if (!selectedDate.value) return;

  // Call the appropriate scrolling function in the tasks card
  if (tasksCardRef.value) {
    const dateString = selectedDate.value.toDateString();
    const now = new Date();

    // If the date is in the past, scroll to exceeding tasks section
    if (selectedDate.value < now) {
      tasksCardRef.value.scrollToExceedingTasks();
    } else {
      // Otherwise explicitly tell tasks card to scroll to the selected date
      nextTick(() => {
        const dateHeader = document.querySelector(`.tasks-scroll-container [data-date="${dateString}"]`);
        if (dateHeader) {
          const scrollContainer = document.querySelector('.tasks-scroll-container');
          if (scrollContainer) {
            const headerTop = dateHeader.getBoundingClientRect().top;
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const scrollTop = headerTop - containerTop + scrollContainer.scrollTop - 16;

            scrollContainer.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  }
}

function scrollToExceedingTasks() {
  if (tasksCardRef.value) {
    tasksCardRef.value.scrollToExceedingTasks();
  }
}

function scrollToUpcomingTasks() {
  if (tasksCardRef.value) {
    tasksCardRef.value.scrollToUpcomingTasks();
  }
}

async function toggleTaskStatus(task: Task) {
  try {
    // Store the original state in case we need to revert
    const originalState = task.finished;

    // Optimistic UI update
    const taskInstance = taskStore.getTaskById(task.id);
    if (taskInstance) {
      taskInstance.finished = task.finished;
      taskInstance.completedAt = task.finished ? new Date() : null;
    }

    // Update in database
    await taskStore.updateTask(task.id, task.category || 'unknown', {
      completedAt: task.finished ? new Date() : null,
      finished: task.finished
    });
  } catch (error) {
    console.error('Failed to update task status:', error);

    // Revert optimistic update if there was an error
    const taskInstance = taskStore.getTaskById(task.id);
    if (taskInstance) {
      taskInstance.finished = !task.finished;
      taskInstance.completedAt = !task.finished ? new Date() : null;
    }
  }
}

function openMeldingItem(task: Task) {
  // Implement melding item opening
  console.log('Opening melding item:', task.id);
}

function openMeldingUrl(url: string) {
  if (url) {
    window.open(url, '_blank');
  }
}

function openMoreMenu(task: Task) {
  // This would show a menu with more actions
  console.log('Opening more options for task', task.id);
}

function showCompletedTasks() {
  if (tasksCardRef.value) {
    tasksCardRef.value.showCompletedTasks();
  }
}

function handleKpiClick(kpi: any) {
  if (kpi.action) {
    kpi.action();
  }
}

// Function to handle filter updates from TodoTasksCard
async function handleFiltersUpdate(filters: Record<string, any>) {
  console.log('[TasksPage] handleFiltersUpdate received:', filters); // Log 1: Check if function runs and what it gets
  activeFilters.value = filters; // Update local activeFilters state
  const newUserId = filters.userId || null;
  console.log('[TasksPage] Current selectedUserIdFilter:', selectedUserIdFilter.value, ' | Incoming userId:', newUserId); // Log 2: Check values before comparison

  // Check if the user filter changed
  if (selectedUserIdFilter.value !== newUserId) {
    console.log('[TasksPage] User filter changed. Updating selectedUserIdFilter...'); // Log 3: Indicate change detection
    selectedUserIdFilter.value = newUserId;
    console.log('[TasksPage] Updated selectedUserIdFilter:', selectedUserIdFilter.value); // Log 4: Confirm update
    // Fetch tasks for the new target user
    await fetchAndDisplayTasks();
  }
}

// Refactored task fetching logic
async function fetchAndDisplayTasks() {
  if (!targetUserId.value) {
    console.warn('Cannot fetch tasks: No target user ID.');
    return;
  }
  isLoading.value = true;
  try {
    await taskStore.fetchTasksByUserId(targetUserId.value);
    await loadTaskStatuses();
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    isLoading.value = false;
  }
}

// Load data on mount
onMounted(async () => {
  pageStore.setPageInfo(`Taakoverzicht`, [
    { title: t('verbeterplein.breadcrumbs.home'), href: '/' },
    { title: t('verbeterplein.breadcrumbs.verbeterplein'), href: '/todos' }
  ]);
  // Initialize actiehouder store first to ensure user names are available
  if (!actiehouderStore.initialized) {
    await actiehouderStore.initializeData();
  }

  // Get current user ID from auth store
  currentUserId.value = getCurrentUserId();
  await fetchAndDisplayTasks();
});

// Function to get current user ID from auth store
function getCurrentUserId(): string {
  if (!authStore.user || !authStore.user.id) {
    console.warn('User not authenticated or user ID not available');
    return '';
  }
  return authStore.user.id;
}

// Function to load task statuses for displayed tasks
async function loadTaskStatuses() {
  await getTaskStatus(currentUserTasks.value);
}

async function getTaskStatus(tasks: Task[]) {
  if (!tasks || tasks.length === 0) return null;
  try {
    const DataIds = currentUserTasks.value.map((task: Task) => {
      return {
        id: task.id,
        category: task.category
      };
    });
    const items = await taskStore.findByIds(DataIds);

    items.forEach((item: any) => {
      const cacheKey = `${item.category}-${item.correctiefId || item.preventiefId}`;
      statusCache.value[cacheKey] = item;
    });

    return items;
  } catch (error) {
    console.error('Error fetching status for task:', error);
    return null;
  }
}
</script>

<style scoped>
.kpi-card:hover {
  background-color: rgba(0, 0, 0, 0.03);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
