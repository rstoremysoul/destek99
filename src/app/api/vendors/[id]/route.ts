import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// PUT update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      contactPerson,
      contactPhone,
      contactEmail,
      address,
      notes,
      active,
    } = body

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name,
        type: type.toUpperCase(),
        contactPerson,
        contactPhone,
        contactEmail,
        address,
        notes,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

// DELETE vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vendor.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}

