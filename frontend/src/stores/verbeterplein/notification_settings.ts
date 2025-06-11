import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationSettingsStore = defineStore(
  'notification_settings',
  () => {
    const enabled = ref(true);
    const toastEnabled = ref(true);
    const systemEnabled = ref(false);
    const sound = ref(true);
    const hasRequestedPermission = ref(false);

    const requestSystemPermission = async () => {
      if (!hasRequestedPermission.value && 'Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          systemEnabled.value = permission === 'granted';
          hasRequestedPermission.value = true;
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          systemEnabled.value = false;
        }
      }
      return systemEnabled.value;
    };

    const toggleEnabled = (value: boolean) => {
      enabled.value = value;
    };

    const toggleToast = (value: boolean) => {
      toastEnabled.value = value;
    };

    const toggleSystem = async (value: boolean) => {
      if (value && !hasRequestedPermission.value) {
        const granted = await requestSystemPermission();
        systemEnabled.value = granted;
        return;
      }
      systemEnabled.value = value;
    };

    const toggleSound = (value: boolean) => {
      sound.value = value;
    };

    return {
      enabled,
      toastEnabled,
      systemEnabled,
      sound,
      hasRequestedPermission,
      toggleEnabled,
      toggleToast,
      toggleSystem,
      toggleSound,
      requestSystemPermission
    };
  },
  {
    persist: true
  }
);
