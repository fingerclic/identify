import { Router, Request, Response } from 'express';
import { SecurityService } from '../services/security.service';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const securityRouter = Router();
const securityService = new SecurityService();

// GET /api/security (Security Dashboard Overview)
securityRouter.get('/security', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = await securityService.getSecurityOverview(userId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des données de sécurité' });
  }
});

// GET /api/audit (User Audit Logs)
securityRouter.get('/audit', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const logs = await securityService.getAuditLogs(userId);
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du journal d\'audit' });
  }
});

// GET /api/audit-logs (Global Audit Logs for Admins)
securityRouter.get('/audit-logs', authenticateJwt, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await securityService.getAuditLogs();
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du journal d\'audit global' });
  }
});
