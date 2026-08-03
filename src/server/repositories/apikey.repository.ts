import { prisma } from '../prisma';

export class ApiKeyRepository {
  async getUserApiKeys(userId: string) {
    return await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createApiKey(userId: string, name: string) {
    const rawKey = 'fc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const prefix = rawKey.substring(0, 12) + '...';

    return await prisma.apiKey.create({
      data: {
        userId,
        name,
        prefix,
        keyHash: rawKey
      }
    });
  }

  async deleteApiKey(userId: string, keyId: string) {
    const found = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!found || found.userId !== userId) return false;
    await prisma.apiKey.delete({ where: { id: keyId } });
    return true;
  }
}
