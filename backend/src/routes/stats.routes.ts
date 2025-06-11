import { Router } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import {
  getDashboardStats,
  getDepartmentStats,
  getRoleStats,
  getActivityStats,
  getGrowthStats
} from '../modules/Stats/controller/StatsController';
import { periodQuerySchema, daysQuerySchema } from '../modules/Stats/validation/schemas';

const router = createSecureRouter();

// Dashboard stats
router.get(
  '/dashboard',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getDashboardStats
);

// Department distribution
router.get(
  '/department',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getDepartmentStats
);

// Role distribution
router.get(
  '/role',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  getRoleStats
);

// User activity
router.get(
  '/activity',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ query: daysQuerySchema }),
  getActivityStats
);

// User growth
router.get(
  '/growth',
  isAuthenticated,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  validateZodRequest({ query: periodQuerySchema }),
  getGrowthStats
);

export default router;
