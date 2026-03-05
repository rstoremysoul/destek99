import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function extractCargoIdFromText(text?: string | null) {
  const match = String(text || '').match(/\[CARGO:([^\]]+)\]/)
  return match?.[1] || null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    if (!productId) {
      return NextResponse.json({ error: 'Vendor product ID is required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const explanation = String(body?.explanation || '').trim()

    if (!explanation) {
      return NextResponse.json({ error: 'Iade aciklamasi zorunludur' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.vendorProduct.findUnique({
        where: { id: productId },
        select: {
          id: true,
          notes: true,
          currentStatus: true,
        },
      })

      if (!product) {
        return { error: 'Vendor product not found', status: 404 as const }
      }

      if (product.currentStatus === 'RETURNED') {
        return { success: true, alreadyReturned: true as const }
      }

      const returnNote = `Iade Aciklamasi: ${explanation}`
      const mergedNotes = [product.notes?.trim(), returnNote].filter(Boolean).join('\n\n')

      await tx.vendorProduct.update({
        where: { id: productId },
        data: {
          currentStatus: 'RETURNED',
          receivedDate: new Date(),
          notes: mergedNotes,
        },
      })

      await tx.vendorProductStatusHistory.create({
        data: {
          productId,
          status: 'RETURNED',
          statusDate: new Date(),
          notes: explanation,
          updatedBy: 'SYSTEM',
          updatedByName: 'Sistem',
        },
      })

      const cargoId = extractCargoIdFromText(product.notes)
      if (cargoId) {
        await tx.cargoTracking.update({
          where: { id: cargoId },
          data: {
            recordStatus: 'CLOSED',
          },
        }).catch(() => undefined)
      }

      return { success: true, alreadyReturned: false as const }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error returning consignment ticket:', error)
    return NextResponse.json(
      { error: 'Failed to return consignment ticket' },
      { status: 500 }
    )
  }
}
