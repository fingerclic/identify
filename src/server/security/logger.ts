import { prisma } from '../prisma';
import { logAudit } from './audit';
import { logSecurityEvent, SecuritySeverityType } from './events';

export class EnterpriseLogger {
  /**
   * Logs User Login (Connexion)
   */
  async logLogin(params: {
    userId: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    success?: boolean;
    details?: string;
  }) {
    const isSuccess = params.success !== false;
    const detailsText = params.details || (isSuccess ? `Connexion réussie pour ${params.email}` : `Échec de connexion pour ${params.email}`);

    // 1. Audit Log in Prisma
    await logAudit(
      params.userId,
      isSuccess ? 'auth.login.success' : 'auth.login.failure',
      detailsText,
      params.ipAddress,
      params.userAgent
    );

    // 2. Security Event in Prisma
    if (params.userId) {
      await logSecurityEvent(
        params.userId,
        isSuccess ? 'AUTH_SUCCESS' : 'AUTH_FAILURE',
        isSuccess ? 'INFO' : 'HIGH',
        detailsText,
        params.ipAddress,
        params.userAgent
      );

      // 3. Login History entry in Prisma
      try {
        await prisma.loginHistory.create({
          data: {
            userId: params.userId,
            ipAddress: params.ipAddress || '127.0.0.1',
            userAgent: params.userAgent || 'Fingerclic Client',
            browser: this.extractBrowser(params.userAgent),
            os: this.extractOs(params.userAgent),
            success: isSuccess
          }
        });
      } catch (err) {
        console.error('Failed to log login history in Prisma:', err);
      }
    }
  }

  /**
   * Logs User Logout (Déconnexion)
   */
  async logLogout(params: {
    userId: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
  }) {
    await logAudit(
      params.userId,
      'auth.logout',
      `Déconnexion effectuée (Session: ${params.sessionId || 'active'})`,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'AUTH_LOGOUT',
      'INFO',
      `Déconnexion de l'utilisateur (${params.sessionId || 'session active'})`,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs User Creation / Registration (Création utilisateur)
   */
  async logUserRegistration(params: {
    userId: string;
    email: string;
    ipAddress: string;
    userAgent: string;
  }) {
    await logAudit(
      params.userId,
      'auth.register',
      `Création de compte utilisateur (${params.email}) enregistrée dans PostgreSQL via Prisma`,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'USER_REGISTERED',
      'INFO',
      `Création du compte utilisateur (${params.email})`,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs Profile Modification (Modification profil)
   */
  async logProfileUpdate(params: {
    userId: string;
    fieldsUpdated: string[];
    ipAddress: string;
    userAgent: string;
  }) {
    const details = `Mise à jour du profil utilisateur. Champs modifiés: ${params.fieldsUpdated.join(', ')}`;

    await logAudit(
      params.userId,
      'profile.update',
      details,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'PROFILE_UPDATED',
      'INFO',
      details,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs Session Deletion / Revocation (Suppression session)
   */
  async logSessionRevocation(params: {
    userId: string;
    targetSessionId: string;
    allOthers?: boolean;
    ipAddress: string;
    userAgent: string;
  }) {
    const details = params.allOthers
      ? `Révocation globale de toutes les autres sessions actives`
      : `Suppression / Révocation de la session ${params.targetSessionId}`;

    await logAudit(
      params.userId,
      'session.revoke',
      details,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'SESSION_REVOKED',
      'MEDIUM',
      details,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs API Key Creation (Création API Key)
   */
  async logApiKeyCreated(params: {
    userId: string;
    keyName: string;
    prefix: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const details = `Génération d'une nouvelle clé d'API (${params.keyName}) avec le préfixe ${params.prefix}`;

    await logAudit(
      params.userId,
      'apikey.create',
      details,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'API_KEY_CREATED',
      'MEDIUM',
      details,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs API Key Deletion / Revocation (Suppression API Key)
   */
  async logApiKeyRevoked(params: {
    userId: string;
    keyId: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const details = `Suppression / Révocation de la clé d'API ${params.keyId}`;

    await logAudit(
      params.userId,
      'apikey.delete',
      details,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'API_KEY_REVOKED',
      'HIGH',
      details,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs SSO Events (SSO)
   */
  async logSsoEvent(params: {
    userId: string;
    provider: string;
    action: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const details = `Authentification SSO (${params.provider}) - Action: ${params.action}`;

    await logAudit(
      params.userId,
      `sso.${params.action}`,
      details,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'SSO_AUTHENTICATION',
      'INFO',
      details,
      params.ipAddress,
      params.userAgent
    );
  }

  /**
   * Logs OAuth Events (OAuth)
   */
  async logOAuthEvent(params: {
    userId: string;
    clientId: string;
    action: string;
    details?: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const details = params.details || `Événement OAuth OIDC (${params.action}) pour le client ${params.clientId}`;

    await logAudit(
      params.userId,
      `oauth.${params.action}`,
      details,
      params.ipAddress,
      params.userAgent
    );

    await logSecurityEvent(
      params.userId,
      'OAUTH_EVENT',
      'INFO',
      details,
      params.ipAddress,
      params.userAgent
    );
  }

  private extractBrowser(ua: string): string {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Navigateur Web';
  }

  private extractOs(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Système d\'exploitation';
  }
}

export const logger = new EnterpriseLogger();
