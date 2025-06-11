import { PermissionAction, ResourceType } from '@prisma/client';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import {
  CreateBackup,
  UploadBackup,
  DownloadBackup,
  ListBackups,
  RestoreBackup,
  DeleteBackup
} from '../modules/Backup/controller/BackupController';
import { BackupIdSchema } from '../modules/Backup/validation/schemas';

const router = createSecureRouter();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all routes
router.use(isAuthenticated);

// Apply permission check to all routes
router.use(hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.ALL }]));

// Create backup
router.post('/create', CreateBackup);

// Upload backup
router.post('/upload', upload.single('backup'), UploadBackup);

// List backups
router.get('/list', ListBackups);

// Download backup
router.get('/download/:backupId', validateZodRequest({ params: BackupIdSchema }), DownloadBackup);

// Restore backup
router.post('/restore/:backupId', validateZodRequest({ params: BackupIdSchema }), RestoreBackup);

// Delete backup
router.delete('/:backupId', validateZodRequest({ params: BackupIdSchema }), DeleteBackup);

export default router;
