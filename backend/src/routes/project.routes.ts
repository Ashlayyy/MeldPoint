import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import {
  GetAllProjects,
  GetProjectById,
  CreateProject,
  UpdateProject,
  AddDeelorder,
  RemoveDeelorder,
  DeleteProject
} from '../modules/Project/controller/ProjectController';
import {
  createProjectSchema,
  getProjectSchema,
  getProjectByNumberSchema,
  deelorderManagementSchema,
  deleteProjectSchema
} from '../modules/Project/validation/schemas';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

// Apply authentication to all routes
router.use(isAuthenticated);

// Routes with validation and permissions
router.get('/', hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]), GetAllProjects);

router.get(
  '/:id',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: getProjectSchema.shape.params }),
  GetProjectById
);

router.get(
  '/number/:id',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: getProjectByNumberSchema.shape.params }),
  GetProjectById
);

router.post(
  '/',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ body: createProjectSchema.shape.body }),
  CreateProject
);

router.patch(
  '/:id',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  UpdateProject
);

router.post(
  '/:id/deelorder',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: deelorderManagementSchema.shape.params,
    body: deelorderManagementSchema.shape.body
  }),
  AddDeelorder
);

router.delete(
  '/:id/deelorder',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: deelorderManagementSchema.shape.params,
    body: deelorderManagementSchema.shape.body
  }),
  RemoveDeelorder
);

router.delete(
  '/:id',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: deleteProjectSchema.shape.params }),
  DeleteProject
);

export default router;
