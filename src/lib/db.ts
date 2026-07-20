import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Helper to check if PostgreSQL is being used
export const isPostgres = () => {
  return !!process.env.DATABASE_URL?.startsWith('postgresql://') || 
         !!process.env.DATABASE_URL?.startsWith('postgres://');
};

// Parse state returned from Prisma
export function parseState(state: unknown): unknown {
  if (!state) return null;
  if (typeof state === 'string') {
    try {
      return JSON.parse(state);
    } catch {
      return state;
    }
  }
  return state;
}

// Serialize state before saving to Prisma
export function serializeState(state: unknown): unknown {
  if (state === null || state === undefined) return null;
  if (isPostgres()) {
    return state; // PostgreSQL expects object for Json type
  }
  return JSON.stringify(state); // SQLite expects string
}

export default db;
