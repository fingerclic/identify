import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('API Error:', err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: err.issues[0]?.message || 'Validation error',
      details: err.issues
    });
  }
  return res.status(500).json({
    error: err.message || 'Erreur interne du serveur'
  });
}
