import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticateJwt';
import { prisma } from '../prisma';

/**
 * Enterprise Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses at least one of the specified roles using Prisma.
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    let userRoles: string[] = [];

    if (req.dbUser && req.dbUser.userRoles) {
      userRoles = req.dbUser.userRoles.map((ur: any) => ur.role.name);
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { userRoles: { include: { role: true } } }
      });

      if (!dbUser) {
        return res.status(401).json({ error: 'Utilisateur introuvable' });
      }

      userRoles = dbUser.userRoles.map((ur: any) => ur.role.name);
    }

    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const hasRole = isSuperAdmin || allowedRoles.some(r => userRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Accès interdit : Rôle insuffisant',
        requiredRoles: allowedRoles,
        assignedRoles: userRoles
      });
    }

    next();
  };
}
