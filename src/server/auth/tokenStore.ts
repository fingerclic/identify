import { prisma } from '../prisma';

export class TokenStore {
  /**
   * Persists a Refresh Token in PostgreSQL via Prisma
   */
  async saveRefreshToken(userId: string, sessionId: string, token: string, expiresAt?: Date) {
    const exp = expiresAt || new Date(Date.now() + 7 * 86400000); // 7 days default
    return await prisma.refreshToken.create({
      data: {
        userId,
        sessionId,
        token,
        revoked: false,
        expiresAt: exp
      }
    });
  }

  /**
   * Finds a Refresh Token by token string
   */
  async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token }
    });
  }

  /**
   * Revokes a specific Refresh Token in PostgreSQL
   */
  async revokeRefreshToken(token: string) {
    const found = await prisma.refreshToken.findUnique({ where: { token } });
    if (found) {
      await prisma.refreshToken.update({
        where: { token },
        data: { revoked: true }
      });
    }
  }

  /**
   * Revokes all active Refresh Tokens for a given user (used on Security Breach / Replay Attack / Global Logout)
   */
  async revokeAllUserTokens(userId: string) {
    return await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true }
    });
  }

  /**
   * Blacklists a JWT Token in PostgreSQL using VerificationToken table
   */
  async blacklistJwtToken(token: string, expiresAt?: Date) {
    const exp = expiresAt || new Date(Date.now() + 3600000); // 1 hour default
    const existing = await prisma.verificationToken.findUnique({ where: { token } });
    if (!existing) {
      await prisma.verificationToken.create({
        data: {
          userId: 'system',
          token,
          type: 'JWT_BLACKLIST',
          expiresAt: exp
        }
      });
    }
  }

  /**
   * Checks if a JWT Token is in the PostgreSQL Blacklist
   */
  async isJwtBlacklisted(token: string): Promise<boolean> {
    const found = await prisma.verificationToken.findUnique({
      where: { token }
    });
    return !!(found && found.type === 'JWT_BLACKLIST');
  }

  /**
   * Persists a single-use OAuth Authorization Code in PostgreSQL
   */
  async storeAuthorizationCode(params: {
    userId: string;
    clientId: string;
    redirectUri: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    scope?: string;
    nonce?: string;
    expiresAt?: Date;
  }) {
    const code = params.nonce ? `authcode_${params.nonce}` : `authcode_${Math.random().toString(36).substring(2, 15)}`;
    const scope = params.scope || 'openid profile email';

    const metadata = {
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod || 'S256',
      scope,
      nonce: params.nonce
    };

    const typeStr = 'OAUTH_CODE:' + Buffer.from(JSON.stringify(metadata)).toString('base64url');
    const exp = params.expiresAt || new Date(Date.now() + 600000); // 10 minutes

    await prisma.verificationToken.create({
      data: {
        userId: params.userId,
        token: code,
        type: typeStr,
        expiresAt: exp
      }
    });

    return code;
  }

  /**
   * Consumes an Authorization Code (Ensures Single-Use and Atomically deletes from PostgreSQL)
   */
  async consumeAuthorizationCode(code: string) {
    const record = await prisma.verificationToken.findUnique({
      where: { token: code }
    });

    if (!record || !record.type.startsWith('OAUTH_CODE:')) {
      return null;
    }

    // Atomically delete from PostgreSQL so it can NEVER be reused (Single-Use enforcement)
    await prisma.verificationToken.delete({ where: { token: code } });

    if (record.expiresAt < new Date()) {
      return null; // Expired
    }

    try {
      const jsonStr = Buffer.from(record.type.substring(11), 'base64url').toString('utf-8');
      const metadata = JSON.parse(jsonStr);
      return {
        userId: record.userId,
        ...metadata
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Automatic Cleanup of Expired Tokens in PostgreSQL
   */
  async cleanupExpiredTokens() {
    const now = new Date();

    const deletedRefresh = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } }
    });

    const deletedVerification = await prisma.verificationToken.deleteMany({
      where: { expiresAt: { lt: now } }
    });

    return {
      deletedRefreshTokens: deletedRefresh.count,
      deletedVerificationTokens: deletedVerification.count
    };
  }
}

export const tokenStore = new TokenStore();
