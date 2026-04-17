import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const SECRET = process.env.BETTER_AUTH_SECRET;
if (!SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required for encryption operations');
}

/**
 * Encrypt sensitive data (2FA secrets, backup codes, etc.)
 * Returns a base64-encoded string containing salt, iv, authTag, and encrypted data
 */
export function encrypt(plaintext: string): string {
    if (!plaintext) return '';

    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive key from BETTER_AUTH_SECRET and salt
    const key = scryptSync(SECRET as string, salt, KEY_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine: salt + iv + authTag + encrypted
    const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
}

/**
 * Decrypt sensitive data
 * Expects base64-encoded string from encrypt()
 */
export function decrypt(encryptedData: string): string {
    if (!encryptedData) return '';

    try {
        const combined = Buffer.from(encryptedData, 'base64');

        const salt = combined.subarray(0, SALT_LENGTH);
        const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = combined.subarray(
            SALT_LENGTH + IV_LENGTH,
            SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
        );
        const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

        // Derive key from BETTER_AUTH_SECRET and salt
        const key = scryptSync(SECRET as string, salt, KEY_LENGTH);

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // If decryption fails, return empty string or throw based on context
        throw new Error('Failed to decrypt sensitive data');
    }
}

/**
 * Timing-safe token comparison for hashed tokens
 * Pads shorter buffer with zeros to prevent length leakage
 */
export function timingSafeEqual(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    const maxLength = Math.max(aBuffer.length, bBuffer.length);
    const paddedA = Buffer.alloc(maxLength);
    const paddedB = Buffer.alloc(maxLength);

    aBuffer.copy(paddedA);
    bBuffer.copy(paddedB);

    return cryptoTimingSafeEqual(paddedA, paddedB);
}
