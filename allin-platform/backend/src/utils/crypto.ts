import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-32-bytes-required!!!';
const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';

// Ensure we have a 32-byte key for AES-256
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

/**
 * Encrypt sensitive data like OAuth tokens
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data like OAuth tokens
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data for storage (one-way)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify a hash against the original data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  const dataHash = hash(data);
  return crypto.timingSafeEqual(Buffer.from(dataHash), Buffer.from(hashedData));
}

/**
 * Encrypt OAuth token before storing in database
 */
export function encryptOAuthToken(token: string): string {
  if (!token) return '';
  return encrypt(token);
}

/**
 * Decrypt OAuth token when retrieving from database
 */
export function decryptOAuthToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  return decrypt(encryptedToken);
}