import jwt from 'jsonwebtoken';
import { tokenStore } from './tokenStore';

const JWT_SECRET = process.env.JWT_SECRET || 'fingerclic_identify_jwt_secret_key_2026_auth_provider_prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fingerclic_identify_refresh_secret_key_2026_auth_provider_prod';

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
