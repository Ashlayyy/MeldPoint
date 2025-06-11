import crypto from 'crypto';
import argon2 from 'argon2';
import logger from '../helpers/loggerInstance';
import prisma from '../db/prismaClient';

interface CreateAPIKeyParams {
  userId: string;
  name: string;
  expiresAt?: Date;
}

interface APIKeyWithoutHash {
  id: string;
  name: string;
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
}

class APIKeyService {
  private static readonly API_KEY_PREFIX = 'in_';
  private static readonly MAX_KEYS_PER_USER = 10;

  private generateAPIKey(): string {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64url');
    return `${APIKeyService.API_KEY_PREFIX}${key}`;
  }

  private async hashAPIKey(apiKey: string): Promise<string> {
    return argon2.hash(apiKey, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    });
  }

  async createAPIKey({
    userId,
    name,
    expiresAt
  }: CreateAPIKeyParams): Promise<{ apiKey: string; keyData: APIKeyWithoutHash }> {
    // Check if user has reached the maximum number of API keys
    const keyCount = await prisma.api_key.count({
      where: { userId, isActive: true }
    });

    if (keyCount >= APIKeyService.MAX_KEYS_PER_USER) {
      throw new Error(`User has reached the maximum limit of ${APIKeyService.MAX_KEYS_PER_USER} API keys`);
    }

    const apiKey = this.generateAPIKey();
    const hashedKey = await this.hashAPIKey(apiKey);

    const keyData = await prisma.api_key.create({
      data: {
        userId,
        key: hashedKey,
        name,
        expiresAt,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true
      }
    });

    return { apiKey, keyData };
  }

  async validateAPIKey(apiKey: string): Promise<{ userId: string; keyId: string } | null> {
    if (!apiKey.startsWith(APIKeyService.API_KEY_PREFIX)) {
      return null;
    }

    try {
      // Find all active and non-expired API keys
      const activeKeys = await prisma.api_key.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      });

      // Check each key (we need to do this because we can't query by hash)
      for (const key of activeKeys) {
        const isValid = await argon2.verify(key.key, apiKey);
        if (isValid) {
          // Update last used timestamp
          await prisma.api_key.update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() }
          });

          return { userId: key.userId, keyId: key.id };
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error validating API key: ${error}`);
      return null;
    }
  }

  async logAPIKeyUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.api_key_usage_log.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        success,
        ipAddress,
        userAgent
      }
    });
  }

  async listAPIKeys(userId: string): Promise<APIKeyWithoutHash[]> {
    return prisma.api_key.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async revokeAPIKey(userId: string, keyId: string): Promise<void> {
    const key = await prisma.api_key.findFirst({
      where: { id: keyId, userId }
    });

    if (!key) {
      throw new Error('API key not found or unauthorized');
    }

    await prisma.api_key.update({
      where: { id: keyId },
      data: { isActive: false }
    });
  }

  async updateAPIKey(
    userId: string,
    keyId: string,
    updates: { name?: string; expiresAt?: Date | null }
  ): Promise<APIKeyWithoutHash> {
    const key = await prisma.api_key.findFirst({
      where: { id: keyId, userId }
    });

    if (!key) {
      throw new Error('API key not found or unauthorized');
    }

    return prisma.api_key.update({
      where: { id: keyId },
      data: updates,
      select: {
        id: true,
        name: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true
      }
    });
  }
}

export const apiKeyService = new APIKeyService();
