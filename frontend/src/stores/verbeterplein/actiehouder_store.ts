import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetAllActiehouders } from '../../API/actiehouder';
import { useNotificationStore } from './notification_store';
import { useRequestStore } from './request_store';
import { debounce } from 'lodash';

const notification = useNotificationStore();
const request = useRequestStore();

const LOG_PREFIX = '👤 [ActiehouderStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

export const useActiehouderStore = defineStore('actiehouder', {
  state: () => ({
    actiehouders: [] as any[],
    loading: {
      single: false,
      all: false
    },
    initialized: false,
    actiehouderCache: new Map<string, any>(),
    initializationPromise: null as Promise<any> | null,
  }),

  getters: {
    actiehouderNames: (state) => state.actiehouders.map((actiehouder: any) => actiehouder.Name),

    getActiehouderByName: (state) => (name: string) => {
      // Check cache first
      const cachedActiehouder = Array.from(state.actiehouderCache.values())
        .find(actiehouder => actiehouder.Name === name);
      if (cachedActiehouder) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Cache hit for actiehouder ${name}`, LOG_STYLES.cache);
        return cachedActiehouder;
      }

      const actiehouder = state.actiehouders.find((actiehouder: any) => actiehouder.Name === name);
      if (actiehouder?.id) {
        state.actiehouderCache.set(actiehouder.id, actiehouder);
      }
      return actiehouder;
    },

    getActiehouderById: (state) => (id: string) => {
      // Check cache first
      if (state.actiehouderCache.has(id)) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Cache hit for actiehouder ${id}`, LOG_STYLES.cache);
        return state.actiehouderCache.get(id);
      }

      const actiehouder = state.actiehouders.find((actiehouder: any) => actiehouder.id === id);
      if (actiehouder) {
        state.actiehouderCache.set(id, actiehouder);
      }
      return actiehouder;
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
      
      this.initializationPromise = request.executeRequest('actiehouder', 'initialization', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllActiehouders();
          if (response.status === 200) {
            this.actiehouders = response.data || [];
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

      return request.executeRequest('actiehouder', 'refresh', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting refresh`, LOG_STYLES.info);
        const response = await GetAllActiehouders();
        if (response.status === 200) {
          this.actiehouders = response.data || [];
        }
      });
    }, 1000),

    async fetchActiehouders() {
      if (!this.initialized) {
        return this.initialize();
      }

      return request.executeRequest('actiehouder', 'fetchActiehouders', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllActiehouders();
          if (response.status === 200) {
            this.actiehouders = response.data || [];
          } else {
            throw new Error(JSON.stringify(response));
          }
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
      this.actiehouderCache.clear();
    }
  }
});
