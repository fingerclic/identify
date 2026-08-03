import { ApplicationRepository } from '../repositories/application.repository';
import { logAudit } from '../security/audit';

export class ApplicationService {
  private appRepo = new ApplicationRepository();

  async getAppsForUser(userId: string) {
    return await this.appRepo.getAllAppsForUser(userId);
  }

  async findByCode(code: string) {
    return await this.appRepo.findByCode(code);
  }

  async grantAccess(userId: string, appCode: string, ipAddress: string, userAgent: string) {
    const app = await this.appRepo.findByCode(appCode);
    if (!app) throw new Error(`Application ${appCode} introuvable`);

    const access = await this.appRepo.grantAccess(userId, app.id);
    await logAudit(userId, 'app.grant_access', `Accès accordé à l'application ${app.name} (${appCode})`, ipAddress, userAgent);
    return access;
  }

  async revokeAccess(userId: string, appCode: string, ipAddress: string, userAgent: string) {
    const app = await this.appRepo.findByCode(appCode);
    if (!app) throw new Error(`Application ${appCode} introuvable`);

    await this.appRepo.revokeAccess(userId, app.id);
    await logAudit(userId, 'app.revoke_access', `Accès révoqué pour l'application ${app.name} (${appCode})`, ipAddress, userAgent);
    return true;
  }
}
