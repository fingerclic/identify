import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ApiKeyService } from '../services/apikey.service';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth.middleware';

export const apiKeyRouter = Router();
const apiKeyService = new ApiKeyService();

const CreateApiKeySchema = z.object({
  name: z.string().min(2, 'Le nom de la clé API doit contenir au moins 2 caractères'),
  expiresInDays: z.number().optional()
});

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Fingerclic Client';
  return { ipAddress, userAgent };
}

// GET /api/apikeys
apiKeyRouter.get('/apikeys', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const apiKeys = await apiKeyService.getUserApiKeys(userId);
    return res.json({ apiKeys });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur de récupération des clés API' });
  }
});

// POST /api/apikeys
apiKeyRouter.post('/apikeys', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = CreateApiKeySchema.parse(req.body);
    const meta = getClientMeta(req);

    const result = await apiKeyService.createApiKey(
      userId,
      body.name,
      body.expiresInDays,
      meta.ipAddress,
      meta.userAgent
    );

    return res.status(201).json({
      message: 'Clé API générée avec succès. Conservez-la précieusement, elle ne sera plus affichée.',
      ...result
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    return res.status(500).json({ error: 'Erreur lors de la génération de la clé API' });
  }
});

// DELETE /api/apikeys/:id
apiKeyRouter.delete('/apikeys/:id', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const apiKeyId = req.params.id;
    const meta = getClientMeta(req);

    await apiKeyService.revokeApiKey(apiKeyId, userId, meta.ipAddress, meta.userAgent);
    return res.json({ message: 'Clé API révoquée avec succès' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur de révocation de la clé API' });
  }
});
