
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const warehouse = await prisma.location.findUnique({
            where: { id: params.id },
            include: {
                assignedDevices: {
                    where: { status: 'AVAILABLE' }, // Or filtered by status
                    orderBy: { deviceName: 'asc' }
                }
            }
        });

        if (!warehouse) {
            return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
        }

        return NextResponse.json(warehouse);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch warehouse details' }, { status: 500 });
    }
}
