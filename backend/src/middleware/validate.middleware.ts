import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import httpStatus from 'http-status';

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid request data',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Internal server error during validation'
    });
  }
};
