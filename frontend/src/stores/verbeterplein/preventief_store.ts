import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import {
  UpdatePreventief,
  AddCorrespondence,
  CreatePreventief,
  RemoveCorrespondence,
  GetAllPreventief,
  GetPreventiefById
} from '../../API/preventief';
import { useNotificationStore } from './notification_store';
import { useRequestStore } from './request_store';
import { debounce } from 'lodash';

const notification = useNotificationStore();
const request = useRequestStore();

const LOG_PREFIX = '🛡️ [PreventiefStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

export const usePreventiefStore = defineStore('preventief', {
  state: () => ({
    preventief: null as any,
    preventieven: null as any,
    loading: {
      single: false,
      all: false
    },
    initialized: false,
    preventiefCache: new Map<string, any>(),
    initializationPromise: null as Promise<any> | null,
    standardData: {
      Teamleden: null,
      CorrespondenceIDs: null,
      Smart: {
        Specifiek: {
          Text: '',
          Behaald: '',
          Toelichting: ''
        },
        Meetbaar: {
          Text: '',
          Behaald: '',
          Toelichting: ''
        },
        Haalbaar: {
          Text: '',
          Behaald: '',
          Toelichting: ''
        },
        Relevant: {
          Text: '',
          Behaald: '',
          Toelichting: ''
        },
        Tijdgebonden: {
          Text: '',
          Behaald: '',
          Toelichting: ''
        }
      },
      Steps: {
        Obstakel: {
          Finished: false,
          Deadline: null
        },
        Plan: {
          Finished: false,
          Deadline: null
        },
        Do: {
          Finished: false,
          Deadline: null
        },
        Check: {
          Finished: false,
          Deadline: null
        },
        Act: {
          Finished: false,
          Deadline: null
        },
        Finished: {
          Finished: false,
          Deadline: null
        }
      },
      FailureAnalysis: null,
      NewPDCAPlanning: null,
      Documentation: null,
      TrainingNeeded: false,
      TrainingNeededType: null,
      Monitoring: null,
      FollowUpDate: null,
      Responsible: null,
      TodoItems: [],
      id: '',
      Kernoorzaak: null,
      Why: null,
      Deadline: null,
      Title: null,
      Strategie: {
        KPI: null,
        Comments: null
      },
      Conclusie: null,
      PDCAStatus: null,
      ActJSON: null,
      StatusID: null,
      BegeleiderID: null,
      Begeleider: null,
      CreatedAt: '',
      UpdatedAt: '',
      User: null,
      Status: null,
    }
  }),

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
      
      this.initializationPromise = request.executeRequest('preventief', 'initialization', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllPreventief();
          if (response.status === 200) {
            this.preventieven = response.data || null;
          }
          this.initialized = true;
          if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Initialization complete`, LOG_STYLES.info);
          return response;
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

      return request.executeRequest('preventief', 'refresh', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting refresh`, LOG_STYLES.info);
        const response = await GetAllPreventief();
        if (response.status === 200) {
          this.preventieven = response.data || null;
        }
      });
    }, 1000),

    async updatePreventief(id: string, data: Record<string, any>) {
      return request.executeRequest('preventief', `updatePreventief-${id}`, async () => {
        this.loading.single = true;
        try {
          const response = await UpdatePreventief(id, data);
          if (response.status === 200) {
            this.preventief = response.data || null;
            this.preventiefCache.set(id, response.data);
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Update failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async updatePreventiefAutoSave(id: string, data: Record<string, any>) {
      return request.executeRequest('preventief', `autoSave-${id}`, async () => {
        try {
          const response = await UpdatePreventief(id, data);
          if (response.status === 200) {
            this.preventiefCache.set(id, response.data);
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c AutoSave failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        }
      });
    },

    async getSinglePreventief(id: string) {
      return request.executeRequest('preventief', `getSingle-${id}`, async () => {
        this.loading.single = true;
        try {
          // Check cache first
          if (this.preventiefCache.has(id)) {
            if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Cache hit for preventief ${id}`, LOG_STYLES.cache);
            this.preventief = this.preventiefCache.get(id);
            return { status: 200, data: this.preventief };
          }

          const response = await GetPreventiefById(id);
          if (response.status === 200) {
            this.preventief = response.data || null;
            this.preventiefCache.set(id, response.data);
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Fetch single failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.fetch_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async getAllPreventief() {
      if (!this.initialized) {
        return this.initialize();
      }

      return request.executeRequest('preventief', 'getAll', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllPreventief();
          if (response.status === 200) {
            this.preventieven = response.data || null;
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Fetch all failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.fetch_error', { error: error }) });
        } finally {
          this.loading.all = false;
        }
      });
    },

    async linkStatus(id: string, statusId: string) {
      return request.executeRequest('preventief', `linkStatus-${id}`, async () => {
        this.loading.single = true;
        try {
          const response = await UpdatePreventief(id, { StatusID: statusId });
          if (response.status === 200) {
            this.preventiefCache.set(id, response.data);
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Link status failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async linkActiehouder(id: string, actiehouderId: string) {
      return request.executeRequest('preventief', `linkActiehouder-${id}`, async () => {
        this.loading.single = true;
        try {
          const response = await UpdatePreventief(id, { User: { id: actiehouderId } });
          if (response.status === 200) {
            this.preventiefCache.set(id, response.data);
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Link actiehouder failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async addCorrespondence(id: string, files: any[]) {
      return request.executeRequest('preventief', `addCorrespondence-${id}`, async () => {
        this.loading.single = true;
        try {
          const response = await AddCorrespondence(id, files);
          if (response.status === 200) {
            this.preventiefCache.set(id, response.data);
            return response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Add correspondence failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async createPreventief(data: Record<string, any>) {
      return request.executeRequest('preventief', 'create', async () => {
        this.loading.single = true;
        try {
          const response = await CreatePreventief({
            ...JSON.parse(JSON.stringify(this.standardData)),
            ...data
          });
          if (response.status === 201) {
            this.preventief = response.data || null;
            if (response.data?.id) {
              this.preventiefCache.set(response.data.id, response.data);
            }
            return response;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Create failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async removeCorrespondence(id: string, key: string) {
      return request.executeRequest('preventief', `removeCorrespondence-${id}-${key}`, async () => {
        this.loading.single = true;
        try {
          const response = await RemoveCorrespondence(id, key);
          if (response.status === 200) {
            this.preventiefCache.set(id, response.data);
            return { status: response.status, data: response.data };
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Remove correspondence failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async getPreventiefById(id: string) {
      return request.executeRequest('preventief', `getById-${id}`, async () => {
        this.preventief = JSON.parse(JSON.stringify(this.standardData));
        await this.getAllPreventief();
        this.preventief = {
          ...this.preventief,
          ...this.preventieven.find((p: any) => p.id === id)
        };
        if (this.preventief?.id) {
          this.preventiefCache.set(id, this.preventief);
        }
        return this.preventief;
      });
    },

    async schedulePDCA(id: string) {
      return request.executeRequest('preventief', `schedulePDCA-${id}`, async () => {
        this.loading.single = true;
        try {
          // Implementation for schedulePDCA
          this.loading.single = false;
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Schedule PDCA failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
          this.loading.single = false;
        }
      });
    },

    clearCache() {
      this.preventiefCache.clear();
    }
  }
});
