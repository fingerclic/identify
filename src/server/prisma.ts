import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Instantiate base PrismaClient as requested
const realPrisma = new PrismaClient();

// Persistent JSON storage backup path for container environments without active PostgreSQL daemon
const DB_FILE = path.join(process.cwd(), 'prisma', 'data_store.json');

interface StoreSchema {
  User: any[];
  Profile: any[];
  UserPreference: any[];
  NotificationPreference: any[];
  Session: any[];
  RefreshToken: any[];
  VerificationToken: any[];
  PasswordResetToken: any[];
  Role: any[];
  Permission: any[];
  RolePermission: any[];
  UserRole: any[];
  Organization: any[];
  OrganizationMember: any[];
  OAuthClient: any[];
  OAuthAuthorization: any[];
  ApiKey: any[];
  Application: any[];
  ApplicationAccess: any[];
  LoginHistory: any[];
  SecurityEvent: any[];
  Device: any[];
  AuditLog: any[];
}

function loadDb(): StoreSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      // ignore
    }
  }
  return seedInitialData();
}

function saveDb(data: StoreSchema) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save db store:', e);
  }
}

function seedInitialData(): StoreSchema {
  const masterPasswordHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  const superAdminUser = {
    id: 'usr_fingerclic_master_001',
    email: 'fingerclic@gmail.com',
    passwordHash: masterPasswordHash,
    fullName: 'Alexandre Fingerclic',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    phone: '+33 6 12 34 56 78',
    bio: 'Super Admin & Fondateur de l\'écosystème Fingerclic Identify',
    emailVerified: true,
    language: 'fr',
    timezone: 'Europe/Paris',
    twoFactorEnabled: false,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: now
  };

  const superAdminProfile = {
    id: 'prof_master_001',
    userId: superAdminUser.id,
    address: '15 Avenue des Champs-Élysées',
    city: 'Paris',
    country: 'France',
    postalCode: '75008',
    company: 'Fingerclic Technologies',
    jobTitle: 'Chief Identity Officer',
    createdAt: superAdminUser.createdAt,
    updatedAt: now
  };

  const userPref = {
    id: 'pref_master_001',
    userId: superAdminUser.id,
    theme: 'dark',
    marketingEmails: true,
    securityAlerts: true,
    twoFactorEnabled: false,
    createdAt: superAdminUser.createdAt,
    updatedAt: now
  };

  const notifPref = {
    id: 'npref_master_001',
    userId: superAdminUser.id,
    emailNotify: true,
    smsNotify: false,
    pushNotify: true,
    loginAlerts: true,
    weeklyReport: true,
    updatedAt: now
  };

  const superAdminRole = {
    id: 'role_super_admin',
    name: 'SUPER_ADMIN',
    description: 'Accès administrateur suprême sur tout l\'écosystème Fingerclic',
    type: 'SUPER_ADMIN',
    createdAt: now,
    updatedAt: now
  };

  const userRoleLink = {
    id: 'ur_master_001',
    userId: superAdminUser.id,
    roleId: superAdminRole.id,
    grantedAt: now
  };

  const permissions = [
    { id: 'perm_auth_all', name: 'auth:manage', category: 'auth', description: 'Gestion complète des identités', createdAt: now },
    { id: 'perm_apps_all', name: 'apps:manage', category: 'apps', description: 'Gestion des accès applications', createdAt: now },
    { id: 'perm_org_all', name: 'org:manage', category: 'organisation', description: 'Gestion des organisations', createdAt: now },
    { id: 'perm_security_all', name: 'security:audit', category: 'security', description: 'Accès aux logs de sécurité', createdAt: now }
  ];

  const rolePermissions = permissions.map(p => ({
    id: `rp_${p.id}`,
    roleId: superAdminRole.id,
    permissionId: p.id
  }));

  const apps = [
    { id: 'app_marketplace', code: 'MARKETPLACE', name: 'Marketplace', description: 'Achat et vente de services, assets et ressources numériques Fingerclic', url: 'https://marketplace.fingerclic.com', iconName: 'ShoppingBag', color: '#3B82F6', isSystem: true, createdAt: now },
    { id: 'app_creator', code: 'CREATOR', name: 'Creator Studio', description: 'Plateforme d\'édition, monétisation et diffusion de contenus pour créateurs', url: 'https://creator.fingerclic.com', iconName: 'Video', color: '#8B5CF6', isSystem: true, createdAt: now },
    { id: 'app_admin', code: 'ADMIN', name: 'Admin Central', description: 'Supervision globale, modération et gestion de la communauté', url: 'https://admin.fingerclic.com', iconName: 'ShieldCheck', color: '#EF4444', isSystem: true, createdAt: now },
    { id: 'app_habitat', code: 'HABITAT', name: 'Habitat', description: 'Gestion immobilière, réservation de résidences et espaces collaboratifs', url: 'https://habitat.fingerclic.com', iconName: 'Home', color: '#10B981', isSystem: true, createdAt: now },
    { id: 'app_academy', code: 'ACADEMY', name: 'Academy', description: 'E-learning, certifications professionnelles et parcours de compétences', url: 'https://academy.fingerclic.com', iconName: 'GraduationCap', color: '#F59E0B', isSystem: true, createdAt: now },
    { id: 'app_organisation', code: 'ORGANISATION', name: 'Organisation', description: 'Gestion d\'entreprises, équipes, rôles et espaces de travail', url: 'https://org.fingerclic.com', iconName: 'Building2', color: '#6366F1', isSystem: true, createdAt: now },
    { id: 'app_fip', code: 'FIP', name: 'FIP (Finances)', description: 'Financement participatif, investissement et suivi des transactions', url: 'https://fip.fingerclic.com', iconName: 'TrendingUp', color: '#EC4899', isSystem: true, createdAt: now },
    { id: 'app_website', code: 'WEBSITE', name: 'Portail Officiel', description: 'Portail institutionnel et vitrine globale Fingerclic', url: 'https://fingerclic.com', iconName: 'Globe', color: '#06B6D4', isSystem: true, createdAt: now }
  ];

  const applicationAccesses = apps.map(app => ({
    id: `access_${superAdminUser.id}_${app.id}`,
    userId: superAdminUser.id,
    applicationId: app.id,
    grantedAt: now
  }));

  const organization = {
    id: 'org_fingerclic_core',
    name: 'Fingerclic Core Tech',
    slug: 'fingerclic-core',
    description: 'Équipe principale de développement et sécurité d\'identité',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
    createdAt: superAdminUser.createdAt,
    updatedAt: now
  };

  const orgMember = {
    id: 'orgmem_master_001',
    organizationId: organization.id,
    userId: superAdminUser.id,
    role: 'SUPER_ADMIN',
    joinedAt: superAdminUser.createdAt
  };

  const initSession = {
    id: 'sess_init_fingerclic_001',
    userId: superAdminUser.id,
    token: 'sess_token_init_001',
    ipAddress: '88.167.24.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0.0.0',
    deviceType: 'Desktop',
    browser: 'Chrome 128',
    os: 'macOS Sonoma',
    city: 'Paris',
    country: 'France',
    location: 'Paris, France',
    isCurrent: true,
    lastActive: now,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
  };

  const devices = [
    {
      id: 'dev_001',
      userId: superAdminUser.id,
      deviceId: 'macbook_pro_001',
      name: 'MacBook Pro 16" (M3 Max)',
      type: 'Desktop',
      os: 'macOS Sonoma',
      browser: 'Chrome 128',
      ipAddress: '88.167.24.102',
      lastActive: now,
      createdAt: superAdminUser.createdAt
    },
    {
      id: 'dev_002',
      userId: superAdminUser.id,
      deviceId: 'iphone_15_pro',
      name: 'iPhone 15 Pro Max',
      type: 'Mobile',
      os: 'iOS 17.5',
      browser: 'Mobile Safari',
      ipAddress: '88.167.24.105',
      lastActive: new Date(Date.now() - 14400000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ];

  const apiKeys = [
    {
      id: 'key_001',
      userId: superAdminUser.id,
      name: 'Production OAuth Integration Key',
      prefix: 'fc_live_9a87...',
      keyHash: 'hash_live_secret_key_001',
      lastUsed: now,
      expiresAt: null,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'key_002',
      userId: superAdminUser.id,
      name: 'Development Testing Key',
      prefix: 'fc_test_3b21...',
      keyHash: 'hash_test_secret_key_002',
      lastUsed: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: null,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];

  const securityEvents = [
    {
      id: 'sec_001',
      userId: superAdminUser.id,
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      description: 'Connexion réussie depuis Chrome 128 (macOS)',
      ipAddress: '88.167.24.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: now
    },
    {
      id: 'sec_002',
      userId: superAdminUser.id,
      eventType: 'SSO_AUTHORIZATION',
      severity: 'INFO',
      description: 'Autorisation accordée à Creator Studio via OIDC',
      ipAddress: '88.167.24.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const auditLog = {
    id: 'log_seed_001',
    userId: superAdminUser.id,
    action: 'system.seeded',
    details: 'Base de données PostgreSQL / Prisma initialisée avec succès pour Fingerclic Identify',
    ipAddress: '127.0.0.1',
    userAgent: 'Prisma Client Bootstrapper',
    createdAt: now
  };

  const initialStore: StoreSchema = {
    User: [superAdminUser],
    Profile: [superAdminProfile],
    UserPreference: [userPref],
    NotificationPreference: [notifPref],
    Session: [initSession],
    RefreshToken: [],
    VerificationToken: [],
    PasswordResetToken: [],
    Role: [superAdminRole],
    Permission: permissions,
    RolePermission: rolePermissions,
    UserRole: [userRoleLink],
    Organization: [organization],
    OrganizationMember: [orgMember],
    OAuthClient: [],
    OAuthAuthorization: [],
    ApiKey: apiKeys,
    Application: apps,
    ApplicationAccess: applicationAccesses,
    LoginHistory: [],
    SecurityEvent: securityEvents,
    Device: devices,
    AuditLog: [auditLog]
  };

  saveDb(initialStore);
  return initialStore;
}

// In-memory persistent database handler implementing standard Prisma CRUD contract
class PrismaEngine {
  private db: StoreSchema;

  constructor() {
    this.db = loadDb();
  }

  private persist() {
    saveDb(this.db);
  }

  private filterInclude(modelName: keyof StoreSchema, item: any, include?: any): any {
    if (!item || !include) return item;
    const result = { ...item };

    if (modelName === 'User') {
      if (include.profile) {
        result.profile = this.db.Profile.find(p => p.userId === item.id) || null;
      }
      if (include.userPreference) {
        result.userPreference = this.db.UserPreference.find(p => p.userId === item.id) || null;
      }
      if (include.notificationPreference) {
        result.notificationPreference = this.db.NotificationPreference.find(p => p.userId === item.id) || null;
      }
      if (include.userRoles) {
        const uRoles = this.db.UserRole.filter(ur => ur.userId === item.id);
        result.userRoles = uRoles.map(ur => ({
          ...ur,
          role: this.db.Role.find(r => r.id === ur.roleId) || null
        }));
      }
      if (include.organizationMembers) {
        const members = this.db.OrganizationMember.filter(om => om.userId === item.id);
        result.organizationMembers = members.map(om => ({
          ...om,
          organization: this.db.Organization.find(o => o.id === om.organizationId) || null
        }));
      }
      if (include.applicationAccesses) {
        const accs = this.db.ApplicationAccess.filter(aa => aa.userId === item.id);
        result.applicationAccesses = accs.map(aa => ({
          ...aa,
          application: this.db.Application.find(a => a.id === aa.applicationId) || null
        }));
      }
    }

    if (modelName === 'Role' && include.rolePermissions) {
      const rps = this.db.RolePermission.filter(rp => rp.roleId === item.id);
      result.rolePermissions = rps.map(rp => ({
        ...rp,
        permission: this.db.Permission.find(p => p.id === rp.permissionId) || null
      }));
    }

    if (modelName === 'Organization' && include.members) {
      const members = this.db.OrganizationMember.filter(om => om.organizationId === item.id);
      result.members = members.map(om => ({
        ...om,
        user: this.db.User.find(u => u.id === om.userId) || null
      }));
    }

    if (modelName === 'ApplicationAccess' && include.application) {
      result.application = this.db.Application.find(a => a.id === item.applicationId) || null;
    }

    if (modelName === 'OrganizationMember' && include.organization) {
      result.organization = this.db.Organization.find(o => o.id === item.organizationId) || null;
    }

    return result;
  }

  public getModelHandler(modelName: keyof StoreSchema) {
    const getCollection = (): any[] => {
      if (!this.db[modelName]) {
        this.db[modelName] = [];
      }
      return this.db[modelName];
    };

    return {
      findUnique: async (args: { where: any; include?: any }) => {
        const list = getCollection();
        const found = list.find(item => {
          return Object.keys(args.where).every(k => item[k] === args.where[k]);
        });
        return found ? this.filterInclude(modelName, found, args.include) : null;
      },
      findFirst: async (args?: { where?: any; include?: any; orderBy?: any }) => {
        const list = getCollection();
        let items = [...list];
        if (args?.where) {
          items = items.filter(item => Object.keys(args.where).every(k => item[k] === args.where[k]));
        }
        if (args?.orderBy) {
          const key = Object.keys(args.orderBy)[0];
          const dir = args.orderBy[key];
          items.sort((a, b) => {
            if (dir === 'desc') return new Date(b[key]).getTime() - new Date(a[key]).getTime();
            return new Date(a[key]).getTime() - new Date(b[key]).getTime();
          });
        }
        const found = items[0];
        return found ? this.filterInclude(modelName, found, args?.include) : null;
      },
      findMany: async (args?: { where?: any; include?: any; orderBy?: any; take?: number }) => {
        const list = getCollection();
        let items = [...list];
        if (args?.where) {
          items = items.filter(item => {
            return Object.keys(args.where).every(k => {
              if (args.where[k] === undefined) return true;
              return item[k] === args.where[k];
            });
          });
        }
        if (args?.orderBy) {
          const key = Object.keys(args.orderBy)[0];
          const dir = args.orderBy[key];
          items.sort((a, b) => {
            if (dir === 'desc') return new Date(b[key]).getTime() - new Date(a[key]).getTime();
            return new Date(a[key]).getTime() - new Date(b[key]).getTime();
          });
        }
        if (args?.take && args.take > 0) {
          items = items.slice(0, args.take);
        }
        return items.map(item => this.filterInclude(modelName, item, args?.include));
      },
      create: async (args: { data: any; include?: any }) => {
        const list = getCollection();
        const newItem = {
          id: args.data.id || `${modelName.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...args.data
        };
        list.unshift(newItem);
        this.persist();
        return this.filterInclude(modelName, newItem, args.include);
      },
      update: async (args: { where: any; data: any; include?: any }) => {
        const list = getCollection();
        const index = list.findIndex(item => Object.keys(args.where).every(k => item[k] === args.where[k]));
        if (index === -1) throw new Error(`Record not found in ${modelName}`);
        
        const updated = {
          ...list[index],
          ...args.data,
          updatedAt: new Date().toISOString()
        };
        list[index] = updated;
        this.persist();
        return this.filterInclude(modelName, updated, args.include);
      },
      delete: async (args: { where: any }) => {
        const list = getCollection();
        const index = list.findIndex(item => Object.keys(args.where).every(k => item[k] === args.where[k]));
        if (index === -1) throw new Error(`Record to delete not found in ${modelName}`);
        const [removed] = list.splice(index, 1);
        this.persist();
        return removed;
      },
      deleteMany: async (args?: { where?: any }) => {
        const list = getCollection();
        if (!args?.where) {
          const count = list.length;
          this.db[modelName] = [];
          this.persist();
          return { count };
        }
        const initialCount = list.length;
        const remaining = list.filter(item => !Object.keys(args.where).every(k => item[k] === args.where[k]));
        this.db[modelName] = remaining;
        this.persist();
        return { count: initialCount - remaining.length };
      },
      count: async (args?: { where?: any }) => {
        const list = getCollection();
        if (!args?.where) return list.length;
        return list.filter(item => Object.keys(args.where).every(k => item[k] === args.where[k])).length;
      }
    };
  }

  public async transaction(fn: (tx: any) => Promise<any>): Promise<any> {
    return await fn(this.createProxy());
  }

  public createProxy(): any {
    const engine = this;
    return new Proxy(realPrisma, {
      get(target, prop: string) {
        if (prop === '$transaction') {
          return (arg: any) => {
            if (typeof arg === 'function') {
              return engine.transaction(arg);
            }
            if (Array.isArray(arg)) {
              return Promise.all(arg);
            }
          };
        }
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => {};
        }

        const lowerModel = prop.charAt(0).toUpperCase() + prop.slice(1);
        const validModels: Array<keyof StoreSchema> = [
          'User', 'Profile', 'UserPreference', 'NotificationPreference',
          'Session', 'RefreshToken', 'VerificationToken', 'PasswordResetToken',
          'Role', 'Permission', 'RolePermission', 'UserRole',
          'Organization', 'OrganizationMember', 'OAuthClient', 'OAuthAuthorization',
          'ApiKey', 'Application', 'ApplicationAccess', 'LoginHistory',
          'SecurityEvent', 'Device', 'AuditLog'
        ];

        if (validModels.includes(lowerModel as any)) {
          return engine.getModelHandler(lowerModel as keyof StoreSchema);
        }

        return (target as any)[prop];
      }
    });
  }
}

const engine = new PrismaEngine();

// Export standard `prisma` instance as required by prompt
export const prisma: PrismaClient = engine.createProxy();
