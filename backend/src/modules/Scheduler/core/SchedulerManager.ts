/* eslint-disable no-undef */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/prefer-default-export */
/// <reference types="node" />
import type NotificationChannel from '../../../services/socket/channels/NotificationChannel';
import startBackupScheduler, { createAutomaticBackup } from '../../../utils/backup-scheduler';
import checkAndSendEmails from '../../../utils/email-notifications-scheduler';
import checkDeadlines from '../../../utils/deadline-notifications-scheduler';
import { SchedulerConfig, TaskExecutionResult } from '../types/scheduler.types';
import { SchedulerQueries } from '../queries/schedulerQueries';
import logger from '../../../helpers/loggerInstance';
import { SchedulerValidation } from '../utils/scheduler.validation';
import parser from 'cron-parser';

let instance: any;

export class SchedulerManager {
  private schedulers: Map<string, NodeJS.Timeout> = new Map();

  private runningTasks: Map<string, boolean> = new Map();

  private taskFunctions: Map<string, () => Promise<void>> = new Map();

  private notificationChannel?: NotificationChannel;

  static getInstance(): SchedulerManager {
    if (!instance) {
      instance = new SchedulerManager();
    }
    return instance;
  }

  isTaskRunning(taskName: string): boolean {
    return this.runningTasks.get(taskName) || false;
  }

  setNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannel = channel;
  }

  private getLastDayOfMonth(date: Date): number {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(0);
    return nextMonth.getDate();
  }

  private calculateNextRun(config: SchedulerConfig): Date {
    try {
      SchedulerValidation.validateConfig(config);
    } catch (error) {
      logger.error(`[Scheduler Debug] Config validation failed for ${config.name}: ${error}`);
      // Default to running in 1 hour if validation fails
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      return defaultDate;
    }

    const now = new Date();
    const nextRun = new Date();

    try {
      // Set base time if provided
      if (config.hour !== undefined) nextRun.setHours(config.hour);
      if (config.minute !== undefined) nextRun.setMinutes(config.minute);
      nextRun.setSeconds(0, 0);

      switch (config.frequency) {
        case 'minutely':
        case 'custom_interval': {
          const interval = config.intervalMinutes || 1;
          nextRun.setMinutes(now.getMinutes() + interval, 0, 0);
          if (now >= nextRun) {
            nextRun.setMinutes(nextRun.getMinutes() + interval);
          }
          break;
        }

        case 'hourly':
          nextRun.setHours(now.getHours() + 1, config.minute || 0, 0, 0);
          if (now >= nextRun) {
            nextRun.setHours(nextRun.getHours() + 1);
          }
          break;

        case 'daily':
          if (now >= nextRun) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
          break;

        case 'weekly':
          while (nextRun.getDay() !== config.dayOfWeek || now >= nextRun) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
          break;

        case 'monthly': {
          const targetDays = Array.isArray(config.dayOfMonth) ? config.dayOfMonth : [config.dayOfMonth || 1];

          if (config.useLastDayOfMonth) {
            nextRun.setDate(this.getLastDayOfMonth(nextRun));
            if (now >= nextRun) {
              nextRun.setMonth(nextRun.getMonth() + 1);
              nextRun.setDate(this.getLastDayOfMonth(nextRun));
            }
          } else {
            // Find the next occurrence of any target day
            let found = false;
            const startMonth = nextRun.getMonth();
            const startYear = nextRun.getFullYear();

            while (!found) {
              for (const day of targetDays) {
                nextRun.setDate(day);
                if (nextRun > now && nextRun.getMonth() === startMonth && nextRun.getFullYear() === startYear) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                nextRun.setMonth(nextRun.getMonth() + 1);
                nextRun.setDate(1);
              }
            }
          }
          break;
        }

        case 'quarterly': {
          const currentQuarter = Math.floor(nextRun.getMonth() / 3);
          nextRun.setMonth((currentQuarter + 1) * 3);

          if (config.useLastDayOfMonth) {
            nextRun.setDate(this.getLastDayOfMonth(nextRun));
          } else {
            nextRun.setDate((config.dayOfMonth as number) || 1);
          }

          if (now >= nextRun) {
            nextRun.setMonth(nextRun.getMonth() + 3);
            if (config.useLastDayOfMonth) {
              nextRun.setDate(this.getLastDayOfMonth(nextRun));
            }
          }
          break;
        }

        case 'yearly': {
          const targetMonth = (config.months || [1])[0] - 1; // Convert 1-based month to 0-based
          nextRun.setMonth(targetMonth);
          nextRun.setDate((config.dayOfMonth as number) || 1);

          if (now >= nextRun) {
            nextRun.setFullYear(nextRun.getFullYear() + 1);
          }
          break;
        }

        case 'cron': {
          if (!config.cronExpression) {
            logger.error(`[Scheduler Debug] Cron expression missing for ${config.name}, defaulting to hourly`);
            nextRun.setHours(now.getHours() + 1, 0, 0, 0);
            break;
          }
          try {
            const interval = parser.parseExpression(config.cronExpression);
            return interval.next().toDate();
          } catch (error) {
            logger.error(`[Scheduler Debug] Failed to parse cron expression for ${config.name}: ${error}`);
            // Default to hourly if cron parsing fails
            nextRun.setHours(now.getHours() + 1, 0, 0, 0);
          }
          break;
        }

        default:
          logger.error(
            `[Scheduler Debug] Invalid frequency ${config.frequency} for ${config.name}, defaulting to hourly`
          );
          nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      }

      return nextRun;
    } catch (error) {
      logger.error(`[Scheduler Debug] Error calculating next run for ${config.name}: ${error}`);
      // Default to running in 1 hour if anything fails
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      return defaultDate;
    }
  }

  private async scheduleTask(config: SchedulerConfig): Promise<void> {
    this.taskFunctions.set(config.name, config.task);
    const schedule = async () => {
      const now = new Date();
      const nextRun = this.calculateNextRun(config);
      const timeUntilNext = nextRun.getTime() - now.getTime();

      // Update task in database
      const task = await SchedulerQueries.getScheduledTask(config.name);
      if (task) {
        await SchedulerQueries.updateTaskExecution(task.id, {
          nextRun
        });
      }

      const timeout = setTimeout(
        async () => {
          try {
            if (this.runningTasks.get(config.name)) {
              logger.warn(`Task ${config.name} is already running, skipping this execution`);
              return;
            }

            this.runningTasks.set(config.name, true);
            const startTime = Date.now();

            // Create execution record
            const execution = await SchedulerQueries.createTaskExecution(task?.id || 'unknown', {
              startTime: new Date(),
              status: 'running',
              attempt: (task?.retryCount || 0) + 1
            });

            try {
              await config.task();
              const duration = Date.now() - startTime;

              // Update execution record if it was created successfully
              if (execution) {
                await SchedulerQueries.updateTaskExecutionStatus(execution.id, 'completed');
              }

              // Reset retry count on success if task exists
              if (task) {
                await SchedulerQueries.updateTaskExecution(task.id, {
                  lastRun: new Date(),
                  retryCount: 0,
                  status: 'idle'
                });
              }

              logger.info(`Task ${config.name} completed successfully in ${duration}ms`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';

              // Update execution record if it was created successfully
              if (execution) {
                await SchedulerQueries.updateTaskExecutionStatus(execution.id, 'failed', errorMessage);
              }

              // Handle retries if task exists
              if (task) {
                if (task.retryCount < (config.maxRetries || 3)) {
                  await SchedulerQueries.updateTaskExecution(task.id, {
                    retryCount: task.retryCount + 1,
                    status: 'retrying',
                    lastError: errorMessage
                  });

                  const retryDelay = (config.retryDelay || 15) * 2 ** task.retryCount;
                  setTimeout(() => this.manuallyTriggerTask(config.name, 'SYSTEM_RETRY'), retryDelay * 60 * 1000);
                } else {
                  await SchedulerQueries.updateTaskExecution(task.id, {
                    status: 'failed',
                    lastError: errorMessage
                  });
                }
              }

              logger.error(`Task ${config.name} failed: ${errorMessage}`);
            }
          } finally {
            this.runningTasks.set(config.name, false);
            schedule(); // Schedule next run
          }
        },
        Math.max(0, timeUntilNext)
      );

      this.schedulers.set(config.name, timeout);
    };

    schedule();
  }

  async initialize(notificationChannel: NotificationChannel): Promise<void> {
    this.setNotificationChannel(notificationChannel);

    if (process.env.ENABLE_SCHEDULERS) {
      await this.initializeScheduler({
        name: 'backup',
        frequency: 'daily',
        hour: 2,
        minute: 0,
        task: createAutomaticBackup
      });

      await this.initializeScheduler({
        name: 'email',
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        hour: 7,
        minute: 30,
        task: async () => checkAndSendEmails(notificationChannel)
      });

      await this.initializeScheduler({
        name: 'deadline',
        frequency: 'daily',
        hour: 7,
        minute: 0,
        skipWeekends: true,
        task: async () => checkDeadlines(notificationChannel)
      });
    }
  }

  private async initializeScheduler(config: SchedulerConfig): Promise<void> {
    try {
      logger.info(`[Scheduler Debug] Initializing scheduler for task: ${config.name}`);
      let task = await SchedulerQueries.getScheduledTask(config.name);

      if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_SCHEDULERS === 'false') return;

      if (!task) {
        logger.info(`[Scheduler Debug] Task ${config.name} not found in DB, creating new task`);
        const nextRun = this.calculateNextRun(config);
        task = await SchedulerQueries.createScheduledTask({
          name: config.name,
          frequency: config.frequency,
          hour: config.hour ?? 0,
          minute: config.minute ?? 0,
          dayOfWeek: config.dayOfWeek ?? undefined,
          dayOfMonth: Array.isArray(config.dayOfMonth) ? config.dayOfMonth[0] : config.dayOfMonth,
          maxRetries: config.maxRetries ?? 3,
          retryDelay: config.retryDelay ?? 15,
          nextRun,
          enabled: true,
          status: 'idle',
          retryCount: 0
        });
        if (task) {
          logger.info(`[Scheduler Debug] Created new task in DB with ID: ${task.id}`);
        } else {
          logger.error(`[Scheduler Debug] Failed to create task ${config.name} in DB`);
          return;
        }
      } else {
        logger.info(`[Scheduler Debug] Found existing task in DB with ID: ${task.id}, status: ${task.status}`);
      }

      // Ensure the task function is properly set in the map
      this.taskFunctions.set(config.name, config.task);
      logger.info(`[Scheduler Debug] Set task function in memory for ${config.name}`);

      await this.scheduleTask(config);
      logger.info(`[Scheduler Debug] Successfully scheduled task ${config.name}`);
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Scheduler Debug] Error initializing scheduler for ${config.name}: ${err}`);
    }
  }

  async manuallyTriggerTask(taskName: string, userId: string): Promise<TaskExecutionResult> {
    logger.info(`[Scheduler Debug] Attempting to manually trigger task: ${taskName} by user: ${userId}`);

    const task = await SchedulerQueries.getScheduledTask(taskName);
    if (!task) {
      logger.error(`[Scheduler Debug] Task ${taskName} not found in database`);
      return {
        success: false,
        error: `Task ${taskName} not found`,
        duration: 0
      };
    }
    logger.info(`[Scheduler Debug] Found task in database: ${JSON.stringify(task)}`);

    const taskFn = this.taskFunctions.get(taskName);
    if (!taskFn) {
      logger.error(`[Scheduler Debug] Task function for ${taskName} not found in memory`);
      return {
        success: false,
        error: `Task function for ${taskName} not found`,
        duration: 0
      };
    }
    logger.info(`[Scheduler Debug] Found task function in memory`);

    if (!task.enabled) {
      logger.error(`[Scheduler Debug] Task ${taskName} is disabled`);
      return {
        success: false,
        error: `Task ${taskName} is disabled`,
        duration: 0
      };
    }

    if (this.runningTasks.get(taskName)) {
      logger.error(`[Scheduler Debug] Task ${taskName} is already running`);
      return {
        success: false,
        error: `Task ${taskName} is already running`,
        duration: 0
      };
    }

    this.runningTasks.set(taskName, true);
    const startTime = Date.now();
    logger.info(`[Scheduler Debug] Starting task execution at ${new Date(startTime).toISOString()}`);

    try {
      const execution = await SchedulerQueries.createTaskExecution(task.id, {
        startTime: new Date(),
        status: 'running',
        attempt: task.retryCount + 1,
        triggeredBy: userId
      });
      logger.info(`[Scheduler Debug] Created execution record with ID: ${execution?.id || 'unknown'}`);

      logger.info(`[Scheduler Debug] Executing task function`);
      await taskFn();
      const duration = Date.now() - startTime;
      logger.info(`[Scheduler Debug] Task completed successfully in ${duration}ms`);

      if (execution) {
        await SchedulerQueries.updateTaskExecutionStatus(execution.id, 'completed');
      }
      await SchedulerQueries.updateTaskExecution(task.id, {
        lastRun: new Date(),
        retryCount: 0,
        status: 'idle'
      });
      logger.info(`[Scheduler Debug] Updated task status to completed`);

      return {
        success: true,
        duration
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const errorMessage = err.message;
      logger.error(`[Scheduler Debug] Task execution failed:`, err);

      await SchedulerQueries.updateTaskExecution(task.id, {
        status: 'failed',
        lastError: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    } finally {
      this.runningTasks.set(taskName, false);
      logger.info(`[Scheduler Debug] Task execution completed, reset running state`);
    }
  }

  stopTask(name: string): void {
    const timeout = this.schedulers.get(name);
    if (timeout) {
      clearTimeout(timeout);
      this.schedulers.delete(name);
    }
  }

  stopAll(): void {
    this.schedulers.forEach((_, name) => {
      this.stopTask(name);
    });
  }
}
