import {
  createTask as createTaskQuery,
  getTasks as getTasksQuery,
  getTaskById as getTaskByIdQuery,
  updateTask as updateTaskQuery,
  completeTask as completeTaskQuery,
  deleteTask as deleteTaskQuery,
  getTasksByDeadline as getTasksByDeadlineQuery,
  getTasksByUserId as getTasksByUserIdQuery,
  getTasksByCorrectiefQuery,
  getTasksByPreventiefQuery,
  uncompleteTask as uncompleteTaskQuery,
  createBatchTasks as createBatchTasksQuery,
  findById as findByIdQuery
} from '../../../db/queries/specialized/taskQueries';
import prisma from '../../../db/prismaClient';
import logger from '../../../utils/logger';

// Export these functions directly
export const createTask = createTaskQuery;
export const getTasks = getTasksQuery;
export const getTaskById = getTaskByIdQuery;
export const updateTask = updateTaskQuery;
export const completeTask = completeTaskQuery;
export const deleteTask = deleteTaskQuery;
export const getTasksByDeadline = getTasksByDeadlineQuery;
export const getTasksByUserId = getTasksByUserIdQuery;
export const getTasksByCorrectief = getTasksByCorrectiefQuery;
export const getTasksByPreventief = getTasksByPreventiefQuery;
export const uncompleteTask = uncompleteTaskQuery;
export const createBatchTasks = createBatchTasksQuery;
export const findById = findByIdQuery;

// Keep the class for other uses if needed
export class TaskService {
  static createTask = createTaskQuery;
  static getTasks = getTasksQuery;
  static getTaskById = getTaskByIdQuery;
  static updateTask = updateTaskQuery;
  static completeTask = completeTaskQuery;
  static deleteTask = deleteTaskQuery;
  static getTasksByDeadline = getTasksByDeadlineQuery;
  static getTasksByUserId = getTasksByUserIdQuery;
  static getTasksByCorrectief = getTasksByCorrectiefQuery;
  static getTasksByPreventief = getTasksByPreventiefQuery;
  static uncompleteTask = uncompleteTaskQuery;
  static createBatchTasks = createBatchTasksQuery;
  static findById = findByIdQuery;

  static async updateTasksByFilter(filter: Record<string, any>, updateData: Record<string, any>): Promise<number> {
    try {
      const result = await prisma.task.updateMany({
        where: filter,
        data: updateData
      });
      return result.count;
    } catch (error) {
      logger.error('TaskService: Failed to update tasks by filter', error);
      throw error;
    }
  }

  static async updateSingleTaskByFilter(id: string, updateData: Record<string, any>): Promise<any> {
    try {
      const result = await prisma.task.update({
        where: { id: id },
        data: updateData
      });
      return result;
    } catch (error) {
      logger.error('TaskService: Failed to update single task by filter', error);
      throw error;
    }
  }
}
