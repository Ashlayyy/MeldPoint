/* eslint-disable class-methods-use-this */
import { SchedulerManager } from '../core/SchedulerManager';
import { SchedulerQueries } from '../queries/schedulerQueries';
import { TaskExecutionResult, TaskStatus } from '../types/scheduler.types';
import logger from '../../../helpers/loggerInstance';

class SchedulerService {
  private manager: SchedulerManager;

  constructor() {
    this.manager = SchedulerManager.getInstance();
  }

  async triggerTask(taskName: string, userId: string): Promise<TaskExecutionResult> {
    try {
      const task = await SchedulerQueries.getScheduledTask(taskName);
      if (!task) {
        throw new Error(`Task ${taskName} not found`);
      }
      return this.manager.manuallyTriggerTask(taskName, userId);
    } catch (error) {
      logger.error(`Error triggering task ${taskName}: ${error}`);
      throw error;
    }
  }

  async getTaskStatus(taskName: string): Promise<TaskStatus> {
    try {
      const task = await SchedulerQueries.getScheduledTask(taskName);
      if (!task) {
        throw new Error(`Task ${taskName} not found`);
      }

      const isRunning = this.manager.isTaskRunning(taskName);

      return {
        name: task.name,
        enabled: task.enabled,
        isRunning,
        nextRun: task.nextRun,
        lastRun: task.lastRun,
        lastExecution: task.executions[0] || null,
        retryCount: task.retryCount,
        status: task.status
      };
    } catch (error) {
      logger.error(`Error getting task status for ${taskName}: ${error}`);
      throw error;
    }
  }

  async getAllTasks() {
    try {
      return await SchedulerQueries.getAllScheduledTasks();
    } catch (error) {
      logger.error(`Error getting all tasks: ${error}`);
      throw error;
    }
  }

  async enableTask(taskName: string) {
    try {
      const task = await SchedulerQueries.getScheduledTask(taskName);
      if (!task) {
        throw new Error(`Task ${taskName} not found`);
      }

      await SchedulerQueries.updateTaskExecution(task.id, {
        status: 'idle',
        enabled: true
      });

      return this.getTaskStatus(taskName);
    } catch (error) {
      logger.error(`Error enabling task ${taskName}: ${error}`);
      throw error;
    }
  }

  async disableTask(taskName: string) {
    try {
      const task = await SchedulerQueries.getScheduledTask(taskName);
      if (!task) {
        throw new Error(`Task ${taskName} not found`);
      }

      await SchedulerQueries.updateTaskExecution(task.id, {
        status: 'disabled',
        enabled: false
      });

      this.manager.stopTask(taskName);
      return this.getTaskStatus(taskName);
    } catch (error) {
      logger.error(`Error disabling task ${taskName}: ${error}`);
      throw error;
    }
  }
}

export default SchedulerService;
