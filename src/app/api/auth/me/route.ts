import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function GET() {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
        return NextResponse.json(
            { message: 'Yetkisiz erişim' },
            { status: 401 }
        )
    }

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET) as any
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Kullanıcı bulunamadı' },
                { status: 401 }
            )
        }

        return NextResponse.json({ user: { ...user, role: user.role.toLowerCase() } }, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Geçersiz token' },
            { status: 401 }
        )
    }
}
