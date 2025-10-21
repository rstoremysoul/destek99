import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const records = await db.technicalService.findMany({
      orderBy: {
        serviceEntryDate: 'desc'
      }
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching technical service records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const record = await db.technicalService.create({
      data: {
        operatingPersonnel: body.operatingPersonnel,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        brand: body.brand,
        businessName: body.businessName,
        deviceName: body.deviceName,
        model: body.model,
        deviceSerial: body.deviceSerial,
        serviceEntryDate: body.serviceEntryDate ? new Date(body.serviceEntryDate) : null,
        serviceExitDate: body.serviceExitDate ? new Date(body.serviceExitDate) : null,
        deviceProblem: body.deviceProblem,
        problemDescription: body.problemDescription,
        performedAction: body.performedAction,
        serviceCost: body.serviceCost,
        customerCost: body.customerCost,
        approvedBy: body.approvedBy,
        connectWritten: body.connectWritten,
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error creating technical service record:', error)
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    const record = await db.technicalService.update({
      where: { id: Number(id) },
      data: {
        operatingPersonnel: data.operatingPersonnel,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        brand: data.brand,
        businessName: data.businessName,
        deviceName: data.deviceName,
        model: data.model,
        deviceSerial: data.deviceSerial,
        serviceEntryDate: data.serviceEntryDate ? new Date(data.serviceEntryDate) : null,
        serviceExitDate: data.serviceExitDate ? new Date(data.serviceExitDate) : null,
        deviceProblem: data.deviceProblem,
        problemDescription: data.problemDescription,
        performedAction: data.performedAction,
        serviceCost: data.serviceCost,
        customerCost: data.customerCost,
        approvedBy: data.approvedBy,
        connectWritten: data.connectWritten,
        vendorName: data.vendorName,
        isAtVendor: data.isAtVendor ?? false,
        vendorEntryDate: data.vendorEntryDate ? new Date(data.vendorEntryDate) : null,
        vendorExitDate: data.vendorExitDate ? new Date(data.vendorExitDate) : null,
        vendorStatus: data.vendorStatus || 'NOT_AT_VENDOR',
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating technical service record:', error)
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    await db.technicalService.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting technical service record:', error)
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    )
  }
}