<template>
  <Dialog
    v-model="dialogVisible"
    :title="getDialogTitle"
    :show-actions="true"
    :confirm-text="archiveMode ? 'Archiveer' : 'Herstellen'"
    :cancel-text="'Annuleer'"
    :close-on-confirm="false"
    :persistent="true"
    @confirm="confirmArchive"
    @update:modelValue="cancelArchive"
  >
    <v-card-text>
      <h3 class="mb-4">Weet je zeker dat je {{ selectedItems.length > 1 ? 'deze items' : 'dit item' }} wilt {{ archiveMode ? 'archiveren' : 'herstellen' }}?</h3>
      <span
        >Als een melding een Preventief heeft, worden alle meldingen {{ archiveMode ? 'gearchiveerd' : 'hersteld' }} die hieraan gekoppeld zijn. Ontkoppel deze, of {{ archiveMode ? 'archiveer' : 'herstel' }} ze.</span
      >
      <v-list lines="three" class="overflow-y-auto" style="max-height: 400px">
        <v-list-item v-for="item in selectedItems" :key="item.id" class="mb-2 elevation-1">
          <v-list-item-title>
            <b>#{{ item.VolgNummer }}</b> - {{ item.Obstakel }} (<i>Type: {{ item.Type }}</i
            >)
          </v-list-item-title>
          <v-list-item-subtitle> Project: {{ item.Project?.NumberID }} - {{ item.Project?.ProjectNaam }} </v-list-item-subtitle>
          <v-list-item-subtitle> Deelorder: {{ item.Deelorder }} </v-list-item-subtitle>
          <v-list-item-subtitle> Status: {{ item.Correctief?.Status?.StatusNaam ?? 'N/A' }} </v-list-item-subtitle>
          <v-list-item-subtitle> Actiehouder: {{ item.Correctief?.User?.Name ?? 'N/A' }} </v-list-item-subtitle>
          <v-list-item-subtitle> Preventief gekoppeld aan {{ item.Preventief?.Melding?.length ?? 'N/A' }} meldingen </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from '@/components/verbeterplein/dialogs/dialog.vue';

// Updated Item interface based on provided JSON structure
interface Item {
  id: string; // Assuming id is string based on JSON "67efd596b9ec7b5df0765735"
  VolgNummer: number;
  Type: string;
  Obstakel: string;
  Deelorder: string;
  Project: {
    id: string;
    NumberID: number; // Assuming number based on JSON 20230109
    ProjectNaam: string;
  };
  Correctief?: {
    id: string;
    Status?: {
      id: string;
      StatusNaam: string;
    };
    User?: {
      id: string;
      Name: string;
    };
  } | null; // Can be null according to JSON
  Preventief?: {
    id: string;
    VolgNummer: number;
    Type: string;
    Obstakel: string;
    Melding: {
      id: string;
      VolgNummer: number;
      Type: string;
      Obstakel: string;
    }[];
  } | null; // Can be null according to JSON
  // Add other fields if needed
}

const props = defineProps<{
  modelValue: boolean;
  selectedItems: Item[];
  archiveMode: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'archive']);
const itemsToArchive = ref<Set<string>>(new Set());

const dialogVisible = ref(props.modelValue);

const getDialogTitle = computed(() => {
  if (props.archiveMode) {
    return props.selectedItems.length > 1 ? 'Archiveer Items' : 'Archiveer Item';
  } else {
    return props.selectedItems.length > 1 ? 'Herstel Items' : 'Herstel Item';
  }
});

const confirmArchive = () => {
  const confirming = window.confirm(
    'Weet je zeker dat je deze items wilt ' + (props.archiveMode ? 'archiveren' : 'herstellen') + '? Als een melding een Preventief heeft, worden alle meldingen ' + (props.archiveMode ? 'gearchiveerd' : 'hersteld') + ' die hieraan gekoppeld zijn. Ontkoppel deze, of ' + (props.archiveMode ? 'archiveer' : 'herstel') + ' ze.'
  );
  if (confirming) {
    emit('archive', { itemIdsToArchive: Array.from(itemsToArchive.value), archive: props.archiveMode });
    emit('update:modelValue', false);
    dialogVisible.value = false;
  }
};

const cancelArchive = (value: boolean) => {
  if (!value) {
    emit('update:modelValue', false);
    dialogVisible.value = false;
  }
};

watch(
  () => props.modelValue,
  (newVal: boolean) => {  
    if (newVal) {
      itemsToArchive.value = new Set();
      try {
        props.selectedItems.forEach((item) => {
          if (!item || typeof item.id === 'undefined') {
            console.error('[ArchivingDialog] Invalid item structure in selectedItems:', item);
            return; // Skip invalid item
          }
          itemsToArchive.value.add(item.id);
          if (item.Preventief && Array.isArray(item.Preventief.Melding)) {
            item.Preventief.Melding.forEach((melding) => {
              if (!melding || typeof melding.id === 'undefined') {
                console.error('[ArchivingDialog] Invalid melding structure in item.Preventief.Melding:', melding, 'for item:', item.id);
                return; // Skip invalid melding
              }
              itemsToArchive.value.add(melding.id);
            });
          }
        });
      } catch (error) {
        console.error('[ArchivingDialog] Error during itemsToArchive population:', error); // Log any errors during population
      }
    }

    dialogVisible.value = newVal;
  },
  { immediate: true }
);
</script>
