<template>
  <div v-if="!authStore.isLoading">
    <NotificationHolder class="notifiHolder" />
    <RouterView />
  </div>
  <div v-else class="d-flex flex-column justify-center align-center h-100 w-100">
    <h5>Loading...</h5>
    <br />
    <v-progress-circular indeterminate color="primary" size="100" width="10"></v-progress-circular>
  </div>
</template>

<!--

v-permissions Usage

<template>
  <button v-permission="[{ action: 'create', resourceType: 'users' }]">
    Create User
  </button>
</template>

-->

<script setup lang="ts">
import { onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { RouterView } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getCsrfToken } from '@/utils/csrf';
import { notificationService } from '@/services/NotificationService';
import { securityService } from '@/services/SecurityService';
import posthog from '@/plugins/posthog';

const dev = import.meta.env.DEV;

// Import components
const NotificationHolder = defineAsyncComponent(() => import('./components/Notivue/component.vue'));

const authStore = useAuthStore();
const { locale } = useI18n();

onMounted(async () => {
  try {
    const toolbarJSON = new URLSearchParams(window.location.hash.substring(1)).get('__posthog');
    if (toolbarJSON) {
      posthog?.loadToolbar(JSON.parse(toolbarJSON));
    }

    try {
      if (import.meta.env.VITE_ENABLE_CSRF === 'true') {
        await getCsrfToken();
      }
    } catch (csrfError) {
      console.warn('CSRF token fetch failed:', csrfError);
    }

    try {
      await authStore.initializeAuth();
    } catch (authError) {
      console.error('Auth initialization failed:', authError);
      throw authError;
    }

    // Initialize locale
    try {
      const savedLocale = localStorage.getItem('locale');
      if (savedLocale) {
        locale.value = savedLocale;
      }
    } catch (localeError) {
      console.warn('Locale initialization failed:', localeError);
    }
    authStore.formatPermissions();

    // Only initialize services if we're not in the callback route
    const isCallbackRoute = window.location.pathname.includes('/auth/callback');
    if (authStore.isAuthenticated && authStore.user?.id && !isCallbackRoute) {
      try {
        // Connect notification service first as it's essential
        await notificationService.connect(authStore.user.id);

        // Try to connect security service, but don't block on failure
        try {
          await securityService.connect();
        } catch (securityError) {
          console.warn('Security service connection failed (non-critical):', securityError);
        }
      } catch (error) {
        console.error('Failed to connect to essential services:', error);
        throw error;
      }
    }

    if (!dev) {
      posthog?.identify(authStore.user.id, { email: authStore.user.email, name: authStore.user.name });
    }
  } catch (error) {
    console.error('Critical app initialization error:', error);
  }
});

onUnmounted(() => {
  try {
    notificationService.disconnect();
    securityService.disconnect();
  } catch (error) {
    console.error('Error disconnecting services:', error);
  }
});
</script>

<style>
@import url('https://db.onlinewebfonts.com/c/c155d66de1db92e16b55efebc127090a?family=FreeSetDemiBold');
</style>

<style scoped lang="scss">
.notifiHolder {
  height: 100%;
  width: 100%;
  z-index: 9999;
}
</style>
