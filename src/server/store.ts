/**
 * DEPRECATED: src/server/store.ts
 * 
 * All in-memory maps, arrays, and global store objects have been completely removed.
 * All Fingerclic Identify data and business operations now exclusively use PostgreSQL via Prisma Client (src/server/prisma.ts).
 */

import { prisma } from './prisma';

export const store = {
  findUserByEmail: async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
  },
  findUserById: async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
  },
  getSystemStats: async () => {
    const activeUsersCount = await prisma.user.count();
    const totalSessionsCount = await prisma.session.count();
    const appsCount = await prisma.application.count();
    return { activeUsersCount, totalSessionsCount, appsCount };
  }
};
