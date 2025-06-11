import { z } from 'zod';
import { RequestHandler } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import createSecureRouter from '../utils/secureRoute';
import {
  GetAllDepartments,
  GetDepartmentById,
  CreateDepartment,
  UpdateDepartment,
  DeleteDepartment,
  AssignUserToDepartment
} from '../modules/Department/controller/DepartmentController';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentSchema,
  assignUserSchema
} from '../modules/Department/validation/department.schema';

const router = createSecureRouter();

// Add authentication middleware
router.use(isAuthenticated);

// Get all departments
router.get(
  '/',
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetAllDepartments
);

// Get department by ID
router.get(
  '/:id',
  validateZodRequest({ params: getDepartmentSchema.shape.params }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  GetDepartmentById
);

// Create department
router.post(
  '/',
  validateZodRequest({ body: createDepartmentSchema.shape.body }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  CreateDepartment
);

// Update department
router.patch(
  '/:id',
  validateZodRequest({
    params: updateDepartmentSchema.shape.params,
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional()
    })
  }),
  ((req, res, next) => {
    if (Object.keys(req.body).length === 0) {
      res.status(400).json({ error: 'At least one field must be provided for update' });
      return;
    }
    next();
  }) as RequestHandler,
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  UpdateDepartment
);

// Delete department
router.delete(
  '/:id',
  validateZodRequest({ params: getDepartmentSchema.shape.params }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  DeleteDepartment
);

// Assign user to department
router.patch(
  '/:userId/user',
  validateZodRequest({
    params: assignUserSchema.shape.params,
    body: assignUserSchema.shape.body
  }),
  hasPermissions([{ action: PermissionAction.MANAGE, resource: ResourceType.MELDING }]),
  AssignUserToDepartment
);

export default router;
