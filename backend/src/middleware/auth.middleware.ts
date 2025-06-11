/* eslint-disable consistent-return */
/* eslint-disable arrow-body-style */
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../helpers/loggerInstance';
import { jwtCookieConfig } from '../config/cookie.config';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    authTraceId?: string;
  }
}

export const authenticateMicrosoft = (req: Request, res: Response, next: NextFunction) => {
  const traceId = uuidv4();
  const authContext = {
    traceId,
    source: 'microsoft_auth_init'
  };

  logger.info('Initiating Microsoft authentication', authContext);

  // Store traceId in session for the callback
  req.session.authTraceId = traceId;

  passport.authenticate('microsoft', {
    prompt: 'select_account',
    state: traceId // Pass traceId through OAuth state parameter
  })(req, res, next);
};

export const authenticateMicrosoftCallback = (req: Request, res: Response, next: NextFunction) => {
  const frontendUrl =
    process.env.NODE_ENV === 'development' ? process.env.FRONTEND_URL_DEVELOPMENT : process.env.FRONTEND_URL_PRODUCTION;

  // Retrieve traceId from session or state parameter
  const traceId = (req.session.authTraceId ||
    (typeof req.query.state === 'string' ? req.query.state : null) ||
    uuidv4()) as string;

  const authContext = {
    traceId,
    source: 'microsoft_auth_callback'
  };

  logger.info('Processing Microsoft authentication callback', authContext);

  return passport.authenticate('microsoft', (err: Error, user: any) => {
    if (err) {
      logger.error('Microsoft authentication callback failed', err, {
        ...authContext,
        errorCode: err.name,
        errorMessage: err.message
      });

      if (err.message?.includes('AADSTS54005') || err.message?.includes('code was already redeemed')) {
        logger.warn('Auth code already redeemed', {
          ...authContext,
          errorCode: 'AUTH_CODE_REDEEMED'
        });
        res.redirect(`${frontendUrl}/auth/login?error=auth_code_already_redeemed&traceId=${traceId}`);
        return;
      }

      res.redirect(`${frontendUrl}/auth/login?error=microsoft_auth_failed&traceId=${traceId}`);
      return;
    }

    if (!user) {
      logger.error('Microsoft authentication callback - user not found', new Error('User not found'), authContext);
      res.redirect(`${frontendUrl}/auth/login?error=user_not_found&traceId=${traceId}`);
      return;
    }

    logger.debug('User authenticated, proceeding with login', {
      ...authContext,
      userId: user.id,
      email: user.Email
    });

    req.logIn(user, (loginErr: any) => {
      if (loginErr) {
        logger.error('Microsoft login error', loginErr, {
          ...authContext,
          userId: user.id,
          errorCode: loginErr.name,
          errorMessage: loginErr.message
        });
        res.redirect(`${frontendUrl}/auth/login?error=login_failed&traceId=${traceId}`);
        return;
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.Email,
          name: user.Name,
          iat: Date.now()
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '12h' }
      );

      logger.info('Microsoft authentication successful, setting JWT', {
        ...authContext,
        userId: user.id,
        email: user.Email
      });

      // Set JWT in HTTP-only cookie
      res.cookie('jwt', token, jwtCookieConfig);

      // Pass traceId to frontend
      res.redirect(`${frontendUrl}/auth/callback`);
    });
  })(req, res, next);
};

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const traceId = uuidv4();
  const authContext = {
    traceId,
    source: 'auth_check',
    userId: req.user?.id
  };

  if (req.isAuthenticated()) {
    logger.debug('Authentication check passed', authContext);
    return next();
  }

  logger.warn('Authentication check failed - unauthorized', authContext);
  res.status(401).json({ message: 'Unauthorized', traceId });
};
