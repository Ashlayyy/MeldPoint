import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import prisma from '../db/prismaClient';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  jti: string;
}

class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOGIN_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    });
  }

  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }

  async generateTokenPair(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    const accessToken = jwt.sign({ userId, type: 'access', jti: accessJti } as TokenPayload, process.env.JWT_SECRET!, {
      expiresIn: AuthService.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh', jti: refreshJti } as TokenPayload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: AuthService.REFRESH_TOKEN_EXPIRY }
    );

    // Store tokens using Prisma
    await prisma.token.create({
      data: {
        jti: accessJti,
        userId,
        type: 'ACCESS',
        blacklisted: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    await prisma.token.create({
      data: {
        jti: refreshJti,
        userId,
        type: 'REFRESH',
        blacklisted: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string, type: 'access' | 'refresh'): Promise<TokenPayload> {
    try {
      const secret = type === 'access' ? process.env.JWT_SECRET! : process.env.JWT_REFRESH_SECRET!;
      const payload = jwt.verify(token, secret) as TokenPayload;

      // Check if token is blacklisted using Prisma
      const storedToken = await prisma.token.findUnique({
        where: { jti: payload.jti }
      });

      if (!storedToken || storedToken.blacklisted || storedToken.expiresAt < new Date()) {
        throw new Error('Token has been revoked or expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const payload = jwt.decode(token) as TokenPayload;
      if (!payload?.jti) throw new Error('Invalid token');

      await prisma.token.update({
        where: { jti: payload.jti },
        data: { blacklisted: true }
      });
    } catch (error) {
      throw new Error('Failed to revoke token');
    }
  }

  async checkLoginAttempts(userId: string): Promise<boolean> {
    const attempt = await prisma.loginAttempt.upsert({
      where: { userId },
      update: {
        attempts: { increment: 1 }
      },
      create: {
        userId,
        attempts: 1
      }
    });

    if (attempt.attempts > AuthService.MAX_LOGIN_ATTEMPTS) {
      await prisma.loginAttempt.update({
        where: { userId },
        data: {
          lockedUntil: new Date(Date.now() + AuthService.LOGIN_BLOCK_DURATION)
        }
      });
      return false;
    }

    return true;
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await prisma.loginAttempt
      .delete({
        where: { userId }
      })
      .catch(() => {
        // Ignore if record doesn't exist
      });
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    const attempt = await prisma.loginAttempt.findUnique({
      where: { userId }
    });

    if (!attempt) return false;

    if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
      return true;
    }

    if (attempt.lockedUntil && attempt.lockedUntil <= new Date()) {
      await this.resetLoginAttempts(userId);
      return false;
    }

    return false;
  }

  async rotateRefreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await this.verifyToken(oldRefreshToken, 'refresh');
    await this.revokeToken(oldRefreshToken);
    return this.generateTokenPair(payload.userId);
  }

  async cleanup(): Promise<void> {
    // Cleanup expired tokens
    const now = new Date();
    await prisma.token.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { blacklisted: true }]
      }
    });

    // Cleanup expired login attempts
    await prisma.loginAttempt.deleteMany({
      where: {
        AND: [{ lockedUntil: { not: null } }, { lockedUntil: { lt: now } }]
      }
    });
  }
}

export const authService = new AuthService();
