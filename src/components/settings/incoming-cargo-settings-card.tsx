'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type Company = { id: string; name: string; active: boolean }
type Branch = { id: string; companyId: string; name: string; active: boolean }
type Fault = { id: string; name: string; active: boolean }

export function IncomingCargoSettingsCard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [faults, setFaults] = useState<Fault[]>([])

  const [newCompany, setNewCompany] = useState('')
  const [newBranch, setNewBranch] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [newFault, setNewFault] = useState('')

  const loadAll = async () => {
    const [companiesRes, branchesRes, faultsRes] = await Promise.all([
      fetch('/api/incoming-cargo-companies'),
      fetch('/api/incoming-cargo-branches'),
      fetch('/api/incoming-cargo-faults'),
    ])
    const [companiesData, branchesData, faultsData] = await Promise.all([
      companiesRes.json(),
      branchesRes.json(),
      faultsRes.json(),
    ])
    setCompanies(Array.isArray(companiesData) ? companiesData : [])
    setBranches(Array.isArray(branchesData) ? branchesData : [])
    setFaults(Array.isArray(faultsData) ? faultsData : [])
  }

  useEffect(() => {
    loadAll().catch((e) => console.error('incoming settings load error', e))
  }, [])

  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      const firstActive = companies.find((c) => c.active)
      if (firstActive) setSelectedCompanyId(firstActive.id)
    }
  }, [companies, selectedCompanyId])

  const filteredBranches = useMemo(
    () => branches.filter((b) => !selectedCompanyId || b.companyId === selectedCompanyId),
    [branches, selectedCompanyId]
  )

  const addCompany = async () => {
    const name = newCompany.trim()
    if (!name) return
    await fetch('/api/incoming-cargo-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setNewCompany('')
    await loadAll()
  }

  const addBranch = async () => {
    const name = newBranch.trim()
    if (!selectedCompanyId || !name) return
    await fetch('/api/incoming-cargo-branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: selectedCompanyId, name }),
    })
    setNewBranch('')
    await loadAll()
  }

  const addFault = async () => {
    const name = newFault.trim()
    if (!name) return
    await fetch('/api/incoming-cargo-faults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setNewFault('')
    await loadAll()
  }

  const toggleCompany = async (row: Company) => {
    await fetch(`/api/incoming-cargo-companies/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    })
    await loadAll()
  }

  const toggleBranch = async (row: Branch) => {
    await fetch(`/api/incoming-cargo-branches/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    })
    await loadAll()
  }

  const toggleFault = async (row: Fault) => {
    await fetch(`/api/incoming-cargo-faults/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    })
    await loadAll()
  }

  return (
    <Card className="border-slate-700/70 bg-slate-900/70 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
      <CardHeader className="border-b border-slate-700/60 pb-4">
        <CardTitle className="text-slate-100">Gelen Kargo Akis Ayarlari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-100">Firma Listesi</div>
          <div className="flex gap-2">
            <Input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Yeni firma adi"
              className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
            />
            <Button
              onClick={addCompany}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
            >
              Ekle
            </Button>
          </div>
          <div className="space-y-2">
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/50 p-2 text-slate-100"
              >
                <span>{c.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCompany(c)}
                  className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                >
                  <Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Aktif' : 'Pasif'}</Badge>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-100">Sube Listesi</div>
          <div className="flex gap-2">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-[260px] border-slate-600/80 bg-slate-950/70 text-slate-100 focus:ring-cyan-400/40">
                <SelectValue placeholder="Firma secin" />
              </SelectTrigger>
              <SelectContent>
                {companies.filter((c) => c.active).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="Yeni sube adi"
              className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
            />
            <Button
              onClick={addBranch}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
            >
              Ekle
            </Button>
          </div>
          <div className="space-y-2">
            {filteredBranches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/50 p-2 text-slate-100"
              >
                <span>{b.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBranch(b)}
                  className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                >
                  <Badge variant={b.active ? 'default' : 'secondary'}>{b.active ? 'Aktif' : 'Pasif'}</Badge>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-100">Bildirilen Ariza Secenekleri</div>
          <div className="flex gap-2">
            <Input
              value={newFault}
              onChange={(e) => setNewFault(e.target.value)}
              placeholder="Yeni ariza secenegi"
              className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
            />
            <Button
              onClick={addFault}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
            >
              Ekle
            </Button>
          </div>
          <div className="space-y-2">
            {faults.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/50 p-2 text-slate-100"
              >
                <span>{f.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFault(f)}
                  className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                >
                  <Badge variant={f.active ? 'default' : 'secondary'}>{f.active ? 'Aktif' : 'Pasif'}</Badge>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
