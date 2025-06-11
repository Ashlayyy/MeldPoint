/* eslint-disable func-names */
import { createRouteHandler, type FileRouter } from 'uploadthing/express';
import { Router } from 'express';
import { uploadRouter } from '../modules/UploadThing/controller/UploadThing';

const router = Router();

const config =
  process.env.NODE_ENV === 'production'
    ? { callbackUrl: process.env.UPLOADTHING_URL }
    : { callbackUrl: process.env.UPLOADTHING_URL_DEV };

router.use(
  '/',
  createRouteHandler({
    router: uploadRouter as unknown as FileRouter,
    config
  })
);

export default router;
