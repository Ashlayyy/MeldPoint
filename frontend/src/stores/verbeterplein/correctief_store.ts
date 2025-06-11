import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetAllReports } from '../../API/melding';
import { CreateCorrectief, UpdateCorrectief } from '../../API/correctief';
import { useNotificationStore } from './notification_store';

const notification = useNotificationStore();

export const useCorrectiefStore = defineStore('correctief', {
  state: () => ({
    correctiefItems: [],
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchCorrectief() {
      this.isLoading = true;
      try {
        const response = await GetAllReports();
        if (response.status === 200) {
          this.correctiefItems = response.data.filter((item: any) => {
            return (
              item.Type === 'Melding' &&
              item.Archived === false &&
              item.Correctief?.AkoordOPS === true &&
              item.Correctief?.Status?.StatusNaam !== 'Afgerond' &&
              item.Correctief?.Deadline !== undefined &&
              item.Correctief?.Deadline !== null
            );
          });
          return response.data;
        }
        throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async updateCorrectief(id: string, data: any) {
      try {
        const response = await UpdateCorrectief(id, data);
        if (response?.status === 200) {
          await this.fetchCorrectief();
          return response;
        }
        throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      }
    },

    async createCorrectief(data: any) {
      try {
        const response = await CreateCorrectief(data);
        if (response.status === 200) {
          await this.fetchCorrectief();
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      }
    },

    async schedulePDCA(id: string) {
      try {
        const response = await UpdateCorrectief(id, {
          TIMER: Date.now() + 7 * 24 * 60 * 60 * 1000,
          OnlyTimer: true
        });
        if (response.status === 200) {
          return response.data;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error }) });
      }
    }
  },

  getters: {
    getCorrectieById: (state) => (id: string) => {
      return state.correctiefItems.find((item: any) => item.id === id);
    }
  }
});
