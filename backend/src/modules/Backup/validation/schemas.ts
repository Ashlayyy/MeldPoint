import { z } from 'zod';

export const BackupIdSchema = z.object({
  backupId: z.string()
});

export const BackupUploadSchema = z.object({
  file: z.any().refine((file) => file?.buffer != null, {
    message: 'Backup file is required'
  })
});

export const BackupProgressSchema = z.object({
  status: z.enum(['started', 'in_progress', 'completed', 'error']),
  progress: z.number().min(0).max(100),
  backup: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

// Type exports
export type BackupIdParams = z.infer<typeof BackupIdSchema>;
export type BackupUploadRequest = z.infer<typeof BackupUploadSchema>;
export type BackupProgress = z.infer<typeof BackupProgressSchema>;
