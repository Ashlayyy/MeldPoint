import { User } from '../interfaces/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
