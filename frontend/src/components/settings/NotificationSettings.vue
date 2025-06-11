<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="d-flex align-center">
      <BellIcon size="20" class="me-2" />
      {{ t('settings.notifications.title') }}
    </v-card-title>

    <v-card-text>
      <v-list>
        <v-list-item>
          <v-switch v-model="enabled" :label="t('settings.notifications.enable_all')" color="primary" hide-details />
        </v-list-item>

        <v-list-item v-if="enabled">
          <v-switch v-model="toastEnabled" :label="t('settings.notifications.enable_toast')" color="primary" hide-details />
        </v-list-item>

        <v-list-item v-if="enabled">
          <v-switch
            v-model="systemEnabled"
            :label="t('settings.notifications.enable_system')"
            color="primary"
            hide-details
            @update:model-value="handleSystemToggle"
          />
        </v-list-item>

        <v-list-item v-if="enabled">
          <v-switch v-model="sound" :label="t('settings.notifications.enable_sound')" color="primary" hide-details />
        </v-list-item>
      </v-list>

      <v-alert v-if="systemEnabled && !hasSystemPermission" type="warning" variant="tonal" class="mt-4">
        {{ t('settings.notifications.permission_required') }}
        <v-btn color="warning" variant="text" class="mt-2" @click="requestPermission">
          {{ t('settings.notifications.request_permission') }}
        </v-btn>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BellIcon } from 'vue-tabler-icons';
import { useNotificationSettingsStore } from '@/stores/verbeterplein/notification_settings';
import { storeToRefs } from 'pinia';
import i18n from '@/main';

const t = i18n.global.t;
const store = useNotificationSettingsStore();
const hasSystemPermission = ref(Notification.permission === 'granted');

const { enabled, toastEnabled, systemEnabled, sound, hasRequestedPermission } = storeToRefs(store);

const handleSystemToggle = async (value: boolean) => {
  if (value && !hasRequestedPermission.value) {
    await requestPermission();
  }
};

const requestPermission = async () => {
  const granted = await store.requestSystemPermission();
  hasSystemPermission.value = granted;
};
</script>
