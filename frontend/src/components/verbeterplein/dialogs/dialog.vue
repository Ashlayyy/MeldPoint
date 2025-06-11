<template>
  <v-dialog
    v-model="dialogVisible"
    :max-width="maxWidth"
    :persistent="persistent"
    :scrim="scrim"
    class="scrollable-dialog"
    :retain-focus="false"
  >
    <v-card>
      <v-card-title v-if="title && title.length > 0" class="bg-secondary text-white pa-4">
        {{ title }}
      </v-card-title>
      <v-card-text :class="['contentClass', 'no-top-padding']">
        <slot></slot>
      </v-card-text>

      <v-card-actions v-if="showActions || showConfirm">
        <v-btn v-if="showActions === true" color="grey darken-1" variant="text" @click="closeDialog">{{ cancelText }}</v-btn>
        <v-spacer></v-spacer>
        <v-btn v-if="showActions === true || showConfirm === true" color="primary" :variant="confirmFormat ?? 'text'" @click="confirm">{{
          confirmText
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String
    // default: 'Dialog'
  },
  maxWidth: {
    type: [String, Number],
    default: 800
  },
  contentClass: {
    type: String,
    default: ''
  },
  scrim: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: false
  },
  showConfirm: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  editingButton: {
    type: Boolean,
    default: false
  },
  closeOnConfirm: {
    type: Boolean,
    default: true
  },
  confirmFormat: {
    type: String as any,
    default: 'text'
  },
  persistent: {
    type: Boolean,
    default: false
  },
  showChat: {
    type: Boolean,
    default: false
  },
  showClone: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const dialogVisible = ref(props.modelValue);
const isHelpdeskOpen = ref(false);

watch(
  () => document.querySelector('.helpdesk-drawer')?.getAttribute('aria-hidden'),
  (newVal) => {
    isHelpdeskOpen.value = newVal === 'false';
  }
);

watch(
  () => props.modelValue,
  (newVal: boolean) => {
    dialogVisible.value = newVal;
  }
);
watch(dialogVisible, (newVisibleValue) => {
  if (props.modelValue !== newVisibleValue) {
    emit('update:modelValue', newVisibleValue);
  }
});

const closeDialog = () => {
  dialogVisible.value = false;
};

const confirm = () => {
  emit('confirm');
  if (props.closeOnConfirm) {
    closeDialog();
  }
};
</script>

<style scoped lang="scss">
.buttonTop {
  display: flex;
  gap: 1rem;
}

.scrollable-dialog {
  height: auto;
}

/* Make sure the card content is also scrollable */
:deep(.v-card-text) {
  overflow-y: auto;
  max-height: 250vh;
  padding-right: 16px;
}

/* Ensure images don't overflow their containers */
:deep(img) {
  max-width: 100%;
  height: auto;
}

.no-top-padding {
  padding-top: 0 !important;
  /* Override the default top padding */
}

:deep(.v-overlay) {
  z-index: 1000 !important;
}

:deep(.v-overlay__content) {
  z-index: 1000 !important;
}

:deep(.v-overlay__scrim) {
  z-index: 999 !important;
}

:deep(.v-dialog) {
  z-index: 1000 !important;
}
</style>
