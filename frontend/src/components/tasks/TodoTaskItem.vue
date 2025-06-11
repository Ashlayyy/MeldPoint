<template>
  <v-hover v-slot="{ isHovering, props }">
    <div
      class="task-item"
      v-bind="props"
      :class="{
        'elevation-1': isHovering || isExpanded,
        exceeding: isExceeding,
        highlighted: isHighlighted,
        [task.category || '']: !!task.category,
        completed: task.finished,
        expanded: isExpanded
      }"
    >
      <div class="task-content" @click="handleExpandClick">
        <div class="checkbox-column">
          <!-- Show checkbox for regular tasks -->
          <v-tooltip location="top" content-class="status-tooltip" :disabled="task.finished">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-checkbox
                v-if="task.actionType !== 'traject'"
                v-model="isFinished"
                @click.stop
                :color="categoryColor"
                hide-details
                v-bind="tooltipProps"
                density="compact"
              />
            </template>
            <span>Voltooi actie</span>
          </v-tooltip>
          <!-- Show status chip for traject/melding items -->
          <v-tooltip location="top" content-class="status-tooltip">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-chip
                v-if="task.actionType === 'traject'"
                class="status-chip"
                :color="statusColor"
                dark
                elevation="1"
                density="comfortable"
                v-bind="tooltipProps"
                @click.stop="handleExpandClick"
                style="cursor: pointer"
              >
                <p :class="{ blacktext: !isDark, whitetext: isDark }">
                  {{ statusName }}
                </p>
              </v-chip>
            </template>
            <span>Wijzig status in het Verbeterplein </span>
          </v-tooltip>
        </div>

        <div class="task-details">
          <div class="task-message" :title="task.message" :class="{ 'expanded-message': isExpanded }">
            {{ task.message }}
          </div>
          <div class="task-meta">
            <div class="meta-id-container">
              <v-chip size="x-small" :color="taskColor" variant="tonal" class="meta-id-chip">
                {{ actionTypeText }}
              </v-chip>

              <span v-if="task.category === 'correctief'" class="meta-project">{{ projectInfo }}</span>
              <span v-if="task.category === 'preventief'" class="meta-project">PDCA: {{ PDCATitel }}</span>
            </div>
          </div>
        </div>

        <div class="action-column">
          <div v-if="isExceeding" class="days-overdue-container mr-2">
            <v-chip size="x-small" color="error" variant="tonal">
              <v-icon size="x-small" class="mr-1">mdi-clock-alert</v-icon>
              {{ daysOverdue === 0 ? 'Deadline vandaag!' : daysOverdue + ' dagen te laat' }}
            </v-chip>
          </div>

          <v-chip size="x-small" :color="categoryColor" variant="tonal" class="category-chip mr-2">
            {{ task.category || 'onbekend' }}
          </v-chip>

          <div class="action-buttons">
            <!-- <v-tooltip location="top" v-if="task.url">
              <template #activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  class="action-btn"
                  @click.stop="openMeldingUrl"
                  v-bind="props"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>Open originele melding</span>
            </v-tooltip> -->

            <v-btn icon size="small" variant="text" color="grey-darken-1" class="action-btn" @click.stop="handleExpandClick">
              <v-icon>{{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Expanded details section -->
      <v-expand-transition>
        <div v-if="isExpanded" class="expanded-details">
          <v-divider class="my-2"></v-divider>

          <div class="expanded-content pl-0 pr-4 py-2">
            <div class="details-container">
              <!-- First column - key details -->
              <div class="details-column">
                <div class="detail-item">
                  <span class="detail-label">Aangemaakt</span>
                  <span class="detail-value">{{ formatDate(task.createdAt) }}</span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">Deadline</span>
                  <span class="detail-value" :class="{ 'error--text': isExceeding }">
                    {{ formatDate(task.deadline) }}
                    <span v-if="isExceeding" class="overdue-text">({{ daysOverdue }} dagen te laat)</span>
                  </span>
                </div>

                <div class="detail-item" v-if="task.finished">
                  <span class="detail-label">Afgerond op</span>
                  <span class="detail-value">{{ formatDate(task.completedAt) }}</span>
                </div>
              </div>

              <!-- Second column - secondary details -->

              <div class="details-column">
                <div class="detail-item" v-if="assignedToName">
                  <span class="detail-label">{{ task.actionType === 'traject' ? 'Actiehouder' : 'Toegewezen aan' }}</span>
                  <span class="detail-value">{{ assignedToName }}</span>
                </div>
                <div class="detail-item" v-if="projectInfo && task.category === 'correctief'">
                  <span class="detail-label">Project</span>
                  <span class="detail-value">{{ projectInfo }}</span>
                </div>

                <div class="detail-item" v-if="task.category === 'preventief'">
                  <span class="detail-label">PDCA-titel</span>
                  <span class="detail-value">{{ PDCATitel }}</span>
                </div>
              </div>
            </div>

            <div class="notes-container mt-3" v-if="task.notes">
              <div class="notes-header">Notities</div>
              <div class="notes-text">{{ task.notes }}</div>
            </div>

            <div class="task-actions mt-3" v-if="task.url">
              <v-btn size="small" color="secondary" variant="tonal" class="open-link-btn" @click.stop="openMeldingUrl">
                <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
                Bekijk in Verbeterplein
              </v-btn>
            </div>
          </div>
        </div>
      </v-expand-transition>
    </div>
  </v-hover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTheme } from 'vuetify';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  statusCache: {
    type: Object,
    default: () => ({})
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  showDeadline: {
    type: Boolean,
    default: false
  },
  expandedTaskId: {
    type: [String, null],
    default: null
  }
});

