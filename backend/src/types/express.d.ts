import { User } from '../interfaces/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Express 5 types `req.params` as `string | string[]`. Our routes use single path
// segments, so treat every param as a string for controllers and LogContext.
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}

export {};
