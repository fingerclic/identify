import crypto from 'crypto';
import { prisma } from '../prisma';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../auth/jwt';
import { rotateRefreshToken } from '../auth/refresh';
import { tokenStore } from '../auth/tokenStore';
import { logAudit } from '../security/audit';
import { logSecurityEvent } from '../security/events';

export class OAuthService {
  /**
   * Generates OIDC Discovery Configuration (RFC 8414)
   */
  getOpenIdConfiguration(issuerUrl: string) {
    return {
      issuer: issuerUrl,
      authorization_endpoint: `${issuerUrl}/oauth/authorize`,
      token_endpoint: `${issuerUrl}/oauth/token`,
      userinfo_endpoint: `${issuerUrl}/oauth/userinfo`,
      jwks_uri: `${issuerUrl}/.well-known/jwks.json`,
      revocation_endpoint: `${issuerUrl}/oauth/revoke`,
      introspection_endpoint: `${issuerUrl}/oauth/introspect`,
      end_session_endpoint: `${issuerUrl}/oauth/logout`,
      scopes_supported: ['openid', 'profile', 'email', 'phone', 'roles', 'offline_access'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
      claims_supported: [
        'sub', 'iss', 'aud', 'exp', 'iat', 'auth_time',
        'email', 'email_verified', 'name', 'picture', 'preferred_username', 'roles'
      ],
      code_challenge_methods_supported: ['S256', 'plain']
    };
  }

  /**
   * Generates JWKS Key Set (JSON Web Key Set)
   */
  getJwks() {
    return {
      keys: [
        {
          kty: 'oct',
          use: 'sig',
          alg: 'HS256',
          kid: 'fingerclic-identify-key-2026'
        }
      ]
    };
  }

  /**
   * Retrieves an OAuth client by clientId (with alias support)
   */
  async getClient(clientId: string) {
    if (!clientId) return null;
    const normalized = clientId.trim();
    const target = normalized === 'nexus' ? 'fingerclic-nexus' : normalized;
    let client = await prisma.oAuthClient.findFirst({
      where: { clientId: target }
    });
    if (!client && normalized !== target) {
      client = await prisma.oAuthClient.findFirst({
        where: { clientId: normalized }
      });
    }
    return client;
  }

  /**
   * Validates if a redirectUri is registered and authorized for the client
   */
  isRedirectUriAllowed(client: any, redirectUri: string): boolean {
    if (!client || !client.redirectUris || !Array.isArray(client.redirectUris)) return false;
    try {
      const parsedReq = new URL(redirectUri);
      return client.redirectUris.some((registeredUri: string) => {
        try {
          const parsedReg = new URL(registeredUri);
          return (
            parsedReq.origin === parsedReg.origin &&
            parsedReq.pathname.replace(/\/$/, '') === parsedReg.pathname.replace(/\/$/, '')
          );
        } catch {
          return registeredUri === redirectUri;
        }
      });
    } catch {
      return false;
    }
  }

  /**
   * Creates an Authorization Code for OIDC Authorization Code Flow with PKCE
   * Persisted strictly in PostgreSQL via Prisma VerificationToken model.
   */
  async createAuthorizationCode(params: {
    userId: string;
    clientId: string;
    redirectUri: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    scope?: string;
    nonce?: string;
  }) {
    const code = 'authcode_' + crypto.randomBytes(24).toString('hex');
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

    // Persist Authorization Code in Prisma / PostgreSQL
    await prisma.verificationToken.create({
      data: {
        userId: params.userId,
        token: code,
        type: typeStr,
        expiresAt: new Date(Date.now() + 600000) // 10 minutes
      }
    });

    // Track or create OAuth Authorization in Prisma
    const client = await prisma.oAuthClient.findFirst({
      where: { clientId: params.clientId }
    });

    if (client) {
      const existingAuth = await prisma.oAuthAuthorization.findFirst({
        where: { userId: params.userId, clientId: client.id }
      });

      if (!existingAuth) {
        await prisma.oAuthAuthorization.create({
          data: {
            userId: params.userId,
            clientId: client.id,
            scope
          }
        });
      }
    }

    return code;
  }

  /**
   * Exchanges an Authorization Code, Refresh Token, or Client Credentials Grant for Tokens with PKCE validation.
   * All state is fetched and stored in Prisma.
   */
  async exchangeToken(params: {
    grantType: string;
    code?: string;
    redirectUri?: string;
    clientId?: string;
    clientSecret?: string;
    codeVerifier?: string;
    refreshToken?: string;
    scope?: string;
    ipAddress: string;
    userAgent: string;
  }) {
    if (params.grantType === 'authorization_code') {
      if (!params.code) throw new Error('Paramètre `code` obligatoire pour le grant authorization_code');

      const record = await prisma.verificationToken.findUnique({
        where: { token: params.code }
      });

      if (!record || !record.type.startsWith('OAUTH_CODE:')) {
        throw new Error('Code d\'autorisation invalide ou expiré');
      }

      if (record.expiresAt < new Date()) {
        await prisma.verificationToken.delete({ where: { token: params.code } }).catch(() => {});
        throw new Error('Code d\'autorisation expiré');
      }

      let meta: any = {};
      try {
        const jsonStr = Buffer.from(record.type.substring(11), 'base64url').toString('utf-8');
        meta = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Format de metadata d\'autorisation corrompu');
      }

      // Single-use token logic: Delete immediately from Prisma
      await prisma.verificationToken.delete({ where: { token: params.code } });

      // Verify redirect_uri matches authorization request
      if (meta.redirectUri) {
        if (!params.redirectUri) {
          throw new Error('Paramètre redirect_uri requis pour l\'échange du code');
        }
        try {
          const reqUrl = new URL(params.redirectUri);
          const metaUrl = new URL(meta.redirectUri);
          if (
            reqUrl.origin !== metaUrl.origin ||
            reqUrl.pathname.replace(/\/$/, '') !== metaUrl.pathname.replace(/\/$/, '')
          ) {
            throw new Error('redirect_uri ne correspond pas à l\'URI d\'autorisation initiale');
          }
        } catch (e: any) {
          if (e.message.includes('ne correspond pas')) throw e;
          if (params.redirectUri !== meta.redirectUri) {
            throw new Error('redirect_uri ne correspond pas à l\'URI d\'autorisation initiale');
          }
        }
      }

      // Verify client_id matches authorization request
      if (meta.clientId) {
        const passedClient = params.clientId === 'nexus' ? 'fingerclic-nexus' : params.clientId;
        const metaClient = meta.clientId === 'nexus' ? 'fingerclic-nexus' : meta.clientId;
        if (passedClient && passedClient !== metaClient) {
          throw new Error('client_id ne correspond pas au client d\'autorisation initiale');
        }
      }

      // Verify client_secret if provided and required
      if (params.clientSecret) {
        const client = await this.getClient(meta.clientId);
        if (client && client.clientSecret && client.clientSecret !== params.clientSecret) {
          throw new Error('client_secret invalide pour ce client OAuth');
        }
      }

      // PKCE Check if code_challenge was provided during authorize
      if (meta.codeChallenge) {
        if (!params.codeVerifier) {
          throw new Error('Paramètre `code_verifier` requis pour PKCE');
        }

        let computedChallenge = params.codeVerifier;
        if (meta.codeChallengeMethod === 'S256') {
          computedChallenge = crypto
            .createHash('sha256')
            .update(params.codeVerifier)
            .digest('base64url');
        }

        if (computedChallenge !== meta.codeChallenge) {
          throw new Error('Échec de la vérification PKCE (`code_verifier` non valide)');
        }
      }

      const user = await prisma.user.findUnique({
        where: { id: record.userId },
        include: { userRoles: { include: { role: true } } }
      });

      if (!user) throw new Error('Utilisateur associé introuvable');

      const roleName = user.userRoles?.[0]?.role?.name || 'USER';
      const sessionId = 'sess_oidc_' + crypto.randomBytes(8).toString('hex');

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: roleName,
        sessionId
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        sessionId
      });

