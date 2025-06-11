import { z } from 'zod';

export const ScreenshotUploadSchema = z.object({
  file: z
    .any()
    .refine((file) => file?.buffer != null, {
      message: 'Screenshot is required'
    })
    .refine(
      (file) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        return file.mimetype && allowedTypes.includes(file.mimetype);
      },
      {
        message: 'Invalid file type. Only PNG, JPEG, and WebP images are allowed.'
      }
    )
    .refine((file) => file.size <= 30 * 1024 * 1024, {
      message: 'File size must be less than 30MB'
    })
});

export const ScreenshotResponseSchema = z.object({
  url: z.string().url()
});

// Type exports
export type ScreenshotUpload = z.infer<typeof ScreenshotUploadSchema>;
export type ScreenshotResponse = z.infer<typeof ScreenshotResponseSchema>;
