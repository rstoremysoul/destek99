import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const serial = searchParams.get('serial');
    const query = searchParams.get('q');

    if (query) {
        try {
            const normalizedQuery = query.trim();
            if (normalizedQuery.length < 2) {
                return NextResponse.json({ items: [] });
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
            ]);

            const merged = new Map<string, any>();

            for (const item of repairMatches) {
                const key = item.serialNumber;
                if (!key || merged.has(key)) continue;
                merged.set(key, {
                    serialNumber: item.serialNumber,
                    deviceName: item.deviceName,
                    model: item.model,
                    brand: item.brand || '',
                    source: 'customer_repair',
                    customerName: item.customer?.name || '',
                    companyName: item.company?.name || '',
                    lastSeenAt: item.createdAt,
                });
            }

            for (const item of installMatches) {
                const key = item.serialNumber;
                if (!key || merged.has(key)) continue;
                merged.set(key, {
                    serialNumber: item.serialNumber,
                    deviceName: item.deviceName,
                    model: item.model,
                    brand: '',
                    source: 'customer_installation',
                    customerName: item.installationForm?.customer?.name || '',
                    companyName: item.installationForm?.company?.name || '',
                    lastSeenAt: item.createdAt,
                });
            }

            for (const item of equivalentMatches) {
                const key = item.serialNumber;
                if (!key || merged.has(key)) continue;
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
                });
            }

            return NextResponse.json({ items: Array.from(merged.values()).slice(0, 12) });
        } catch (error) {
            return NextResponse.json({ error: 'Lookup search failed' }, { status: 500 });
        }
    }

    if (!serial) {
        return NextResponse.json({ error: 'Serial number required' }, { status: 400 });
    }

    try {
        // 1. Check Inventory (EquivalentDevice) - Best source
        const inventoryItem = await prisma.equivalentDevice.findFirst({
            where: { serialNumber: serial },
            select: { id: true, deviceName: true, model: true, brand: true }
        });

        if (inventoryItem) {
            return NextResponse.json({
                ...inventoryItem,
                source: 'equivalent_inventory',
                customerName: '',
                companyName: '',
            });
        }

        // 2. Check recent repairs
        const repairItem = await prisma.deviceRepair.findFirst({
            where: { serialNumber: serial },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true } },
                company: { select: { name: true } },
            }
        });

        if (repairItem) {
            return NextResponse.json({
                deviceName: repairItem.deviceName,
                model: repairItem.model,
                brand: repairItem.brand || '',
                source: 'customer_repair',
                customerName: repairItem.customer?.name || '',
                companyName: repairItem.company?.name || '',
            });
        }

        // 3. Check cargo history
        const cargoItem = await prisma.cargoDevice.findFirst({
            where: { serialNumber: serial },
            orderBy: { createdAt: 'desc' },
            select: { deviceName: true, model: true }
        });

        if (cargoItem) {
            return NextResponse.json({
                ...cargoItem,
                brand: '',
                source: 'cargo_history',
                customerName: '',
                companyName: '',
            });
        }

        // 4. Check installation history
        const installItem = await prisma.installationDevice.findFirst({
            where: { serialNumber: serial },
            orderBy: { createdAt: 'desc' },
            select: { deviceName: true, model: true }
        });

        if (installItem) {
            return NextResponse.json({
                ...installItem,
                brand: '',
                source: 'customer_installation',
                customerName: '',
                companyName: '',
            });
        }

        return NextResponse.json(null); // Not found
    } catch (error) {
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
