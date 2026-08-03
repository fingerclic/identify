import { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  maxHits: number;
  message?: string;
}

interface RateLimitRecord {
  count: number;
  firstHit: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.firstHit > 600000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Creates an in-memory sliding window Rate Limiter middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record) {
      rateLimitStore.set(key, { count: 1, firstHit: now });
      return next();
    }

    if (now - record.firstHit > options.windowMs) {
      rateLimitStore.set(key, { count: 1, firstHit: now });
      return next();
    }

    record.count++;

    if (record.count > options.maxHits) {
      return res.status(429).json({
        error: options.message || 'Trop de requêtes effectuées. Veuillez réessayer ultérieurement.',
        retryAfterSeconds: Math.ceil((record.firstHit + options.windowMs - now) / 1000)
      });
    }

    next();
  };
}

/**
 * Global API Rate Limiter (200 requests / minute per IP)
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxHits: 200,
  message: 'Limite de requêtes globales atteinte (200 req/min).'
});

/**
 * Auth Specific Rate Limiter for Login/Register/Password Reset (15 requests / 15 minutes per IP)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxHits: 15,
  message: 'Trop de tentatives d\'authentification. Par mesure de sécurité, veuillez attendre 15 minutes.'
});
