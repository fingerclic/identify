/**
 * Non-destructive reference data seed for a dedicated Identify PostgreSQL DB.
 * Deliberately creates NO users, passwords, OAuth secrets, sessions or grants.
 * Explicit opt-in required: IDENTIFY_SEED_REFERENCE_DATA=YES.
 */
import { PrismaClient, RoleType, AppCode } from '@prisma/client';

if (process.env.IDENTIFY_SEED_REFERENCE_DATA !== 'YES') {
  throw new Error('Reference seed disabled. Set IDENTIFY_SEED_REFERENCE_DATA=YES explicitly.');
}
if (!process.env.IDENTIFY_DATABASE_URL) {
  throw new Error('IDENTIFY_DATABASE_URL must point to the dedicated Identify database.');
}
if (process.env.DATABASE_URL && process.env.DATABASE_URL === process.env.IDENTIFY_DATABASE_URL) {
  throw new Error('Refusing to seed a database shared with DATABASE_URL.');
}

const prisma = new PrismaClient();
const roles = [
  { name: 'SUPER_ADMIN', type: RoleType.SUPER_ADMIN, description: 'Administration globale des identités' },
  { name: 'ADMIN', type: RoleType.ADMIN, description: 'Administration déléguée' },
  { name: 'DEVELOPER', type: RoleType.DEVELOPER, description: 'Intégration et développement' },
  { name: 'USER', type: RoleType.USER, description: 'Utilisateur standard' },
  { name: 'MEMBER', type: RoleType.MEMBER, description: 'Membre d’une organisation' }
];

const permissions = [
  ['auth:manage', 'auth', 'Gérer les comptes et l’authentification'],
  ['profile:read', 'profile', 'Consulter son profil'],
  ['profile:write', 'profile', 'Modifier son profil'],
  ['sessions:read', 'sessions', 'Consulter ses sessions'],
  ['sessions:revoke', 'sessions', 'Révoquer ses sessions'],
  ['apps:read', 'apps', 'Consulter les applications'],
  ['apps:manage', 'apps', 'Administrer les habilitations applicatives'],
  ['org:manage', 'organisation', 'Administrer les organisations'],
  ['security:audit', 'security', 'Consulter les événements de sécurité']
] as const;

const apps: Array<{
  code: AppCode; name: string; description: string; url: string; iconName: string; color: string;
}> = [
  { code: AppCode.NEXUS, name: 'Nexus', description: 'Portail officiel Fingerclic', url: 'https://fingerclic.com', iconName: 'Globe', color: '#A11C27' },
  { code: AppCode.MYSTUDIO, name: 'My Studio', description: 'Projets et espace client', url: 'https://mystudio.fingerclic.com', iconName: 'Layers', color: '#56657A' },
  { code: AppCode.CORE, name: 'Core', description: 'Services métier et ERP', url: 'https://core.fingerclic.com', iconName: 'Database', color: '#34495E' },
  { code: AppCode.WORKSPACE, name: 'Workspace', description: 'Hub des applications et organisations', url: 'https://app.fingerclic.com', iconName: 'LayoutGrid', color: '#6366F1' },
  { code: AppCode.FIP, name: 'FIP', description: 'Intelligence, données et analyse', url: 'https://fip.fingerclic.com', iconName: 'Brain', color: '#7858A6' },
  { code: AppCode.FINT, name: 'FINT', description: 'Bus d’intégration et événements', url: 'https://fint.fingerclic.com', iconName: 'Network', color: '#356F78' },
  { code: AppCode.CMS, name: 'CMS', description: 'Contenu, médias et thèmes', url: 'https://cms.fingerclic.com', iconName: 'PanelsTopLeft', color: '#6A6854' },
  { code: AppCode.ADMIN, name: 'Admin', description: 'Console d’administration', url: 'https://admin.fingerclic.com', iconName: 'Shield', color: '#4E5969' },
  { code: AppCode.MARKETPLACE, name: 'Marketplace', description: 'Produits et services', url: 'https://marketplace.fingerclic.com', iconName: 'ShoppingBag', color: '#3B82F6' },
  { code: AppCode.CREATOR, name: 'Creator', description: 'Création de sites et boutiques', url: 'https://creator.fingerclic.com', iconName: 'PenTool', color: '#8B5CF6' },
  { code: AppCode.HABITAT, name: 'Habitat', description: 'Services immobiliers', url: 'https://habitat.fingerclic.com', iconName: 'Home', color: '#10B981' }
];

async function main() {
  await prisma.$transaction(async (tx) => {
    for (const role of roles) {
      await tx.role.upsert({
        where: { name: role.name },
        create: role,
        update: { type: role.type, description: role.description }
      });
    }

    const superAdmin = await tx.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
    for (const [name, category, description] of permissions) {
      const permission = await tx.permission.upsert({
        where: { name },
        create: { name, category, description },
        update: { category, description }
      });
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: permission.id } },
        create: { roleId: superAdmin.id, permissionId: permission.id },
        update: {}
      });
    }

    for (const app of apps) {
      await tx.application.upsert({
        where: { code: app.code },
        create: { ...app, isSystem: true },
        update: { name: app.name, description: app.description, url: app.url, iconName: app.iconName, color: app.color }
      });
    }
  });
  console.log('Identify reference data initialized: roles, permissions, app registry. No users or secrets were created.');
}

main()
  .catch((error) => {
    console.error('Identify reference data seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
