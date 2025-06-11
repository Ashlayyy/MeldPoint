import { PermissionAction, ResourceType } from '@prisma/client';
import { validateRequest } from '../middleware/validation.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import createSecureRouter from '../utils/secureRoute';
import { handleDeepDive } from '../modules/Deepdive/controller/DeepdiveController';

const router = createSecureRouter();

// Routes will be implemented later
// Example structure:
// router.post(
//   '/analyze',
//   isAuthenticated,
//   hasPermissions([{ action: PermissionAction.CREATE, resource: ResourceType.DEEPDIVE }]),
//   validateRequest({
//     body: {
//       // validation rules will go here
//     }
//   }),
//   handleDeepDive
// );

export default router;
