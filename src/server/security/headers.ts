import { Request, Response, NextFunction } from 'express';

/**
 * Helmet-equivalent Enterprise Security Headers Middleware
 * Configures HTTP Response Headers for protection against XSS, Clickjacking, MIME-sniffing, etc.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from MIME-sniffing the response away from declared Content-Type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Protect against clickjacking by restricting framing
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable legacy XSS Auditor in modern browser modes
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS HSTS for 1 year with subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Control referrer information sent in HTTP requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Robust Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' ws: wss: https:;"
  );

  next();
}
