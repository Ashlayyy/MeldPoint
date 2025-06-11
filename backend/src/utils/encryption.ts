import crypto from 'crypto';
import { promisify } from 'util';
import logger from '../helpers/loggerInstance';

const pbkdf2 = promisify(crypto.pbkdf2);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not set in environment variables');
}

/**
 * Derives an encryption key from the environment key using PBKDF2
 */
async function getKey(salt: Buffer): Promise<Buffer> {
  return pbkdf2(process.env.ENCRYPTION_KEY!, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts data
 */
export async function encrypt(data: any): Promise<string> {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Get encryption key
    const key = await getKey(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const jsonData = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(jsonData, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Combine salt, IV, auth tag, and encrypted content
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);

    // Convert to base64
    return combined.toString('base64');
  } catch (error) {
    logger.error(`Encryption error: ${error}`);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data
 */
export async function decrypt(encryptedData: string): Promise<any> {
  try {
    // Convert from base64
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const content = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Get encryption key
    const key = await getKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

    // Parse and return the decrypted data
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    logger.error(`Decryption error: ${error}`);
    throw new Error('Failed to decrypt data');
  }
}
