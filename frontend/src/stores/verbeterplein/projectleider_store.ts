import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetAllProjectLeiders } from '../../API/projectleider';
import { useNotificationStore } from './notification_store';
const notification = useNotificationStore();

export const useProjectleiderStore = defineStore('projectleider', {
  state: () => ({
    projectleiders: [],
    isLoading: false,
    error: null,
    initialized: false
  }),

  actions: {
    async fetchProjectleiders() {
      this.isLoading = true;
      try {
        const response = await GetAllProjectLeiders();
        if (response.status === 200) {
          this.projectleiders = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async initializeData() {
      if (this.initialized) return;
      await this.fetchProjectleiders();
      this.initialized = true;
    }
  },

  getters: {
    projectleiderNames: (state) => state.projectleiders.map((projectleider: any) => projectleider.Name),

    getProjectleiderByName: (state) => (name: string) => state.projectleiders.find((projectleider: any) => projectleider.Name === name),

    getProjectleiderById: (state) => (id: string) => state.projectleiders.find((projectleider: any) => projectleider.id === id)
  }
});
