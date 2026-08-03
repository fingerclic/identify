import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt';
import { tokenStore } from './tokenStore';
import { prisma } from '../prisma';
import { logAudit } from '../security/audit';
import { logSecurityEvent } from '../security/events';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Handles Automatic Refresh Token Rotation and Replay Attack Detection
 */
export async function rotateRefreshToken(
  oldRefreshToken: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Fingerclic Auth Service'
): Promise<RefreshResult> {
  const payload = verifyRefreshToken(oldRefreshToken);

  // Check if token exists in PostgreSQL database via Prisma
  const stored = await tokenStore.findRefreshToken(oldRefreshToken);

  // REPLAY ATTACK DETECTION / REUSE SECURITY DEFENSE:
  // If the token is missing from DB or already marked as revoked, it indicates token reuse!
  if (!stored || stored.revoked) {
    if (payload?.userId) {
      // Invalidate ALL refresh tokens for this compromised account immediately
      await tokenStore.revokeAllUserTokens(payload.userId);

      await logAudit(
        payload.userId,
        'security.replay_attack',
        'ALERTE SÉCURITÉ : Tentative de réutilisation d\'un Refresh Token révoqué ! Révocation globale effectuée.',
        ipAddress,
        userAgent
      );

      await logSecurityEvent(
        payload.userId,
        'REPLAY_ATTACK_DETECTED',
        'CRITICAL',
        'Détection d\'attaque par rejeu de jeton de rafraîchissement. Toutes les sessions de l\'utilisateur ont été révoquées par précaution.',
        ipAddress,
        userAgent
      );
    }

    throw new Error('ALERTE SÉCURITÉ : Refresh Token invalide ou déjà révoqué. Toutes les sessions associées ont été invalidées par précaution.');
  }

  if (!payload) {
    // Token is expired in JWT signature
    await tokenStore.revokeRefreshToken(oldRefreshToken);
    throw new Error('Refresh token expiré');
  }

  // Find user to verify account status
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    await tokenStore.revokeRefreshToken(oldRefreshToken);
    throw new Error('Utilisateur associé introuvable');
  }

  // 1. Mark the old token as REVOKED in PostgreSQL (Rotation)
  await tokenStore.revokeRefreshToken(oldRefreshToken);

  const roleName = user.userRoles?.[0]?.role?.name || 'USER';

  // 2. Generate brand new Access Token & Refresh Token pair
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: roleName,
    sessionId: payload.sessionId
  });

  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    sessionId: payload.sessionId
  });

  // 3. Persist new Refresh Token in PostgreSQL via Prisma
  await tokenStore.saveRefreshToken(user.id, payload.sessionId, newRefreshToken);

  await logAudit(
    user.id,
    'auth.token_rotated',
    'Rotation automatique du Refresh Token effectuée avec succès dans PostgreSQL via Prisma',
    ipAddress,
    userAgent
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900 // 15 minutes
  };
}

/**
 * Revokes a user's refresh token
 */
export async function revokeToken(refreshToken: string) {
  await tokenStore.revokeRefreshToken(refreshToken);
}
