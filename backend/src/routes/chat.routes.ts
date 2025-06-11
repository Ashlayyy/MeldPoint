/* eslint-disable @typescript-eslint/naming-convention */
import { Router } from 'express';
import { PermissionAction, ResourceType } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.middleware';
import { hasPermissions } from '../middleware/permission.middleware';
import { validateRequest, ValidationRule } from '../middleware/validation.middleware';
import CheckAPIkey from '../middleware/apikey.middleware';
import createSecureRouter from '../utils/secureRoute';
import {
  getMessagesFromChatRoom,
  createMessage,
  createChatRoomForMelding
} from '../modules/Chat/controller/chatController';

const router = createSecureRouter();

// Validation schemas
const messageValidation: { [key: string]: ValidationRule } = {
  message: ['string', 'required'],
  user: ['string', 'required']
};

const chatRoomValidation: { [key: string]: ValidationRule } = {
  meldingId: ['string', 'required']
};

// Get messages from chat room
router.get(
  '/:id',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([
    {
      action: PermissionAction.MANAGE,
      resource: ResourceType.MELDING
    }
  ]),
  getMessagesFromChatRoom
);

// Create new message
router.post(
  '/message/:id',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([
    {
      action: PermissionAction.MANAGE,
      resource: ResourceType.MELDING
    }
  ]),
  //validateRequest({ body: messageValidation }),
  createMessage
);

// Create new chat room
router.post(
  '/chatroom',
  CheckAPIkey,
  isAuthenticated,
  hasPermissions([
    {
      action: PermissionAction.MANAGE,
      resource: ResourceType.MELDING
    }
  ]),
  //validateRequest({ body: chatRoomValidation }),
  createChatRoomForMelding
);

export default router;
