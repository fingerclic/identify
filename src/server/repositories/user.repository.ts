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
    const defaultRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!defaultRole) {
      throw new Error('Identify reference data missing: USER role must be seeded before registration.');
    }

    // A single real PostgreSQL transaction (nested writes) prevents half-created
    // identities. Access to individual applications must be granted explicitly.
    const newUser = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone?.trim() || null,
        bio: 'Membre de l’écosystème Fingerclic',
        emailVerified: false,
        language: 'fr',
        timezone: 'UTC',
        profile: {
          create: { city: null, country: null, company: null, jobTitle: null }
        },
        userPreference: {
          create: {
            theme: 'dark',
            marketingEmails: false,
            securityAlerts: true,
            twoFactorEnabled: false
          }
        },
        notificationPreference: {
          create: {
            emailNotify: true,
            smsNotify: false,
            pushNotify: true,
            loginAlerts: true
          }
        },
        userRoles: {
          create: [{ roleId: defaultRole.id }]
        }
      }
    });

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
