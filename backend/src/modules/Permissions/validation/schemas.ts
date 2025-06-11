import { z } from 'zod';
import { PermissionAction, ResourceType } from '@prisma/client';

export const PermissionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  action: z.nativeEnum(PermissionAction),
  resourceType: z.nativeEnum(ResourceType)
});

export const PermissionGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export const RoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.string().optional()
});

export const AssignmentParamsSchema = z.object({
  userId: z.string().optional(),
  roleId: z.string().optional(),
  groupId: z.string().optional(),
  permissionId: z.string()
});

export type Permission = z.infer<typeof PermissionSchema>;
export type PermissionGroup = z.infer<typeof PermissionGroupSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type AssignmentParams = z.infer<typeof AssignmentParamsSchema>;
