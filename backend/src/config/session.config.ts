import { SessionOptions } from 'express-session';
import MongoStore from 'connect-mongo';

export const SESSION_ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_MAX_CONCURRENT = 3; // Maximum concurrent sessions per user

export const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL,
    ttl: 12 * 60 * 60, // 12 hours session TTL
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
};
