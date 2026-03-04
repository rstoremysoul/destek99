'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, CheckCircle2, Clock3, Package, Sparkles, Truck } from 'lucide-react'
import { Space_Grotesk, Manrope } from 'next/font/google'

type PaletteKey = 'ocean_ink' | 'forest_steel'

type PaletteSet = {
  light: Record<string, string>
  dark: Record<string, string>
  hero: string
}

const titleFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'] })
const bodyFont = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

const PALETTES: Record<PaletteKey, PaletteSet> = {
  ocean_ink: {
    light: {
      '--background': '216 40% 98%',
      '--foreground': '220 36% 12%',
      '--card': '0 0% 100%',
      '--card-foreground': '220 36% 12%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '220 36% 12%',
      '--primary': '217 92% 43%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '214 38% 92%',
      '--secondary-foreground': '220 32% 16%',
      '--muted': '214 28% 94%',
      '--muted-foreground': '215 18% 38%',
      '--accent': '192 95% 91%',
      '--accent-foreground': '201 93% 28%',
      '--destructive': '0 74% 46%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '216 28% 85%',
      '--input': '216 28% 85%',
      '--ring': '217 92% 43%',
    },
    dark: {
      '--background': '223 41% 7%',
      '--foreground': '213 31% 94%',
      '--card': '222 36% 10%',
      '--card-foreground': '213 31% 94%',
      '--popover': '222 36% 10%',
      '--popover-foreground': '213 31% 94%',
      '--primary': '212 100% 62%',
      '--primary-foreground': '224 51% 10%',
      '--secondary': '221 24% 17%',
      '--secondary-foreground': '210 22% 88%',
      '--muted': '221 22% 15%',
      '--muted-foreground': '216 15% 70%',
      '--accent': '196 82% 18%',
      '--accent-foreground': '191 83% 76%',
      '--destructive': '0 72% 56%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '220 20% 22%',
      '--input': '220 20% 22%',
      '--ring': '212 100% 62%',
    },
    hero: 'from-blue-500/25 via-cyan-400/20 to-emerald-400/20',
  },
  forest_steel: {
    light: {
      '--background': '165 24% 97%',
      '--foreground': '184 26% 13%',
      '--card': '0 0% 100%',
      '--card-foreground': '184 26% 13%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '184 26% 13%',
      '--primary': '167 85% 31%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '167 24% 90%',
      '--secondary-foreground': '184 26% 16%',
      '--muted': '165 20% 93%',
      '--muted-foreground': '171 14% 35%',
      '--accent': '173 71% 88%',
      '--accent-foreground': '170 80% 23%',
      '--destructive': '0 74% 45%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '168 19% 82%',
      '--input': '168 19% 82%',
      '--ring': '167 85% 31%',
    },
    dark: {
      '--background': '171 23% 8%',
      '--foreground': '160 18% 92%',
      '--card': '170 23% 11%',
      '--card-foreground': '160 18% 92%',
      '--popover': '170 23% 11%',
      '--popover-foreground': '160 18% 92%',
      '--primary': '161 76% 47%',
      '--primary-foreground': '170 30% 11%',
      '--secondary': '170 17% 17%',
      '--secondary-foreground': '160 16% 86%',
      '--muted': '170 15% 14%',
      '--muted-foreground': '161 11% 67%',
      '--accent': '170 55% 17%',
      '--accent-foreground': '165 70% 78%',
      '--destructive': '0 75% 58%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '170 13% 24%',
      '--input': '170 13% 24%',
      '--ring': '161 76% 47%',
    },
    hero: 'from-emerald-500/25 via-teal-400/20 to-sky-400/20',
  },
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export default function UiPreviewPage() {
  const [dark, setDark] = useState(true)
  const [palette, setPalette] = useState<PaletteKey>('ocean_ink')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

  const styleVars = useMemo(
    () => (dark ? PALETTES[palette].dark : PALETTES[palette].light) as React.CSSProperties,
    [dark, palette]
  )

  return (
    <div
      style={styleVars}
      className={cn(
        bodyFont.className,
        'relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_10%_8%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_90%_18%,rgba(59,130,246,0.26),transparent_30%),radial-gradient(circle_at_50%_88%,rgba(16,185,129,0.24),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-accent/45 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative container mx-auto space-y-6 p-6">
        <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-card/70 shadow-[0_30px_80px_-35px_rgba(8,145,178,0.45)] backdrop-blur-xl">
          <div className={cn('relative grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] bg-gradient-to-br', PALETTES[palette].hero)}>
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,rgba(56,189,248,0.45)_0%,transparent_42%)]" />
            <div className="relative space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full border-cyan-400/35 bg-cyan-400/15 text-cyan-100" variant="secondary">
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Premium Dark Direction
                </Badge>
                <Badge className="rounded-full border-emerald-400/35 bg-emerald-400/15 text-emerald-100" variant="secondary">
                  Enterprise + Saturated
                </Badge>
              </div>
              <h1 className={cn(titleFont.className, 'text-3xl leading-tight md:text-5xl')}>
                Teknolojik ve kurumsal
                <span className="block bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  dark theme showcase
                </span>
              </h1>
              <p className="max-w-2xl text-sm text-slate-200/90 md:text-base">
                Amaç: dark modda daha güçlü bir imza. Katmanlı ışık oyunları, net veri hiyerarşisi ve kontrollü
                doygunlukla profesyonel bir vitrin dili.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 px-5">Pilot Uygulamayı Başlat</Button>
                <Button variant="outline" className="rounded-full border-cyan-300/35 bg-slate-900/30 text-cyan-100 hover:bg-cyan-500/10 px-5">Kapsam Karşılaştır</Button>
              </div>
              <div className="grid gap-2 pt-1 sm:grid-cols-3">
                {[
                  { label: 'Visual Depth', value: '96%' },
                  { label: 'Contrast Readability', value: 'AA+' },
                  { label: 'Interaction Smoothness', value: '120ms' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-cyan-300/20 bg-slate-900/35 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300/70">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="relative border-cyan-300/20 bg-slate-950/45 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.35),transparent_40%)]" />
              <CardHeader className="relative pb-2">
                <CardTitle className="text-sm text-cyan-100/85">Theme Controls + Pulse</CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={!dark ? 'secondary' : 'default'}
                    className="rounded-xl"
                    onClick={() => setDark(false)}
                  >
                    Light
                  </Button>
                  <Button
                    variant={dark ? 'default' : 'secondary'}
                    className="rounded-xl"
                    onClick={() => setDark(true)}
                  >
                    Dark
                  </Button>
                </div>
                <Select value={palette} onValueChange={(v: PaletteKey) => setPalette(v)}>
                  <SelectTrigger className="rounded-xl border-cyan-300/30 bg-slate-900/50">
                    <SelectValue placeholder="Palette" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ocean_ink">Ocean Ink</SelectItem>
                    <SelectItem value="forest_steel">Forest Steel</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-xl border border-cyan-300/20 bg-slate-900/45 p-3">
                  <div className="relative h-20 w-20 rounded-full bg-[conic-gradient(from_20deg,rgba(34,211,238,0.95),rgba(59,130,246,0.9),rgba(16,185,129,0.9),rgba(34,211,238,0.95))] p-[5px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-cyan-100">88%</div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300/70">Realtime Visual Pulse</p>
                    <p className="mt-1 text-sm text-cyan-100">Dark mood yoğunluğu kontrollü şekilde arttırıldı.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Açık Kargo', value: '142', icon: Truck, tone: 'from-blue-500/20 to-cyan-500/10', glow: 'shadow-cyan-500/20' },
            { label: 'Depodaki Cihaz', value: '764', icon: Package, tone: 'from-emerald-500/20 to-teal-500/10', glow: 'shadow-emerald-500/20' },
            { label: 'Tamamlanan', value: '58', icon: CheckCircle2, tone: 'from-indigo-500/20 to-blue-500/10', glow: 'shadow-blue-500/20' },
            { label: 'Bekleyen İşlem', value: '17', icon: Clock3, tone: 'from-orange-500/20 to-amber-500/10', glow: 'shadow-amber-500/20' },
          ].map((item) => (
            <Card
              key={item.label}
              className={cn(
                'group relative overflow-hidden border-border/70 bg-gradient-to-br transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                item.tone,
                item.glow
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.14)_45%,transparent_100%)]" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/90">{item.label}</p>
                    <p className={cn(titleFont.className, 'mt-2 text-3xl tracking-tight')}>{item.value}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-cyan-300/20 bg-slate-950/45 shadow-[0_14px_40px_-22px_rgba(6,182,212,0.45)] backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className={cn(titleFont.className, 'text-xl text-cyan-100')}>Kargo Operasyon Tablosu</CardTitle>
                <Button variant="outline" className="rounded-xl border-cyan-300/30 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/10">
                  Tümünü Gör
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Input placeholder="Takip no veya seri no" className="rounded-xl border-cyan-300/25 bg-slate-900/50" />
                <Select defaultValue="incoming">
                  <SelectTrigger className="rounded-xl border-cyan-300/25 bg-slate-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Gelen</SelectItem>
                    <SelectItem value="outgoing">Giden</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="open">
                  <SelectTrigger className="rounded-xl border-cyan-300/25 bg-slate-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Açık</SelectItem>
                    <SelectItem value="closed">Kapalı</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">Filtre Uygula</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-cyan-300/20">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/70 text-left text-slate-200">
                    <tr>
                      <th className="p-3 font-medium">Takip No</th>
                      <th className="p-3 font-medium">Tip</th>
                      <th className="p-3 font-medium">Durum</th>
                      <th className="p-3 font-medium">Cihaz</th>
                      <th className="p-3 font-medium">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { t: 'INC-524401-12', type: 'Gelen', status: 'Açık', device: 'RobotPOS RP-81' },
                      { t: 'OUT-524402-44', type: 'Giden', status: 'Tamamlandı', device: 'PAX A920' },
                      { t: 'INC-524410-90', type: 'Gelen', status: 'Açık', device: 'Verifone X990' },
                    ].map((row) => (
                      <tr key={row.t} className="border-t border-cyan-300/10 bg-slate-950/35 transition-colors hover:bg-cyan-500/10">
                        <td className="p-3 font-medium">{row.t}</td>
                        <td className="p-3">{row.type}</td>
                        <td className="p-3">
                          <Badge variant={row.status === 'Açık' ? 'default' : 'secondary'}>{row.status}</Badge>
                        </td>
                        <td className="p-3 text-slate-300">{row.device}</td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" className="rounded-lg border-cyan-300/30 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/10">
                            Detay <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-300/20 bg-slate-950/45 shadow-[0_14px_40px_-22px_rgba(6,182,212,0.45)] backdrop-blur">
            <CardHeader>
              <CardTitle className={cn(titleFont.className, 'text-xl text-cyan-100')}>Bileşen Dili</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="states">
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-900/60">
                  <TabsTrigger value="states">Durum</TabsTrigger>
                  <TabsTrigger value="actions">Aksiyon</TabsTrigger>
                  <TabsTrigger value="note">Not</TabsTrigger>
                </TabsList>
                <TabsContent value="states" className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Normal</Badge>
                    <Badge variant="secondary">İkincil</Badge>
                    <Badge variant="destructive">Kritik</Badge>
                    <Badge variant="outline">Nötr</Badge>
                  </div>
                  <p className="text-sm text-slate-300">Renk doygunluğu yükseltildi, kontrast korunuyor.</p>
                </TabsContent>
                <TabsContent value="actions" className="mt-4 flex flex-wrap gap-2">
                  <Button className="rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400">Primary</Button>
                  <Button variant="secondary" className="rounded-lg">Secondary</Button>
                  <Button variant="outline" className="rounded-lg">Outline</Button>
                  <Button variant="ghost" className="rounded-lg">Ghost</Button>
                </TabsContent>
                <TabsContent value="note" className="mt-4 text-sm text-slate-300">
                  Sonraki adımda bu dil birebir gerçek ekranlara taşınacak. Grid yapısı ve tüm iş akışı aynı kalacak.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
