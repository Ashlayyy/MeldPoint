import multer from 'multer';
import { PermissionAction, ResourceType } from '@prisma/client';
import createSecureRouter from '../utils/secureRoute';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { UploadScreenshot } from '../modules/Screenshot/controller/ScreenshotController';

const router = createSecureRouter();

const upload = multer({
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
    fieldSize: 30 * 1024 * 1024
  }
});

// Routes
router.post(
  '/',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  upload.single('screenshot'),
  UploadScreenshot
);

export default router;