const emit = defineEmits(['toggle-status', 'open-melding', 'open-url', 'more-menu', 'expand-task']);

const theme = useTheme();
const actiehouderStore = useActiehouderStore();
const isDark = computed(() => theme.global.current.value.dark);

// Expanded state is now based on comparing the task ID with the expandedTaskId prop
const isExpanded = computed(() => {
  return props.expandedTaskId === props.task.id;
});

// Function to toggle expanded state by emitting event to parent
function handleExpandClick() {
  // If already expanded, collapse by emitting null
  // If not expanded, emit this task's ID to expand
  const newExpandedId = isExpanded.value ? null : props.task.id;
  emit('expand-task', newExpandedId);
}

const isExceeding = computed(() => {
  return !props.task.finished && new Date(props.task.deadline) < new Date();
});

const daysOverdue = computed(() => {
  const deadlineDate = new Date(props.task.deadline);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - deadlineDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

const statusColor = computed(() => {
  const key = `${props.task.category}-${props.task.correctiefId || props.task.preventiefId}`;
  return props.statusCache[key]?.StatusColor ?? 'grey';
});

const statusName = computed(() => {
  const key = `${props.task.category}-${props.task.correctiefId || props.task.preventiefId}`;
  return props.statusCache[key]?.StatusNaam || 'N/A';
});

const categoryColor = computed(() => {
  switch (props.task.category) {
    case 'correctief':
      return `rgb(var(--v-theme-primary))`;
    case 'preventief':
      return `rgb(var(--v-theme-secondary))`;
    default:
      return 'warning';
  }
});

const taskColor = computed(() => {
  if (props.task.actionType === 'traject') return 'info';
  else if (props.task.actionType === 'task') return 'success';
  else return 'warning';
});

const actionTypeText = computed(() => {
  switch (props.task.actionType) {
    case 'traject':
      return 'Melding';
    case 'task':
      return 'Actie';
    default:
      return 'Onbekend';
  }
});

// Helper function to safely get actiehouder name
function getActiehouderName(id: string | undefined): string {
  if (!id) return 'Onbekend';

  try {
    const actiehouder = actiehouderStore.getActiehouderById(id);

    // Use optional chaining and access property via bracket notation
    return actiehouder?.['Name'] || `ID: ${id}`;
  } catch (error) {
    console.error('Error fetching actiehouder name:', error);
    return `ID: ${id}`;
  }
}

// Get actiehouder name from ID
const assignedToName = computed(() => {
  if (!props.task.userId) return 'Niet toegewezen';
  return getActiehouderName(props.task.userId);
});

// Toggle task completion status
function toggleTaskStatus() {
  // Only emit the event - let the parent component handle the actual state update
  emit('toggle-status', { ...props.task, finished: !props.task.finished });
}

// Open melding URL
function openMeldingUrl() {
  emit('open-url', props.task.url);
  showStatusHint.value = false;
}

// Open more menu
function openMoreMenu() {
  emit('more-menu', props.task);
}

// Date formatting helper
function formatDate(date: string | Date | undefined) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Get priority color
function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'hoog':
      return 'error';
    case 'medium':
      return 'warning';
    case 'laag':
      return 'success';
    default:
      return 'grey';
  }
}

// Get priority icon
function getPriorityIcon(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'hoog':
      return 'mdi-flag';
    case 'medium':
      return 'mdi-flag-outline';
    case 'laag':
      return 'mdi-flag-variant-outline';
    default:
      return 'mdi-flag-outline';
  }
}

// Dialog state
const showStatusHint = ref(false);

// Project info computed property
const projectInfo = computed(() => {
  const key = `${props.task.category}-${props.task.correctiefId || props.task.preventiefId}`;
  const statusData = props.statusCache[key];

  if (statusData?.ProjectNumberID && statusData?.Deelorder) {
    return `${statusData.ProjectNumberID} DO${statusData.Deelorder}`;
  } else if (statusData?.ProjectNumberID) {
    return statusData.ProjectNumberID;
  } else if (props.task.project) {
    return props.task.project;
  }

  return '';
});

const PDCATitel = computed(() => {
  const key = `${props.task.category}-${props.task.correctiefId || props.task.preventiefId}`;
  const statusData = props.statusCache[key];
  return statusData?.PDCATitel || 'Onbekend';
});

const isFinished = computed({
  get: () => props.task.finished,
  set: (value) => {
    emit('toggle-status', { ...props.task, finished: value });
  }
});
</script>

