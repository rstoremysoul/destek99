
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LocationType } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as LocationType | null;

        const where = type ? { type, active: true } : { active: true };

        // Note: If 'OFFICE' is not in enum, we rely on 'WAREHOUSE' type and name='Ofis' convention or similar
        // Based on schema update, we added explicit types. Let's filter broadly if no specific type requested.

        const warehouses = await prisma.location.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { assignedDevices: true }
                }
            }
        });

        return NextResponse.json(warehouses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const warehouse = await prisma.location.create({
            data: {
                name: data.name,
                address: data.address,
                city: data.city,
                district: data.district,
                phone: data.phone,
                contactPerson: data.contactPerson,
                type: data.type || 'WAREHOUSE',
                active: true,
            },
        });
        return NextResponse.json(warehouse);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
    }
}
