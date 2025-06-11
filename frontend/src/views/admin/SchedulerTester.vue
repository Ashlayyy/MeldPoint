<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">Scheduler Tester</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">
              {{ error }}
            </v-alert>

            <!-- Task List -->
            <v-list v-if="tasks.length > 0">
              <v-list-item v-for="task in tasks" :key="task.name" :value="task">
                <template v-slot:prepend>
                  <v-switch
                    v-model="task.enabled"
                    color="primary"
                    hide-details
                    @update:model-value="(value: any) => toggleTask(task.name, value)"
                    :loading="loadingStates[task.name]?.toggle"
                  ></v-switch>
                </template>

                <v-list-item-title class="text-subtitle-1 font-weight-bold mb-1">
                  {{ task.name }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="d-flex align-center mt-2">
                    <v-chip size="small" :color="getStatusColor(task.status)" class="mr-2">
                      {{ task.status }}
                    </v-chip>
                    <span v-if="task.lastRun" class="text-caption mr-4"> Last Run: {{ formatDate(task.lastRun) }} </span>
                    <span v-if="task.nextRun" class="text-caption"> Next Run: {{ formatDate(task.nextRun) }} </span>
                  </div>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    :loading="loadingStates[task.name]?.trigger"
                    @click="triggerTask(task.name)"
                  >
                    Trigger Now
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <!-- Loading State -->
            <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

            <!-- Empty State -->
            <v-alert v-if="!loading && tasks.length === 0" type="info" variant="tonal"> No scheduled tasks found. </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { schedulerApi, type Task } from '@/API/scheduler';

interface LoadingState {
  trigger?: boolean;
  toggle?: boolean;
}

interface LoadingStates {
  [key: string]: LoadingState;
}

const notificationStore = useNotificationStore();
const tasks = ref<Task[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const loadingStates = ref<LoadingStates>({});

// Fetch all tasks
const fetchTasks = async () => {
  try {
    loading.value = true;
    error.value = null;
    tasks.value = await schedulerApi.getAllTasks();
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch tasks';
    notificationStore.error({
      message: 'Failed to fetch scheduler tasks'
    });
  } finally {
    loading.value = false;
  }
};

// Toggle task enabled state
const toggleTask = async (taskName: string, enabled: boolean) => {
  notificationStore.promise({
    message: `${enabled ? 'Enabling' : 'Disabling'} ${taskName}`,
  })

  if (!loadingStates.value[taskName]) {
    loadingStates.value[taskName] = {};
  }
  loadingStates.value[taskName].toggle = true;

  try {
    let response;
    if (enabled) {
      response = await schedulerApi.enableTask(taskName);
    } else {
      response = await schedulerApi.disableTask(taskName);
    }
    console.log(response);
    notificationStore.resolvePromise({
      message: `Task ${taskName} ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (err: any) {
    error.value = err.response?.data?.error || `Failed to ${enabled ? 'enable' : 'disable'} task`;
    notificationStore.rejectPromise({
      message: `Failed to ${enabled ? 'enable' : 'disable'} task ${taskName}`
    });
    // Revert the switch state
    const task = tasks.value.find((t) => t.name === taskName);
    if (task) {
      task.enabled = !enabled;
    }
  } finally {
    if (loadingStates.value[taskName]) {
      loadingStates.value[taskName].toggle = false;
    }
  }
};

// Trigger task manually
const triggerTask = async (taskName: string) => {
  notificationStore.promise({
    message: `Triggering ${taskName}`,
  })

  if (!loadingStates.value[taskName]) {
    loadingStates.value[taskName] = {};
  }
  loadingStates.value[taskName].trigger = true;

  try {
    await schedulerApi.triggerTask(taskName);
    notificationStore.resolvePromise({
      message: `Task ${taskName} triggered successfully`
    });
    await fetchTasks();
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to trigger task';
    notificationStore.rejectPromise({
      message: `Failed to trigger task ${taskName}`
    });
  } finally {
    if (loadingStates.value[taskName]) {
      loadingStates.value[taskName].trigger = false;
    }
  }
};

// Format date for display
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};

// Get status color for chip
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    running: 'primary',
    completed: 'success',
    failed: 'error',
    pending: 'warning',
    disabled: 'grey'
  };
  return statusColors[status.toLowerCase()] || 'grey';
};

// Initial fetch
onMounted(fetchTasks);
</script>

<style scoped>
.wrap-label {
  white-space: normal;
  word-break: break-word;
}
</style>
