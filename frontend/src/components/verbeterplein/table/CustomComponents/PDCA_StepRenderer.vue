<template>
    <div class="d-flex justify-center align-center h-100 w-100">
      <v-icon
        :color="actualCellValue ? 'success' : 'error'"
        :icon="actualCellValue ? 'mdi-check-circle' : 'mdi-close-circle'"
        size="24"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  params: {
    value: any;
  }
}>();
console.log('props', props.params);
const actualCellValue = computed(() => !!props.params.value);
</script>