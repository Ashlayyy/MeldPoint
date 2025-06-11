import { defineStore } from 'pinia';
import { apiKeysAPI } from '@/API/apiKeys';
import { useNotificationStore } from './notification_store';
import { ref, computed } from 'vue';
import i18n from '@/main';

const t = i18n.global.t;

interface APIKey {
  id: string;
  name: string;
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
}

interface APIKeyWithMetadata extends APIKey {
  expiresIn?: number; // days until expiration
  isExpired?: boolean;
  isExpiringSoon?: boolean; // expires in less than 7 days
}

export const useApiKeysStore = defineStore('apiKeys', () => {
  const apiKeys = ref<APIKeyWithMetadata[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const notification = useNotificationStore();

  // Computed properties
  const activeKeys = computed(() => apiKeys.value.filter((key) => key.isActive));
  const expiredKeys = computed(() => apiKeys.value.filter((key) => key.isExpired));
  const expiringSoonKeys = computed(() => apiKeys.value.filter((key) => key.isExpiringSoon && !key.isExpired));

  // Helper functions
  const calculateKeyMetadata = (key: APIKey): APIKeyWithMetadata => {
    const now = new Date();
    const metadata: APIKeyWithMetadata = { ...key };

    if (key.expiresAt) {
      const expiryDate = new Date(key.expiresAt);
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      metadata.expiresIn = diffDays;
      metadata.isExpired = diffDays <= 0;
      metadata.isExpiringSoon = diffDays > 0 && diffDays <= 7;
    }

    return metadata;
  };

  // Actions
  const fetchApiKeys = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const keys = await apiKeysAPI.list();
      apiKeys.value = keys.map(calculateKeyMetadata);
    } catch (err: any) {
      error.value = err.message;
      notification.error({
        message: t('errors.fetch_error', { error: err.message })
      });
    } finally {
      isLoading.value = false;
    }
  };

  const createApiKey = async (name: string, expiresAt?: Date) => {
    isLoading.value = true;
    error.value = null;

    notification.promise({
      message: t('saving.saving')
    });

    try {
      const result = await apiKeysAPI.create({ name, expiresAt });
      await fetchApiKeys(); // Refresh the list
      notification.resolvePromise({
        message: t('success.api_key_created')
      });
      return result;
    } catch (err: any) {
      error.value = err.message;
      notification.rejectPromise({
        message: t('errors.create_error', { error: err.message })
      });
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateApiKey = async (keyId: string, name: string) => {
    isLoading.value = true;
    error.value = null;

    notification.promise({
      message: t('saving.saving')
    });

    try {
      await apiKeysAPI.update(keyId, name);
      await fetchApiKeys(); // Refresh the list
      notification.resolvePromise({
        message: t('success.api_key_updated')
      });
    } catch (err: any) {
      error.value = err.message;
      notification.rejectPromise({
        message: t('errors.update_error ', { error: err.message })
      });
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const revokeApiKey = async (keyId: string) => {
    isLoading.value = true;
    error.value = null;

    notification.promise({
      message: t('saving.saving')
    });

    try {
      await apiKeysAPI.revoke(keyId);
      await fetchApiKeys(); // Refresh the list
      notification.resolvePromise({
        message: t('success.api_key_revoked')
      });
    } catch (err: any) {
      error.value = err.message;
      notification.rejectPromise({
        message: t('errors.revoke_error', { error: err.message })
      });
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    apiKeys,
    isLoading,
    error,

    // Computed
    activeKeys,
    expiredKeys,
    expiringSoonKeys,

    // Actions
    fetchApiKeys,
    createApiKey,
    updateApiKey,
    revokeApiKey
  };
});
