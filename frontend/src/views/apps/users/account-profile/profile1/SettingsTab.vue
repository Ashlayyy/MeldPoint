<template>
  <v-row>
    <v-col cols="12">
      <v-card variant="flat">
        <v-tabs v-model="activeTab">
          <v-tab value="notifications">{{ t('settings.notifications.title') }}</v-tab>
          <v-tab value="security">{{ t('settings.security.title') }}</v-tab>
          <v-tab value="email">{{ t('settings.email.title') }}</v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="notifications">
              <NotificationSettings />
            </v-window-item>

            <v-window-item value="security">
              <SecurityTab />
            </v-window-item>

            <v-window-item value="email">
              <h3>Coming Soon</h3>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NotificationSettings from '@/components/settings/NotificationSettings.vue';
import SecurityTab from '@/components/settings/SecurityTab.vue';

const { t } = useI18n();
const activeTab = ref('notifications');
</script>
