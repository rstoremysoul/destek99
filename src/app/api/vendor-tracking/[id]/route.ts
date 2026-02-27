import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { parseVendorWorkflowMeta } from '@/lib/vendor-workflow'

// GET single vendor product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.vendorProduct.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        statusHistory: {
          orderBy: {
            statusDate: 'desc',
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Vendor product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching vendor product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor product' },
      { status: 500 }
    )
  }
}

// PATCH update vendor product
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const nextStatus = String(body.currentStatus || '').toUpperCase()

    if (nextStatus === 'COMPLETED') {
      const existing = await prisma.vendorProduct.findUnique({
        where: { id: params.id },
        select: { notes: true },
      })
      const notesCandidate = typeof body.notes === 'string' ? body.notes : (existing?.notes || '')
      const workflow = parseVendorWorkflowMeta(notesCandidate)
      if (!workflow.meta?.repairId) {
        return NextResponse.json(
          { error: 'Tedarikci kaydi teknik servise cekilmeden tamamlanamaz' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.vendorProduct.update({
      where: { id: params.id },
      data: {
        ...body,
        sentDate: body.sentDate ? new Date(body.sentDate) : undefined,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
        estimatedReturn: body.estimatedReturn ? new Date(body.estimatedReturn) : undefined,
        currentStatus: body.currentStatus?.toUpperCase(),
      },
      include: {
        vendor: true,
        statusHistory: {
          orderBy: {
            statusDate: 'desc',
          },
        },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating vendor product:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor product' },
      { status: 500 }
    )
  }
}

// DELETE vendor product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vendorProduct.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor product:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor product' },
      { status: 500 }
    )
  }
}
