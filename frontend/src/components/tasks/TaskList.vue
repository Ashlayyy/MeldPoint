<template>
  <v-list class="pa-0">
    <template v-for="(task, index) in tasks" :key="task.id">
      <v-list-item
        class="task-item"
        :class="{ 'has-parent-deadline': hasParentDeadline(task) }"
      >
        <template v-slot:prepend>
          <v-icon
            :color="getTaskTypeColor(task.category)"
            size="small"
            class="mr-2"
          >
            {{ getTaskTypeIcon(task.category) }}
          </v-icon>
        </template>
        
        <v-list-item-title class="d-flex align-center">
          <span class="task-message">{{ task.message }}</span>
          <!-- Parent deadline indicator -->
          <v-chip
            v-if="hasParentDeadline(task)"
            :color="getParentDeadlineStatus(task)"
            size="small"
            class="ml-2"
            variant="tonal"
          >
            <v-icon start size="small">
              {{ getParentDeadlineIcon(task) }}
            </v-icon>
            {{ formatDate(getParentDeadline(task)) }}
          </v-chip>
        </v-list-item-title>

        <v-list-item-subtitle class="d-flex align-center mt-1">
          <v-icon size="small" color="grey" class="mr-1">
            mdi-clock-outline
          </v-icon>
          {{ formatDate(task.deadline) }}
        </v-list-item-subtitle>

        <template v-slot:append>
          <v-chip
            :color="task.category === 'correctief' ? 'blue' : 'purple'"
            size="small"
            variant="tonal"
            class="task-type-badge"
          >
            {{ task.category === 'correctief' ? 'Correctief' : 'Preventief' }}
          </v-chip>
        </template>
      </v-list-item>
      <v-divider v-if="index < tasks.length - 1" class="my-2" />
    </template>
  </v-list>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  tasks: any[]; // Replace with proper Task interface
  parentDeadlines: Record<string, any>; // Replace with proper interface
}>();

const getTaskTypeColor = (type: string) => {
  return type === 'correctief' ? 'blue' : 'purple';
};

const getTaskTypeIcon = (type: string) => {
  return type === 'correctief' ? 'mdi-alert-circle' : 'mdi-calendar-check';
};

const getParentDeadlineIcon = (task: any) => {
  const status = props.parentDeadlines[task.meldingId]?.status;
  return {
    warning: 'mdi-alert',
    danger: 'mdi-alert-circle',
    normal: 'mdi-check-circle'
  }[status] || 'mdi-information';
};

const hasParentDeadline = (task: any) => {
  return props.parentDeadlines[task.meldingId];
};

const getParentDeadline = (task: any) => {
  return props.parentDeadlines[task.meldingId]?.deadline;
};

const getParentDeadlineStatus = (task: any) => {
  const status = props.parentDeadlines[task.meldingId]?.status;
  return {
    warning: 'warning',
    danger: 'error',
    normal: 'success'
  }[status] || 'default';
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<style scoped lang="scss">
.task-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.04);
  }
  
  &.has-parent-deadline {
    border-left: 3px solid rgb(var(--v-theme-primary));
  }
}

.task-message {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.task-type-badge {
  font-weight: 500;
  text-transform: capitalize;
}

:deep(.v-list-item) {
  min-height: 64px;
  padding: 8px 16px;
}

:deep(.v-divider) {
  opacity: 0.5;
}
</style> 