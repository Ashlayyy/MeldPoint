import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetDashboardStats, GetDepartmentStats, GetRoleStats, GetActivityStats, GetGrowthStats } from '@/API/stats';
import { useNotificationStore } from './notification_store';
const notification = useNotificationStore();

export const useStatsStore = defineStore('stats', {
  state: () => ({
    dashboard: null as any,
    departments: [] as any[],
    roles: [] as any[],
    activity: [] as any[],
    growth: [] as any[],
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchDashboardStats() {
      this.isLoading = true;
      try {
        const response = await GetDashboardStats();
        if (response.status === 200) {
          this.dashboard = response.data || null;
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchDepartmentStats() {
      this.isLoading = true;
      try {
        const response = await GetDepartmentStats();
        if (response.status === 200) {
          this.departments = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchActivityStats(days: number = 30) {
      this.isLoading = true;
      try {
        const response = await GetActivityStats(days);
        if (response.status === 200) {
          this.activity = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    },

    async fetchGrowthStats(period: number = 30) {
      this.isLoading = true;
      try {
        const response = await GetGrowthStats(period);
        if (response.status === 200) {
          this.growth = response.data || [];
        } else throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.isLoading = false;
      }
    }
  }
});
