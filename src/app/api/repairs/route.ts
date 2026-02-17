import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { Priority, RepairStatus } from '@prisma/client'

// GET all repairs
export async function GET(request: NextRequest) {
  try {
    const repairs = await prisma.deviceRepair.findMany({
      include: {
        company: true,
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(repairs)
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repairs' },
      { status: 500 }
    )
  }
}

// POST create new repair
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      repairNumber,
      companyName,
      customerName,
      customerPhone,
      deviceName,
      model,
      serialNumber,
      brand,
      receivedDate,
      completedDate,
      estimatedCompletion,
      status,
      priority,
      problemDescription,
      diagnosisNotes,
      repairNotes,
      isWarranty,
      warrantyInfo,
      assignedTechnician,
      technicianName,
      laborCost,
      partsCost,
      totalCost,
      repairCost,
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
          phone: customerPhone,
          companyId: company.id,
        },
      })
    }

    // Map enum values
    const statusMap: Record<string, RepairStatus> = {
      'received': RepairStatus.RECEIVED,
      'diagnosing': RepairStatus.DIAGNOSING,
      'waiting_parts': RepairStatus.WAITING_PARTS,
      'repairing': RepairStatus.REPAIRING,
      'testing': RepairStatus.TESTING,
      'completed': RepairStatus.COMPLETED,
      'unrepairable': RepairStatus.UNREPAIRABLE,
    }

    const priorityMap: Record<string, Priority> = {
      'low': Priority.LOW,
      'medium': Priority.MEDIUM,
      'high': Priority.HIGH,
      'urgent': Priority.URGENT,
    }

    const repair = await prisma.deviceRepair.create({
      data: {
        repairNumber,
        companyId: company.id,
        customerId: customer.id,
        deviceName,
        model,
        serialNumber,
        brand,
        receivedDate: new Date(receivedDate),
        completedDate: completedDate ? new Date(completedDate) : null,
        estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
        status: statusMap[status.toLowerCase()] || RepairStatus.RECEIVED,
        priority: priorityMap[priority.toLowerCase()] || Priority.MEDIUM,
        problemDescription,
        diagnosisNotes,
        repairNotes,
        isWarranty: isWarranty || false,
        warrantyInfo,
        technicianId: assignedTechnician || null,
        laborCost,
        partsCost,
        totalCost,
        repairCost,
      },
      include: {
        company: true,
        customer: true,
      },
    })

    return NextResponse.json(repair, { status: 201 })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json(
      { error: 'Failed to create repair' },
      { status: 500 }
    )
  }
}

