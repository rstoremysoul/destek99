import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const brandsWithModels = {
  'ROBOTPOS': ['M', 'MK', 'VINTEC', 'EC-LINE', 'EL-LINE', 'RP-81'],
  'HUGIN': ['POS-80', 'POS-58', 'THERMAL-80'],
  'POSSIFY': ['P1', 'P2', 'P3', 'MINI'],
  'POSSAFE': ['PS-100', 'PS-200', 'PS-300'],
  'POSINESS': ['PN-80', 'PN-58'],
  'DESMAK': ['D-100', 'D-200', 'THERMAL'],
  'INGENIGO': ['IG-100', 'IG-200', 'SMART'],
  'SERVIS POINT': ['SP-80', 'SP-58', 'MINI'],
  'TECPRO': ['TP-100', 'TP-200', 'PRO'],
  'PERKON': ['PK-80', 'PK-58'],
  'ERAY': ['E-100', 'E-200'],
  'AFANDA': ['AF-80', 'AF-58'],
  'SETSIS': ['ST-100', 'ST-200'],
  'DENIZ YUKSEL': ['DY-80', 'DY-100'],
  'SAFIR TEKNOLOJI': ['SF-100', 'SF-200'],
  'CAS': ['CAS-80', 'CAS-100', 'SCALE'],
  'ALATEL': ['AL-100', 'AL-200']
}

async function main() {
  console.log('Starting seed for device brands and models...')

  for (const [brandName, models] of Object.entries(brandsWithModels)) {
    // Create or find brand
    const brand = await prisma.deviceBrand.upsert({
      where: { name: brandName },
      update: {},
      create: {
        name: brandName,
        active: true,
      },
    })

    console.log(`Created/Found brand: ${brandName}`)

    // Create models for this brand
    for (const modelName of models) {
      await prisma.deviceModel.upsert({
        where: {
          brandId_name: {
            brandId: brand.id,
            name: modelName,
          },
        },
        update: {},
        create: {
          brandId: brand.id,
          name: modelName,
          active: true,
        },
      })
      console.log(`  - Created/Found model: ${modelName}`)
    }
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

