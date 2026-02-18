import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const data: { name?: string; active?: boolean } = {}

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

    if (!('name' in data) && !('active' in data)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.deviceModel.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
  }
}
