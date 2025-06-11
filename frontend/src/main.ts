import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createNotivue } from 'notivue';
import { AllCommunityModule, ModuleRegistry, ValidationModule } from 'ag-grid-community'; 
import VueDatePicker from '@vuepic/vue-datepicker';
import VCalendar from 'v-calendar';
import print from 'vue3-print-nb';
import { createI18n } from 'vue-i18n';

import App from './App.vue';
import { router } from './router';
import vuetify from './plugins/vuetify';
import VueApexCharts from 'vue3-apexcharts';
import VueTablerIcons from 'vue-tabler-icons';
import postHog from './plugins/posthog';
import './_mockApis';
import messages from './utils/locales/messages';


import './scss/style.scss';
import 'notivue/notification.css';
import 'notivue/animations.css';
import 'notivue/notification-progress.css';
import '@uploadthing/vue/styles.css';
import '@vuepic/vue-datepicker/dist/main.css';

import { useSettingsStore } from '@/stores/verbeterplein/setting_store';
import permissionPlugin from './plugins/permission';

const app = createApp(App);

app.config.globalProperties.$posthog = postHog;

ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);

const notivue = createNotivue({
  position: 'top-right',
  limit: 3,
  avoidDuplicates: false,
  enqueue: true,
  notifications: {
    global: {
      duration: 3500
    }
  }
});

const i18n = createI18n({
  locale: 'nl',
  messages: messages,
  defaultLocale: 'nl',
  silentTranslationWarn: true,
  silentFallbackWarn: true
});

app.use(router);
app.use(notivue);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(VCalendar, {});
app.use(VueTablerIcons);
app.use(print);
app.use(i18n);
app.use(VueApexCharts);
app.use(permissionPlugin);
app.component('VueDatePicker', VueDatePicker);

/*

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err);
  console.log('Component:', instance);
  console.log('Error Info:', info);
};

app.config.warnHandler = (msg, instance, trace) => {
  if (msg.includes('Maximum recursive updates')) {
    console.warn('Recursive update in component:', instance);
    console.log('Component tree:', trace);
  }
};*/

app.use(vuetify).mount('#app');
const settingsStore = useSettingsStore();
settingsStore.initializeTheme();

export default i18n;
