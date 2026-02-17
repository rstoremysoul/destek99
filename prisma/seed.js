const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('123456', 10)

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@destek.com',
            name: 'Yönetici',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log({ admin })

    // Create default warehouses/locations
    const warehouses = [
        { name: 'Merkez Ofis', type: 'HEADQUARTERS', address: 'Merkez Ofis Adresi' },
        { name: 'Tedarikçi Firma', type: 'SUPPLIER', address: 'Tedarikçi Adresi' },
        { name: 'Muadil Cihaz Deposu', type: 'WAREHOUSE', address: 'Depo Adresi' },
        { name: 'Müşteri Lokasyonu', type: 'CUSTOMER', address: 'Müşteri Adresi' },
        { name: 'Yerinde Servis Ekibi', type: 'SERVICE_CENTER', address: 'Servis Adresi' },
        { name: 'Kurulum Ekibi', type: 'INSTALLATION_TEAM', address: 'Kurulum Ekibi' },
        { name: 'Test Cihazları Deposu', type: 'WAREHOUSE', address: 'Test Deposu' },
        { name: 'Konsinye Cihaz Deposu', type: 'BRANCH', address: 'Konsinye Depo' },
    ]

    for (const wh of warehouses) {
        const existing = await prisma.location.findFirst({
            where: { name: wh.name }
        })
        if (!existing) {
            await prisma.location.create({
                data: wh
            })
            console.log(`Created warehouse: ${wh.name}`)
        } else {
            console.log(`Warehouse already exists: ${wh.name}`)
        }
    }

    // Create default cargo companies
    const cargoCompanies = [
        'MNG Kargo',
        'Aras Kargo',
        'Yurtiçi Kargo',
    ]

    for (const companyName of cargoCompanies) {
        await prisma.cargoCompany.upsert({
            where: { name: companyName },
            update: { active: true },
            create: { name: companyName, active: true },
        })
        console.log(`Cargo company ready: ${companyName}`)
    }
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
