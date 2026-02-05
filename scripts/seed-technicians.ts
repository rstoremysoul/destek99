import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Teknisyenler ekleniyor...')

  const technicians = [
    {
      name: 'Ahmet YÄ±lmaz',
      phone: '0532 123 4567',
      email: 'ahmet.yilmaz@example.com',
      specialization: 'Network & Server',
      active: true,
    },
    {
      name: 'Mehmet Demir',
      phone: '0533 234 5678',
      email: 'mehmet.demir@example.com',
      specialization: 'POS & Printer',
      active: true,
    },
    {
      name: 'AyÅŸe Kaya',
      phone: '0534 345 6789',
      email: 'ayse.kaya@example.com',
      specialization: 'Server & Storage',
      active: true,
    },
    {
      name: 'Fatma Ã‡elik',
      phone: '0535 456 7890',
      email: 'fatma.celik@example.com',
      specialization: 'Network Infrastructure',
      active: true,
    },
  ]

  for (const tech of technicians) {
    const created = await prisma.technician.create({
      data: tech,
    })
    console.log(`âœ“ ${created.name} eklendi`)
  }

  console.log('\nToplam', technicians.length, 'teknisyen eklendi.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

