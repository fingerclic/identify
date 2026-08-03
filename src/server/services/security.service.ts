import { SecurityRepository } from '../repositories/security.repository';
import { UserRepository } from '../repositories/user.repository';
import { ApiKeyRepository } from '../repositories/apikey.repository';

export class SecurityService {
  private securityRepo = new SecurityRepository();
  private userRepo = new UserRepository();
  private apiKeyRepo = new ApiKeyRepository();

  async getSecurityOverview(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('Utilisateur introuvable');

    const securityEvents = await this.securityRepo.getSecurityEvents(userId);
    const devices = await this.securityRepo.getDevices(userId);
    const apiKeys = await this.apiKeyRepo.getUserApiKeys(userId);

    return {
      securityScore: 95,
      twoFactorEnabled: user.userPreference?.twoFactorEnabled || false,
      emailVerified: user.emailVerified,
      lastPasswordChange: user.updatedAt,
      securityEvents,
      devices,
      apiKeysCount: apiKeys.length
    };
  }

  async getDevices(userId: string) {
    return await this.securityRepo.getDevices(userId);
  }

  async getAuditLogs(userId?: string) {
    return await this.securityRepo.getAuditLogs(userId);
  }
}
