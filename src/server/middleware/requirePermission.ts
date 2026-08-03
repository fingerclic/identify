import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticateJwt';
import { prisma } from '../prisma';

/**
 * Enterprise Permission-Based Access Control Middleware
 * Verifies user permissions via Prisma tables (Role, Permission, RolePermission, UserRole).
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    let userRoles: any[] = [];
    if (req.dbUser && req.dbUser.userRoles) {
      userRoles = req.dbUser.userRoles;
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!dbUser) {
        return res.status(401).json({ error: 'Utilisateur introuvable' });
      }

      userRoles = dbUser.userRoles;
    }

    // SUPER_ADMIN has full permissions
    const isSuperAdmin = userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      return next();
    }

    // Collect permissions across all assigned roles
    const userPermissions = new Set<string>();
    for (const ur of userRoles) {
      if (ur.role && ur.role.rolePermissions) {
        for (const rp of ur.role.rolePermissions) {
          if (rp.permission) {
            userPermissions.add(rp.permission.name);
          }
        }
      }
    }

    const hasAll = requiredPermissions.every(perm => userPermissions.has(perm));

    if (!hasAll) {
      return res.status(403).json({
        error: 'Accès interdit : Permission manquante',
        requiredPermissions,
        userPermissions: Array.from(userPermissions)
      });
    }

    next();
  };
}

/**
 * Organization Membership & Role Verification Middleware
 * Verifies user membership and optionally specific role inside an organization via OrganizationMember.
 */
export function requireOrganizationMember(requiredRoleInOrg?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const orgId = req.params.orgId || req.params.id || req.body.organizationId || (req.query.organizationId as string);
    if (!orgId) {
      return res.status(400).json({ error: 'Identifiant d\'organisation manquant' });
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.userId,
        OR: [
          { organizationId: orgId },
          { organization: { slug: orgId } }
        ]
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Accès interdit : Vous ne faites pas partie de cette organisation' });
    }

    if (requiredRoleInOrg && member.role !== requiredRoleInOrg && member.role !== 'SUPER_ADMIN' && member.role !== 'ADMIN') {
      return res.status(403).json({
        error: `Accès interdit : Rôle ${requiredRoleInOrg} requis au sein de l'organisation`,
        userOrgRole: member.role
      });
    }

    next();
  };
}

/**
 * Application Access Control Middleware
 * Verifies that the user has explicit access to an ecosystem application via ApplicationAccess table.
 */
export function requireApplicationAccess(appCode?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const targetAppCode = appCode || req.params.code || req.body.appCode;
    if (!targetAppCode) {
      return res.status(400).json({ error: 'Code d\'application manquant' });
    }

    // Check if user is SUPER_ADMIN
    const isSuperAdmin = req.dbUser?.userRoles?.some((ur: any) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      return next();
    }

    const access = await prisma.applicationAccess.findFirst({
      where: {
        userId: req.user.userId,
        application: {
          code: targetAppCode as any
        }
      }
    });

    if (!access) {
      return res.status(403).json({
        error: `Accès interdit : Vous ne possédez pas d'habilitation pour l'application ${targetAppCode}`
      });
    }

    next();
  };
}
