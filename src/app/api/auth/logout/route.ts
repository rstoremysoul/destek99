import { NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST() {
    const serialized = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
    })

    const response = NextResponse.json(
        { message: 'Çıkış yapıldı' },
        { status: 200 }
    )

    response.headers.set('Set-Cookie', serialized)

    return response
}