      // Save Refresh Token in Prisma
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          sessionId,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 86400000)
        }
      });

      const idToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: roleName,
        sessionId
      });

      await logAudit(user.id, 'oauth.token_exchange', `Token émis pour le client OIDC ${params.clientId || meta.clientId}`, params.ipAddress, params.userAgent);
      await logSecurityEvent(user.id, 'OIDC_TOKEN_ISSUED', 'INFO', `Jeton d'accès OIDC émis avec succès (${params.clientId || meta.clientId})`, params.ipAddress, params.userAgent);

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900,
        refresh_token: refreshToken,
        id_token: idToken,
        scope: meta.scope || 'openid profile email'
      };
    }

    if (params.grantType === 'refresh_token') {
      if (!params.refreshToken) {
        throw new Error('Paramètre `refresh_token` requis pour le grant refresh_token');
      }

      const rotated = await rotateRefreshToken(params.refreshToken, params.ipAddress, params.userAgent);

      return {
        access_token: rotated.accessToken,
        token_type: 'Bearer',
        expires_in: rotated.expiresIn,
        refresh_token: rotated.refreshToken,
        id_token: rotated.accessToken,
        scope: 'openid profile email'
      };
    }

    if (params.grantType === 'client_credentials') {
      if (!params.clientId || !params.clientSecret) {
        throw new Error('client_id et client_secret requis pour client_credentials');
      }

      const client = await prisma.oAuthClient.findFirst({
        where: { clientId: params.clientId, clientSecret: params.clientSecret }
      });

      if (!client) {
        throw new Error('Identifiants client OIDC/OAuth invalides');
      }

      const accessToken = generateAccessToken({
        userId: `client_${client.id}`,
        email: `${client.clientId}@fingerclic.system`,
        role: 'SYSTEM_CLIENT',
        sessionId: `sess_client_${client.id}`
      });

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: params.scope || 'read write'
      };
    }

    throw new Error(`Type de grant non pris en charge : ${params.grantType}`);
  }

  /**
   * Fetches OIDC UserInfo Claims (Standard OpenID Connect UserInfo)
   */
  async getUserInfo(userPayload: JwtPayload) {
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      include: {
        profile: true,
        userRoles: { include: { role: true } }
      }
    });

    if (!user) throw new Error('Utilisateur non trouvé');

    const roles = user.userRoles.map(ur => ur.role.name);

    return {
      sub: user.id,
      email: user.email,
      email_verified: user.emailVerified,
      name: user.fullName,
      picture: user.avatarUrl,
      preferred_username: user.email.split('@')[0],
      phone_number: user.phone || undefined,
      zoneinfo: user.timezone,
      locale: user.language,
      roles,
      company: user.profile?.company,
      job_title: user.profile?.jobTitle,
      updated_at: Math.floor(new Date(user.updatedAt).getTime() / 1000)
    };
  }

  /**
   * Introspects Token (RFC 7662) via Prisma and JWT Verification
   */
  async introspectToken(token: string) {
    try {
      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'fingerclic_identify_jwt_secret_key_2026_auth_provider_prod';
      const decoded: any = jwt.default.verify(token, JWT_SECRET);

      return {
        active: true,
        scope: 'openid profile email',
        client_id: 'fingerclic-identify-core',
        sub: decoded.userId,
        exp: decoded.exp,
        iat: decoded.iat,
        iss: 'https://identify.fingerclic.com',
        token_type: 'Bearer'
      };
    } catch (e) {
      // Check if token is a persisted RefreshToken in Prisma
      const stored = await prisma.refreshToken.findUnique({ where: { token } });
      if (stored && !stored.revoked && stored.expiresAt > new Date()) {
        return {
          active: true,
          scope: 'openid profile email',
          client_id: 'fingerclic-identify-core',
          sub: stored.userId,
          exp: Math.floor(stored.expiresAt.getTime() / 1000),
          token_type: 'Bearer'
        };
      }
      return { active: false };
    }
  }

  /**
   * Revokes Token (RFC 7009) via Prisma
   */
  async revokeToken(token: string, userId?: string) {
    const found = await prisma.refreshToken.findUnique({ where: { token } });
    if (found) {
      await prisma.refreshToken.update({
        where: { token },
        data: { revoked: true }
      });
      if (userId || found.userId) {
        await logAudit(userId || found.userId, 'oauth.token_revoked', 'Jeton d\'accès/refresh révoqué dans Prisma', '127.0.0.1', 'OIDC Revoke Endpoint');
      }
      return true;
    }

    const vToken = await prisma.verificationToken.findUnique({ where: { token } });
    if (vToken) {
      await prisma.verificationToken.delete({ where: { token } });
      return true;
    }

    return false;
  }
}
