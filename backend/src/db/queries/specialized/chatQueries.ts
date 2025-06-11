/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';
import { withDatabaseRetry } from '../../../helpers/databaseRetry';

export async function addMessageToChatRoom(chatRoomID: string, message: string, user: string) {
  return prisma.message.create({
    data: {
      content: message,
      user: { connect: { id: user } },
      chatroom: { connect: { id: chatRoomID } }
    },
    include: {
      user: {
        select: {
          Name: true,
          Email: true,
          id: true,
          Department: true
        }
      },
      chatroom: {
        include: {
          Melding: {
            select: {
              id: true,
              User: true
            }
          }
        }
      }
    }
  });
}

export async function getMessagesFromChatRoom(chatRoomId: string) {
  return withDatabaseRetry(() =>
    prisma.message.findMany({
      where: { chatroomId: chatRoomId },
      include: {
        user: true,
        chatroom: {
          include: {
            Melding: {
              include: {
                User: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  );
}

export async function createMessage(chatRoomId: string, message: string, userId: string) {
  return withDatabaseRetry(() =>
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
                User: true
              }
            }
          }
        }
      }
    })
  );
}

export async function createChatRoomForMelding(meldingId: string) {
  return withDatabaseRetry(() =>
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
}
