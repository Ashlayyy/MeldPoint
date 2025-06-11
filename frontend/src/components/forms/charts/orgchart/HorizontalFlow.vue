<script setup>
//This is for Chart data
import { dataHorizontal } from './data.ts';
import { ref } from 'vue';
import { Background, Controls, MiniMap, VueFlow } from '@braks/vue-flow';

const ds = ref(dataHorizontal);

const onNodeClick = (event, node) => {
  console.log('Node clicked', node);
};
</script>

<template>
  <div>
    <VueFlow
      v-model="ds"
      @click="onNodeClick(event, node)"
      class="basicflow"
      :default-edge-options="{ type: 'smoothstep' }"
      :default-zoom="1.2"
      :min-zoom="0.2"
      :max-zoom="4"
      :fit-view-on-init="true"
    >
      <Background pattern-color="#aaa" gap="4" />
      <MiniMap />
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
