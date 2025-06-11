<template>
  <div class="flex justify-center items-center h-screen">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useRouter } from 'vue-router';
import { securityService } from '@/services/SecurityService';

const router = useRouter();
const notification = useNotificationStore();
const authStore = useAuthStore();

onMounted(async () => {
  notification.promise({ message: 'Logging in...' });

  try {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      throw new Error('Authentication failed');
    }

    Promise.resolve().then(async () => {
      try {
        await securityService.connect();
      } catch (error) {
        console.warn('Security service connection failed (non-critical):', error);
      }
    });

    notification.resolvePromise({
      message: 'You are now logged in.',
      duration: 2000
    });

    const redirectPath = localStorage.getItem('redirectPath') || '/verbeterplein/overzicht';
    localStorage.removeItem('redirectPath');
    router.push(redirectPath);
  } catch (e) {
    console.error('Login error:', e);
    authStore.logout();
    notification.rejectPromise({
      title: 'Login Failed',
      message: 'Please try again. If it happens again, please contact support.'
    });
    router.push('/auth/login');
  }
});
</script>
