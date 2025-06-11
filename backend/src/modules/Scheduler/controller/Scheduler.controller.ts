/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import SchedulerService from '../service/Scheduler.service';
import logger from '../../../helpers/loggerInstance';

class SchedulerController {
  private readonly schedulerService: SchedulerService;

  constructor(schedulerService: SchedulerService) {
    this.schedulerService = schedulerService;
  }

  async triggerTask(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.schedulerService.triggerTask(req.params.taskName, req.user!.id);
      res.json(result);
    } catch (error) {
      logger.error(`Controller error triggering task: ${error}`);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.schedulerService.getTaskStatus(req.params.taskName);
      res.json(status);
    } catch (error) {
      logger.error(`Controller error getting task status: ${error}`);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await this.schedulerService.getAllTasks();
      res.json(tasks);
    } catch (error) {
      logger.error(`Controller error getting all tasks: ${error}`);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async enableTask(req: Request, res: Response): Promise<void> {
    try {
      const task = await this.schedulerService.enableTask(req.params.taskName);
      res.json(task);
    } catch (error) {
      logger.error(`Controller error enabling task: ${error}`);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async disableTask(req: Request, res: Response): Promise<void> {
    try {
      const task = await this.schedulerService.disableTask(req.params.taskName);
      res.json(task);
    } catch (error) {
      logger.error(`Controller error disabling task: ${error}`);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export default SchedulerController;
