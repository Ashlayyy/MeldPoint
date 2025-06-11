/* eslint-disable no-shadow */
import { Request } from 'express';

interface TokenData {
  id: string;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      tokenData?: TokenData;
    }
  }
}

// Extend SessionData to include our custom properties
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

export interface CsrfRequest extends Request {
  csrfToken: () => string;
}
