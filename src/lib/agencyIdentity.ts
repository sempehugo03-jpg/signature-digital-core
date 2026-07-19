import type { CSSProperties } from 'react'
import type { RealEstateAgencyConfig } from '../data/realEstateTemplate'
import type { RealEstateCompositionConfig } from './realEstateCompositionSystem'
import { createRealEstateVisualSystem } from './realEstateVisualSystem'
import type { RealEstateVisualTheme } from './realEstateVisualThemeEngine'
import {
  resolveAnimationContract,
  type AnimationContract,
} from './animationContract'
import {
  type VisualBlueprintDiagnostic,
  type VisualBlueprintV1,
} from './visualBlueprint'
import { resolveRenderContract, type RenderContract } from './renderContract'
import {
  resolveAgencyContactIdentity,
  type AgencyContactIdentityValidation,
} from './agencyContactLegalIdentity'
import {
  createDefaultAgencyComplianceConfig,
  type AgencyComplianceConfig,
} from './agencyCompliance'

export type AgencyIdentity = {
  agencyId: string
  agencySlug: string
  brand: {
    name: string
    city: string
    phone: string
    email: string
    address: string
  }
  contactIdentity: AgencyContactIdentityValidation
  compliance: AgencyComplianceConfig
  logos: {
    logoUrl: string
    lightLogoUrl: string
    darkLogoUrl: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  typography: {
    heading: string
    body: string
    mood: string
  }
  assets: {
    heroImage: string
    sectionImages: string[]
  }
  content: {
    heroTitle: string
    heroSubtitle: string
    primaryCtaLabel: string
    heroVariant: string
    sectionOrder: string
  }
  visualBlueprint: VisualBlueprintV1 | null
  visualBlueprintDiagnostics: VisualBlueprintDiagnostic[]
  renderContract: RenderContract
  composition: RealEstateCompositionConfig
  animation: AnimationContract
  visualTheme: RealEstateVisualTheme | null
  visualMood: string
  tokens: CSSProperties
  style: CSSProperties
  className: string
  primaryButtonStyle: CSSProperties
  accentTextStyle: CSSProperties
}

export function resolveAgencyIdentity(config: RealEstateAgencyConfig, baseClassNames: string[] = []): AgencyIdentity {
  const renderContract = resolveRenderContract({
    visualBlueprint: config.visualBlueprint,
    fallbackSectionOrder: config.sectionOrder,
    logoUrl: config.logoUrl,
    heroImage: config.heroImage,
    sectionImages: config.sectionImages,
    typographyHeading: config.typographyHeading,
    typographyBody: config.typographyBody,
    typographyStyle: config.typographyStyle,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    backgroundColor: config.backgroundColor,
  })
  const contactIdentity = resolveAgencyContactIdentity(config)
  const compliance = createDefaultAgencyComplianceConfig(contactIdentity.normalized, config.complianceConfig)
  const visualBlueprint = renderContract.blueprint
  const primary = renderContract.palette.primary
  const accent = renderContract.palette.accent
  const visualSystem = createRealEstateVisualSystem(visualBlueprint, {
    primaryColor: primary,
    accentColor: accent,
  })
  const composition = renderContract.composition
  const animation = resolveAnimationContract(visualBlueprint, {
    privateSurface: baseClassNames.some((className) => className.includes('od-space-page')),
  })
  const visualMood = visualSystem.mood || getBlueprintMood(visualBlueprint)
  const tokens = {
    ...visualSystem.tokens,
    ...composition.tokens,
    ...renderContract.tokens,
    ...animation.tokens,
    '--agency-primary': primary,
    '--agency-accent': accent,
  } as CSSProperties

  return {
    agencyId: config.agencyId,
    agencySlug: config.agencySlug,
    brand: {
      name: config.agencyName,
      city: config.city,
      phone: contactIdentity.normalized.publicContact.publicPhone || config.phone,
      email: contactIdentity.normalized.publicContact.publicEmail || config.email,
      address: contactIdentity.normalized.postalAddress.addressLine1 || config.address,
    },
    contactIdentity,
    compliance,
    logos: {
      logoUrl: renderContract.images.logoUrl,
      lightLogoUrl: getUsableImageSource(visualBlueprint?.brand.lightLogoUrl, ''),
      darkLogoUrl: getUsableImageSource(visualBlueprint?.brand.darkLogoUrl, ''),
    },
    colors: {
      primary,
      secondary: renderContract.palette.secondary,
      accent,
      background: renderContract.palette.background,
    },
    typography: {
      heading: renderContract.typography.heading,
      body: renderContract.typography.body,
      mood: visualBlueprint?.brand.typographyMood || visualSystem.theme?.typographyMood || '',
    },
    assets: {
      heroImage: renderContract.images.heroImage,
      sectionImages: renderContract.images.sectionImages,
    },
    content: {
      heroTitle: resolvePublicHeroTitle(visualBlueprint?.hero.title || config.heroTitle, config.agencyName),
      heroSubtitle: resolvePublicHeroSubtitle(visualBlueprint?.hero.subtitle || config.heroSubtitle),
      primaryCtaLabel: sanitizePublicCopy(visualBlueprint?.hero.cta || config.primaryCtaLabel) || 'Estimer mon bien',
      heroVariant: config.heroVariant || 'premium',
      sectionOrder: composition.sectionOrder.join(','),
    },
    visualBlueprint,
    visualBlueprintDiagnostics: renderContract.diagnostics,
    renderContract,
    composition,
    animation,
    visualTheme: visualSystem.theme,
    visualMood,
    tokens,
    style: {
      ...tokens,
      ...createBlueprintCompatibilityAliases(tokens),
    } as CSSProperties,
    className: [
      'od-page',
      ...baseClassNames,
      ...createBlueprintClassNames(visualBlueprint, visualMood),
      composition.className,
      visualSystem.className,
      animation.className,
    ].filter(Boolean).join(' '),
    primaryButtonStyle: {
      backgroundColor: primary,
      border: `1px solid ${primary}`,
      color: '#fff',
    } as CSSProperties,
    accentTextStyle: { color: accent } as CSSProperties,
  }
}

function createBlueprintClassNames(blueprint: VisualBlueprintV1 | null, mood: string) {
  if (!blueprint) return []

  return [
    'od-agency-identity',
    'od-blueprint-page',
    `od-render-mood-${toClassValue(mood) || 'default'}`,
  ]
}

function createBlueprintCompatibilityAliases(tokens: CSSProperties) {
  // Compatibility aliases only: the Agency Identity source of truth is the --od-token-* set.
  const aliases: { [alias: string]: string } = {}
  const aliasMap = {
    '--bp-nav-height': '--od-token-nav-height',
    '--bp-nav-background': '--od-token-nav-bg',
    '--bp-nav-link-color': '--od-token-nav-color',
    '--bp-nav-gap': '--od-token-nav-gap',
    '--bp-nav-opacity': '--od-token-nav-opacity',
    '--bp-hero-height': '--od-token-hero-height',
    '--bp-hero-overlay': '--od-token-hero-overlay',
    '--bp-hero-mobile-height': '--od-token-hero-mobile-height',
    '--bp-title-width': '--od-token-title-width',
    '--bp-title-size': '--od-token-title-size',
    '--bp-subtitle-size': '--od-token-subtitle-size',
    '--bp-section-spacing': '--od-token-section-spacing',
    '--bp-section-background': '--od-token-section-background',
    '--bp-content-width': '--od-token-container-width',
    '--bp-mobile-spacing': '--od-token-mobile-spacing',
    '--bp-mobile-title-scale': '--od-token-mobile-title-scale',
    '--bp-card-radius': '--od-token-radius-card',
    '--bp-card-gap': '--od-token-grid-gap',
    '--bp-card-ratio': '--od-token-image-ratio',
    '--bp-card-shadow': '--od-token-shadow-card',
    '--bp-button-background': '--od-token-button-bg',
    '--bp-button-color': '--od-token-button-color',
    '--bp-button-border': '--od-token-border',
    '--bp-button-size': '--od-token-button-size',
    '--bp-button-hover': '--od-token-button-hover',
  } as const

  Object.entries(aliasMap).forEach(([alias, source]) => {
    if (tokens[source as keyof CSSProperties]) aliases[alias] = `var(${source})`
  })

  return aliases as CSSProperties
}

function getUsableImageSource(candidate: string | undefined, fallback: string) {
  if (!candidate) return fallback
  const value = candidate.trim()
  if (/^(https?:\/\/|data:image\/|blob:|\/)/i.test(value)) return value
  return fallback
}

function resolvePublicHeroTitle(value: string | undefined, agencyName: string) {
  return sanitizePublicCopy(value) || `${agencyName || 'Votre agence'}, une experience immobiliere claire.`
}

function resolvePublicHeroSubtitle(value: string | undefined) {
  return sanitizePublicCopy(value) || 'Une presentation claire, elegante et suivie a chaque etape.'
}

function sanitizePublicCopy(value?: string) {
  const text = value?.trim() ?? ''
  if (!text) return ''
  if (containsInternalBriefText(text)) return ''
  return text
}

function containsInternalBriefText(value: string) {
  return /(^|\b)(repondre a l['’ ]?enjeu|répondre à l['’ ]?enjeu|objectif\s*:|impression recherch|douleur\s*:|brief\s*:|targetclient|diagnostic|clientbrief|lovableoutput|projectdetail|runtime|agencyid|slug)\b/i.test(value)
}

function getBlueprintMood(blueprint: VisualBlueprintV1 | null) {
  const mood = [
    blueprint?.brand.backgroundPalette,
    blueprint?.brand.typographyMood,
    blueprint?.brand.generalMood,
    blueprint?.brand.graphicStyle,
  ].join(' ').toLowerCase()
  if (/dark|navy|noir|black|night|sombre/.test(mood)) return 'dark'
  if (/cream|warm|beige|sand|chaleur|chaleureux/.test(mood)) return 'warm'
  if (/minimal|white|light|clair/.test(mood)) return 'light'
  return 'default'
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
