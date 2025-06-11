<template>
  <v-alert
    v-if="!isAlertClosed"
    :text="text"
    :title="title"
    :type="type as AlertType"
    :variant="variant"
    :density="density"
    :border="border"
    closable
    @click:close="closeAlert"
  ></v-alert>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';

type AlertType = 'success' | 'info' | 'warning' | 'error';
type AlertVariant = 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain';
type AlertDensity = 'default' | 'comfortable' | 'compact';

export default defineComponent({
  name: 'PersistentAlert',
  props: {
    id: {
      type: String,
      required: true,
      default: 'default-alert'
    },
    text: {
      type: String,
      default:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ratione debitis quis est labore voluptatibus! Eaque cupiditate minima, at placeat totam, magni doloremque veniam neque porro libero rerum unde voluptatem!'
    },
    title: {
      type: String,
      default: 'Alert title'
    },
    type: {
      type: String as () => AlertType,
      default: 'info',
      validator: (value: string) => ['success', 'info', 'warning', 'error'].includes(value)
    },
    variant: {
      type: String as () => AlertVariant,
      default: 'flat',
      validator: (value: string) => ['text', 'tonal', 'flat', 'elevated', 'outlined', 'plain'].includes(value)
    },
    density: {
      type: String as () => AlertDensity,
      default: 'compact',
      validator: (value: string) => ['default', 'comfortable', 'compact'].includes(value)
    },
    localstorageKey: {
      type: String,
      default: 'announcement-new-version'
    },
    border: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const isAlertClosed = ref(false);
    const localStorageKey = `${props.localstorageKey}-closed`;

    onMounted(() => {
      const storedValue = localStorage.getItem(localStorageKey);
      if (storedValue === 'true') {
        isAlertClosed.value = true;
      }
    });

    const closeAlert = () => {
      isAlertClosed.value = true;
      localStorage.setItem(localStorageKey, 'true');
    };

    return {
      isAlertClosed,
      closeAlert
    };
  }
});
</script>
