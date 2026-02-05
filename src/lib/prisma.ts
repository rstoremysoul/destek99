import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Bağlantıyı test et
prisma.$connect()
  .then(() => console.log('✓ Prisma connected successfully'))
  .catch((e) => console.error('✗ Prisma connection failed:', e))

