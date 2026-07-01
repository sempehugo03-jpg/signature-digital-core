import {
  templateImmobilierAgencyId,
  templateImmobilierConfig,
  type RealEstateAgencyConfig,
} from '../realEstateTemplate'
import { assertAgencyDataIsolation } from '../../real-estate-engine'

export const realEstateAgencyDataRegistry: Record<string, RealEstateAgencyConfig> = {
  [templateImmobilierAgencyId]: templateImmobilierConfig,
}

export function getRealEstateAgencyDataById(agencyId: string) {
  return realEstateAgencyDataRegistry[agencyId]
}

export function listRealEstateAgencyData() {
  return Object.values(realEstateAgencyDataRegistry)
}

export function validateRegisteredAgencyIsolation() {
  return listRealEstateAgencyData().every((config) => assertAgencyDataIsolation(config))
}
