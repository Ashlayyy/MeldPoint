<template>
  <div class="d-flex justify-center align-center h-100 w-100">
    <v-chip :color="color" dark>
      <p class="blacktext" style="color: black !important;">{{ text }}</p>
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  params: {
    value: any;
  };
}>();
const status = computed(() => props.params.value);
const color = computed(() => status.value?.StatusColor ?? 'grey');
const text = computed(() => status.value?.StatusNaam || 'N/A');
</script>

<style scoped lang="scss">
.blacktext {
  color: black !important;
}
</style>
