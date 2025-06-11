import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import {
  sendTestNotification,
  sendTodoTestNotification,
  sendBroadcastNotification,
  getNotifications,
  markNotificationsAsRead
} from '../modules/Notification/controller/NotificationController';
import {
  testNotificationSchema,
  todoNotificationSchema,
  broadcastNotificationSchema,
  markNotificationsReadSchema
} from '../modules/Notification/validation/schemas';
import createSecureRouter from '../utils/secureRoute';

const router = createSecureRouter();

// Routes
router.get('/', isAuthenticated, getNotifications);

router.post(
  '/mark-read',
  isAuthenticated,
  //validateZodRequest({ body: markNotificationsReadSchema.shape.body }),
  markNotificationsAsRead
);

// Test routes
router.post(
  '/test',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  //validateZodRequest({ body: testNotificationSchema.shape.body }),
  sendTestNotification
);

router.post(
  '/test/todo',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  //validateZodRequest({ body: todoNotificationSchema.shape.body }),
  sendTodoTestNotification
);

router.post(
  '/test/broadcast',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]),
  //validateZodRequest({ body: broadcastNotificationSchema.shape.body }),
  sendBroadcastNotification
);

export default router;
