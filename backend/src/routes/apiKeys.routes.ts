import { Router } from 'express';
import { CreateAPIKey, ListAPIKeys, RevokeAPIKey, UpdateAPIKey } from '../modules/User/controller/APIKeyController';
import { isAuthenticated } from '../middleware/auth.middleware';
import { validateZodRequest } from '../middleware/zodValidation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateAPIKeySchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    expiresAt: z.string().datetime().optional()
  })
};

const UpdateAPIKeySchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    expiresAt: z.string().datetime().optional()
  }),
  params: z.object({
    keyId: z.string().uuid()
  })
};

const KeyIdSchema = {
  params: z.object({
    keyId: z.string().uuid()
  })
};

// Routes
router.post('/', isAuthenticated, validateZodRequest(CreateAPIKeySchema), CreateAPIKey);
router.get('/', isAuthenticated, ListAPIKeys);
router.delete('/:keyId', isAuthenticated, validateZodRequest(KeyIdSchema), RevokeAPIKey);
router.patch('/:keyId', isAuthenticated, validateZodRequest(UpdateAPIKeySchema), UpdateAPIKey);

export default router;
