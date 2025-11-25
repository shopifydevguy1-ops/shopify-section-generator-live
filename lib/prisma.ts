// Lazy-load Prisma to avoid execution during Next.js build phase
let _prisma: any = null;
let _prismaPromise: Promise<any> | null = null;

function getPrisma() {
  // During Next.js build phase, return a mock to avoid TypeScript execution errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {} as any;
  }

  if (!_prisma) {
    const { PrismaClient } = require('@prisma/client');
    const { Pool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');

    const globalForPrisma = globalThis as unknown as {
      prisma: typeof PrismaClient | undefined;
    };

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    _prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _prisma;
  }

  return _prisma;
}

export const prisma = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrisma();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

