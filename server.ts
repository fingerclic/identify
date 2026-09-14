import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import { securityHeaders, globalRateLimiter } from './src/server/middleware/security.middleware';
import { authRouter } from './src/server/routes/auth.routes';
import { oauthRouter } from './src/server/routes/oauth.routes';
import { userRouter } from './src/server/routes/user.routes';
import { securityRouter } from './src/server/routes/security.routes';
import { applicationsRouter } from './src/server/routes/applications.routes';
import { organizationsRouter } from './src/server/routes/organizations.routes';
import { apiKeyRouter } from './src/server/routes/apikey.routes';
import { metricsRouter } from './src/server/routes/metrics.routes';

const app = express();
const PORT = 3000;

// Security & Standard Middlewares
app.use(securityHeaders);
app.use(globalRateLimiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount OIDC & OAuth Standard Protocol Routes
app.use('/', oauthRouter);

// Mount Modular Enterprise REST API Routers
app.use('/api', authRouter);
app.use('/api', oauthRouter);
app.use('/api', userRouter);
app.use('/api', securityRouter);
app.use('/api', applicationsRouter);
app.use('/api', organizationsRouter);
app.use('/api', apiKeyRouter);
app.use('/api', metricsRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Une erreur interne du serveur s\'est produite',
    timestamp: new Date().toISOString()
  });
});

// Vite Middleware & Static Production Handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/oauth') || req.originalUrl.startsWith('/.well-known')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Fingerclic Identify Enterprise IdP running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
