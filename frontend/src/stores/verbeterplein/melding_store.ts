import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import {
  GetAllReports,
  CreateReport,
  UpdateReport,
  RemoveCorrespondence,
  AddCorrespondence,
  FindMeldingByPreventiefID,
  AddCloneID,
  GetLengths,
  GetReportById,
  GetReportByVolgnummer
} from '@/API/melding';
import { UpdateArchiveBatch } from '@/API/batch';
import { cacheService } from '@/utils/cache';
import { useNotificationStore } from './notification_store';
import { useRequestStore } from './request_store';
import { debounce } from 'lodash';

const notification = useNotificationStore();
const request = useRequestStore();

const LOG_PREFIX = '🔄 [MeldingStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

export const useMeldingStore = defineStore('melding', {
  state: () => ({
    reports: [] as any[],
    selectedFormId: '',
    selectedForm: null as any,
    loading: {
      single: false,
      all: false
    },
    lengths: {
      all: 0,
      ops: 0,
      correctief: 0,
      pdca: 0,
      archived: 0,
      financed: 0
    },
    initialized: false,
    currentLoadingId: null as string | null,
    reportCache: new Map<string, any>(),
    pendingRequests: new Map<string, Promise<any>>(),
    refreshTimeout: null as NodeJS.Timeout | null,
    refreshInProgress: false,
    initializationPromise: null as Promise<void> | null
  }),

  getters: {
    pdcaReports: (state) => {
      // Get all PDCA reports
      const pdcaReports = state.reports?.filter(
        (report: any) => report.Type === 'Melding' && report.Archived === false && report.PDCA === true
      );

      // Sort by VolgNummer (ascending)
      pdcaReports.sort((a, b) => Number(a.VolgNummer) - Number(b.VolgNummer));

      // Track seen Preventief IDs
      const seenPreventiefIds = new Set();

      // Filter to keep only first occurrence of each Preventief
      const uniquePDCAReports = pdcaReports.filter((report) => {
        if (!report.Preventief?.id) return true; // Keep reports without Preventief
        if (seenPreventiefIds.has(report.Preventief.id)) return false; // Skip if we've seen this Preventief
        seenPreventiefIds.add(report.Preventief.id); // Add to seen set
        return true;
      });

      // Sort by VolgNummer (descending)
      return uniquePDCAReports.sort((a, b) => Number(b.VolgNummer) - Number(a.VolgNummer));
    },

    getReportById: (state) => (id: string) => {
      return state.reports.find((report: any) => report.id === id);
    },

    getReportByVolgNummer: (state) => (volgNummer: string) => {
      // Check cache first
      if (state.reportCache.has(volgNummer)) {
        return state.reportCache.get(volgNummer);
      }

      const report = state.reports.find((report: any) => Number(report.VolgNummer) === Number(volgNummer));

      // Cache for future use
      if (report) {
        state.reportCache.set(volgNummer, report);
      }

      return report;
    }
  },

  actions: {
    async initialize() {
      if (this.initialized) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Already initialized, skipping`, LOG_STYLES.cache);
        return;
      }

      this.loading.all = true;

      if (this.initializationPromise) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Initialization in progress, reusing promise`, LOG_STYLES.cache);
        return this.initializationPromise;
      }

      if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting initialization`, LOG_STYLES.info);

      this.initializationPromise = request.executeRequest('melding', 'initialization', async () => {
        try {
          const [lengthsResponse, reportsResponse] = await Promise.all([GetLengths(), GetAllReports(false)]);

          if (reportsResponse.status === 200) {
            this.reports = reportsResponse.data;
          }
          if (lengthsResponse.status === 200) {
            this.lengths = lengthsResponse.data;
          }

          this.initialized = true;
          if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Initialization complete`, LOG_STYLES.info);
        } catch (error) {
          if (import.meta.env.ENABLE_LOGGING) console.error(`${LOG_PREFIX} %c Initialization failed`, LOG_STYLES.error, error);
          throw error;
        } finally {
          this.initializationPromise = null;
          this.loading.all = false;
        }
      });

      return this.initializationPromise;
    },

    async initializeData() {
      return this.initialize();
    },

    refreshData: debounce(async function (this: any) {
      if (!this.initialized) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Not initialized, running initialization instead`, LOG_STYLES.info);
        return this.initialize();
      }

      return request.executeRequest('melding', 'refresh', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting combined refresh`, LOG_STYLES.info);

        const [reportsResponse, lengthsResponse] = await Promise.all([GetAllReports(false), GetLengths()]);

        if (reportsResponse.status === 200) {
          this.reports = reportsResponse.data;
        }
        if (lengthsResponse.status === 200) {
          this.lengths = lengthsResponse.data;
        }
      });
    }, 1000),

    async fetchSingleReport(volgNummer: string) {
      return request.executeRequest('melding', `fetch-report-${volgNummer}`, async () => {
        this.loading.single = true;
        try {
          // Check cache first
          const cached = this.reportCache.get(volgNummer);
          if (cached) {
            this.selectedForm = cached;
            return cached;
          }

          const response = await GetReportByVolgnummer(volgNummer);
          if (response.status === 200) {
            const report = response.data;
            this.selectedForm = report;
            this.reportCache.set(volgNummer, report);

            if (!this.reports.find((r) => r.VolgNummer === volgNummer)) {
              this.reports = [...this.reports, report];
            }

            return report;
          }
          return null;
        } catch (error) {
          notification.error({
            message: t('errors.fetch_error', { error: error })
          });
          return null;
        } finally {
          this.loading.single = false;
        }
      });
    },

    async fetchReports(forced: boolean = false) {
      if (!forced && !this.initialized) {
        return this.initialize();
      }

      return request.executeRequest('melding', 'fetchReports', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllReports(forced);
          if (response.status === 200) {
            this.reports = response.data;
          }
          return response;
        } finally {
          this.loading.all = false;
        }
      });
    },

    async fetchReportById(id: string, forced: boolean = false) {
      this.loading.single = true;
      try {
        const response = await GetReportById(id, forced);
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
      } finally {
        this.loading.single = false;
      }
    },

    async addReport(report: any) {
      return request.executeRequest('melding', 'addReport', async () => {
        this.loading.single = true;
        try {
          const response = await CreateReport(report);
          if (response.status === 201) {
            await this.refreshData();
            cacheService.clear();
            return response;
          }
          throw new Error(JSON.stringify(response));
        } finally {
          this.loading.single = false;
        }
      });
    },

    async updateReport(id: string, report: any) {
      return request.executeRequest('melding', `updateReport-${id}`, async () => {
        this.loading.single = true;
        try {
          const response = await UpdateReport(id, report);
          if (response.status === 200) {
            await this.refreshData();
            cacheService.remove(`report-${id}`);
            this.selectedForm = response.data.data;
            return response;
          }
          throw new Error(JSON.stringify(response));
        } finally {
          this.loading.single = false;
        }
      });
    },

    async linkStatusMelding(meldingId: string, statusId: string) {
      this.loading.single = true;
      try {
        const response = await UpdateReport(meldingId, { StatusID: statusId });
        if (response.status === 200) {
          this.selectedForm = response.data.data;
          return { status: response.status, data: response.data.data };
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.link_error', { error: error }) });
      } finally {
        this.loading.single = false;
      }
    },

    async linkActiehouderMelding(meldingId: string, actiehouderId: string) {
      this.loading.single = true;
      try {
        const response = await UpdateReport(meldingId, { ActiehouderID: actiehouderId });
        if (response.status === 200) {
          this.selectedForm = response.data.data;
          return { status: response.status, data: response.data.data };
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.link_error', { error: error }) });
      } finally {
        this.loading.single = false;
      }
    },

    async linkPreventief(meldingId: string, preventiefId: string) {
      this.loading.single = true;
      try {
        const response = await UpdateReport(meldingId, { PreventiefID: preventiefId });
        if (response.status === 200) {
          this.selectedForm = response.data.data;
          return { status: response.status, data: response.data.data };
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.link_error', { error: error }) });
      } finally {
        this.loading.single = false;
      }
    },

    async linkCorrectief(meldingId: string, correctiefId: string) {
      this.loading.single = true;
      try {
        const response = await UpdateReport(meldingId, { CorrectiefID: correctiefId });
        if (response.status === 200) {
          this.selectedForm = response.data.data;
          return { status: response.status, data: response.data.data };
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.link_error', { error: error }) });
      } finally {
        this.loading.single = false;
      }
    },

    async linkProject(meldingId: string, projectId: string) {
      this.loading.single = true;
      try {
        const response = await UpdateReport(meldingId, { ProjectID: projectId });
        if (response.status === 200) {
          this.selectedForm = response.data.data;
          return { status: response.status, data: response.data.data };
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.link_error', { error: error }) });
      } finally {
        this.loading.single = false;
      }
    },

    async archiveReport(ids: string[], archive = true) {
      return request.executeRequest('melding', 'archive', async () => {
        this.loading.single = true;
        try {
          const response = await UpdateArchiveBatch(ids, archive);
          if (response.status === 200) {
            this.reports = [];
            this.selectedForm = null;
            await this.refreshData();
            return response;
          }
          throw new Error(JSON.stringify(response));
        } finally {
          this.loading.single = false;
        }
      });
    },

    async removeCorrespondence(meldingId: string, key: string) {
      return request.executeRequest('melding', 'removeCorrespondence', async () => {
        this.loading.single = true;
        try {
          const response = await RemoveCorrespondence(meldingId, key);
          if (response.status === 200) {
            this.selectedForm = response.data;
            return { status: response.status, data: response.data };
          } else {
            throw new Error(JSON.stringify(response));
          }
        } catch (error: any) {
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async addCorrespondence(meldingId: string, files: any[]) {
      return request.executeRequest('melding', 'addCorrespondence', async () => {
        this.loading.single = true;
        try {
          const response = await AddCorrespondence(meldingId, files);
          if (response.status === 200) {
            this.selectedForm = response.data;
            return { status: response.status, data: response.data };
          } else {
            throw new Error(JSON.stringify(response));
          }
        } catch (error: any) {
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async addMeldingToPDCA(preventiefID: string) {
      return request.executeRequest('melding', 'addMeldingToPDCA', async () => {
        this.loading.single = true;
        try {
          const response = await FindMeldingByPreventiefID(preventiefID);
          if (response.status === 200) {
            this.selectedForm = response.data;
            return { status: response.status, data: response.data };
          } else {
            throw new Error(JSON.stringify(response));
          }
        } catch (error: any) {
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async addCloneID(meldingID: string, cloneID: string) {
      return request.executeRequest('melding', 'addCloneID', async () => {
        this.loading.single = true;
        try {
          const response = await AddCloneID(meldingID, cloneID);
          if (response.status === 200) {
            this.selectedForm = response.data.data;
            return { status: response.status, data: response.data.data };
          } else {
            throw new Error(JSON.stringify(response));
          }
        } catch (error: any) {
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async updateCurrentForm(forced: boolean = false) {
      this.selectedForm = await this.fetchReportById(this.selectedFormId, forced);
    },

    setSelectedFormId(id: string) {
      this.selectedFormId = id;
    },

    setSelectedForm(form: any) {
      this.selectedForm = form;
      if (form?.VolgNummer) {
        this.reportCache.set(form.VolgNummer, form);
      }
    },

    clearCache() {
      this.reportCache.clear();
    }
  }
});
