import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { SessionService } from '../services/session.service';
import { ApplicationService } from '../services/application.service';
import { OrganizationService } from '../services/organization.service';
import { SecurityService } from '../services/security.service';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth.middleware';

export const userRouter = Router();

const userService = new UserService();
const sessionService = new SessionService();
const appService = new ApplicationService();
const orgService = new OrganizationService();
const securityService = new SecurityService();

const EditProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().or(z.string().length(0)).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    marketingEmails: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional()
  }).optional()
});

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Fingerclic Client';
  return { ipAddress, userAgent };
}

// GET /api/me
userRouter.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.getUserProfile(userId);
    const sessions = await sessionService.getUserSessions(userId, req.user!.sessionId);
    const authorizedApps = await appService.getAppsForUser(userId);
    const organizations = await orgService.getUserOrganizations(userId);

    return res.json({
      user,
      currentSessionId: req.user!.sessionId,
      sessions,
      authorizedApps,
      organizations
    });
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Utilisateur introuvable' });
  }
});

// PATCH /api/me
userRouter.patch('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const updates = EditProfileSchema.parse(req.body);
    const meta = getClientMeta(req);

    const updatedUser = await userService.updateProfile(userId, updates, meta.ipAddress, meta.userAgent);

    return res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// GET /api/sessions
userRouter.get('/sessions', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const sessions = await sessionService.getUserSessions(userId, req.user!.sessionId);
    return res.json({ sessions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur de récupération des sessions' });
  }
});

// DELETE /api/sessions/:id
userRouter.delete('/sessions/:id', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.params.id;
    const meta = getClientMeta(req);

    if (sessionId === req.user!.sessionId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas révoquer la session actuelle via cette action. Utilisez Déconnexion.' });
    }

    await sessionService.revokeSession(sessionId, userId, meta.ipAddress, meta.userAgent);
    return res.json({ message: 'Session révoquée avec succès' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur lors de la révocation de la session' });
  }
});

// DELETE /api/sessions (Revoke All Other Sessions)
userRouter.delete('/sessions', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const currentSessionId = req.user!.sessionId;
    const meta = getClientMeta(req);

    const count = await sessionService.revokeAllOtherSessions(userId, currentSessionId, meta.ipAddress, meta.userAgent);
    return res.json({
      message: `${count} autre(s) appareil(s) déconnecté(s) avec succès.`,
      revokedCount: count
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la déconnexion globale' });
  }
});

// GET /api/devices
userRouter.get('/devices', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const devices = await securityService.getDevices(userId);
    return res.json({ devices });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des appareils' });
  }
});
