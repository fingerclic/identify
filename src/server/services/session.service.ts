import { SessionRepository } from '../repositories/session.repository';
import { logger } from '../security/logger';

export class SessionService {
  private sessionRepo = new SessionRepository();

  async getUserSessions(userId: string, currentSessionId?: string) {
    return await this.sessionRepo.getUserSessions(userId, currentSessionId);
  }

  async revokeSession(sessionId: string, userId: string, ipAddress: string, userAgent: string) {
    const success = await this.sessionRepo.revokeSession(sessionId, userId);
    if (!success) throw new Error('Session introuvable ou déjà révoquée');

    await logger.logSessionRevocation({
      userId,
      targetSessionId: sessionId,
      allOthers: false,
      ipAddress,
      userAgent
    });
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string, ipAddress: string, userAgent: string) {
    const count = await this.sessionRepo.revokeAllOtherSessions(userId, currentSessionId);
    await logger.logSessionRevocation({
      userId,
      targetSessionId: currentSessionId,
      allOthers: true,
      ipAddress,
      userAgent
    });
    return count;
  }
}
