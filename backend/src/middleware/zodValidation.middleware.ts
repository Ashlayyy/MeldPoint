import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, z } from 'zod';

export interface ZodValidationOptions {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateZodRequest = (options: ZodValidationOptions): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      next();
      return;
      /*
      if (options.params) {
        req.params = await options.params.parseAsync(req.params);
      }
      if (options.query) {
        req.query = await options.query.parseAsync(req.query);
      }
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }
      next();
      */
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
        return;
      }
      next(error);
    }
  };
};
