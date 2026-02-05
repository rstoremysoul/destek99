import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET check if serial number exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')

    if (!serial) {
      return NextResponse.json(
        { error: 'Serial number is required' },
        { status: 400 }
      )
    }

    const existingDevice = await prisma.equivalentDevice.findUnique({
      where: {
        serialNumber: serial,
      },
    })

    return NextResponse.json({
      exists: !!existingDevice,
      device: existingDevice ? {
        id: existingDevice.id,
        deviceNumber: existingDevice.deviceNumber,
        deviceName: existingDevice.deviceName,
      } : null,
    })
  } catch (error) {
    console.error('Error checking serial number:', error)
    return NextResponse.json(
      { error: 'Failed to check serial number' },
      { status: 500 }
    )
  }
}

