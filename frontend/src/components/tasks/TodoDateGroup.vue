<template>
  <div>
    <div 
      class="date-header pa-2 "
      :data-date="date"
      :class="{
        'today': isToday,
        'selected': isSelected
      }"
    >
      {{ formattedDate }}
    </div>

    <div class="tasks-section">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  date: {
    type: String,
    required: true
  },
  isToday: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  formattedDate: {
    type: String,
    required: true
  }
});
</script>

<style scoped lang="scss">
.date-header {
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
  padding: 8px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  
  &.today {
    font-weight: 700;
    background-color: rgba(var(--v-theme-primary), 0.04);
  }

  &.selected {
    background-color: rgba(var(--v-theme-warning), 0.08);
    border-left: 3px solid rgb(var(--v-theme-warning));
  }
}

.tasks-section {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  
  &:last-child {
    border-bottom: none;
  }
}
</style> 