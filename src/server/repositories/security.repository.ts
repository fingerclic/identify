import { prisma } from '../prisma';

export class SecurityRepository {
  async getDevices(userId: string) {
    return await prisma.device.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' }
    });
  }

  async getSecurityEvents(userId: string) {
    return await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getAuditLogs(userId?: string) {
    if (userId) {
      return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    return await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    });
  }
}
