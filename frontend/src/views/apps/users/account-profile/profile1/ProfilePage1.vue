<script setup lang="ts">
import { ref } from 'vue';
// common components
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';

// tabs import
import ProfileTab from './ProfileTab.vue';
import SettingsTab from './SettingsTab.vue';
import ThemeTab from './ThemeTab.vue';

// icons
import { UserCircleIcon, SettingsIcon, BrushIcon } from 'vue-tabler-icons';

// theme breadcrumb
const page = ref({ title: 'Profile' });
const inDevelopment = ref(import.meta.env.VITE_NODE_ENV === 'development');
const breadcrumbs = ref([
  {
    title: 'Users',
    disabled: true,
    href: '#'
  },
  {
    title: 'Account',
    disabled: true,
    href: '#'
  },
  {
    title: 'Profile',
    disabled: true,
    href: '#'
  }
]);

// tabs data
const tab = ref('tab-profile');
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <v-card variant="flat">
        <v-card variant="outlined">
          <v-card-text>
            <v-tabs v-model="tab" color="primary">
              <v-tab variant="plain" value="tab-profile"
                ><UserCircleIcon class="v-icon--start" width="20" stroke-width="1.5" /> Profile</v-tab
              >
              <v-tab variant="plain" value="tab-theme"><BrushIcon class="v-icon--start" width="20" stroke-width="1.5" /> Thema</v-tab>
              <v-tab variant="plain" value="tab-setting" :disabled="!inDevelopment"
                ><SettingsIcon class="v-icon--start" width="20" stroke-width="1.5" />Settings</v-tab
              >
            </v-tabs>
            <v-divider></v-divider>
            <div class="pt-6">
              <v-window v-model="tab">
                <v-window-item value="tab-profile">
                  <ProfileTab />
                </v-window-item>

                <v-window-item value="tab-theme">
                  <ThemeTab />
                </v-window-item>

                <v-window-item value="tab-setting">
                  <SettingsTab />
                </v-window-item>
              </v-window>
            </div>
          </v-card-text>
        </v-card>
      </v-card>
    </v-col>
  </v-row>
</template>
