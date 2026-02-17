export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET() {
  try {
    // Total records
    const totalRecords = await db.technicalService.count()

    // Completed vs ongoing
    const completedRecords = await db.technicalService.count({
      where: {
        serviceExitDate: {
          not: null
        }
      }
    })

    const ongoingRecords = totalRecords - completedRecords

    // This month's records
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const thisMonthRecords = await db.technicalService.count({
      where: {
        serviceEntryDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      }
    })

    // Device types breakdown
    const deviceTypesRaw = await db.technicalService.groupBy({
      by: ['deviceName'],
      _count: {
        deviceName: true
      },
      orderBy: {
        _count: {
          deviceName: 'desc'
        }
      },
      take: 10
    })

    const deviceTypes = deviceTypesRaw.map(item => ({
      name: item.deviceName || 'Bilinmeyen',
      count: item._count.deviceName
    }))

    // Business breakdown
    const businessesRaw = await db.technicalService.groupBy({
      by: ['businessName'],
      _count: {
        businessName: true
      },
      orderBy: {
        _count: {
          businessName: 'desc'
        }
      },
      take: 10
    })

    const businesses = businessesRaw.map(item => ({
      name: item.businessName || 'Bilinmeyen',
      count: item._count.businessName
    }))

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const count = await db.technicalService.count({
        where: {
          serviceEntryDate: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }),
        count
      })
    }

    // Technician performance
    const technicianPerformanceRaw = await db.technicalService.groupBy({
      by: ['operatingPersonnel'],
      _count: {
        operatingPersonnel: true
      },
      orderBy: {
        _count: {
          operatingPersonnel: 'desc'
        }
      }
    })

    const technicianPerformance = technicianPerformanceRaw.map(item => ({
      name: item.operatingPersonnel || 'Bilinmeyen',
      count: item._count.operatingPersonnel
    }))

    // Average resolution time (for completed records)
    const completedWithDates = await db.technicalService.findMany({
      select: {
        serviceEntryDate: true,
        serviceExitDate: true
      },
      where: {
        serviceEntryDate: { not: null },
        serviceExitDate: { not: null }
      }
    })

    const resolutionTimes = completedWithDates
      .filter(record => record.serviceEntryDate && record.serviceExitDate)
      .map(record => {
        const entryDate = new Date(record.serviceEntryDate!)
        const exitDate = new Date(record.serviceExitDate!)
        return Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      })

    const averageResolutionDays = resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((sum, days) => sum + days, 0) / resolutionTimes.length)
      : 0

    return NextResponse.json({
      totalRecords,
      completedRecords,
      ongoingRecords,
      thisMonthRecords,
      deviceTypes,
      businesses,
      monthlyTrend,
      technicianPerformance,
      averageResolutionDays
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

