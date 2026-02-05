import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password } = body

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Kullanıcı adı veya şifre hatalı' },
                { status: 401 }
            )
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return NextResponse.json(
                { message: 'Kullanıcı adı veya şifre hatalı' },
                { status: 401 }
            )
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role.toLowerCase() },
            JWT_SECRET,
            { expiresIn: '1d' }
        )

        const serialized = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    role: user.role.toLowerCase(),
                },
            },
            { status: 200 }
        )

        response.headers.set('Set-Cookie', serialized)

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { message: 'Giriş işlemi sırasında bir hata oluştu' },
            { status: 500 }
        )
    }
}
