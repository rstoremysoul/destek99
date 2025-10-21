import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vendor = searchParams.get('vendor')
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (vendor && vendor !== 'all') {
      whereClause.vendorName = vendor
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const records = await db.vendorTracking.findMany({
      where: whereClause,
      orderBy: {
        entryDate: 'desc'
      }
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching vendor tracking records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const record = await db.vendorTracking.create({
      data: {
        vendorName: body.vendorName,
        deviceName: body.deviceName,
        deviceSerial: body.deviceSerial,
        businessName: body.businessName,
        entryDate: body.entryDate ? new Date(body.entryDate) : null,
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        problemDescription: body.problemDescription,
        vendorAction: body.vendorAction,
        cost: body.cost,
        status: body.status || 'AT_VENDOR',
        notes: body.notes,
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error creating vendor tracking record:', error)
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

    const record = await db.vendorTracking.update({
      where: { id: Number(id) },
      data: {
        vendorName: data.vendorName,
        deviceName: data.deviceName,
        deviceSerial: data.deviceSerial,
        businessName: data.businessName,
        entryDate: data.entryDate ? new Date(data.entryDate) : null,
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
        problemDescription: data.problemDescription,
        vendorAction: data.vendorAction,
        cost: data.cost,
        status: data.status || 'AT_VENDOR',
        notes: data.notes,
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating vendor tracking record:', error)
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

    await db.vendorTracking.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor tracking record:', error)
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    )
  }
}