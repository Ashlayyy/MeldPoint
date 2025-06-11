const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

async function getKey(salt: Uint8Array): Promise<CryptoKey> {
  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('VITE_ENCRYPTION_KEY is not set in environment variables');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(encryptionKey), 'PBKDF2', false, ['deriveBits']);

  const keyBytes = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encrypt(data: any): Promise<string | any> {
  if (process.env.VITE_ENABLE_ENCRYPTION === 'false') {
    return data;
  }

  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await getKey(salt);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: 128
      },
      key,
      encodedData
    );

    const content = new Uint8Array(encryptedContent).slice(0, -AUTH_TAG_LENGTH);
    const authTag = new Uint8Array(encryptedContent).slice(-AUTH_TAG_LENGTH);

    const combined = new Uint8Array(salt.length + iv.length + authTag.length + content.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(authTag, salt.length + iv.length);
    combined.set(content, salt.length + iv.length + authTag.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function decrypt(encryptedData: string): Promise<any> {
  if (process.env.VITE_ENABLE_ENCRYPTION === 'false') {
    try {
      return JSON.parse(encryptedData);
    } catch (parseError) {
      console.error('Failed to parse data assuming encryption was disabled:', parseError);
      throw new Error(
        `Data is not valid JSON and encryption is disabled: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
  }

  try {
    const binaryStr = atob(encryptedData);
    const encryptedArray = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      encryptedArray[i] = binaryStr.charCodeAt(i);
    }

    const salt = encryptedArray.slice(0, SALT_LENGTH);
    const iv = encryptedArray.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = encryptedArray.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const content = encryptedArray.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = await getKey(salt);

    const encryptedContent = new Uint8Array(content.length + authTag.length);
    encryptedContent.set(content);
    encryptedContent.set(authTag, content.length);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: 128
      },
      key,
      encryptedContent
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : String(error)}`);
  }
}
