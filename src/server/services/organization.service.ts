import { OrganizationRepository } from '../repositories/organization.repository';
import { logAudit } from '../security/audit';

export class OrganizationService {
  private orgRepo = new OrganizationRepository();

  async getUserOrganizations(userId: string) {
    return await this.orgRepo.getUserOrganizations(userId);
  }

  async createOrganization(userId: string, name: string, slug: string, description: string | undefined, ipAddress: string, userAgent: string) {
    const org = await this.orgRepo.createOrganization(userId, name, slug, description);
    await logAudit(userId, 'org.create', `Création de l'organisation ${name} (${slug})`, ipAddress, userAgent);
    return org;
  }
}
