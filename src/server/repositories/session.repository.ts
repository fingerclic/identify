import { prisma } from '../prisma';

export class SessionRepository {
  async createSession(data: {
    userId: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const ua = data.userAgent || '';
    let deviceType = 'Desktop';
    if (/mobile/i.test(ua)) deviceType = 'Mobile';
    if (/ipad|tablet/i.test(ua)) deviceType = 'Tablet';

    let browser = 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'macOS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    const token = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 86400000);

    const session = await prisma.session.create({
      data: {
        userId: data.userId,
        token,
        ipAddress: data.ipAddress || '88.167.24.102',
        userAgent: data.userAgent || 'Mozilla/5.0 Browser',
        deviceType,
        browser,
        os,
        city: 'Paris',
        country: 'France',
        location: 'Paris, France',
        isCurrent: true,
        expiresAt
      }
    });

    // Track or update Device
    const existingDevice = await prisma.device.findFirst({
      where: { userId: data.userId, os, browser }
    });

    if (existingDevice) {
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          lastActive: new Date(),
          ipAddress: session.ipAddress
        }
      });
    } else {
      await prisma.device.create({
        data: {
          userId: data.userId,
          deviceId: 'dev_' + Date.now(),
          name: `${os} (${browser})`,
          type: deviceType,
          os,
          browser,
          ipAddress: session.ipAddress
        }
      });
    }

    // Track Login History
    await prisma.loginHistory.create({
      data: {
        userId: data.userId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        browser,
        os,
        city: 'Paris',
        country: 'France',
        success: true
      }
    });

    return session;
  }

  async getUserSessions(userId: string, currentSessionId?: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' }
    });

    return sessions.map(sess => ({
      ...sess,
      isCurrent: currentSessionId ? sess.id === currentSessionId : false
    }));
  }

  async revokeSession(sessionId: string, userId: string) {
    const found = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!found || found.userId !== userId) return false;
    await prisma.session.delete({ where: { id: sessionId } });
    return true;
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string) {
    const deleted = await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId }
      }
    });
    return deleted.count;
  }

  async saveRefreshToken(userId: string, sessionId: string, token: string) {
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    return await prisma.refreshToken.create({
      data: {
        userId,
        sessionId,
        token,
        revoked: false,
        expiresAt
      }
    });
  }

  async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({ where: { token } });
  }

  async revokeRefreshToken(token: string) {
    const found = await prisma.refreshToken.findUnique({ where: { token } });
    if (found) {
      await prisma.refreshToken.update({
        where: { token },
        data: { revoked: true }
      });
    }
  }

  async createVerificationToken(userId: string, type: 'EMAIL_VERIFY' | 'PASSWORD_RESET') {
    const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.verificationToken.create({
      data: {
        userId,
        token,
        type,
        expiresAt
      }
    });

    return token;
  }

  async findVerificationToken(token: string) {
    return await prisma.verificationToken.findUnique({ where: { token } });
  }

  async consumeVerificationToken(token: string) {
    const found = await prisma.verificationToken.findUnique({ where: { token } });
    if (found) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    return found;
  }
}
