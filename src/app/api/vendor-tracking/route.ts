export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { VendorProductStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vendor = searchParams.get('vendor')
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (vendor && vendor !== 'all') {
      whereClause.vendorId = vendor
    }

    if (status && status !== 'all') {
      const statusMap: Record<string, VendorProductStatus> = {
        'at_vendor': VendorProductStatus.AT_VENDOR,
        'in_testing': VendorProductStatus.IN_TESTING,
        'in_transit': VendorProductStatus.IN_TRANSIT,
        'completed': VendorProductStatus.COMPLETED,
        'returned': VendorProductStatus.RETURNED,
      }
      whereClause.currentStatus = statusMap[status.toLowerCase()] || status.toUpperCase()
    }

    const products = await db.vendorProduct.findMany({
      where: whereClause,
      include: {
        vendor: true,
      },
      orderBy: {
        sentDate: 'desc'
      }
    })

    return NextResponse.json(products)
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

    const statusMap: Record<string, VendorProductStatus> = {
      'at_vendor': VendorProductStatus.AT_VENDOR,
      'in_testing': VendorProductStatus.IN_TESTING,
      'in_transit': VendorProductStatus.IN_TRANSIT,
      'completed': VendorProductStatus.COMPLETED,
      'returned': VendorProductStatus.RETURNED,
    }

    const product = await db.vendorProduct.create({
      data: {
        vendorId: body.vendorId,
        deviceName: body.deviceName,
        model: body.model || '',
        serialNumber: body.serialNumber || '',
        brand: body.brand,
        problemDescription: body.problemDescription || '',
        currentStatus: statusMap[body.status?.toLowerCase()] || VendorProductStatus.AT_VENDOR,
        sentDate: body.sentDate ? new Date(body.sentDate) : null,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : null,
        estimatedReturn: body.estimatedReturn ? new Date(body.estimatedReturn) : null,
        cost: body.cost,
        notes: body.notes,
      },
      include: {
        vendor: true,
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating vendor product:', error)
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : String(error) },
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
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const statusMap: Record<string, VendorProductStatus> = {
      'at_vendor': VendorProductStatus.AT_VENDOR,
      'in_testing': VendorProductStatus.IN_TESTING,
      'in_transit': VendorProductStatus.IN_TRANSIT,
      'completed': VendorProductStatus.COMPLETED,
      'returned': VendorProductStatus.RETURNED,
    }

    const product = await db.vendorProduct.update({
      where: { id: String(id) },
      data: {
        vendorId: data.vendorId,
        deviceName: data.deviceName,
        model: data.model,
        serialNumber: data.serialNumber,
        brand: data.brand,
        problemDescription: data.problemDescription,
        currentStatus: statusMap[data.status?.toLowerCase()] || data.currentStatus,
        sentDate: data.sentDate ? new Date(data.sentDate) : null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        estimatedReturn: data.estimatedReturn ? new Date(data.estimatedReturn) : null,
        cost: data.cost,
        notes: data.notes,
      },
      include: {
        vendor: true,
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating vendor product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
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
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await db.vendorProduct.delete({
      where: { id: String(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

