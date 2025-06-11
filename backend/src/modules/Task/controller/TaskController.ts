import { Request, Response } from 'express';
import { TaskService } from '../service/TaskService';

export class TaskController {
  static async createTask(req: Request, res: Response) {
    try {
      const data = req.body as any;
      const task = await TaskService.createTask(data);
      return res.status(201).json(task);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create task' });
    }
  }

  static async getTasks(req: Request, res: Response) {
    try {
      const filters = req.query as unknown as any;
      const tasks = await TaskService.getTasks(filters);
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get tasks' });
    }
  }

  static async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await TaskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get task' });
    }
  }

  static async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body as any;
      const task = await TaskService.updateTask(id, data);
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update task' });
    }
  }

  static async completeTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await TaskService.completeTask(id);
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to complete task' });
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TaskService.deleteTask(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  static async getTasksByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const tasks = await TaskService.getTasksByUserId(userId);
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get user tasks' });
    }
  }
}
