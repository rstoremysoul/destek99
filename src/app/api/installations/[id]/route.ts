import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET single installation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installation = await prisma.installationForm.findUnique({
      where: { id: params.id },
      include: {
        devices: true,
        company: true,
        customer: true,
      },
    })

    if (!installation) {
      return NextResponse.json(
        { error: 'Installation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(installation)
  } catch (error) {
    console.error('Error fetching installation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch installation' },
      { status: 500 }
    )
  }
}

// PATCH update installation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const installation = await prisma.installationForm.update({
      where: { id: params.id },
      data: {
        ...body,
        requestDate: body.requestDate ? new Date(body.requestDate) : undefined,
        plannedInstallDate: body.plannedInstallDate
          ? new Date(body.plannedInstallDate)
          : undefined,
        actualInstallDate: body.actualInstallDate
          ? new Date(body.actualInstallDate)
          : undefined,
        status: body.status?.toUpperCase(),
        priority: body.priority?.toUpperCase(),
      },
      include: {
        devices: true,
        company: true,
        customer: true,
      },
    })

    return NextResponse.json(installation)
  } catch (error) {
    console.error('Error updating installation:', error)
    return NextResponse.json(
      { error: 'Failed to update installation' },
      { status: 500 }
    )
  }
}

// DELETE installation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.installationForm.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting installation:', error)
    return NextResponse.json(
      { error: 'Failed to delete installation' },
      { status: 500 }
    )
  }
}

