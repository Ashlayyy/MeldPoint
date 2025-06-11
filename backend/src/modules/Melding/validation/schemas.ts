import { z } from 'zod';

// Enums
const PriorityEnum = z.enum(['low', 'medium', 'high']);
const StatusEnum = z.enum(['open', 'in_progress', 'closed']);

// Base schemas
const meldingIdParam = z.object({
  id: z.string().min(1, 'Melding ID is required')
});

// Create Melding
export const createMeldingSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    priority: PriorityEnum,
    status: StatusEnum,
    assignedTo: z.string().optional(),
    dueDate: z.string().optional()
  })
});

// Update Melding
export const updateMeldingSchema = z.object({
  params: meldingIdParam,
  body: z.object({
    data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      priority: PriorityEnum.optional(),
      status: StatusEnum.optional(),
      assignedTo: z.string().optional(),
      dueDate: z.string().optional()
    })
  })
});

// Clone Management
export const cloneManagementSchema = z.object({
  params: z.object({
    meldingID: z.string().min(1, 'Melding ID is required'),
    cloneID: z.string().min(1, 'Clone ID is required')
  })
});

// Correspondence Management
export const correspondenceSchema = z.object({
  params: z.object({
    meldingID: z.string().min(1, 'Melding ID is required'),
    correspondenceID: z.string().min(1, 'Correspondence ID is required')
  })
});

export const setCorrespondenceSchema = z.object({
  params: z.object({
    meldingID: z.string().min(1, 'Melding ID is required')
  }),
  body: z.object({
    correspondenceIds: z.array(z.string()).min(1, 'At least one correspondence ID is required')
  })
});

// Preventief Search
export const preventiefSearchSchema = z.object({
  params: z.object({
    preventiefId: z.string().min(1, 'Preventief ID is required')
  })
});

// Type exports
export type CreateMeldingSchema = z.infer<typeof createMeldingSchema>;
export type UpdateMeldingSchema = z.infer<typeof updateMeldingSchema>;
export type CloneManagementSchema = z.infer<typeof cloneManagementSchema>;
export type CorrespondenceSchema = z.infer<typeof correspondenceSchema>;
export type SetCorrespondenceSchema = z.infer<typeof setCorrespondenceSchema>;
export type PreventiefSearchSchema = z.infer<typeof preventiefSearchSchema>;
