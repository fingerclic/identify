import { ApiKeyRepository } from '../repositories/apikey.repository';
import { logger } from '../security/logger';

export class ApiKeyService {
  private apiKeyRepo = new ApiKeyRepository();

  async getUserApiKeys(userId: string) {
    return await this.apiKeyRepo.getUserApiKeys(userId);
  }

  async createApiKey(userId: string, name: string, expiresInDays: number | undefined, ipAddress: string, userAgent: string) {
    const key = await this.apiKeyRepo.createApiKey(userId, name);
    await logger.logApiKeyCreated({
      userId,
      keyName: name,
      prefix: key.prefix,
      ipAddress,
      userAgent
    });
    return key;
  }

  async deleteApiKey(userId: string, keyId: string, ipAddress: string, userAgent: string) {
    const success = await this.apiKeyRepo.deleteApiKey(userId, keyId);
    if (!success) throw new Error('Clé API introuvable');

    await logger.logApiKeyRevoked({
      userId,
      keyId,
      ipAddress,
      userAgent
    });
    return true;
  }

  async revokeApiKey(keyId: string, userId: string, ipAddress: string, userAgent: string) {
    return await this.deleteApiKey(userId, keyId, ipAddress, userAgent);
  }
}
