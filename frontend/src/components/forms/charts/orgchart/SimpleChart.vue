<script setup>
//This is for Chart data
import data from './data.ts';
import { ref } from 'vue';
import { Controls, VueFlow } from '@braks/vue-flow';

const ds = ref(data);
</script>

<template>
  <div>
    <VueFlow v-model="ds" :default-zoom="1.5" :fit-view-on-init="true">
      <Controls />
    </VueFlow>
  </div>
</template>
<style>
/* these are necessary styles for vue flow */
@import '@braks/vue-flow/dist/style.css';

/* this contains the default theme, these are optional styles */
@import '@braks/vue-flow/dist/theme-default.css';
:root {
  --vf-node-bg: transparent;
  --vf-node-text: inherit;
  --vf-connection-path: rgb(var(--v-theme-secondary));
  --vf-handle: rgba(85, 85, 85, 0.386);
}
.vue-flow {
  min-height: 400px;
}
</style>
