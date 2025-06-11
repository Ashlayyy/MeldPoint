import axios from '@/utils/axios';

export interface Task {
  name: string;
  enabled: boolean;
  status: string;
  lastRun?: Date;
  nextRun?: Date;
}

export const schedulerApi = {
  /**
   * Get all scheduled tasks
   */
  getAllTasks: async (): Promise<Task[]> => {
    const response = await axios.get('/scheduler/tasks');
    return response.data;
  },

  /**
   * Enable a scheduled task
   */
  enableTask: async (taskName: string): Promise<any> => {
    const response = await axios.post(`/scheduler/enable/${taskName}`);
    return response;
  },

  /**
   * Disable a scheduled task
   */
  disableTask: async (taskName: string): Promise<any> => {
    const response = await axios.post(`/scheduler/disable/${taskName}`);
    return response;
  },

  /**
   * Trigger a task manually
   */
  triggerTask: async (taskName: string): Promise<any> => {
    const response = await axios.post(`/scheduler/trigger/${taskName}`);
    return response;
  }
};
