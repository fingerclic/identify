import { Router, Request, Response } from 'express';
import { ApplicationService } from '../services/application.service';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authenticateJwt';
import { requireApplicationAccess } from '../middleware/requirePermission';

export const applicationsRouter = Router();
const appService = new ApplicationService();

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Fingerclic Client';
  return { ipAddress, userAgent };
}

// GET /api/apps
applicationsRouter.get('/apps', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const apps = await appService.getAppsForUser(userId);
    return res.json({ apps });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des applications' });
  }
});

// POST /api/apps/:code/access
applicationsRouter.post('/apps/:code/access', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const code = req.params.code;
    const meta = getClientMeta(req);

    const access = await appService.grantAccess(userId, code, meta.ipAddress, meta.userAgent);
    return res.status(201).json({
      message: `Accès accordé à l'application ${code}`,
      access
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur d\'attribution d\'accès' });
  }
});

// DELETE /api/apps/:code/access
applicationsRouter.delete('/apps/:code/access', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const code = req.params.code;
    const meta = getClientMeta(req);

    await appService.revokeAccess(userId, code, meta.ipAddress, meta.userAgent);
    return res.json({ message: `Accès révoqué pour l'application ${code}` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur de révocation d\'accès' });
  }
});

// GET /api/apps/:code/verify
applicationsRouter.get('/apps/:code/verify', authenticateJwt, requireApplicationAccess(), async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ verified: true, code: req.params.code });
});

