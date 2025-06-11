<template>
  <Dialog persistent v-model="dialogVisible" title="Start PDCA?" :show-actions="false" max-width="500">
    <v-card-text>
      <p>
        Wil je nu een PDCA starten voor deze melding? <br />
        Er zijn twee opties: <br />
        - Ja, start de PDCA nu <br />
        - Nee, start de PDCA over maximaal een week, je krijgt dan een melding zodra de week voorbij is.
      </p>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="handleResponse(false)" color="primary"> Nee </v-btn>
      <v-spacer></v-spacer>
      <v-btn @click="handleResponse(true)" variant="tonal" color="primary"> Ja </v-btn>
    </v-card-actions>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dialog from '@/components/verbeterplein/dialogs/dialog.vue';


const dialogVisible = ref(false);

const emit = defineEmits(['response']);

const handleResponse = (startNow: boolean) => {
  dialogVisible.value = false;
  emit('response', startNow);
};

defineExpose({
  open: () => {
    dialogVisible.value = true;
  }
});
</script>
