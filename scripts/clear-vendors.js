const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearVendors() {
  try {
    // Delete all vendors
    const result = await prisma.vendor.deleteMany({})
    console.log(`âœ“ Deleted ${result.count} vendors from database`)

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error clearing vendors:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

clearVendors()

