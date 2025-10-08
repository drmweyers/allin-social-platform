import crypto from 'crypto';

/**
 * CRITICAL SECURITY: No fallback values for encryption keys
 * The application will fail to start if ENCRYPTION_KEY is not set
 */
if (!process.env.ENCRYPTION_KEY) {
  throw new Error(
    'CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is required. ' +
    'Generate a secure key using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

if (process.env.ENCRYPTION_KEY.length < 64) {
  throw new Error(
    'CRITICAL SECURITY ERROR: ENCRYPTION_KEY must be at least 64 characters long (32 bytes in hex). ' +
    'Current length: ' + process.env.ENCRYPTION_KEY.length + '. ' +
    'Generate a secure key using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';

/**
 * Validate and derive a 32-byte encryption key for AES-256
 * Uses scrypt for key derivation with a fixed salt for consistency
 */
function deriveKey(): Buffer {
  // Use scrypt to derive a 32-byte key from the encryption key
  // Note: Using a fixed salt for backward compatibility with existing encrypted data
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

const key = deriveKey();

/**
 * Encrypt sensitive data like OAuth tokens using AES-256-GCM
 * @param text - The plaintext string to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encrypt(text: string): string {
  try {
    if (!text) {
      throw new Error('Text to encrypt cannot be empty');
    }

    // Generate a random 16-byte IV for each encryption operation
    const iv = crypto.randomBytes(16);

    // Use secure createCipheriv instead of deprecated createCipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag for GCM mode (provides integrity and authenticity)
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data (all hex-encoded)
    // Format: iv:authTag:encryptedData
    const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    // Preserve original error message if available
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data like OAuth tokens using AES-256-GCM
 * @param encryptedText - The encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) {
      throw new Error('Encrypted text cannot be empty');
    }

    // Parse the encrypted data format: iv:authTag:encryptedData
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected format: iv:authTag:encryptedData');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // Validate IV length (must be 16 bytes for AES-256-GCM)
    if (iv.length !== 16) {
      throw new Error('Invalid IV length. Expected 16 bytes.');
    }

    // Use secure createDecipheriv instead of deprecated createDecipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;

    // Set authentication tag for GCM mode verification
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Preserve original error message if available
    if (error instanceof Error) {
      throw error;
    }
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