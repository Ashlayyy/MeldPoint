/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
import { CreateScheduledTaskInput, UpdateTaskExecutionInput } from '../types/scheduler.types';
import logger from '../../../helpers/loggerInstance';
import prisma from '../../../db/prismaClient';

export class SchedulerQueries {
  static async createScheduledTask(data: CreateScheduledTaskInput) {
    try {
      return await prisma.scheduledTask.create({
        data,
        include: { executions: true }
      });
    } catch (error) {
      logger.error(`Error creating scheduled task: ${error}`);
      return null;
    }
  }

  static async getScheduledTask(name: string) {
    try {
      return await prisma.scheduledTask.findUnique({
        where: { name },
        include: {
          executions: {
            orderBy: { startTime: 'desc' },
            take: 1
          }
        }
      });
    } catch (error) {
      logger.error(`Error getting scheduled task: ${error}`);
      return null;
    }
  }

  static async getAllScheduledTasks() {
    try {
      return await prisma.scheduledTask.findMany({
        include: {
          executions: {
            orderBy: { startTime: 'desc' },
            take: 1
          }
        }
      });
    } catch (error) {
      logger.error(`Error getting all scheduled tasks: ${error}`);
      return [];
    }
  }

  static async updateTaskExecution(id: string, data: UpdateTaskExecutionInput) {
    try {
      return await prisma.scheduledTask.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error(`Error updating task execution: ${error}`);
      return null;
    }
  }

  static async createTaskExecution(taskId: string, data: any) {
    try {
      return await prisma.taskExecution.create({
        data: {
          ...data,
          taskId
        }
      });
    } catch (error) {
      logger.error(`Error creating task execution: ${error}`);
      return null;
    }
  }

  static async updateTaskExecutionStatus(id: string, status: string, error?: string) {
    try {
      return await prisma.taskExecution.update({
        where: { id },
        data: {
          status,
          error,
          endTime: new Date()
        }
      });
    } catch (err) {
      logger.error(`Error updating task execution status: ${err}`);
      return null;
    }
  }
}
