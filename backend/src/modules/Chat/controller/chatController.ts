/* eslint-disable @typescript-eslint/return-await */
import { Request, Response } from 'express';
import { z } from 'zod';
import { ResourceType } from '@prisma/client';
import logger from '../../../helpers/loggerInstance';
import * as ChatService from '../service/ChatService';
import type NotificationChannel from '../../../services/socket/channels/NotificationChannel';
import { MessageSchema, ChatRoomSchema, ChatRoomParamsSchema } from '../validation/schemas';
import { logSuccess, logError } from '../../../middleware/handleHistory';

const getExecutionTime = (startTime: [number, number]): number => {
  return Number((process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2));
};

export async function getMessagesFromChatRoom(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const { id } = req.params;
    logger.info('Chat-Controller: Fetching messages from chat room', { chatRoomId: id });

    const messages = await ChatService.getMessagesFromChatRoom(id);

    logSuccess(req, {
      action: 'GET_CHAT_MESSAGES',
      resourceType: ResourceType.MELDING,
      resourceId: id,
      metadata: {
        executionTime: getExecutionTime(startTime)
      }
    });

    logger.info('Chat-Controller: Successfully retrieved messages', { chatRoomId: id });
    res.status(200).json({ data: messages });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('Chat-Controller: Failed to get messages', error);

    const chatRoomId = req.params.id;
    logError(req, {
      action: 'GET_CHAT_MESSAGES',
      resourceType: ResourceType.MELDING,
      resourceId: chatRoomId,
      error,
      metadata: {
        executionTime: getExecutionTime(startTime)
      }
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
  }
}

export async function createMessage(req: Request, res: Response) {
  const startTime = process.hrtime();
  try {
    const { message, user } = req.body;
    const { id: chatRoomId } = req.params;

    logger.info('Chat-Controller: Creating new message', { chatRoomId });

    const newMessage = await ChatService.createMessage(chatRoomId, message, user);

    logSuccess(req, {
      action: 'CREATE_CHAT_MESSAGE',
      resourceType: ResourceType.MELDING,
      resourceId: chatRoomId,
      metadata: {
        executionTime: getExecutionTime(startTime)
      }
    });

    logger.info('Chat-Controller: Successfully created message', { chatRoomId, messageId: newMessage.id });
    res.status(201).json({ data: newMessage });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('Chat-Controller: Failed to create message', error);

    const chatRoomId = req.params.id;
    logError(req, {
      action: 'CREATE_CHAT_MESSAGE',
      resourceType: ResourceType.MELDING,
      resourceId: chatRoomId,
      error,
      metadata: {
        data: req.body,
        executionTime: getExecutionTime(startTime)
      }
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create chat message' });
    }
  }
}

export async function createChatRoomForMelding(req: Request, res: Response) {
  const startTime = process.hrtime();
  const { meldingId } = req.body;
  try {
    logger.info('Chat-Controller: Creating new chat room', { meldingId });

    const chatRoom = await ChatService.createChatRoomForMelding(meldingId);

    logSuccess(req, {
      action: 'CREATE_CHATROOM',
      resourceType: ResourceType.MELDING,
      resourceId: meldingId,
      metadata: {
        executionTime: getExecutionTime(startTime)
      }
    });

    logger.info('Chat-Controller: Successfully created chat room', { chatRoomId: chatRoom.id, meldingId });
    res.status(201).json({ data: chatRoom });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred');
    logger.error('Chat-Controller: Failed to create chat room', error);

    logError(req, {
      action: 'CREATE_CHATROOM',
      resourceType: ResourceType.MELDING,
      resourceId: meldingId,
      error,
      metadata: {
        data: req.body,
        executionTime: getExecutionTime(startTime)
      }
    });

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create chat room' });
    }
  }
}
