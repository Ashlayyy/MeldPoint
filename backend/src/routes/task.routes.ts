import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { Request, Response } from 'express';
import {
  getTasks as getTasksQuery,
  getTasksByUserId as getTasksByUserIdQuery,
  getTaskById as getTaskByIdQuery,
  createTask as createTaskQuery,
  updateTask as updateTaskQuery,
  completeTask as completeTaskQuery,
  deleteTask as deleteTaskQuery,
  getTasksByCorrectief,
  getTasksByPreventief,
  uncompleteTask,
  findById
} from '../modules/Task/service/TaskService';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

// Route handlers
const getTasksHandler = async (req: Request, res: Response) => {
  const tasks = await getTasksQuery(req.query);
  res.json(tasks);
};

const getTasksByUserIdHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const tasks = await getTasksByUserIdQuery(userId);
  res.json(tasks);
};

const getTasksByCurrentUserHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { id } = req.user;
  const tasks = await getTasksByUserIdQuery(id);
  res.json(tasks);
};

const getTaskByIdHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await getTaskByIdQuery(id);
  res.json(task);
};

const createTaskHandler = async (req: Request, res: Response) => {
  const task = await createTaskQuery(req.body);
  res.status(201).json(task);
};

const updateTaskHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await updateTaskQuery(id, req.body);
  res.json(task);
};

const completeTaskHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await completeTaskQuery(id);
  res.json(task);
};

const uncompleteTaskHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await uncompleteTask(id);
  res.json(task);
};

const deleteTaskHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedTask = await deleteTaskQuery(id);

    res.status(200).json({ success: true, data: deletedTask });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const getTasksByCorrectiefHandler = async (req: Request, res: Response) => {
  const { correctiefId } = req.params;
  const tasks = await getTasksByCorrectief(correctiefId);
  res.json(tasks);
};

const getTasksByPreventiefHandler = async (req: Request, res: Response) => {
  const { preventiefId } = req.params;
  const tasks = await getTasksByPreventief(preventiefId);
  res.json(tasks);
};

const findByIdhandler = async (req: Request, res: Response) => {
  const { ids } = req.body;
  const tasks = await findById(ids);
  res.json(tasks);
};

// Routes
router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getTasksHandler
);

router.get(
  '/user/:userId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getTasksByUserIdHandler
);

router.get(
  '/currentUser',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getTasksByCurrentUserHandler
);

router.get(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getTaskByIdHandler
);

router.post(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  createTaskHandler
);

router.put(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  updateTaskHandler
);

router.put(
  '/:id/complete',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  completeTaskHandler
);

router.put(
  '/:id/uncomplete',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  uncompleteTaskHandler
);

router.post(
  '/findByID',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  findByIdhandler
);

router.delete(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  deleteTaskHandler
);

router.get(
  '/correctief/:correctiefId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getTasksByCorrectiefHandler
);

router.get(
  '/preventief/:preventiefId',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getTasksByPreventiefHandler
);

export default router;
