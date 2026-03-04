'use client'

import { DeviceTypesSettingsCard } from '@/components/settings/device-types-settings-card'
import { DeviceModelsSettingsCard } from '@/components/settings/device-models-settings-card'
import { TechniciansSettingsCard } from '@/components/settings/technicians-settings-card'
import { IncomingCargoSettingsCard } from '@/components/settings/incoming-cargo-settings-card'
import { CargoCompaniesSettingsCard } from '@/components/settings/cargo-companies-settings-card'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 px-5 py-4 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.95)]">
        <h1 className="text-xl font-semibold text-slate-100">Sistem Ayarlari</h1>
        <p className="mt-1 text-sm text-slate-300">
          Operasyon listelerini yonetin ve aktif/pasif durumlarini bu ekrandan duzenleyin.
        </p>
      </div>
      <TechniciansSettingsCard />
      <CargoCompaniesSettingsCard />
      <DeviceTypesSettingsCard />
      <DeviceModelsSettingsCard />
      <IncomingCargoSettingsCard />
    </div>
  )
}
