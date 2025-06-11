import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  getStatuses,
  getStatus,
  createStatus,
  updateStatus,
  deleteStatus
} from '../modules/Status/controller/StatusController';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

// Validation rules
const statusIdValidation = {
  params: {
    id: ['required', 'string']
  }
};

const createStatusValidation = {
  body: {
    StatusNaam: ['required', 'string'],
    StatusColor: ['required', 'string'],
    StatusType: ['required', 'string']
  }
};

const updateStatusValidation = {
  params: {
    id: ['required', 'string']
  },
  body: {
    StatusNaam: ['required', 'string'],
    StatusColor: ['required', 'string'],
    StatusType: ['required', 'string']
  }
};

// Routes
router.get(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getStatuses
);

router.get(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateRequest(statusIdValidation),
  getStatus
);

router.post(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateRequest(createStatusValidation),
  createStatus
);

router.patch(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateRequest(updateStatusValidation),
  updateStatus
);

router.delete(
  '/:id',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  //validateRequest(statusIdValidation),
  deleteStatus
);

export default router;
