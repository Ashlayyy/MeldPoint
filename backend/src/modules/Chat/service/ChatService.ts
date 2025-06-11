import logger from '../../../helpers/loggerInstance';
import { withDatabaseRetry } from '../../../helpers/databaseRetry';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import prisma from '../../../db/prismaClient';
import { channelManager } from '../../../server';
import NotificationChannel from '../../../services/socket/channels/NotificationChannel';

export async function getMessagesFromChatRoom(chatRoomId: string) {
  try {
    const messages = await withDatabaseRetry(() =>
      prisma.message.findMany({
        where: { chatroomId: chatRoomId },
        include: {
          chatroom: true,
          user: true
        },
        orderBy: { createdAt: 'asc' }
      })
    );

    if (!messages) {
      throw new NotFoundError('Chat room not found');
    }

    return messages;
  } catch (error) {
    logger.error(
      'ChatService: Failed to get messages from chat room',
      error instanceof Error ? error : new Error('Unknown error')
    );
    throw error;
  }
}

export async function createMessage(chatRoomId: string, message: string, userId: string) {
  try {
    const notificationChannel = channelManager.getNotificationChannel() as NotificationChannel;
    const createdMessage = await withDatabaseRetry(() =>
      prisma.message.create({
        data: {
          content: message,
          chatroomId: chatRoomId,
          userId
        },
        include: {
          user: true,
          chatroom: {
            include: {
              Melding: {
                include: {
                  User: true,
                  Correctief: {
                    include: {
                      User: true
                    }
                  },
                  Preventief: {
                    include: {
                      User: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    );

    if (!createdMessage) {
      throw new BadRequestError('Failed to create message');
    }

    console.log('ENABLE_CHAT_NOTIFICATIONS', process.env.ENABLE_CHAT_NOTIFICATIONS);
    if (process.env.ENABLE_CHAT_NOTIFICATIONS === 'true' && notificationChannel) {
      logger.info('Sending notification');

      // Get all unique user IDs to notify
      const usersToNotify = new Set<string>();

      // Add melding owner
      if (createdMessage.chatroom.Melding?.User?.id && createdMessage.chatroom.Melding.User.id !== userId) {
        usersToNotify.add(createdMessage.chatroom.Melding.User.id);
      }

      // Add correctief actiehouder
      if (
        createdMessage.chatroom.Melding?.Correctief?.User?.id &&
        createdMessage.chatroom.Melding.Correctief.User.id !== userId
      ) {
        usersToNotify.add(createdMessage.chatroom.Melding.Correctief.User.id);
      }

      // Add preventief actiehouder
      if (
        createdMessage.chatroom.Melding?.Preventief?.User?.id &&
        createdMessage.chatroom.Melding.Preventief.User.id !== userId
      ) {
        usersToNotify.add(createdMessage.chatroom.Melding.Preventief.User.id);
      }

      // Send notification to each user
      for (const userIdToNotify of usersToNotify) {
        await notificationChannel.sendNotification({
          type: 'toast',
          userId: userIdToNotify,
          message: `Nieuw bericht van ${createdMessage.user.Name}: ${message}`,
          needTodo: false,
          url: `/verbeterplein/melding/${createdMessage.chatroom.Melding?.VolgNummer}/chat`
        });
      }
    }

    return createdMessage;
  } catch (error) {
    logger.error('ChatService: Failed to create message', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

export async function createChatRoomForMelding(meldingId: string) {
  try {
    const chatRoom = await withDatabaseRetry(() =>
      prisma.chatRoom.create({
        data: {
          meldingId
        },
        include: {
          Melding: true,
          messages: {
            include: {
              user: true
            }
          }
        }
      })
    );

    if (!chatRoom) {
      throw new BadRequestError('Failed to create chat room');
    }

    return chatRoom;
  } catch (error) {
    logger.error(
      'ChatService: Failed to create chat room for melding',
      error instanceof Error ? error : new Error('Unknown error')
    );
    throw error;
  }
}
