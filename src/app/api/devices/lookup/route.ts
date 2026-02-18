export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type DeviceHistoryItem = {
  source: 'cargo' | 'repair' | 'installation' | 'equivalent'
  date: Date
  title: string
  details: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const serial = searchParams.get('serial')
  const query = searchParams.get('q')

  if (query) {
    try {
      const normalizedQuery = query.trim()
      if (normalizedQuery.length < 2) {
        return NextResponse.json({ items: [] })
      }

      const [repairMatches, installMatches, equivalentMatches] = await Promise.all([
        prisma.deviceRepair.findMany({
          where: { serialNumber: { contains: normalizedQuery } },
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: {
            customer: { select: { name: true } },
            company: { select: { name: true } },
          },
        }),
        prisma.installationDevice.findMany({
          where: { serialNumber: { contains: normalizedQuery } },
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: {
            installationForm: {
              include: {
                customer: { select: { name: true } },
                company: { select: { name: true } },
              },
            },
          },
        }),
        prisma.equivalentDevice.findMany({
          where: { serialNumber: { contains: normalizedQuery } },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true,
            serialNumber: true,
            deviceName: true,
            model: true,
            brand: true,
            createdAt: true,
          },
        }),
      ])

      const merged = new Map<string, any>()

      for (const item of repairMatches) {
        const key = item.serialNumber
        if (!key || merged.has(key)) continue
        merged.set(key, {
          serialNumber: item.serialNumber,
          deviceName: item.deviceName,
          model: item.model,
          brand: item.brand || '',
          source: 'customer_repair',
          customerName: item.customer?.name || '',
          companyName: item.company?.name || '',
          lastSeenAt: item.createdAt,
        })
      }

      for (const item of installMatches) {
        const key = item.serialNumber
        if (!key || merged.has(key)) continue
        merged.set(key, {
          serialNumber: item.serialNumber,
          deviceName: item.deviceName,
          model: item.model,
          brand: '',
          source: 'customer_installation',
          customerName: item.installationForm?.customer?.name || '',
          companyName: item.installationForm?.company?.name || '',
          lastSeenAt: item.createdAt,
        })
      }

      for (const item of equivalentMatches) {
        const key = item.serialNumber
        if (!key || merged.has(key)) continue
        merged.set(key, {
          serialNumber: item.serialNumber,
          deviceName: item.deviceName,
          model: item.model,
          brand: item.brand || '',
          source: 'equivalent_inventory',
          equivalentDeviceId: item.id,
          customerName: '',
          companyName: '',
          lastSeenAt: item.createdAt,
        })
      }

      return NextResponse.json({ items: Array.from(merged.values()).slice(0, 12) })
    } catch (_error) {
      return NextResponse.json({ error: 'Lookup search failed' }, { status: 500 })
    }
  }

  if (!serial) {
    return NextResponse.json({ error: 'Serial number required' }, { status: 400 })
  }

  try {
    const [inventoryItem, repairItem, cargoItem, installItem, cargoHistory, repairHistory, installHistory, equivalentHistory] = await Promise.all([
      prisma.equivalentDevice.findFirst({
        where: { serialNumber: serial },
        select: { id: true, deviceName: true, model: true, brand: true },
      }),
      prisma.deviceRepair.findFirst({
        where: { serialNumber: serial },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          company: { select: { name: true } },
        },
      }),
      prisma.cargoDevice.findFirst({
        where: { serialNumber: serial },
        orderBy: { createdAt: 'desc' },
        select: { deviceName: true, model: true },
      }),
      prisma.installationDevice.findFirst({
        where: { serialNumber: serial },
        orderBy: { createdAt: 'desc' },
        select: { deviceName: true, model: true },
      }),
      prisma.cargoDevice.findMany({
        where: { serialNumber: serial },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          cargo: {
            select: {
              trackingNumber: true,
              type: true,
              sender: true,
              receiver: true,
              sentDate: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.deviceRepair.findMany({
        where: { serialNumber: serial },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          repairNumber: true,
          status: true,
          problemDescription: true,
          createdAt: true,
        },
      }),
      prisma.installationDevice.findMany({
        where: { serialNumber: serial },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          installationForm: {
            select: {
              formNumber: true,
              company: { select: { name: true } },
              customer: { select: { name: true } },
              createdAt: true,
            },
          },
        },
      }),
      prisma.equivalentDevice.findMany({
        where: { serialNumber: serial },
        take: 1,
        include: {
          history: {
            orderBy: { changedAt: 'desc' },
            take: 8,
          },
        },
      }),
    ])

    const history: DeviceHistoryItem[] = []

    for (const item of cargoHistory) {
      const typeText = item.cargo.type === 'INCOMING' ? 'Gelen kargo' : item.cargo.type === 'OUTGOING' ? 'Giden kargo' : 'Kargo hareketi'
      history.push({
        source: 'cargo',
        date: item.cargo.sentDate || item.createdAt,
        title: `${typeText} - ${item.cargo.trackingNumber}`,
        details: `${item.cargo.sender} -> ${item.cargo.receiver}`,
      })
    }

    for (const item of repairHistory) {
      history.push({
        source: 'repair',
        date: item.createdAt,
        title: `Tamir - ${item.repairNumber}`,
        details: `${item.status} | ${item.problemDescription}`,
      })
    }

    for (const item of installHistory) {
      history.push({
        source: 'installation',
        date: item.installationForm?.createdAt || item.createdAt,
        title: `Kurulum - ${item.installationForm?.formNumber || '-'}`,
        details: `${item.installationForm?.company?.name || '-'} / ${item.installationForm?.customer?.name || '-'}`,
      })
    }

    const eq = equivalentHistory[0]
    if (eq) {
      for (const move of eq.history) {
        history.push({
          source: 'equivalent',
          date: move.changedAt,
          title: 'Muadil envanter hareketi',
          details: move.notes || `${move.previousLocation} -> ${move.newLocation}`,
        })
      }
    }

    const sortedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12)

    if (inventoryItem) {
      return NextResponse.json({
        ...inventoryItem,
        source: 'equivalent_inventory',
        customerName: '',
        companyName: '',
        history: sortedHistory,
      })
    }

    if (repairItem) {
      return NextResponse.json({
        deviceName: repairItem.deviceName,
        model: repairItem.model,
        brand: repairItem.brand || '',
        source: 'customer_repair',
        customerName: repairItem.customer?.name || '',
        companyName: repairItem.company?.name || '',
        history: sortedHistory,
      })
    }

    if (cargoItem) {
      return NextResponse.json({
        ...cargoItem,
        brand: '',
        source: 'cargo_history',
        customerName: '',
        companyName: '',
        history: sortedHistory,
      })
    }

    if (installItem) {
      return NextResponse.json({
        ...installItem,
        brand: '',
        source: 'customer_installation',
        customerName: '',
        companyName: '',
        history: sortedHistory,
      })
    }

    if (sortedHistory.length > 0) {
      return NextResponse.json({
        deviceName: '',
        model: '',
        brand: '',
        source: 'history_only',
        customerName: '',
        companyName: '',
        history: sortedHistory,
      })
    }

    return NextResponse.json(null)
  } catch (_error) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
