import { createHash, randomBytes } from 'crypto';
import * as db from './db';

/**
 * Generate unique username for proxy
 */
export function generateProxyUsername(userId: number): string {
  const random = randomBytes(4).toString('hex');
  return `user${userId}_${random}`;
}

/**
 * Generate secure random password
 */
export function generateProxyPassword(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Hash password for storage
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Get or create proxy credentials for user
 */
export async function getOrCreateProxyCredentials(userId: number): Promise<{
  username: string;
  password: string;
} | null> {
  // Check if credentials exist
  let creds = await db.getProxyCredentials(userId);
  
  if (creds) {
    // Return existing credentials (password is hashed, can't retrieve original)
    // In real implementation, you'd store password temporarily or regenerate
    return {
      username: creds.username,
      password: '********', // Can't retrieve original password
    };
  }
  
  // Generate new credentials
  const username = generateProxyUsername(userId);
  const password = generateProxyPassword();
  const passwordHash = hashPassword(password);
  
  await db.createProxyCredentials({
    userId,
    username,
    passwordHash,
  });
  
  return { username, password };
}

/**
 * Regenerate proxy credentials for user
 */
export async function regenerateProxyCredentials(userId: number): Promise<{
  username: string;
  password: string;
}> {
  // Delete old credentials
  await db.deleteProxyCredentials(userId);
  
  // Generate new ones
  const username = generateProxyUsername(userId);
  const password = generateProxyPassword();
  const passwordHash = hashPassword(password);
  
  await db.createProxyCredentials({
    userId,
    username,
    passwordHash,
  });
  
  return { username, password };
}

/**
 * Verify proxy authentication
 */
export async function verifyProxyAuth(username: string, password: string): Promise<number | null> {
  const db_instance = await db.getDb();
  if (!db_instance) return null;
  
  const { proxyCredentials } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const result = await db_instance.select().from(proxyCredentials)
    .where(eq(proxyCredentials.username, username))
    .limit(1);
  
  const creds = result[0];
  if (!creds) return null;
  
  if (!verifyPassword(password, creds.passwordHash)) {
    return null;
  }
  
  // Update last used
  await db.updateProxyCredentialsLastUsed(creds.userId);
  
  return creds.userId;
}
