import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import {
  getTimelineController,
  getDepartmentViewsController,
  getEventTypesController,
  getTopUsersController,
  getActivityTimeController,
  getActivityDayController,
  getTrendController
} from '../modules/Engagement/controller/engagement.controller';

const router = createSecureRouter();

router.use(isAuthenticated);

//router.use(hasPermissions([{ action: PermissionAction.READ, resource: ResourceType.ANALYTICS }]));
//Temp permission for testing
router.use(hasPermissions([{ action: PermissionAction.READ, resource: ResourceType.MELDING }]));

router.get('/:meldingId/:preventiefId/:correctiefId/timeline', getTimelineController);
router.get('/:meldingId/:preventiefId/:correctiefId/department-views', getDepartmentViewsController);
router.get('/:meldingId/:preventiefId/:correctiefId/event-types', getEventTypesController);
router.get('/:meldingId/:preventiefId/:correctiefId/top-users', getTopUsersController);
router.get('/:meldingId/:preventiefId/:correctiefId/activity-time', getActivityTimeController);
router.get('/:meldingId/:preventiefId/:correctiefId/activity-day', getActivityDayController);
router.get('/:meldingId/:preventiefId/:correctiefId/trend', getTrendController);

export default router;
