import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { TasksAPI } from '@/API/tasks';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useRequestStore } from '@/stores/verbeterplein/request_store';

const notification = useNotificationStore();
const request = useRequestStore();

const LOG_PREFIX = '🔄 [TaskStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

// Update Task interface to match Prisma model
export interface Task {
  id: string;
  message: string;
  userId: string;
  url?: string;
  action: string;
  actionType?: string;
  category?: string;
  status?: string;
  preventiefId?: string;
  correctiefId?: string;
  createdAt: string;
  deadline: string;
  completedAt?: string | Date | null;
  finished: boolean;
  level?: number;
  user?: any;
  preventief?: any;
  correctief?: any;
  parentId?: string;
  data?: any;
  metadata?: any;
  meldingId?: string;
}

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    correctiefTasks: new Map<string, Task>(),
    preventiefTasks: new Map<string, Task>(),
    currentUserTasks: new Map<string, Task>(),
    uncompletedTasks: new Map<string, Task>(),
    completedTasks: new Map<string, Task>(),
    loading: false,
    error: null as Error | null
  }),

  getters: {
    getTaskById: (state) => {
      return (taskId: string): Task | undefined => {
        return state.correctiefTasks.get(taskId) || state.preventiefTasks.get(taskId);
      };
    },

    getAllTasks: (state) => {
      return Array.from(state.correctiefTasks.values()).concat(Array.from(state.preventiefTasks.values()));
    },

    getTasksByUserId: (state) => {
      return (userId: string): Task[] => {
        return [...Array.from(state.correctiefTasks.values()), ...Array.from(state.preventiefTasks.values())].filter(
          (task: any) => task.userId === userId
        ) as Task[];
      };
    }
  },

  actions: {
    async createTask(data: any) {
      return request.executeRequest('tasks', 'createTask', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Creating new task`, LOG_STYLES.info);
        this.loading = true;
        try {
          const payload: any = {
            message: data.message,
            userId: data.userId,
            action: data.action,
            actionType: data.actionType || 'task', // Default to 'task' if not specified
            category: data.category || (data.targetId && data.targetId.startsWith('prev') ? 'preventief' : 'correctief'),
            level: data.level ?? 0, // Default to 0 if not specified
            url: data.url,
            deadline: data.deadline,
            finished: data.finished ?? false
          };

          if (data.category === 'preventief' && data.targetId) {
            payload.preventiefId = data.targetId;
          } else if (data.category === 'correctief' && data.targetId) {
            payload.correctiefId = data.targetId;
          }

          const { data: returnData } = await TasksAPI.createTask(payload);

          // Store task in correct map based on category
          if (returnData.category === 'correctief') {
            this.correctiefTasks.set(returnData.id, returnData);
          } else if (returnData.category === 'preventief') {
            this.preventiefTasks.set(returnData.id, returnData);
          } else {
            // If no category is specified, determine based on IDs
            if (returnData.correctiefId) {
              this.correctiefTasks.set(returnData.id, returnData);
            } else if (returnData.preventiefId) {
              this.preventiefTasks.set(returnData.id, returnData);
            } else {
              // Default fallback - store as correctief
              this.correctiefTasks.set(returnData.id, returnData);
            }
          }
          return returnData;
        } catch (error: any) {
          notification.error({ message: t('errors.create_error', { error: error }) });
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async updateTask(id: string, mode: string, updates: Partial<Task>): Promise<Task | undefined> {
      return request.executeRequest('tasks', `updateTask-${id}`, async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Updating task ${id}`, LOG_STYLES.info);
        this.loading = true;
        try {
          const { data } = await TasksAPI.updateTask(id, updates);
          if (mode === 'correctief') {
            this.correctiefTasks.set(id, data);
          } else if (mode === 'preventief') {
            this.preventiefTasks.set(id, data);
          } else {
            throw new Error('Invalid action type');
          }
          return data;
        } catch (error) {
          this.error = error as Error;
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async deleteTask(id: string, mode: string) {
      return request.executeRequest('tasks', `deleteTask-${id}`, async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Deleting task ${id}`, LOG_STYLES.info);
        this.loading = true;
        try {
          await TasksAPI.deleteTask(id);
          if (mode === 'correctief') {
            this.correctiefTasks.delete(id);
          } else if (mode === 'preventief') {
            this.preventiefTasks.delete(id);
          } else {
            // If category not specified, try to delete from both maps
            this.correctiefTasks.delete(id);
            this.preventiefTasks.delete(id);
          }
        } catch (error: any) {
          notification.error({ message: t('errors.delete_error', { error: error }) });
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async fetchTasksCurrentUser() {
      return request.executeRequest('tasks', 'fetchCurrentUser', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Fetching current user tasks`, LOG_STYLES.info);
        this.loading = true;
        try {
          const { data } = await TasksAPI.getTasksCurrentUser();
          data.forEach((task) => {
            this.currentUserTasks.set(task.id, task);
            if (task.completedAt) {
              this.completedTasks.set(task.id, task);
            } else {
              this.uncompletedTasks.set(task.id, task);
            }
          });
        } catch (error: any) {
          notification.error({ message: t('errors.fetch_error', { error: error }) });
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async fetchAllTasks() {
      return request.executeRequest('tasks', 'fetchAll', async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Fetching all tasks`, LOG_STYLES.info);
        this.loading = true;
        try {
          const { data } = await TasksAPI.getTasks();
          this.correctiefTasks.clear();
          this.preventiefTasks.clear();
          data.forEach((task) => {
            if (task.category === 'correctief') {
              this.correctiefTasks.set(task.id, task);
            } else if (task.category === 'preventief') {
              this.preventiefTasks.set(task.id, task);
            }
          });
        } catch (error) {
          this.error = error as Error;
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async fetchTasksByUserId(userId: string) {
      return request.executeRequest('tasks', `fetchTasksByUserId-${userId}`, async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Fetching tasks by user ID ${userId}`, LOG_STYLES.info);
        this.loading = true;
        try {
          const { data } = await TasksAPI.getTasksByUserId(userId);
          data.forEach((task) => {
            if (task.category === 'correctief' || (!task.category && task.correctiefId)) {
              this.correctiefTasks.set(task.id, task);
            } else if (task.category === 'preventief' || (!task.category && task.preventiefId)) {
              this.preventiefTasks.set(task.id, task);
            } else {
              this.correctiefTasks.set(task.id, task);
            }
          });
          return data;
        } catch (error) {
          this.error = error as Error;
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async fetchTasksByPreventief(preventiefId: string) {
      this.loading = true;
      try {
        const { data } = await TasksAPI.getTasksByPreventief(preventiefId);
        data.forEach((task) => {
          this.preventiefTasks.set(task.id, task);
        });
        return data;
      } catch (error) {
        this.error = error as Error;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTasksByCorrectief(correctiefId: string) {
      return request.executeRequest('tasks', `fetchTasksByCorrectief-${correctiefId}`, async () => {
        if (import.meta.env.ENABLE_LOGGING)
          console.log(`${LOG_PREFIX} %c Fetching tasks by correctief ID ${correctiefId}`, LOG_STYLES.info);
        this.loading = true;
        try {
          const { data } = await TasksAPI.getTasksByCorrectief(correctiefId);
          data.forEach((task) => {
            this.correctiefTasks.set(task.id, task);
          });
          return data;
        } catch (error) {
          this.error = error as Error;
          throw error;
        } finally {
          this.loading = false;
        }
      });
    },

    async findByIds(ids: { id: string; category: string | undefined }[]) {
      return request.executeRequest('tasks', `findByIds`, async () => {
        if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Fetching tasks by multiple IDs`, LOG_STYLES.info);
        this.loading = true;
        try {
          const { data } = await TasksAPI.findTasksByIds(ids);
          return data;
        } catch (error) {
          this.error = error as Error;
          throw error;
        } finally {
          this.loading = false;
        }
      });
    }
  }
});
