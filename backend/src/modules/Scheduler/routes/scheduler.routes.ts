import secureRouter from '../../../utils/secureRoute';
import SchedulerController from '../controller/Scheduler.controller';

export const initializeSchedulerRoutes = (controller: SchedulerController) => {
  const router = secureRouter();

  router.post('/trigger/:taskName', controller.triggerTask.bind(controller));
  router.get('/status/:taskName', controller.getTaskStatus.bind(controller));
  router.get('/tasks', controller.getAllTasks.bind(controller));
  router.post('/enable/:taskName', controller.enableTask.bind(controller));
  router.post('/disable/:taskName', controller.disableTask.bind(controller));

  return router;
};

export default initializeSchedulerRoutes;
