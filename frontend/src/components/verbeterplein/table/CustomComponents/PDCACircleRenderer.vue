<template>
  <div class="w-100 h-100 d-flex align-center justify-center">
    <PDCACircle v-if="params.data?.Preventief?.rootCauseLevel !== 1" :step="getPDCAStep(params.data)" :size="30" />
    <IconListCheck v-else stroke-width="1.5" size="22" />
  </div>
</template>

<script setup lang="ts">
import PDCACircle from '@/components/verbeterplein/shared/PDCACircle.vue';
import { IconListCheck } from '@tabler/icons-vue';

defineProps({
  params: {
    type: Object,
    required: true
  }
});

const getPDCAStep = (item: any) => {
  const steps = item.Preventief?.Steps;
  if (!steps) return 0;
  let count = 0;
  for (const step in steps) {
    if (steps[step]?.Finished) {
      count++;
    }
  }
  return count;
};
</script>
