import { z } from 'zod';

export const ProjectLeiderSchema = z.object({
  name: z.string().min(1, 'Name is required')
});

export const ProjectLeiderParamsSchema = z.object({
  id: z.string().min(1, 'Project leader ID is required')
});

export type ProjectLeider = z.infer<typeof ProjectLeiderSchema>;
export type ProjectLeiderParams = z.infer<typeof ProjectLeiderParamsSchema>;
