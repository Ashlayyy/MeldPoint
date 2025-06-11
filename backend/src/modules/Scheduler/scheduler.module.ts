import { Router } from 'express';
import SchedulerController from './controller/Scheduler.controller';
import SchedulerService from './service/Scheduler.service';
import { initializeSchedulerRoutes } from './routes/scheduler.routes';

export class SchedulerModule {
  public router: Router;

  public controller: SchedulerController;

  public service: SchedulerService;

  constructor() {
    this.service = new SchedulerService();
    this.controller = new SchedulerController(this.service);
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const schedulerRouter = initializeSchedulerRoutes(this.controller);
    this.router.use('/', schedulerRouter);
  }
}

export default new SchedulerModule();
