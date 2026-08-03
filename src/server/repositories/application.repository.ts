import { prisma } from '../prisma';

export class ApplicationRepository {
  async getAllAppsForUser(userId: string) {
    const apps = await prisma.application.findMany({
      orderBy: { name: 'asc' }
    });

    const userAccesses = await prisma.applicationAccess.findMany({
      where: { userId }
    });

    const authorizedSet = new Set(userAccesses.map(a => a.applicationId));

    return apps.map(app => ({
      ...app,
      isAuthorized: authorizedSet.has(app.id)
    }));
  }

  async findByCode(code: string) {
    return await prisma.application.findFirst({
      where: { code: code as any }
    });
  }

  async grantAccess(userId: string, applicationId: string) {
    const existing = await prisma.applicationAccess.findFirst({
      where: { userId, applicationId }
    });

    if (existing) return existing;

    return await prisma.applicationAccess.create({
      data: { userId, applicationId }
    });
  }

  async revokeAccess(userId: string, applicationId: string) {
    return await prisma.applicationAccess.deleteMany({
      where: { userId, applicationId }
    });
  }
}
