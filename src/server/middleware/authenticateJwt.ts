import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted, JwtPayload } from '../auth/jwt';
import { prisma } from '../prisma';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
  dbUser?: any;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const raw = authHeader.split(' ')[1]?.trim();
    if (raw && raw !== 'undefined' && raw !== 'null') {
      return raw;
    }
  }

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith('fingerclic_session=')) {
        return trimmed.substring('fingerclic_session='.length);
      }
      if (trimmed.startsWith('fingerclic_access_token=')) {
        return trimmed.substring('fingerclic_access_token='.length);
      }
    }
  }

  if (req.query && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}

/**
 * Enterprise Authenticate JWT Middleware
 * Validates JWT Access Tokens, checks PostgreSQL blacklist and verifies active user status via Prisma.
 */
export async function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token d\'accès manquant ou format invalide' });
    }

    // Check PostgreSQL JWT Blacklist
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token révoqué ou mis en liste noire' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Verify user in database via Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        },
        organizationMembers: {
          include: { organization: true }
        },
        applicationAccesses: {
          include: { application: true }
        }
      }
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'Utilisateur associé introuvable ou compte désactivé' });
    }

    req.user = decoded;
    req.token = token;
    req.dbUser = dbUser;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Erreur lors de la vérification de l\'authentification' });
  }
}
