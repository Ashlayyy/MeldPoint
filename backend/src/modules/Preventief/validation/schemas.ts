import { z } from 'zod';

// Base schemas
const preventiefIdParam = z.object({
  id: z.string().min(1, 'Preventief ID is required')
});

const meldingIdParam = z.object({
  meldingID: z.string().min(1, 'Melding ID is required')
});

const teamlidIdParam = z.object({
  teamlidID: z.string().min(1, 'Teamlid ID is required')
});

const correspondenceIdParam = z.object({
  CorrespondenceID: z.string().min(1, 'Correspondence ID is required')
});

// Create Preventief
export const createPreventiefSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    status: z.enum(['open', 'in_progress', 'closed']),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().optional(),
    assignedTo: z.string().optional(),
    teamleden: z.array(z.string()).optional(),
    correspondenceIds: z.array(z.string()).optional()
  })
});

// Update Preventief
export const updatePreventiefSchema = z.object({
  params: preventiefIdParam,
  body: z.object({
    data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['open', 'in_progress', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      dueDate: z.string().optional(),
      assignedTo: z.string().optional(),
      teamleden: z.array(z.string()).optional(),
      correspondenceIds: z.array(z.string()).optional()
    })
  })
});

// Get Single Preventief
export const getSinglePreventiefSchema = z.object({
  params: preventiefIdParam
});

// Team Management
export const addTeamlidSchema = z.object({
  params: z.object({
    ...meldingIdParam.shape,
    ...teamlidIdParam.shape
  })
});

export const rewriteTeamlidSchema = z.object({
  params: meldingIdParam,
  body: z.object({
    teamleden: z.array(z.string()).min(1, 'At least one teamlid is required')
  })
});

export const removeTeamlidSchema = z.object({
  params: z.object({
    ...meldingIdParam.shape,
    ...teamlidIdParam.shape
  })
});

// Correspondence Management
export const addCorrespondenceSchema = z.object({
  params: z.object({
    preventiefID: z.string().min(1, 'Preventief ID is required')
  }),
  body: z.object({
    correspondenceId: z.string().min(1, 'Correspondence ID is required')
  })
});

export const removeCorrespondenceSchema = z.object({
  params: z.object({
    preventiefID: z.string().min(1, 'Preventief ID is required'),
    CorrespondenceID: z.string().min(1, 'Correspondence ID is required')
  })
});

// Type exports
export type CreatePreventiefSchema = z.infer<typeof createPreventiefSchema>;
export type UpdatePreventiefSchema = z.infer<typeof updatePreventiefSchema>;
export type GetSinglePreventiefSchema = z.infer<typeof getSinglePreventiefSchema>;
export type AddTeamlidSchema = z.infer<typeof addTeamlidSchema>;
export type RewriteTeamlidSchema = z.infer<typeof rewriteTeamlidSchema>;
export type RemoveTeamlidSchema = z.infer<typeof removeTeamlidSchema>;
export type AddCorrespondenceSchema = z.infer<typeof addCorrespondenceSchema>;
export type RemoveCorrespondenceSchema = z.infer<typeof removeCorrespondenceSchema>;
