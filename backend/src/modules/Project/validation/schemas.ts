import { z } from 'zod';

// Base schemas
const projectIdParam = z.object({
  id: z.string().min(1, 'Project ID is required')
});

// Project base schema
const projectBaseSchema = {
  ProjectNaam: z.string().min(1, 'Project name is required'),
  NumberID: z.string().min(1, 'Number ID is required'),
  ProjectLeider: z.string().optional(),
  Department: z.string().optional()
};

// Create Project
export const createProjectSchema = z.object({
  body: z.object(projectBaseSchema)
});

// Update Project
const updateProjectBodySchema = z.object({
  ProjectNaam: z.string().optional(),
  NumberID: z.string().optional(),
  ProjectLeider: z.string().optional(),
  Department: z.string().optional()
});

export const updateProjectSchema = z
  .object({
    params: projectIdParam,
    body: updateProjectBodySchema
  })
  .refine((data) => Object.keys(data.body).length > 0, {
    message: 'At least one field must be provided for update'
  });

// Get Project by ID
export const getProjectSchema = z.object({
  params: projectIdParam
});

// Get Project by Number
export const getProjectByNumberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Project number is required')
  })
});

// Deelorder Management
const deelorderSchema = z.object({
  deelorder: z.string().min(1, 'Deelorder ID is required')
});

export const deelorderManagementSchema = z.object({
  params: projectIdParam,
  body: deelorderSchema
});

// Delete Project
export const deleteProjectSchema = z.object({
  params: projectIdParam
});

// Type exports
export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;
export type GetProjectSchema = z.infer<typeof getProjectSchema>;
export type GetProjectByNumberSchema = z.infer<typeof getProjectByNumberSchema>;
export type DeelorderManagementSchema = z.infer<typeof deelorderManagementSchema>;
export type DeleteProjectSchema = z.infer<typeof deleteProjectSchema>;
