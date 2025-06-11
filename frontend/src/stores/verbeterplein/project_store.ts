import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import {
  GetAllProjects,
  GetProjectById,
  CreateProject,
  UpdateProject,
  AddDeelorder,
  RemoveDeelorder,
  DeleteProject
} from '../../API/project';
import { useNotificationStore } from './notification_store';
import { useRequestStore } from './request_store';
import { debounce } from 'lodash';

const notification = useNotificationStore();
const request = useRequestStore();

const LOG_PREFIX = '🏗️ [ProjectStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [] as any[],
    currentProject: null as any | null,
    loading: {
      single: false,
      all: false
    },
    initialized: false,
    projectCache: new Map<string, any>(),
    initializationPromise: null as Promise<void> | null,
  }),

  getters: {
    getProjectById: (state) => (id: string) => {
      // Check cache first
      if (state.projectCache.has(id)) {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Cache hit for project ${id}`, LOG_STYLES.cache);
        return state.projectCache.get(id);
      }
      
      const project = state.projects.find((project) => project.id === id);
      if (project) {
        state.projectCache.set(id, project);
      }
      return project;
    },

    getProjectByNumberID: (state) => (numberID: string) => {
      return state.projects.find((project) => project.projectnummer === numberID);
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
      
      this.initializationPromise = request.executeRequest('project', 'initialization', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllProjects();
          if (response.status === 200) {
            this.projects = response.data;
          }
          this.initialized = true;
          if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Initialization complete`, LOG_STYLES.info);
        } catch (error) {
          console.error(`${LOG_PREFIX} %c Initialization failed`, LOG_STYLES.error, error);
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

      return request.executeRequest('project', 'refresh', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting refresh`, LOG_STYLES.info);
        const response = await GetAllProjects();
        if (response.status === 200) {
          this.projects = response.data;
        }
      });
    }, 1000),

    async fetchProjects() {
      if (!this.initialized) {
        return this.initialize();
      }

      return request.executeRequest('project', 'fetchProjects', async () => {
        this.loading.all = true;
        try {
          const response = await GetAllProjects();
          if (response.status === 200) {
            this.projects = response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Fetch failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.fetch_error', { error: error }) });
        } finally {
          this.loading.all = false;
        }
      });
    },

    async fetchProjectById(id: string) {
      return request.executeRequest('project', `fetch-project-${id}`, async () => {
        this.loading.single = true;
        try {
          // Check cache first
          if (this.projectCache.has(id)) {
            this.currentProject = this.projectCache.get(id);
            return this.currentProject;
          }

          const response = await GetProjectById(id);
          if (response.status === 200) {
            this.currentProject = response.data;
            this.projectCache.set(id, response.data);
            return response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Fetch by ID failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.fetch_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async createProject(projectData: any) {
      return request.executeRequest('project', 'createProject', async () => {
        this.loading.single = true;
        try {
          const response = await CreateProject(projectData);
          if (response.status === 201) {
            this.projects.push(response.data);
            await this.refreshData();
            return response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Create failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async updateProject(id: string, projectData: any) {
      return request.executeRequest('project', `updateProject-${id}`, async () => {
        this.loading.single = true;
        try {
          const response = await UpdateProject(id, projectData);
          if (response.status === 200) {
            const index = this.projects.findIndex((p) => p.id === id);
            if (index !== -1) {
              this.projects[index] = response.data;
            }
            this.projectCache.set(id, response.data);
            return response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Update failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async addDeelorder(projectID: string, deelorder: string) {
      return request.executeRequest('project', `addDeelorder-${projectID}`, async () => {
        this.loading.single = true;
        try {
          const response = await AddDeelorder(projectID, deelorder);
          if (response.status === 200) {
            const index = this.projects.findIndex((p) => p.id === projectID);
            if (index !== -1) {
              this.projects[index] = response.data;
            }
            this.projectCache.set(projectID, response.data);
            return response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Add deelorder failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async removeDeelorder(projectID: string, deelorder: string) {
      return request.executeRequest('project', `removeDeelorder-${projectID}`, async () => {
        this.loading.single = true;
        try {
          const response = await RemoveDeelorder(projectID, deelorder);
          if (response.status === 200) {
            const index = this.projects.findIndex((p) => p.id === projectID);
            if (index !== -1) {
              this.projects[index] = response.data;
            }
            this.projectCache.set(projectID, response.data);
            return response.data;
          } else throw new Error(JSON.stringify(response));
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Remove deelorder failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.save_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    async deleteProject(id: string) {
      return request.executeRequest('project', `deleteProject-${id}`, async () => {
        this.loading.single = true;
        try {
          await DeleteProject(id);
          this.projectCache.delete(id);
          await this.refreshData();
        } catch (error: any) {
          console.error(`${LOG_PREFIX} %c Delete failed`, LOG_STYLES.error, error);
          notification.error({ message: t('errors.delete_error', { error: error }) });
        } finally {
          this.loading.single = false;
        }
      });
    },

    clearCache() {
      this.projectCache.clear();
    }
  }
});
