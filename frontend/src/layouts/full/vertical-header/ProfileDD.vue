<script setup lang="ts">
import { ref } from 'vue';
import { SettingsIcon, LogoutIcon } from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/verbeterplein/setting_store';
import { useRouter } from 'vue-router';
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const user = ref(authStore.user);
const allowNotifications = ref(settingsStore.notificationsEnabled);
const router = useRouter();
const { t } = useI18n();

const updateAllowNotifications = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  try {
    if (Notification.permission === 'granted') {
      settingsStore.$patch({
        notificationsEnabled: !settingsStore.notificationsEnabled,
        lastUpdated: new Date()
      });
      allowNotifications.value = settingsStore.notificationsEnabled;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      settingsStore.$patch({
        notificationsEnabled: permission === 'granted',
        lastUpdated: new Date()
      });
      allowNotifications.value = settingsStore.notificationsEnabled;
    } else {
      settingsStore.$patch({
        notificationsEnabled: false,
        lastUpdated: new Date()
      });
      allowNotifications.value = false;
    }
  } catch (error) {
    console.error('Failed to update notification settings:', error);
  }
};

const getGreeting = () => {
  const hours = new Date().getHours();
  return hours >= 4 && hours < 12
    ? t('profile.greeting_morning', { name: user.value.Name })
    : hours >= 12 && hours < 18
      ? t('profile.greeting_afternoon', { name: user.value.Name })
      : hours >= 18 && hours < 24
        ? t('profile.greeting_evening', { name: user.value.Name })
        : t('profile.greeting_night', { name: user.value.Name });
};
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- profile DD -->
  <!-- ---------------------------------------------- -->
  <div class="pa-4">
    <h4 class="mb-n1">{{ getGreeting() }}</h4>
    <span class="text-subtitle-2 text-medium-emphasis">{{ $t('profile.roles.user') }}</span>

    <v-divider></v-divider>

    <div class="bg-lightprimary rounded-md px-5 py-3 my-3">
      <div class="d-flex align-center justify-space-between">
        <h5 class="text-h5">{{ $t('profile.allow_notifications') }}</h5>
        <div>
          <v-switch @update:model-value="updateAllowNotifications" v-model="allowNotifications" color="primary" hide-details></v-switch>
        </div>
      </div>
    </div>

    <v-divider></v-divider>

    <v-list class="mt-3">
      <v-list-item to="/app/user/account-profile/profile" color="secondary" rounded="md">
        <template v-slot:prepend>
          <SettingsIcon size="20" class="mr-2" />
        </template>

        <v-list-item-title class="text-subtitle-2">{{ $t('profile.settings') }}</v-list-item-title>
      </v-list-item>
      <v-list-item to="/issues" color="secondary" rounded="md">
        <template v-slot:prepend>
          <BrandGithubIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2">{{ $t('profile.my_issues') }}</v-list-item-title>
      </v-list-item>
      <v-list-item
        @click="
          async () => {
            await authStore.logout();
          }
        "
        color="secondary"
        rounded="md"
      >
        <template v-slot:prepend>
          <LogoutIcon size="20" class="mr-2" />
        </template>

        <v-list-item-title class="text-subtitle-2">{{ $t('profile.logout') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>
