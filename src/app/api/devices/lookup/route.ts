
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const serial = searchParams.get('serial');

    if (!serial) {
        return NextResponse.json({ error: 'Serial number required' }, { status: 400 });
    }

    try {
        // 1. Check Inventory (EquivalentDevice) - Best source
        const inventoryItem = await prisma.equivalentDevice.findFirst({
            where: { serialNumber: serial },
            select: { deviceName: true, model: true, brand: true }
        });

        if (inventoryItem) {
            return NextResponse.json(inventoryItem);
        }

        // 2. Check recent repairs
        const repairItem = await prisma.deviceRepair.findFirst({
            where: { serialNumber: serial },
            orderBy: { createdAt: 'desc' },
            select: { deviceName: true, model: true, brand: true }
        });

        if (repairItem) {
            return NextResponse.json(repairItem);
        }

        // 3. Check cargo history
        const cargoItem = await prisma.cargoDevice.findFirst({
            where: { serialNumber: serial },
            orderBy: { createdAt: 'desc' },
            select: { deviceName: true, model: true }
        });

        if (cargoItem) {
            return NextResponse.json({ ...cargoItem, brand: '' });
        }

        // 4. Check installation history
        const installItem = await prisma.installationDevice.findFirst({
            where: { serialNumber: serial },
            orderBy: { createdAt: 'desc' },
            select: { deviceName: true, model: true }
        });

        if (installItem) {
            return NextResponse.json({ ...installItem, brand: '' });
        }

        return NextResponse.json(null); // Not found
    } catch (error) {
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
