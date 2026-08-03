import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OAuthService } from '../services/oauth.service';
import { UserService } from '../services/user.service';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateAccessToken } from '../auth/jwt';
import { logAudit } from '../security/audit';
import { logSecurityEvent } from '../security/events';

export const oauthRouter = Router();
const oauthService = new OAuthService();
const userService = new UserService();

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Fingerclic Client';
  return { ipAddress, userAgent };
}

function getIssuerUrl(req: Request) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  return `${protocol}://${host}`;
}

// 1. GET /.well-known/openid-configuration
oauthRouter.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
  const issuer = getIssuerUrl(req);
  return res.json(oauthService.getOpenIdConfiguration(issuer));
});

// 2. GET /.well-known/jwks.json
oauthRouter.get('/.well-known/jwks.json', (_req: Request, res: Response) => {
  return res.json(oauthService.getJwks());
});

// 3. GET & POST /oauth/authorize
const handleAuthorize = async (req: Request, res: Response) => {
  try {
    const client_id = (req.query.client_id || req.body.client_id) as string;
    const redirect_uri = (req.query.redirect_uri || req.body.redirect_uri) as string;
    const response_type = (req.query.response_type || req.body.response_type) as string;
    const scope = (req.query.scope || req.body.scope) as string;
    const state = (req.query.state || req.body.state) as string;
    const code_challenge = (req.query.code_challenge || req.body.code_challenge) as string;
    const code_challenge_method = (req.query.code_challenge_method || req.body.code_challenge_method) as string;
    const nonce = (req.query.nonce || req.body.nonce) as string;

    if (!client_id || !redirect_uri) {
      return res.status(400).json({ error: 'client_id et redirect_uri sont obligatoires' });
    }

    if (response_type !== 'code') {
      return res.status(400).json({ error: 'response_type non supporté. Seul `code` est autorisé (PKCE/Authorization Code)' });
    }

    // Default system user for authorization code simulation if not logged in
    const userId = (req as AuthenticatedRequest).user?.userId || 'usr_fingerclic_master_001';

    const code = await oauthService.createAuthorizationCode({
      userId,
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      scope,
      nonce
    });

    const targetUrl = new URL(redirect_uri);
    targetUrl.searchParams.set('code', code);
    if (state) targetUrl.searchParams.set('state', state);

    if (req.method === 'GET' && req.accepts('html')) {
      return res.redirect(targetUrl.toString());
    }

    return res.json({
      code,
      state,
      redirect_uri: targetUrl.toString()
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Échec d\'autorisation OAuth2' });
  }
};

oauthRouter.get('/oauth/authorize', handleAuthorize);
oauthRouter.post('/oauth/authorize', handleAuthorize);

// 4. POST /oauth/token
oauthRouter.post('/oauth/token', async (req: Request, res: Response) => {
  try {
    const grant_type = req.body.grant_type;
    const code = req.body.code;
    const redirect_uri = req.body.redirect_uri;
    const client_id = req.body.client_id || req.headers.authorization?.split(' ')[1];
    const client_secret = req.body.client_secret;
    const code_verifier = req.body.code_verifier;
    const refresh_token = req.body.refresh_token;
    const scope = req.body.scope;

    const meta = getClientMeta(req);

    const result = await oauthService.exchangeToken({
      grantType: grant_type,
      code,
      redirectUri: redirect_uri,
      clientId: client_id,
      clientSecret: client_secret,
      codeVerifier: code_verifier,
      refreshToken: refresh_token,
      scope,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: err.message || 'Échec de l\'échange de token'
    });
  }
});

// 5. GET & POST /oauth/userinfo
const handleUserInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const claims = await oauthService.getUserInfo(req.user!);
    return res.json(claims);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Token invalide ou utilisateur non trouvé' });
  }
};

oauthRouter.get('/oauth/userinfo', authenticateJwt, handleUserInfo);
oauthRouter.post('/oauth/userinfo', authenticateJwt, handleUserInfo);

// 6. POST /oauth/introspect
oauthRouter.post('/oauth/introspect', async (req: Request, res: Response) => {
  try {
    const token = req.body.token;
    if (!token) return res.status(400).json({ active: false, error: 'Token requis' });
    const result = await oauthService.introspectToken(token);
    return res.json(result);
  } catch (err: any) {
    return res.json({ active: false });
  }
});

// 7. POST /oauth/revoke
oauthRouter.post('/oauth/revoke', async (req: Request, res: Response) => {
  try {
    const token = req.body.token;
    if (!token) return res.status(400).json({ error: 'Token requis' });
    const success = await oauthService.revokeToken(token);
    return res.json({ success });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la révocation du jeton' });
  }
});

// 8. GET /oauth/logout
oauthRouter.get('/oauth/logout', (req: Request, res: Response) => {
  const postLogoutRedirectUri = req.query.post_logout_redirect_uri as string;
  if (postLogoutRedirectUri) {
    return res.redirect(postLogoutRedirectUri);
  }
  return res.json({ message: 'Session OIDC fermée avec succès.' });
});

// 9. POST /api/sso/authorize (Cross-app Ecosystem Assertion)
oauthRouter.post('/api/sso/authorize', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { appCode } = req.body;

    if (!appCode) {
      return res.status(400).json({ error: 'Code d\'application requis (ex: MARKETPLACE, CREATOR, ADMIN)' });
    }

    const user = await userService.getUserProfile(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const userRole = (user.userRoles as any)?.[0]?.role?.name || 'USER';

    const ssoToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: userRole,
      sessionId: req.user!.sessionId
    });

    const meta = getClientMeta(req);
    await logAudit(userId, 'sso.authorize', `SSO assertion autorisée pour la plateforme ${appCode} via Prisma`, meta.ipAddress, meta.userAgent);
    await logSecurityEvent(userId, 'SSO_AUTHORIZATION', 'INFO', `Autorisation OIDC/SSO générée pour ${appCode}`, meta.ipAddress, meta.userAgent);

    return res.json({
      ssoToken,
      expiresInSeconds: 300,
      targetApp: appCode,
      ssoRedirectUrl: `https://${appCode.toLowerCase()}.fingerclic.com/auth/callback?sso_token=${ssoToken}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de l\'autorisation SSO' });
  }
});
