import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function isUnknownConsignmentArg(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message || ''
  return (
    message.includes('Unknown argument `isConsignment`') ||
    message.includes('Unknown field `isConsignment`')
  )
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const data: { name?: string; active?: boolean; isConsignment?: boolean } = {}

    if (typeof body?.name === 'string') {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      data.name = name
    }

    if (typeof body?.active === 'boolean') {
      data.active = body.active
    }

    if (typeof body?.isConsignment === 'boolean') {
      data.isConsignment = body.isConsignment
    }

    if (!('name' in data) && !('active' in data) && !('isConsignment' in data)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    let updated: any
    try {
      updated = await db.deviceModel.update({
        where: { id },
        data,
      })
    } catch (error) {
      if (!isUnknownConsignmentArg(error) || typeof data.isConsignment !== 'boolean') throw error
      const { isConsignment, ...rest } = data
      updated = await db.deviceModel.update({
        where: { id },
        data: rest,
      })
      await db.$executeRawUnsafe(
        'UPDATE device_models SET is_consignment = ? WHERE id = ?',
        isConsignment ? 1 : 0,
        id
      )
      updated = { ...updated, isConsignment }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
  }
}
