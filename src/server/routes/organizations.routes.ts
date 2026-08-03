import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OrganizationService } from '../services/organization.service';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authenticateJwt';
import { requireOrganizationMember } from '../middleware/requirePermission';

export const organizationsRouter = Router();
const orgService = new OrganizationService();

const CreateOrgSchema = z.object({
  name: z.string().min(2, 'Le nom de l\'organisation doit contenir au moins 2 caractères'),
  slug: z.string().min(2, 'Le slug de l\'organisation doit contenir au moins 2 caractères'),
  description: z.string().optional()
});

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Fingerclic Client';
  return { ipAddress, userAgent };
}

// GET /api/organizations
organizationsRouter.get('/organizations', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const organizations = await orgService.getUserOrganizations(userId);
    return res.json({ organizations });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des organisations' });
  }
});

// GET /api/organizations/:id/verify
organizationsRouter.get('/organizations/:id/verify', authenticateJwt, requireOrganizationMember(), async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ verified: true, organizationId: req.params.id });
});

// POST /api/organizations
organizationsRouter.post('/organizations', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = CreateOrgSchema.parse(req.body);
    const meta = getClientMeta(req);

    const organization = await orgService.createOrganization(
      userId,
      body.name,
      body.slug,
      body.description,
      meta.ipAddress,
      meta.userAgent
    );

    return res.status(201).json({
      message: 'Organisation créée avec succès',
      organization
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(400).json({ error: err.message || 'Erreur lors de la création de l\'organisation' });
  }
});

