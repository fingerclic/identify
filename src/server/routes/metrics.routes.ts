import { Router, Request, Response } from 'express';
import os from 'os';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export const metricsRouter = Router();

const startTime = Date.now();
const API_VERSION = '2.0.0-enterprise';
const PRISMA_VERSION = Prisma.prismaVersion?.client || '5.22.0';

/**
 * Helper to calculate CPU usage percentage
 */
function getCpuMetrics() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuUsage = process.cpuUsage();

  return {
    cores: cpus.length,
    model: cpus[0]?.model || 'Standard CPU',
    loadAverage1m: Math.round(loadAvg[0] * 100) / 100,
    loadAverage5m: Math.round(loadAvg[1] * 100) / 100,
    loadAverage15m: Math.round(loadAvg[2] * 100) / 100,
    userTimeMs: Math.round(cpuUsage.user / 1000),
    systemTimeMs: Math.round(cpuUsage.system / 1000)
  };
}

/**
 * Helper to calculate Memory usage
 */
function getMemoryMetrics() {
  const mem = process.memoryUsage();
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;

  return {
    rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    externalMb: Math.round((mem.external / 1024 / 1024) * 100) / 100,
    systemTotalMb: Math.round((totalMemBytes / 1024 / 1024) * 100) / 100,
    systemUsedMb: Math.round((usedMemBytes / 1024 / 1024) * 100) / 100,
    systemFreeMb: Math.round((freeMemBytes / 1024 / 1024) * 100) / 100,
    systemMemoryUsagePercent: Math.round((usedMemBytes / totalMemBytes) * 10000) / 100
  };
}

// GET /api/health
metricsRouter.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'CONNECTED';
  let prismaStatus = 'HEALTHY';
  let latencyMs = 0;

  try {
    const startPing = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - startPing;
  } catch (err) {
    dbStatus = 'DISCONNECTED';
    prismaStatus = 'UNHEALTHY';
  }

  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const isHealthy = dbStatus === 'CONNECTED';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    apiVersion: API_VERSION,
    prismaVersion: PRISMA_VERSION,
    databaseStatus: dbStatus,
    prismaStatus: prismaStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    latencyMs
  });
});

// GET /api/metrics (Enterprise System & PostgreSQL Database Metrics)
metricsRouter.get('/metrics', async (_req: Request, res: Response) => {
  try {
    let dbStatus = 'CONNECTED';
    let prismaStatus = 'HEALTHY';
    let dbLatencyMs = 0;

    try {
      const startPing = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startPing;
    } catch (e) {
      dbStatus = 'DISCONNECTED';
      prismaStatus = 'UNHEALTHY';
    }

    // Query statistics directly from PostgreSQL via Prisma
    const [
      activeSessionsCount,
      totalUsersCount,
      totalOrgsCount,
      totalAppsCount,
      totalApiKeysCount,
      totalSecurityEventsCount
    ] = await Promise.all([
      prisma.session.count({
        where: { expiresAt: { gt: new Date() } }
      }),
      prisma.user.count(),
      prisma.organization.count(),
      prisma.application.count(),
      prisma.apiKey.count({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      }),
      prisma.securityEvent.count()
    ]);

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      apiVersion: API_VERSION,
      prismaVersion: PRISMA_VERSION,
      nodeVersion: process.version,
      databaseStatus: dbStatus,
      prismaStatus: prismaStatus,
      dbLatencyMs,
      uptimeSeconds,
      uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      memory: getMemoryMetrics(),
      cpu: getCpuMetrics(),
      statistics: {
        activeSessions: activeSessionsCount,
        nombreUtilisateurs: totalUsersCount,
        nombreOrganisations: totalOrgsCount,
        nombreApplications: totalAppsCount,
        activeApiKeys: totalApiKeysCount,
        totalSecurityEvents: totalSecurityEventsCount
      }
    });
  } catch (err: any) {
    console.error('Metrics route error:', err);
    return res.status(500).json({ error: 'Erreur lors du calcul des métriques du système' });
  }
});
