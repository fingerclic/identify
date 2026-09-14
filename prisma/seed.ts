import { PrismaClient, RoleType, AppCode } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface SeedData {
  superAdmin: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    bio: string;
    role: string;
    emailVerified: boolean;
    language: string;
    timezone: string;
    address: string;
    city: string;
    country: string;
    company: string;
    jobTitle: string;
  };
  apps: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    url: string;
    iconName: string;
    color: string;
    isSystem: boolean;
  }>;
}

export const seedData: SeedData = {
  superAdmin: {
    id: 'usr_fingerclic_master_001',
    email: 'fingerclic@gmail.com',
    fullName: 'Alexandre Fingerclic',
    phone: '+33 6 12 34 56 78',
    bio: 'Super Admin & Fondateur de l\'écosystème Fingerclic Identify',
    role: 'SUPER_ADMIN',
    emailVerified: true,
    language: 'fr',
    timezone: 'Europe/Paris',
    address: '15 Avenue des Champs-Élysées',
    city: 'Paris',
    country: 'France',
    company: 'Fingerclic Technologies',
    jobTitle: 'Chief Identity Officer'
  },
  apps: [
    {
      id: 'app_marketplace',
      code: 'MARKETPLACE',
      name: 'Marketplace',
      description: 'Achat et vente de services, assets et ressources numériques Fingerclic',
      url: 'https://marketplace.fingerclic.com',
      iconName: 'ShoppingBag',
      color: '#3B82F6',
      isSystem: true
    },
    {
      id: 'app_creator',
      code: 'CREATOR',
      name: 'Creator Studio',
      description: 'Plateforme d\'édition, monétisation et diffusion de contenus pour créateurs',
      url: 'https://creator.fingerclic.com',
      iconName: 'Video',
      color: '#8B5CF6',
      isSystem: true
    },
    {
      id: 'app_admin',
      code: 'ADMIN',
      name: 'Admin Central',
      description: 'Supervision globale, modération et gestion de la communauté',
      url: 'https://admin.fingerclic.com',
      iconName: 'ShieldCheck',
      color: '#EF4444',
      isSystem: true
    },
    {
      id: 'app_habitat',
      code: 'HABITAT',
      name: 'Habitat',
      description: 'Gestion immobilière, réservation de résidences et espaces collaboratifs',
      url: 'https://habitat.fingerclic.com',
      iconName: 'Home',
      color: '#10B981',
      isSystem: true
    },
    {
      id: 'app_academy',
      code: 'ACADEMY',
      name: 'Academy',
      description: 'E-learning, certifications professionnelles et parcours de compétences',
      url: 'https://academy.fingerclic.com',
      iconName: 'GraduationCap',
      color: '#F59E0B',
      isSystem: true
    },
    {
      id: 'app_organisation',
      code: 'ORGANISATION',
      name: 'Organisation',
      description: 'Gestion d\'entreprises, équipes, rôles et espaces de travail',
      url: 'https://org.fingerclic.com',
      iconName: 'Building2',
      color: '#6366F1',
      isSystem: true
    },
    {
      id: 'app_fip',
      code: 'FIP',
      name: 'FIP (Finances)',
      description: 'Financement participatif, investissement et suivi des transactions',
      url: 'https://fip.fingerclic.com',
      iconName: 'TrendingUp',
      color: '#EC4899',
      isSystem: true
    },
    {
      id: 'app_website',
      code: 'WEBSITE',
      name: 'Portail Officiel',
      description: 'Portail institutionnel et vitrine globale Fingerclic',
      url: 'https://fingerclic.com',
      iconName: 'Globe',
      color: '#06B6D4',
      isSystem: true
    },
    {
      id: 'app_nexus',
      code: 'NEXUS',
      name: 'NEXUS',
      description: 'Plateforme centrale d\'orchestration et hub applicatif unifié de l\'écosystème Fingerclic',
      url: 'https://nexus.fingerclic.com',
      iconName: 'Layers',
      color: '#6366F1',
      isSystem: true
    }
  ]
};

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create / Upsert Super Admin User
  const hashedPassword = await bcrypt.hash('Fingerclic2026!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: seedData.superAdmin.email },
    update: {
      fullName: seedData.superAdmin.fullName,
      phone: seedData.superAdmin.phone,
      bio: seedData.superAdmin.bio,
      emailVerified: seedData.superAdmin.emailVerified,
      language: seedData.superAdmin.language,
      timezone: seedData.superAdmin.timezone
    },
    create: {
      id: seedData.superAdmin.id,
      email: seedData.superAdmin.email,
      passwordHash: hashedPassword,
      fullName: seedData.superAdmin.fullName,
      phone: seedData.superAdmin.phone,
      bio: seedData.superAdmin.bio,
      emailVerified: seedData.superAdmin.emailVerified,
      language: seedData.superAdmin.language,
      timezone: seedData.superAdmin.timezone
    }
  });

  console.log(`✅ Super Admin created/updated: ${superAdmin.email}`);

  // Upsert Profile
  await prisma.profile.upsert({
    where: { userId: superAdmin.id },
    update: {
      address: seedData.superAdmin.address,
      city: seedData.superAdmin.city,
      country: seedData.superAdmin.country,
      company: seedData.superAdmin.company,
      jobTitle: seedData.superAdmin.jobTitle
    },
    create: {
      userId: superAdmin.id,
      address: seedData.superAdmin.address,
      city: seedData.superAdmin.city,
      country: seedData.superAdmin.country,
      company: seedData.superAdmin.company,
      jobTitle: seedData.superAdmin.jobTitle
    }
  });

  // Upsert User Preferences
  await prisma.userPreference.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
      theme: 'dark',
      marketingEmails: true,
      securityAlerts: true,
      twoFactorEnabled: false
    }
  });

  // Upsert Notification Preferences
  await prisma.notificationPreference.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
      emailNotify: true,
      smsNotify: false,
      pushNotify: true,
      loginAlerts: true,
      weeklyReport: false
    }
  });

  // 2. Create Roles & Permissions
  const rolesData = [
    { name: 'SUPER_ADMIN', type: RoleType.SUPER_ADMIN, description: 'Super Administrateur avec tous les privilèges' },
    { name: 'ADMIN', type: RoleType.ADMIN, description: 'Administrateur système' },
    { name: 'DEVELOPER', type: RoleType.DEVELOPER, description: 'Développeur d\'applications' },
    { name: 'USER', type: RoleType.USER, description: 'Utilisateur standard' },
    { name: 'MEMBER', type: RoleType.MEMBER, description: 'Membre d\'organisation' }
  ];

  const createdRoles: Record<string, string> = {};

  for (const roleDef of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        type: roleDef.type,
        description: roleDef.description
      },
      create: {
        name: roleDef.name,
        type: roleDef.type,
        description: roleDef.description
      }
    });
    createdRoles[roleDef.name] = role.id;
  }

  console.log('✅ Roles created/updated');

  const permissionsData = [
    { name: 'auth:login', category: 'auth', description: 'Autorisation de connexion' },
    { name: 'auth:register', category: 'auth', description: 'Autorisation d\'inscription' },
    { name: 'auth:logout', category: 'auth', description: 'Autorisation de déconnexion' },
    { name: 'auth:reset_password', category: 'auth', description: 'Réinitialisation de mot de passe' },
    { name: 'profile:read', category: 'profile', description: 'Lecture du profil' },
    { name: 'profile:write', category: 'profile', description: 'Modification du profil' },
    { name: 'sessions:read', category: 'sessions', description: 'Consultation des sessions actives' },
    { name: 'sessions:revoke', category: 'sessions', description: 'Révocation de sessions' },
    { name: 'apps:read', category: 'apps', description: 'Consultation du catalogue d\'applications' },
    { name: 'apps:access', category: 'apps', description: 'Accès aux applications de l\'écosystème' },
    { name: 'admin:users:manage', category: 'admin', description: 'Gestion complète des utilisateurs' },
    { name: 'admin:roles:manage', category: 'admin', description: 'Gestion des rôles et permissions' },
    { name: 'admin:apps:manage', category: 'admin', description: 'Gestion des applications' },
    { name: 'admin:system:metrics', category: 'admin', description: 'Accès aux métriques système' }
  ];

  for (const permDef of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: permDef.name },
      update: {
        category: permDef.category,
        description: permDef.description
      },
      create: {
        name: permDef.name,
        category: permDef.category,
        description: permDef.description
      }
    });

    // Link all permissions to SUPER_ADMIN role
    const superAdminRoleId = createdRoles['SUPER_ADMIN'];
    if (superAdminRoleId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRoleId,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: superAdminRoleId,
          permissionId: perm.id
        }
      });
    }
  }

  console.log('✅ Permissions created & linked to SUPER_ADMIN');

  // 3. Applications
  const createdAppIds: string[] = [];

  for (const appDef of seedData.apps) {
    const app = await prisma.application.upsert({
      where: { code: appDef.code as AppCode },
      update: {
        name: appDef.name,
        description: appDef.description,
        url: appDef.url,
        iconName: appDef.iconName,
        color: appDef.color,
        isSystem: appDef.isSystem
      },
      create: {
        id: appDef.id,
        code: appDef.code as AppCode,
        name: appDef.name,
        description: appDef.description,
        url: appDef.url,
        iconName: appDef.iconName,
        color: appDef.color,
        isSystem: appDef.isSystem
      }
    });
    createdAppIds.push(app.id);
  }

  console.log(`✅ ${createdAppIds.length} Applications created/updated`);

  // 4. Main Organization
  const mainOrg = await prisma.organization.upsert({
    where: { slug: 'fingerclic-technologies' },
    update: {
      name: 'Fingerclic Technologies',
      description: 'Organisation principale de l\'écosystème Fingerclic Identify'
    },
    create: {
      id: 'org_fingerclic_tech_001',
      name: 'Fingerclic Technologies',
      slug: 'fingerclic-technologies',
      description: 'Organisation principale de l\'écosystème Fingerclic Identify'
    }
  });

  console.log(`✅ Main Organization created/updated: ${mainOrg.name}`);

  // 5. Relations (UserRole, OrganizationMember, ApplicationAccess)

  // Link Super Admin UserRole
  const superAdminRoleId = createdRoles['SUPER_ADMIN'];
  if (superAdminRoleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdmin.id,
          roleId: superAdminRoleId
        }
      },
      update: {},
      create: {
        userId: superAdmin.id,
        roleId: superAdminRoleId
      }
    });
    console.log('✅ Linked Super Admin to SUPER_ADMIN role');
  }

  // Link Super Admin OrganizationMember
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: mainOrg.id,
        userId: superAdmin.id
      }
    },
    update: {
      role: RoleType.SUPER_ADMIN
    },
    create: {
      organizationId: mainOrg.id,
      userId: superAdmin.id,
      role: RoleType.SUPER_ADMIN
    }
  });
  console.log('✅ Linked Super Admin to Main Organization');

  // Link Super Admin ApplicationAccess for all apps
  for (const appId of createdAppIds) {
    await prisma.applicationAccess.upsert({
      where: {
        userId_applicationId: {
          userId: superAdmin.id,
          applicationId: appId
        }
      },
      update: {},
      create: {
        userId: superAdmin.id,
        applicationId: appId
      }
    });
  }
  console.log('✅ Granted Application Access to Super Admin for all apps');

  // 6. Seed / Upsert NEXUS OAuth Client
  await prisma.oAuthClient.upsert({
    where: { clientId: 'fingerclic-nexus' },
    update: {
      name: 'Fingerclic NEXUS',
      redirectUris: [
        'https://fingerclic.com/auth/callback',
        'https://nexus.fingerclic.com/auth/callback',
        'http://localhost:3000/auth/callback',
        'http://localhost:5173/auth/callback'
      ],
      appCode: 'NEXUS' as AppCode,
      isSystem: true
    },
    create: {
      id: 'client_nexus_001',
      clientId: 'fingerclic-nexus',
      clientSecret: 'fc_sec_nexus_live_7a8b9c0d1e2f3g4h5i6j7k8l9m0n',
      name: 'Fingerclic NEXUS',
      redirectUris: [
        'https://fingerclic.com/auth/callback',
        'https://nexus.fingerclic.com/auth/callback',
        'http://localhost:3000/auth/callback',
        'http://localhost:5173/auth/callback'
      ],
      appCode: 'NEXUS' as AppCode,
      isSystem: true
    }
  });
  console.log('✅ Seeded OAuthClient for Fingerclic NEXUS');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
