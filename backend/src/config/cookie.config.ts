/* eslint-disable import/prefer-default-export */
import { CookieOptions } from 'express';

export const jwtCookieConfig: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 12 * 60 * 60 * 1000,
  path: '/'
};
