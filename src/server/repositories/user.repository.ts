import { prisma } from '../prisma';

export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        profile: true,
        userPreference: true,
        notificationPreference: true,
        userRoles: { include: { role: true } },
        organizationMembers: { include: { organization: true } },
        applicationAccesses: { include: { application: true } }
      }
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userPreference: true,
        notificationPreference: true,
        userRoles: { include: { role: true } },
        organizationMembers: { include: { organization: true } },
        applicationAccesses: { include: { application: true } }
      }
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
  }) {
    const defaultRole = await prisma.role.findFirst({ where: { type: 'USER' } });
    const allApps = await prisma.application.findMany();

    const newUser = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone || '',
        bio: 'Membre de l\'écosystème Fingerclic',
        emailVerified: false,
        language: 'fr',
        timezone: 'Europe/Paris'
      }
    });

    // Create connected sub-records as mandated: Profile, UserPreference, NotificationPreference
    await prisma.profile.create({
      data: {
        userId: newUser.id,
        city: 'Paris',
        country: 'France',
        company: 'Fingerclic Member',
        jobTitle: 'Utilisateur'
      }
    });

    await prisma.userPreference.create({
      data: {
        userId: newUser.id,
        theme: 'dark',
        marketingEmails: true,
        securityAlerts: true,
        twoFactorEnabled: false
      }
    });

    await prisma.notificationPreference.create({
      data: {
        userId: newUser.id,
        emailNotify: true,
        smsNotify: false,
        pushNotify: true,
        loginAlerts: true
      }
    });

    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: defaultRole.id
        }
      });
    }

    // Grant default access to all applications
    for (const app of allApps) {
      await prisma.applicationAccess.create({
        data: {
          userId: newUser.id,
          applicationId: app.id
        }
      });
    }

    return this.findById(newUser.id);
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    avatarUrl?: string;
    phone?: string;
    bio?: string;
    address?: string;
    city?: string;
    country?: string;
    company?: string;
    jobTitle?: string;
    language?: string;
    timezone?: string;
    preferences?: {
      theme?: string;
      marketingEmails?: boolean;
      securityAlerts?: boolean;
      twoFactorEnabled?: boolean;
    }
  }) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        phone: data.phone,
        bio: data.bio,
        language: data.language,
        timezone: data.timezone
      }
    });

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      await prisma.profile.update({
        where: { userId },
        data: {
          address: data.address,
          city: data.city,
          country: data.country,
          company: data.company,
          jobTitle: data.jobTitle
        }
      });
    }

    if (data.preferences) {
      const prefs = await prisma.userPreference.findUnique({ where: { userId } });
      if (prefs) {
        await prisma.userPreference.update({
          where: { userId },
          data: {
            theme: data.preferences.theme,
            marketingEmails: data.preferences.marketingEmails,
            securityAlerts: data.preferences.securityAlerts,
            twoFactorEnabled: data.preferences.twoFactorEnabled
          }
        });
      }
    }

    return this.findById(userId);
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
  }

  async verifyEmail(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });
  }
}
