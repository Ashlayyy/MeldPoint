<template>
  <div class="ag-overlay-loading-center">
    <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
    <div aria-live="polite" aria-atomic="true">{{ params.loadingMessage }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  params: {
    type: Object,
    required: true
  }
});
</script>
