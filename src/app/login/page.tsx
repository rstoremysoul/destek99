'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, LockKeyhole, ShieldCheck, User2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        await new Promise((resolve) => setTimeout(resolve, 950))
        router.push('/dashboard')
      } else {
        setError(data.message || 'Giris basarisiz')
      }
    } catch {
      setError('Giris yapilirken bir hata olustu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-stage flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute -top-8 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-cyan-400/25 blur-3xl" />

        <div className={`glow-beam-frame shadow-[0_24px_65px_-35px_rgba(8,145,178,0.85)] ${success ? 'login-success' : ''}`}>
          <Card className="glow-beam-content border-slate-700/80 bg-slate-950/80 backdrop-blur-xl">
            {success ? (
              <div className="login-success-overlay" aria-hidden="true">
                <span className="login-success-ring" />
                <span className="login-success-ring delay-1" />
                <CheckCircle2 className="login-success-icon" />
              </div>
            ) : null}

            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/12 px-3 py-1 text-xs font-medium text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Guvenli Giris
              </div>
              <CardTitle className="text-2xl font-bold text-slate-100">Destek Yonetimi</CardTitle>
              <CardDescription className="text-slate-300">Hesabiniza giris yapin</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-200">
                    Kullanici Adi
                  </Label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      placeholder="Kullanici adinizi girin"
                      disabled={loading || success}
                      className="h-11 border-slate-600/80 bg-slate-900/70 pl-10 text-slate-100 placeholder:text-slate-400 transition-all duration-200 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">
                    Sifre
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Sifrenizi girin"
                      disabled={loading || success}
                      className="h-11 border-slate-600/80 bg-slate-900/70 pl-10 text-slate-100 placeholder:text-slate-400 transition-all duration-200 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-md border border-emerald-300/35 bg-emerald-500/12 px-3 py-2 text-center text-sm font-medium text-emerald-100">
                    Giris basarili, panel aciliyor...
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className={`h-11 w-full gap-2 font-semibold text-white shadow-[0_12px_28px_-18px_rgba(56,189,248,0.95)] transition-all duration-300 ${
                    success
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
                  }`}
                  disabled={loading || success}
                >
                  {success ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  {loading ? 'Giris yapiliyor...' : success ? 'Basarili' : 'Giris Yap'}
                </Button>
              </form>

              <div className="mt-6 rounded-lg border border-slate-700/70 bg-slate-900/70 p-4 text-sm text-slate-200">
                <p className="mb-2 font-medium text-slate-100">Demo Hesaplar</p>
                <p>admin / 123456</p>
                <p>teknisyen1 / 123456</p>
                <p>teknisyen2 / 123456</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
