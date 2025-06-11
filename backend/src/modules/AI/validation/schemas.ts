import { z } from 'zod';

export const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system'], {
          required_error: 'Message role is required',
          invalid_type_error: 'Message role must be one of: user, assistant, system'
        }),
        content: z.string({
          required_error: 'Message content is required',
          invalid_type_error: 'Message content must be a string'
        })
      })
    )
    .nonempty({
      message: 'Messages array cannot be empty'
    })
});

export type AIMessageInput = z.infer<typeof messageSchema>;
