import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET all installations
export async function GET(request: NextRequest) {
  try {
    console.log('Prisma:', prisma)
    console.log('Prisma type:', typeof prisma)
    console.log('Prisma installationForm:', prisma?.installationForm)

    if (!prisma) {
      return NextResponse.json(
        { error: 'Prisma client is undefined' },
        { status: 500 }
      )
    }

    const installations = await prisma.installationForm.findMany({
      include: {
        devices: true,
        company: true,
        customer: true,
        technician: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(installations)
  } catch (error) {
    console.error('Error fetching installations:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Failed to fetch installations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST create new installation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      formNumber,
      companyName,
      customerName,
      customerPhone,
      requestDate,
      plannedInstallDate,
      actualInstallDate,
      status,
      priority,
      installationAddress,
      contactPerson,
      contactPhone,
      notes,
      technicianId,
      devices,
    } = body

    // Create or find company
    let company = await prisma.company.findFirst({
      where: { name: companyName },
    })

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyName,
        },
      })
    }

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: {
        name: customerName,
        companyId: company.id,
      },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone || contactPhone,
          companyId: company.id,
        },
      })
    }

    // Map status and priority to enum values
    const statusMap: { [key: string]: string } = {
      'received': 'RECEIVED',
      'preparing': 'PREPARING',
      'ready': 'READY',
      'installing': 'INSTALLING',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
    }

    const priorityMap: { [key: string]: string } = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'URGENT',
    }

    // Create installation form with devices
    const installation = await prisma.installationForm.create({
      data: {
        formNumber,
        companyId: company.id,
        customerId: customer.id,
        technicianId: technicianId || null,
        requestDate: new Date(requestDate),
        plannedInstallDate: new Date(plannedInstallDate),
        actualInstallDate: actualInstallDate ? new Date(actualInstallDate) : null,
        status: statusMap[status.toLowerCase()] || 'RECEIVED',
        priority: priorityMap[priority.toLowerCase()] || 'MEDIUM',
        installationAddress,
        contactPerson,
        contactPhone,
        notes,
        devices: devices && devices.length > 0 ? {
          create: devices.map((device: any) => ({
            deviceId: device.deviceId || device.id || `DEV-${Date.now()}`,
            deviceName: device.deviceName,
            model: device.model,
            serialNumber: device.serialNumber,
            quantity: device.quantity || 1,
            installationStatus: device.installationStatus?.toUpperCase() || 'PENDING',
            notes: device.notes,
          })),
        } : undefined,
      },
      include: {
        devices: true,
        company: true,
        customer: true,
        technician: true,
      },
    })

    return NextResponse.json(installation, { status: 201 })
  } catch (error) {
    console.error('Error creating installation:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to create installation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

