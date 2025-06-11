<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSettingsStore, type Theme } from '@/stores/verbeterplein/setting_store';
import { SunIcon, MoonIcon, DevicesIcon } from 'vue-tabler-icons';

const settingsStore = useSettingsStore();

// Initialize theme on component mount
onMounted(() => {
  settingsStore.initializeTheme();
});

// Compute the current theme mode
const currentTheme = computed({
  get: () => settingsStore.theme,
  set: (value: Theme) => {
    settingsStore.setTheme(value);
    settingsStore.applyTheme();
  }
});

const themeOptions = [
  { name: 'light', icon: SunIcon, label: 'Light Mode' },
  { name: 'dark', icon: MoonIcon, label: 'Dark Mode' },
  { name: 'system', icon: DevicesIcon, label: 'System' }
];
</script>

<template>
  <v-card flat>
    <v-card-item class="py-5">
      <v-card-title class="text-subtitle-1 font-weight-medium mb-4">Theme Mode (WIP. BETA)</v-card-title>
      <v-card-text class="pa-0">
        <v-btn-toggle v-model="currentTheme" mandatory class="d-flex flex-wrap gap-2" color="primary">
          <v-btn v-for="option in themeOptions" :key="option.name" :value="option.name" variant="outlined" class="px-4">
            <component :is="option.icon" class="mr-2" size="20" />
            {{ option.label }}
          </v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card-item>
  </v-card>
</template>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
