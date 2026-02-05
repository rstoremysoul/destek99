import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET single repair by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repair = await prisma.deviceRepair.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        customer: true,
        technician: true,
      },
    })

    if (!repair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error fetching repair:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repair' },
      { status: 500 }
    )
  }
}

// PATCH update repair
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const repair = await prisma.deviceRepair.update({
      where: { id: params.id },
      data: {
        ...body,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
        completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
        estimatedCompletion: body.estimatedCompletion ? new Date(body.estimatedCompletion) : undefined,
        status: body.status?.toUpperCase(),
        priority: body.priority?.toUpperCase(),
      },
      include: {
        company: true,
        customer: true,
        technician: true,
      },
    })

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error updating repair:', error)
    return NextResponse.json(
      { error: 'Failed to update repair' },
      { status: 500 }
    )
  }
}

// DELETE repair
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.deviceRepair.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repair:', error)
    return NextResponse.json(
      { error: 'Failed to delete repair' },
      { status: 500 }
    )
  }
}

