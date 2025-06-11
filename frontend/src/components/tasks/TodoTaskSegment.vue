<template>
  <div class="task-segment" :class="[segmentClass]" ref="segmentRef">
    <div class="segment-header pa-4" :class="[headerClass]">
      <v-icon :color="iconColor" class="mr-2">{{ icon }}</v-icon>
      {{ title }}
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps({
  title: {
    type: String,
    required: true
  },
  segmentClass: {
    type: String,
    default: ''
  },
  headerClass: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  iconColor: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  }
});

const segmentRef = ref<HTMLElement | null>(null);

defineExpose({ segmentRef });
</script>

<style scoped lang="scss">
.task-segment {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  margin-bottom: 12px;

  &.exceeding-segment {
    border-left: 3px solid rgb(var(--v-theme-error));
  }

  &.upcoming-segment {
    border-left: 3px solid rgb(var(--v-theme-warning));
  }

  .segment-header {
    font-weight: 500;
    padding: 12px 16px;
  }

  .exceeding-header {
    color: inherit;
    background-color: rgba(var(--v-theme-error), 0.04);
    font-weight: 600;
    border-left: none;
    border-bottom: 1px solid rgba(var(--v-theme-error), 0.1);
  }

  .upcoming-header {
    background-color: rgba(var(--v-theme-warning), 0.04);
    font-weight: 600;
    border-bottom: 1px solid rgba(var(--v-theme-warning), 0.1);
  }
}
</style>