<style scoped lang="scss">
.task-item {
  padding: 8px 12px;
  min-height: 36px;
  position: relative;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
  transition: all 0.15s ease;
  display: grid;
  grid-template-rows: auto auto;
  // border-left: none; /* Explicitly remove any left border by default */

  &:last-child {
    border-bottom: none;
  }

  &.expanded {
    background-color: rgba(var(--v-theme-surface-variant), 0.08);
  }

  &.exceeding {
    // border-left: 2px solid rgb(var(--v-theme-error));

    &:hover {
      background-color: rgba(var(--v-theme-error), 0.04);
    }
  }

  &.highlighted {
    background-color: rgba(var(--v-theme-warning), 0.04);
  }

  &.correctief {
    // border-left: 2px solid rgb(var(--v-theme-primary));

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.04);
    }
  }

  &.preventief {
    // border-left: 2px solid rgb(var(--v-theme-secondary));

    &:hover {
      background-color: rgba(var(--v-theme-secondary), 0.04);
    }
  }

  &.completed {
    .task-message {
      text-decoration: line-through;
      color: rgba(var(--v-theme-on-surface), 0.6);
    }
  }

  .task-content {
    display: grid;
    grid-template-columns: 120px 1fr auto;
    align-items: center;
    width: 100%;
    gap: 8px;
    min-height: 28px;

    .checkbox-column {
      width: 160px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 4px;

      .v-checkbox {
        margin: 0;
        padding: 0;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
      }
      .status-chip {
        min-width: 50px;
        max-width: 120px;
        height: 24px !important;

        p {
          margin: 0;
          padding: 0;
          font-size: 0.75rem;
          line-height: 1;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .task-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 4px;
      cursor: pointer;
      max-width: calc(100% - 10px);

      .task-message {
        font-size: 0.9rem;
        font-weight: 500;
        line-height: 1.2;
        margin: 0;
        max-width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;

        &.expanded-message {
          white-space: normal; // Allow text to wrap when expanded
          overflow: visible;
          text-overflow: unset;
        }
      }

      .task-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.7rem;
        color: rgba(var(--v-theme-on-surface), 0.7);
        min-height: 24px;

        .meta-id-container {
          display: flex;
          align-items: center;
          overflow: hidden;
          flex: 1;
          margin-right: auto;
        }

        .meta-id-chip {
          margin-right: 4px;
          flex-shrink: 0;
          font-weight: 500;
        }

        .meta-project {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta-date-container {
          display: flex;
          align-items: center;
          white-space: nowrap;
        }

        .meta-date {
          white-space: nowrap;
          color: rgba(var(--v-theme-on-surface), 0.5);
          font-size: 0.65rem;
        }

        .v-chip {
          height: 20px !important;
          display: flex;
          align-items: center;
        }
      }
    }

    .action-column {
      display: flex;
      align-items: center;
      gap: 4px;

      .days-overdue-container {
        display: flex;
        align-items: center;
      }

      .category-chip {
        height: 20px !important;
        display: flex;
        align-items: center;
      }

      .action-buttons {
        display: flex;
        align-items: center;
        gap: 2px;

        .action-btn {
          margin: 0;
        }
      }
    }

    @media (max-width: 768px) {
      /* Adjust grid for mobile */
      display: grid;
      grid-template-columns: 80px 1fr;
      grid-template-rows: auto auto;

      .task-details {
        .task-meta {
          .meta-id-container {
            flex-basis: 100%;
            margin-bottom: 4px;
          }
        }
      }

      .action-column {
        grid-column: 1 / -1; /* Span full width */
        grid-row: 2; /* Place in second row */
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        padding-left: 80px; /* Align with content */
        margin-top: 4px;

        .days-overdue-container,
        .category-chip {
          margin-bottom: 4px; /* Add spacing when wrapped */
        }
      }
    }
  }

  /* Expanded details styling */
  .expanded-details {
    width: 100%;
    background-color: rgba(var(--v-theme-surface-variant), 0.02);
    border-radius: 0 0 4px 4px;
  }

  .expanded-content {
    font-size: 0.9rem;
    padding-left: 120px; /* Match the width of the checkbox column */
  }

  .details-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-left: 130px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }

  .details-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }

  .detail-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.6);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    font-size: 0.9rem;
    color: rgba(var(--v-theme-on-surface), 0.9);
  }

  .overdue-text {
    font-size: 0.8rem;
    margin-left: 4px;
    color: rgb(var(--v-theme-error));
    font-weight: 500;
  }

  .notes-container {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  }

  .notes-header {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(var(--v-theme-on-surface), 0.6);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .notes-text {
    background-color: rgba(var(--v-theme-surface-variant), 0.1);
    padding: 12px;
    border-radius: 4px;
    color: rgba(var(--v-theme-on-surface), 0.9);
    white-space: pre-line;
    line-height: 1.5;
    font-size: 0.85rem;
  }

  .task-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}

.blacktext {
  color: rgba(0, 0, 0, 0.87) !important;
}

.whitetext {
  color: white !important;
}

.pulse-animation {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.status-chip {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}
</style>
