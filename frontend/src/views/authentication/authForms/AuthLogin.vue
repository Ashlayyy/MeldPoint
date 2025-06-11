<script setup lang="ts">
import { ref, onMounted } from 'vue';
import i18n from '@/main';
import Microsoft from '@/assets/images/auth/social-microsoft.svg';
import { useAuthStore } from '@/stores/auth';

const t = i18n.global.t;
const authError = ref('');
const authTraceID = ref('');

const authStore = useAuthStore();

const errorMessages = {
  microsoft_auth_failed: t('auth.microsoft_auth_failed'),
  user_not_found: t('auth.user_not_found'),
  login_failed: t('auth.login_failed'),
  auth_code_already_redeemed: t('auth.auth_code_reused')
};

// Add mounted hook to check URL parameters
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error && errorMessages[error as keyof typeof errorMessages]) {
    authError.value = errorMessages[error as keyof typeof errorMessages];
  }
  authTraceID.value = urlParams.get('traceId') || '';
});
</script>

<template>
  <v-btn
    block
    color="primary"
    variant="outlined"
    class="text-lightText microsoftbutton px-4"
    @click="authStore.login"
    data-test="microsoft-login-button"
  >
    <img :src="Microsoft" alt="microsoft" height="35" />
    <span class="ml-2">{{ t('auth.microsoft_login') }}</span></v-btn
  >
  <v-alert v-if="authError" color="error" class="mb-4" data-test="auth-error" closable @click:close="authError = ''">
    {{ authError }}
    <br /><br />
    Geef deze code aan wanneer je een melding maakt: {{ authTraceID }}
  </v-alert>
</template>
<style lang="scss">
.custom-devider {
  border-color: rgba(0, 0, 0, 0.08) !important;
}
.microsoftbutton {
  border-color: rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}
</style>
