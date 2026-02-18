'use client'

import { DeviceTypesSettingsCard } from '@/components/settings/device-types-settings-card'
import { DeviceModelsSettingsCard } from '@/components/settings/device-models-settings-card'
import { TechniciansSettingsCard } from '@/components/settings/technicians-settings-card'

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <TechniciansSettingsCard />
      <DeviceTypesSettingsCard />
      <DeviceModelsSettingsCard />
    </div>
  )
}
