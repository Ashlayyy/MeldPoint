<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import HorizontalHeader from './horizontal-header/HorizontalHeader.vue';
import HorizontalSidebar from './horizontal-sidebar/HorizontalSidebar.vue';
import Customizer from './customizer/CustomizerPanel.vue';
import { useCustomizerStore } from '../../stores/customizer';
import Helpdesk from '@/components/shared/Helpdesk.vue';
import PersistentAlert from '@/components/shared/PersistentAlert.vue';

const customizer = useCustomizerStore();

const layoutClasses = computed(() => [
  customizer.actTheme,
  customizer.fontTheme,
  customizer.mini_sidebar ? 'mini-sidebar' : '',
  customizer.setHorizontalLayout ? 'horizontalLayout' : 'verticalLayout',
  customizer.inputBg ? 'inputWithbg' : ''
]);
</script>

<template>
  <v-locale-provider>
    <v-app :theme="customizer.actTheme" :class="layoutClasses">
      <v-main>
        <PersistentAlert id="app-announcement" title="Verbeterplein v1.0 is gelanceerd 🎉"
          text="Features: Taakoverzicht, acties uitzetten, mini-PDCA (PD) en meer! Bedankt voor jullie feedback!💪"
          type="info" localstorageKey="v1-announcement" />
        <VerticalSidebarVue v-if="!customizer.setHorizontalLayout" />
        <VerticalHeaderVue v-if="!customizer.setHorizontalLayout" />
        <HorizontalHeader v-if="customizer.setHorizontalLayout" />
        <HorizontalSidebar v-if="customizer.setHorizontalLayout" />
        <Customizer v-if="customizer.Customizer_drawer" />
        <v-container fluid class="page-wrapper">
          <div :class="{ maxWidth: customizer.boxed }">
            <RouterView />
          </div>
        </v-container>
      </v-main>
      <Helpdesk />
    </v-app>
  </v-locale-provider>
</template>
