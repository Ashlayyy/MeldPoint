import { z } from 'zod';

export const MessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  user: z.string().min(1, 'User ID is required')
});

export const ChatRoomSchema = z.object({
  meldingId: z.string().min(1, 'Melding ID is required')
});

export const ChatRoomParamsSchema = z.object({
  id: z.string().min(1, 'Chat room ID is required')
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatRoom = z.infer<typeof ChatRoomSchema>;
export type ChatRoomParams = z.infer<typeof ChatRoomParamsSchema>;
