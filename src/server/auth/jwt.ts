import jwt from 'jsonwebtoken';
import { tokenStore } from './tokenStore';

function requiredSigningSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`Identify configuration error: ${name} must be set to a unique, strong secret (at least 32 characters).`);
  }
  return value;
}

const JWT_SECRET = requiredSigningSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = requiredSigningSecret('JWT_REFRESH_SECRET');
if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('Identify configuration error: access and refresh signing secrets must differ.');
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: { userId: string; sessionId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; sessionId: string };
  } catch (err) {
    return null;
  }
}

/**
 * Enterprise Blacklist Integration using PostgreSQL via Prisma
 */
export async function blacklistToken(token: string, expiresAt?: Date) {
  await tokenStore.blacklistJwtToken(token, expiresAt);
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  return await tokenStore.isJwtBlacklisted(token);
}
