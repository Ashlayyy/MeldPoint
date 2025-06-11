import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetAllStatuses } from '../../API/status';
import { useNotificationStore } from './notification_store';
import { useRequestStore } from './request_store';
import { debounce } from 'lodash';

const notification = useNotificationStore();
const request = useRequestStore();

const LOG_PREFIX = '🔄 [StatusStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

export const useStatusStore = defineStore('status', {
  state: () => ({
    statussen: [] as any[],
    statusListCorrectief: [] as any[],
    loading: {
      single: false,
      all: false
    },
    initialized: false,
    statusCache: new Map<string, any>(),
    initializationPromise: null as Promise<void> | null,
  }),

  getters: {
    allStatussen: (state) => {
      const statuses = state.statussen.filter((status: any) => status.StatusType === 'all')
        .map((status: any) => status);
      return statuses;
    },

    correctiefStatussen: (state) => {
      const statuses = state.statussen
        .filter((status: any) => status.StatusType === 'all')
        .map((status: any) => status);
      return statuses;
    },

    getStatusByName: (state) => (name: string) => {
      // Check cache first
      if (state.statusCache.has(name)) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Cache hit for status ${name}`, LOG_STYLES.cache);
        return state.statusCache.get(name);
      }

      const status = state.statussen.find((status: any) => status.StatusNaam === name);
      if (status) {
        state.statusCache.set(name, status);
      }
      return status;
    }
  },

  actions: {
    async initialize() {
      if (this.initialized) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Already initialized, skipping`, LOG_STYLES.cache);
        return;
      }

      if (this.initializationPromise) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Initialization in progress, reusing promise`, LOG_STYLES.cache);
        return this.initializationPromise;
      }

      if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting initialization`, LOG_STYLES.info);
      
      this.initializationPromise = request.executeRequest('status', 'initialization', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllStatuses();
          if (response.status === 200) {
            this.statussen = response.data?.filter((status: any) => status.StatusType === 'all')
            this.statusListCorrectief = response.data;
          }
          this.initialized = true;
          if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Initialization complete`, LOG_STYLES.info);
        } catch (error) {
          console.error(`${LOG_PREFIX} %c Initialization failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.fetch_error', { error: error }) });
          throw error;
        } finally {
          this.initializationPromise = null;
          this.loading.all = false;
        }
      });

      return this.initializationPromise;
    },

    refreshData: debounce(async function(this: any) {
      if (!this.initialized) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Not initialized, running initialization instead`, LOG_STYLES.info);
        return this.initialize();
      }

      return request.executeRequest('status', 'refresh', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting refresh`, LOG_STYLES.info);
        const response = await GetAllStatuses();
        if (response.status === 200) {
          this.statussen = response.data?.filter((status: any) => status.StatusType === 'all')
          this.statusListCorrectief = response.data;
        }
      });
    }, 1000),

    async fetchStatussen(mode?: string) {
      if (!this.initialized && !mode) {
        return this.initialize();
      }

      return request.executeRequest('status', 'fetchStatussen', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllStatuses();
          if (response.status === 200) {
            if (mode === 'reparatieloop') {
              this.statussen = response.data?.filter((status: any) => 
                status.StatusType === 'all')
            } else {
              this.statussen = response.data?.filter((status: any) => 
                status.StatusType === 'all')
              this.statusListCorrectief = response.data;
            }
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Fetch failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.fetch_error', { error: error }) });
        } finally {
          this.loading.all = false;
        }
      });
    },

    async initializeData() {
      return this.initialize();
    },

    clearCache() {
      this.statusCache.clear();
    }
  }
});
