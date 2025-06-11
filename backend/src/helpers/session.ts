/* eslint-disable import/prefer-default-export */
import { Request } from 'express';
import { Session } from 'express-session';
import { createHash } from 'crypto';
import logger from './loggerInstance';
import { SESSION_ABSOLUTE_TIMEOUT, SESSION_MAX_CONCURRENT } from '../config/session.config';

interface PassportSession extends Session {
  passport: {
    user: any;
  };
  fingerprint?: string;
  createdAt?: number;
}

interface SessionFingerprint {
  userAgent: string;
  ip: string;
}

const generateFingerprint = (req: Request): string => {
  const data: SessionFingerprint = {
    userAgent: req.headers['user-agent'] ?? 'unknown',
    ip: req.ip ?? req.socket.remoteAddress ?? 'unknown'
  };

  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const getActiveSessions = async (req: Request, userId: string): Promise<string[]> => {
  const store = req.sessionStore as any;
  return new Promise((resolve, reject) => {
    store.all((error: Error, sessions: any[]) => {
      if (error) {
        reject(error);
        return;
      }

      const userSessions = sessions
        .filter(
          (sess) =>
            sess?.passport?.user?.id === userId &&
            sess.fingerprint &&
            Date.now() - (sess.createdAt || 0) < SESSION_ABSOLUTE_TIMEOUT
        )
        .map((sess) => sess.id);

      resolve(userSessions);
    });
  });
};

const enforceSessionLimits = async (req: Request, userId: string): Promise<void> => {
  const activeSessions = await getActiveSessions(req, userId);

  if (activeSessions.length >= SESSION_MAX_CONCURRENT) {
    // Remove oldest session(s)
    const store = req.sessionStore as any;
    const sessionsToRemove = activeSessions.slice(0, activeSessions.length - SESSION_MAX_CONCURRENT + 1);

    await Promise.all(
      sessionsToRemove.map(
        (sessionId) =>
          new Promise<void>((resolve) => {
            store.destroy(sessionId, () => resolve());
          })
      )
    );
  }
};

export const regenerateSession = (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      logger.warn('Session regeneration attempted but no session exists');
      resolve();
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      logger.warn('Session regeneration attempted but no user ID exists');
      resolve();
      return;
    }

    const fingerprint = generateFingerprint(req);
    const currentFingerprint = (req.session as PassportSession).fingerprint;

    // Check if fingerprint has changed
    if (currentFingerprint && currentFingerprint !== fingerprint) {
      logger.warn(`Session fingerprint mismatch for user ${userId}`);
      reject(new Error('Session fingerprint mismatch'));
      return;
    }

    // Check absolute timeout
    const sessionCreatedAt = (req.session as PassportSession).createdAt || Date.now();
    if (Date.now() - sessionCreatedAt > SESSION_ABSOLUTE_TIMEOUT) {
      logger.warn(`Session absolute timeout reached for user ${userId}`);
      reject(new Error('Session absolute timeout reached'));
      return;
    }

    enforceSessionLimits(req, userId)
      .then(() => {
        req.session.regenerate((err) => {
          if (err) {
            logger.error(`Failed to regenerate session for user ${userId}: ${err}`);
            reject(err);
            return;
          }

          // Set new session data
          if (req.user) {
            (req.session as PassportSession).passport = { user: req.user };
            (req.session as PassportSession).fingerprint = fingerprint;
            (req.session as PassportSession).createdAt = Date.now();
          }

          req.session.save((saveErr) => {
            if (saveErr) {
              logger.error(`Failed to save regenerated session for user ${userId}: ${saveErr}`);
              reject(saveErr);
              return;
            }

            logger.info(`Successfully regenerated session for user ${userId}`);
            resolve();
          });
        });
      })
      .catch(reject);
  });
};
