import {
  templateImmobilierAgencyId,
  templateImmobilierConfig,
  templateImmobilierSlug,
} from '../../data/realEstateTemplate'
import type { RealEstateThemeConfig } from '../../real-estate-engine'

export type AgencySkinConfig = RealEstateThemeConfig & {
  skinName: string
  assets: {
    heroImage: string
  }
  contentTone: 'premium-editorial'
}

export const opusDomusAgencySkin: AgencySkinConfig = {
  agencyId: templateImmobilierAgencyId,
  agencySlug: templateImmobilierSlug,
  skinName: 'Template immobilier',
  variant: 'premium-editorial',
  colors: {
    background: '#ffffff',
    foreground: '#19191d',
    muted: '#747179',
    accent: '#19191d',
  },
  assets: {
    heroImage: templateImmobilierConfig.heroImage,
  },
  contentTone: 'premium-editorial',
}

export const agencySkins = {
  [templateImmobilierAgencyId]: opusDomusAgencySkin,
} as const
