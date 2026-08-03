import { prisma } from '../prisma';

export class OrganizationRepository {
  async getUserOrganizations(userId: string) {
    const members = await prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true }
    });

    return members.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      description: m.organization.description,
      role: m.role,
      joinedAt: m.joinedAt
    }));
  }

  async createOrganization(userId: string, name: string, slug: string, description?: string) {
    const org = await prisma.organization.create({
      data: { name, slug, description }
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId,
        role: 'SUPER_ADMIN'
      }
    });

    return org;
  }
}
