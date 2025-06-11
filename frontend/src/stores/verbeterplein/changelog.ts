import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChangelogEntry, ResponseData } from '@/types/changelog';
import { GetChangelogs } from '@/API/changelog';

export const useChangelogStore = defineStore('changelog', () => {
  const changelogs = ref<ChangelogEntry[]>([]);
  const source = ref<string>('');
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const fetchChangelogs = async () => {
    isLoading.value = true;
    error.value = null;
    source.value = '';
    changelogs.value = [];

    try {
      const data: ResponseData = await GetChangelogs();
      changelogs.value = data.changelogs;
      source.value = data.source;
    } catch (err: unknown) {
      console.error('Error in fetchChangelogs action:', err);
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'An unknown error occurred while fetching changelogs.';
      }
      changelogs.value = [];
      source.value = '';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    changelogs,
    isLoading,
    error,
    source,
    fetchChangelogs
  };
});
