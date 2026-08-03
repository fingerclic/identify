import { prisma } from '../prisma';

export type SecuritySeverityType = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export async function logSecurityEvent(
  userId: string,
  eventType: string,
  severity: SecuritySeverityType,
  description: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    return await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        severity,
        description,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Fingerclic Client'
      }
    });
  } catch (err) {
    console.error('Failed to log security event via Prisma:', err);
    return null;
  }
}

export async function getUserSecurityEvents(userId: string, limit = 50) {
  return await prisma.securityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getSystemSecurityEvents(limit = 100) {
  return await prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
