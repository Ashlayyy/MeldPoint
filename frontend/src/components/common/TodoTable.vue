<template>
  <!-- Action List Section -->
  <div class="d-flex flex-column mt-0">
    <div class="d-flex align-center justify-space-between mt-8 mb-4">
      <div class="d-flex align-center">
        <v-icon color="primary" size="24" class="mr-2">mdi-format-list-checks</v-icon>
        <div class="d-flex align-center">
          <div class="text-h5">{{ title }}</div>
          <!-- <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-chip v-bind="props" color="success" size="x-small" class="ml-2 font-weight-bold" variant="flat"> BETA </v-chip>
            </template>
            In de volgende update word je ook herinnerd aan deze acties
          </v-tooltip> -->
        </div>
      </div>
      <template v-if="isPreventiveActionDisabled">
        <v-tooltip text="De PLAN-fase van de PDCA moet eerst ingevuld zijn." location="top">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-plus" class="attachment-add-btn" disabled>
                Actie toevoegen
              </v-btn>
            </div>
          </template>
        </v-tooltip>
      </template>
      <template v-else>
        <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="startNewAction" class="attachment-add-btn">
          Actie toevoegen
        </v-btn>
      </template>
    </div>

    <!-- Action Dialog -->
    <v-dialog v-model="showActionDialog" max-width="500px" min-height="600px">
      <v-card>
        <v-card-title class="text-h4" :class="newAction.id ? 'bg-secondary' : 'bg-primary'">
          {{ newAction.id ? 'Actie bewerken' : 'Nieuwe Actie' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex align-center gap-4 mt-4">
            <v-icon color="primary" size="24">mdi-account-outline</v-icon>
            <v-select
              v-model="newAction.userId"
              :items="actiehouderStore.actiehouders"
              item-title="Name"
              item-value="id"
              label="Actiehouder"
              variant="outlined"
              density="compact"
              hide-details="auto"
              class="flex-grow-1"
              placeholder="Selecteer een actiehouder"
            ></v-select>
          </div>
          <div class="d-flex flex-column gap-4 mt-4">
            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-text-box-outline</v-icon>
              <v-textarea
                v-model="newAction.description"
                label="Actie"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="flex-grow-1"
                rows="3"
                placeholder="Beschrijf de actie die uitgevoerd moet worden"
              ></v-textarea>
            </div>

            <div class="d-flex align-center gap-4">
              <v-icon color="primary" size="24">mdi-calendar-outline</v-icon>
              <div class="flex-grow-1">
                <div class="position-relative">
                  <Datepicker
                    v-model="newAction.deadline"
                    :mondayFirst="true"
                    :enableTimePicker="false"
                    :disabled-dates="disabledDates"
                    format="dd-MM-yyyy"
                    class="date-picker-field"
                    placeholder="Kies een deadline"
                  >
                    <template v-slot:trigger>
                      <v-text-field
                        :model-value="newAction.deadline ? formatDate(newAction.deadline as string) : ''"
                        label="Deadline"
                        variant="outlined"
                        density="comfortable"
                        hide-details="auto"
                        readonly
                        placeholder="Kies een deadline"
                        :hint="getDeadlineHint"
                        persistent-hint
                      >
                      </v-text-field>
                    </template>
                  </Datepicker>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showActionDialog = false" :disabled="saving"> Annuleren </v-btn>
          <v-btn
            :color="newAction.id ? 'secondary' : 'primary'"
            variant="flat"
            @click="saveNewAction"
            :loading="saving"
            :disabled="!isValidAction"
          >
            {{ newAction.id ? 'Bijwerken' : 'Opslaan' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="isLoading">
      <v-progress-circular indeterminate />
    </div>
    <div v-else>
      <v-table density="compact" class="action-table">
        <thead>
          <tr>
            <th class="column-who">Wie</th>
            <th class="column-action">Actie</th>
            <th class="column-deadline">Deadline</th>
            <th class="column-actions">Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>
              <v-tooltip :text="task.user?.Name" location="top">
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="initials">{{ getInitials(task.user?.Name) || 'N/A' }}</span>
                </template>
              </v-tooltip>
            </td>
            <td>
              <v-menu :close-on-content-click="false" location="top" :disabled="!isLongText(task.action)" max-width="300">
                <template v-slot:activator="{ props }">
                  <div
                    v-bind="props"
                    class="action-text"
                    :class="{ 'finished-task': task.finished }"
                    :style="{ cursor: isLongText(task.action) ? 'pointer' : 'default' }"
                  >
                    {{ task.action }}
                  </div>
                </template>
                <v-card class="action-popover">
                  <v-card-text class="action-popover-content" :class="{ 'finished-task': task.finished }">
                    {{ task.action }}
                  </v-card-text>
                </v-card>
              </v-menu>
            </td>
            <td :class="{ 'finished-task': task.finished }">{{ formatDate(task.deadline) }}</td>
            <td class="text-center">
              <v-tooltip text="Actie voltooien" location="top">
                <template v-slot:activator="{ props }">
                  <v-checkbox
                    v-bind="props"
                    v-model="task.finished"
                    @update:model-value="(value) => updateTaskFinished(task.id, value)"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                </template>
              </v-tooltip>
              <v-btn icon="mdi-pencil" variant="text" density="compact" size="small" @click="editAction(task)"> </v-btn>
              <v-btn icon="mdi-delete" variant="text" density="compact" size="small" color="error" @click="deleteAction(task)"> </v-btn>
            </td>
          </tr>
          <tr v-if="tasks.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis">Nog geen acties toegevoegd</td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>

  <br>

  <v-dialog v-model="showDeleteConfirmDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h5 bg-error text-white pa-4"> Actie verwijderen </v-card-title>
      <v-card-text class="pa-4 pt-6">
        <p>Weet je zeker dat je deze actie wilt verwijderen?</p>
        <p class="text-caption mt-2">Deze actie kan niet ongedaan worden gemaakt.</p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="showDeleteConfirmDialog = false"> Annuleren </v-btn>
        <v-btn color="error" variant="flat" @click="confirmDelete"> Verwijderen </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Datepicker from 'vuejs3-datepicker';

import { formatDate } from '@/utils/helpers/dateHelpers';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useTaskStore } from '@/stores/task_store';
import { push } from 'notivue';

const notificationStore = useNotificationStore();
const actiehouderStore = useActiehouderStore();
const taskStore = useTaskStore();
const showActionDialog = ref(false);
const level = ref<number>(0);

const props = defineProps<{
  item: any;
  id: string;
  type: 'correctief' | 'preventief';
  title: string;
}>();

const emit = defineEmits<{
  (e: 'update', value: [boolean, boolean]): void;
  (e: 'tasksUpdated'): void;
  (e: 'task-created'): void;
}>();

const { t } = useI18n();
const showDeleteConfirmDialog = ref(false);
const taskToDelete = ref<any>(null);

const saving = ref(false);
const newAction = ref<{
  description: string;
  userId: null | undefined;
  deadline: string | Date;
  finished: boolean;
  id: string | null;
}>({
  description: '',
  userId: null,
  deadline: '',
  finished: false,
  id: null
});

const isValidAction = computed(() => {
  return newAction.value.description && newAction.value.userId && newAction.value.deadline;
});

const getDeadlineHint = computed(() => {
  let maxDate = null;

  if (props.type === 'correctief' && props.item?.Correctief?.Deadline) {
    maxDate = props.item.Correctief.Deadline;
  } else if (props.type === 'preventief' && props.item?.Preventief?.Deadline) {
    maxDate = props.item.Preventief.Deadline;
  }

  const formattedDate = maxDate ? formatDate(maxDate) : 'onbepaald';
  return `Deadline tussen vandaag en ${formattedDate}`;
});

const disabledDates = computed(() => {
  let deadline = null;

  if (props.type === 'correctief' && props.item?.Correctief?.Deadline) {
    deadline = props.item.Correctief.Deadline;
  } else if (props.type === 'preventief' && props.item?.Preventief?.Deadline) {
    deadline = props.item.Preventief.Deadline;
  }

  return {
    from: deadline ? new Date(deadline) : null,
    to: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
  };
});

// Add function to get initials from full name
const getInitials = (name: string | undefined) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const tasks = ref<any[]>([]);
const isLoading = ref(false);

const fetchTasks = async () => {
  if (!props.item) return;

  let fetchedTasks: any[] = [];

  if (props.type === 'correctief') {
    if (!props.item.Correctief) return;
    fetchedTasks = await taskStore.fetchTasksByCorrectief(props.item.Correctief.id);
  } else if (props.type === 'preventief') {
    if (!props.item.Preventief) return;
    fetchedTasks = await taskStore.fetchTasksByPreventief(props.item.Preventief.id);
  }

  tasks.value = fetchedTasks.filter((task) => task.actionType === 'task');
};

watch(
  () => [props.type, props.item],
  async () => {
    isLoading.value = true;
    try {
      fetchTasks();
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

const editAction = (task: any) => {
  // Set the newAction values to the existing task's values
  newAction.value = {
    description: task.action,
    userId: task.userId,
    deadline: task.deadline,
    finished: task.finished || false,
    id: task.id
  };
  showActionDialog.value = true;
};

const startNewAction = () => {
  newAction.value = {
    description: '',
    userId: null,
    deadline: '',
    finished: false,
    id: null
  };
  showActionDialog.value = true;
};

const updateTaskFinished = async (taskId: string, finished: boolean | null) => {
  try {
    notificationStore.promise({
      message: t('notifications.updating_status')
    });

    console.log('updateTaskFinished', taskId, finished);

    await taskStore.updateTask(taskId, props.type, {
      completedAt: finished ? new Date() : null,
      finished: finished || false
    });

    notificationStore.resolvePromise({
      message: t('notifications.status_updated')
    });
  } catch (error) {
    notificationStore.rejectPromise({
      message: t('errors.status_update_failed')
    });
  }
};

const isLongText = (text: string) => {
  return text.length > 50;
};

const saveNewAction = async () => {
  if (!isValidAction.value || !props.item?.Correctief?.id) return;

  saving.value = true;
  try {
    notificationStore.promise({
      message: newAction.value.id ? 'Actie wordt bijgewerkt...' : 'Actie wordt opgeslagen...'
    });

    // Ensure deadline is in ISO format with time component
    let deadline = newAction.value.deadline;
    if (deadline && typeof deadline === 'object' && 'toISOString' in deadline) {
      deadline = deadline.toISOString(); // Convert Date object to ISO string
    }

    if (!newAction.value.userId) {
      push.error({
        message: t('errors.user_not_found')
      });
      return;
    }

    if (newAction.value.id) {
      await taskStore.updateTask(newAction.value.id, props.type, {
        action: newAction.value.description,
        userId: newAction.value.userId,
        deadline: deadline
      });
    } else {
      if (!props.type || !['correctief', 'preventief'].includes(props.type)) {
        push.error({
          message: 'Deze actie kan niet worden opgeslagen, er is iets fout gegaan.'
        });
        return;
      }

      if (props.type === 'correctief') {
        level.value = 0;
      } else if (props.type === 'preventief' && props.item?.Preventief?.rootCauseLevel === 1) {
        level.value = 1;
      } else if (props.type === 'preventief') {
        level.value = 2;
      } else {
        level.value = 0;
      }

      await taskStore.createTask({
        message: newAction.value.description,
        userId: newAction.value.userId,
        action: newAction.value.description,
        level: level.value,
        actionType: 'task',
        category: props.type,
        targetId: props.id,
        url: window.location.origin + getShareableUrl(),
        deadline: deadline,
        finished: newAction.value.finished
      });

      // Emit event specifically for creation
      emit('task-created');
    }

    // Fetch tasks locally AND emit event
    fetchTasks();
    emit('tasksUpdated');

    showActionDialog.value = false;
    newAction.value = {
      description: '',
      userId: null,
      deadline: '',
      finished: false,
      id: null
    };

    notificationStore.resolvePromise({
      message: newAction.value.id ? 'Actie succesvol bijgewerkt' : 'Actie succesvol opgeslagen'
    });
  } catch (error) {
    notificationStore.rejectPromise({
      message: 'Er is een fout opgetreden bij het opslaan van de actie'
    });
  } finally {
    saving.value = false;
  }
};

const getShareableUrl = () => {
  if (props.item?.VolgNummer) {
    return `/verbeterplein/melding/${props.item.VolgNummer}`;
  }
  return null;
};

const deleteAction = async (task: any) => {
  taskToDelete.value = task;
  showDeleteConfirmDialog.value = true;
};

const confirmDelete = async () => {
  if (!taskToDelete.value) return;

  try {
    notificationStore.promise({
      message: t('notifications.deleting_action')
    });

    await taskStore.deleteTask(taskToDelete.value.id, props.type);

    notificationStore.resolvePromise({
      message: t('notifications.action_deleted')
    });
    // Fetch tasks locally AND emit event
    fetchTasks();
    emit('tasksUpdated');
  } catch (error) {
    notificationStore.rejectPromise({
      message: t('errors.delete_failed')
    });
  } finally {
    showDeleteConfirmDialog.value = false;
    taskToDelete.value = null;
  }
};

const isPreventiveActionDisabled = computed(() => {
  return false; // prevent disabling for now untill legacy stuff is gone.
  // if (props.type === 'correctief') return false;
  // else if (props.item?.Preventief?.rootCauseLevel < 2) return false;
  // return props.item?.Preventief?.Steps?.Plan?.Finished !== true;
});
</script>

<style scoped lang="scss">
.action-table {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  overflow: hidden;

  :deep(th) {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.025em;
    color: rgba(var(--v-theme-on-surface), 0.7);
    background: rgb(var(--v-theme-surface));
    padding: 8px;
  }

  :deep(td) {
    font-size: 0.875rem;
    height: 40px;
    padding: 4px 8px;
    vertical-align: middle;

    &.text-center {
      > * {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }

      .v-checkbox,
      .v-btn {
        margin: 0 2px;
      }
    }
  }

  :deep(.v-checkbox) {
    margin: 0;
    padding: 0;
    height: 32px;
    display: flex;
    align-items: center;
  }

  :deep(.v-selection-control) {
    min-height: unset;
    margin: 0;
  }

  .status-chip {
    font-size: 0.75rem;
  }

  .column-who {
    width: 60px;
    min-width: 60px;
  }

  .column-deadline {
    width: 100px;
    min-width: 100px;
  }

  .column-actions {
    width: 80px;
    min-width: 80px;
  }

  :deep(td) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action-text {
    padding: 0px 2px 2px 0px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-word;
    max-height: 60px;
    line-height: 1.4;
  }
}

.initials {
  font-weight: 600;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  padding: 3px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.text-grey {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.info-icon {
  opacity: 0.7;
  transition: opacity 0.2s ease;
  cursor: help;

  &:hover {
    opacity: 1;
  }
}

:deep(.v-field__outline) {
  --v-field-border-width: 1px;
}

:deep(.v-tooltip) {
  .v-overlay__content {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-border-color), 0.12);
    box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
  }
}

.date-picker-field {
  :deep(.dp__input) {
    display: none;
  }

  :deep(.dp__main) {
    border-radius: 4px;
    box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
  }

  :deep(.dp__disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Add this to the <style> section after the existing styles

:deep(.v-tooltip > .v-overlay__content) {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.12);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px;
  width: 200px;
  max-width: 200px;
  min-width: 200px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.action-popover {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.12);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.action-popover-content {
  padding: 12px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.tabs-container {
  position: sticky;
  top: 55px; // Slightly reduced from 64px to overlap with header
  z-index: 3;
  background: rgb(var(--v-theme-surface));
  margin-top: -1px; // Added negative margin to ensure no gap
}

.finished-task {
  text-decoration: line-through;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
