import { Router } from 'express';
import encryptionMiddleware from '../middleware/encryption.middleware';

export default function createSecureRouter(): Router {
  const router = Router();
  router.use(encryptionMiddleware.decrypt);
  router.use(encryptionMiddleware.encrypt);
  return router;
}
