import { PrismaClient } from '@prisma/client';

// Identify owns a dedicated PostgreSQL database. The business API and My Studio
// must never be used as an implicit fallback for the identity store.
const connectionString = process.env.IDENTIFY_DATABASE_URL;
if (!connectionString) {
  throw new Error('IDENTIFY_DATABASE_URL is required: Identify cannot start without its PostgreSQL identity database.');
}

let databaseUrl: URL;
try {
  databaseUrl = new URL(connectionString);
} catch {
  throw new Error('IDENTIFY_DATABASE_URL must be a valid PostgreSQL connection URL.');
}
if (databaseUrl.protocol !== 'postgresql:' && databaseUrl.protocol !== 'postgres:') {
  throw new Error('IDENTIFY_DATABASE_URL must use the PostgreSQL protocol.');
}
if (process.env.DATABASE_URL && process.env.DATABASE_URL === connectionString) {
  throw new Error('Identify must not reuse the generic DATABASE_URL of another application.');
}

// A singleton client prevents connection-pool proliferation during development.
const globalForPrisma = globalThis as unknown as { identifyPrisma?: PrismaClient };
export const prisma = globalForPrisma.identifyPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.identifyPrisma = prisma;
}
