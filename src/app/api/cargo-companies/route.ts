
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const companies = await prisma.cargoCompany.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(companies);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch cargo companies' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const company = await prisma.cargoCompany.create({
            data: {
                name: data.name,
                active: data.active ?? true,
            },
        });
        return NextResponse.json(company);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create cargo company' }, { status: 500 });
    }
}
