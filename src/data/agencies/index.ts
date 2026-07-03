import type { RealEstateAgencyConfig } from '../realEstateTemplate'
import { listRealEstateAgencyRuntimes } from '../realEstateAgencyConfig'
import { assertAgencyDataIsolation } from '../../real-estate-engine'

export const realEstateAgencyDataRegistry: Record<string, RealEstateAgencyConfig> = Object.fromEntries(
  listRealEstateAgencyRuntimes().map((runtime) => [runtime.agencyConfig.agencyId, runtime.agencyConfig]),
)

export function getRealEstateAgencyDataById(agencyId: string) {
  return realEstateAgencyDataRegistry[agencyId]
}

export function listRealEstateAgencyData() {
  return Object.values(realEstateAgencyDataRegistry)
}

export function validateRegisteredAgencyIsolation() {
  return listRealEstateAgencyData().every((config) => assertAgencyDataIsolation(config))
}
