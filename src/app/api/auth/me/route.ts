import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET
export const runtime = 'nodejs'

export async function GET() {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { message: 'Sunucu kimlik dogrulama ayari eksik' },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')

  if (!token?.value) {
    return NextResponse.json(
      { message: 'Yetkisiz erisim' },
      { status: 401 }
    )
  }

  try {
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId?: string }
    if (!decoded?.userId) {
      return NextResponse.json(
        { message: 'Gecersiz token' },
        { status: 401 }
      )
    }

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
        { message: 'Kullanici bulunamadi' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { user: { ...user, role: user.role.toLowerCase() } },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { message: 'Gecersiz token' },
      { status: 401 }
    )
  }
}
