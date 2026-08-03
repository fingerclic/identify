import { prisma } from '../prisma';

export async function logAudit(
  userId: string | undefined,
  action: string,
  details: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Fingerclic Client'
      }
    });
  } catch (err) {
    console.error('Failed to log audit event via Prisma:', err);
    return null;
  }
}

export async function getUserAuditLogs(userId: string, limit = 100) {
  return await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId },
        { userId: null }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getSystemAuditLogs(limit = 100) {
  return await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
