<template>
  <v-card class="mb-6" elevation="0">
    <v-card-title class="d-flex align-center py-2">
      <h3 class="text-h6">Kalender</h3>
      <v-spacer />
      <v-switch
        v-model="showCompletedInCalendar"
        label="Toon afgeronde taken"
        color="success"
        hide-details
        density="compact"
        class="ma-0 pa-0"
      />
    </v-card-title>

    <!-- Calendar Legend -->
    <div class="px-4 pb-2">
      <div class="d-flex flex-wrap gap-3">
        <div class="legend-item d-flex align-center">
          <div class="legend-dot" style="background-color: red"></div>
          <span class="text-caption">Overschreden</span>
        </div>
        <div v-if="showCompletedInCalendar" class="legend-item d-flex align-center">
          <div class="legend-dot" style="background-color: green"></div>
          <span class="text-caption">Afgerond</span>
        </div>
        <div class="legend-item d-flex align-center">
          <div class="legend-dot" style="background-color: #1976d2"></div>
          <span class="text-caption">Correctief</span>
        </div>
        <div class="legend-item d-flex align-center">
          <div class="legend-dot" style="background-color: #9c27b0"></div>
          <span class="text-caption">Preventief</span>
        </div>
      </div>
    </div>

    <VCalendar
      locale="nl"
      :attributes="calendarAttributes"
      expanded
      show-weeknumbers
      @dayclick="onDayClick"
      ref="calendarRef"
      class="calendar-container"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Calendar as VCalendar } from 'v-calendar';
import 'v-calendar/style.css';

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['day-click']);

const showCompletedInCalendar = ref(true);
const calendarRef = ref<InstanceType<typeof VCalendar> | null>(null);

const computedDotColor = (task: any) => {
  const deadline = new Date(task.deadline);
  const today = new Date();
  if (task.finished) {
    return 'green';
  }
  if (deadline < today) {
    return 'red';
  }
  return task.category === 'correctief' ? 'blue' : 'purple';
};

// Add this helper function
function truncateMessage(message: string, maxLength = 30): string {
  return message.length > maxLength ? `${message.slice(0, maxLength)}...` : message;
}

// Function to convert task deadlines to calendar attributes
const calendarAttributes = computed(() => {
  const attributes = [];

  // Add today's highlight
  attributes.push({
    key: 'today',
    dates: new Date(),
    highlight: {
      color: 'primary',
      fillMode: 'solid'
    },
    popover: {
      label: 'Today'
    }
  });

  if (props.tasks && Array.isArray(props.tasks)) {
    props.tasks
      .filter((task: any) => {
        return task.deadline && (!task.finished || showCompletedInCalendar.value);
      })
      .forEach((task: any) => {
        attributes.push({
          key: `task-${task.id}`,
          dates: new Date(task.deadline),
          dot: {
            color: computedDotColor(task),
            style: {
              backgroundColor: computedDotColor(task),
              size: 16
            }
          },
          popover: {
            label: truncateMessage(task.message),
            visibility: 'hover'
          },
          customData: {
            id: task.id,
            type: 'task',
            category: task.action,
            completed: task.finished
          }
        });
      });
  }

  return attributes;
});

function popoverLabel(task: any) {
  return task.message;
}

function onDayClick(data: { date: Date }) {
  emit('day-click', data.date);
}

function moveToToday() {
  if (calendarRef.value) {
    calendarRef.value.move(new Date());
  }
}
</script>

<style scoped lang="scss">
/* Calendar Styles */
:deep(.vc-container) {
  --vc-font-family: inherit;
  --vc-bg: rgb(var(--v-theme-surface));
  --vc-border-color: rgba(var(--v-theme-on-surface), 0.12);
  --vc-header-arrow-hover-bg-color: rgba(var(--v-theme-primary), 0.1);
  --vc-weekday-color: rgba(var(--v-theme-on-surface), 0.6);
  --vc-weekday-font-weight: 500;

  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

:deep(.vc-day) {
  min-height: 3.5rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.04);
  }
}

:deep(.vc-day-content) {
  font-weight: 400;
}

:deep(.vc-highlight-solid) {
  opacity: 0.1;
}

:deep(.vc-day.is-today) {
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

:deep(.vc-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 2px;
}

.calendar-container {
  height: 100%;
  min-height: 400px;
  z-index: 99999;

  @media (max-width: 960px) {
    min-height: 300px;
  }
}

/* Calendar toggle styling */
.v-card-title {
  padding-bottom: 0;

  .v-switch {
    margin-top: 0;
    margin-bottom: 0;

    :deep(.v-switch__label) {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    :deep(.v-switch__thumb) {
      color: rgb(var(--v-theme-success));
    }
  }
}

// Add a specific style for completed task dots
:deep(.vc-highlights.vc-day-popover-row-indicator .vc-dot) {
  &.completed-task {
    background-color: rgb(var(--v-theme-success));
  }
}

// Add legend styles
.legend-item {
  margin-right: 8px;

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
  }

  .text-caption {
    font-size: 0.75rem;
    opacity: 0.7;
  }
}
</style>
