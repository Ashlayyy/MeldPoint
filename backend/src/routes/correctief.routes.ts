import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import { GetCorrectief, GetAllCorrectief, Create, Update } from '../modules/Correctief/controller/CorrectiefController';
import {
  correctiefSchema,
  updateCorrectiefSchema,
  correctiefParamsSchema,
  correctiefQuerySchema
} from '../modules/Correctief/validation/schemas';

const router = createSecureRouter();

// Get single correctief
router.get(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ params: correctiefParamsSchema }),
  GetCorrectief
);

// Get all correctief
router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ query: correctiefQuerySchema }),
  GetAllCorrectief
);

// Create correctief
router.post(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ body: correctiefSchema }),
  Create
);

// Update correctief
router.patch(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({
    params: correctiefParamsSchema,
    body: updateCorrectiefSchema
  }),
  Update
);

export default router;
