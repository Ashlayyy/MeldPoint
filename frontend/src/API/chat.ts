/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetMessagesFromChatRoom(id: string) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `chat-messages-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/chat/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 30 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function CreateMessage(id: string, message: string, user: string) {
  if (!id || !message || !user) throw new Error('ID, message and user are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat/message/${id}`, {
    message,
    user
  });
  cacheService.remove(`chat-messages-${id}`);
  return { status: response.status, data: response.data.data };
}

export async function CreateChatRoom(meldingId: string) {
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat/chatroom`, { meldingId });
  return { status: response.status, data: response.data.data };
}
