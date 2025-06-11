import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional()
  })
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Department ID is required')
  }),
  body: z
    .object({
      name: z.string().optional(),
      description: z.string().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
});

export const assignUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    department: z.string().min(1, 'Department ID is required')
  })
});

export const getDepartmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Department ID is required')
  })
});

export type CreateDepartmentSchema = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentSchema = z.infer<typeof updateDepartmentSchema>;
export type AssignUserSchema = z.infer<typeof assignUserSchema>;
export type GetDepartmentSchema = z.infer<typeof getDepartmentSchema>;
