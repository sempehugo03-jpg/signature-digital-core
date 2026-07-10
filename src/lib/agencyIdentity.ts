import type { CSSProperties } from 'react'
import type { RealEstateAgencyConfig } from '../data/realEstateTemplate'
import {
  resolveRealEstateComposition,
  type RealEstateCompositionConfig,
} from './realEstateCompositionSystem'
import { createRealEstateVisualSystem } from './realEstateVisualSystem'
import type { RealEstateVisualTheme } from './realEstateVisualThemeEngine'
import {
  parseVisualBlueprintV1Result,
  type VisualBlueprintDiagnostic,
  type VisualBlueprintV1,
} from './visualBlueprint'

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
  composition: RealEstateCompositionConfig
  visualTheme: RealEstateVisualTheme | null
  visualMood: string
  tokens: CSSProperties
  style: CSSProperties
  className: string
  primaryButtonStyle: CSSProperties
  accentTextStyle: CSSProperties
}

export function resolveAgencyIdentity(config: RealEstateAgencyConfig, baseClassNames: string[] = []): AgencyIdentity {
  const visualBlueprintResult = parseVisualBlueprintV1Result(config.visualBlueprint)
  const visualBlueprint = visualBlueprintResult.blueprint
  const primary = normalizeColor(visualBlueprint?.brand.primaryColor) || normalizeColor(config.primaryColor) || '#19191d'
  const accent = normalizeColor(visualBlueprint?.brand.accentColor) || normalizeColor(config.accentColor) || '#b08d57'
  const visualSystem = createRealEstateVisualSystem(visualBlueprint, {
    primaryColor: primary,
    accentColor: accent,
  })
  const composition = resolveRealEstateComposition(visualBlueprint, config.sectionOrder)
  const visualMood = visualSystem.mood || getBlueprintMood(visualBlueprint)
  const tokens = {
    ...visualSystem.tokens,
    ...composition.tokens,
    '--agency-primary': primary,
    '--agency-accent': accent,
  } as CSSProperties

  return {
    agencyId: config.agencyId,
    agencySlug: config.agencySlug,
    brand: {
      name: config.agencyName,
      city: config.city,
      phone: config.phone,
      email: config.email,
      address: config.address,
    },
    logos: {
      logoUrl: getUsableImageSource(visualBlueprint?.brand.logoUrl, config.logoUrl || ''),
      lightLogoUrl: getUsableImageSource(visualBlueprint?.brand.lightLogoUrl, ''),
      darkLogoUrl: getUsableImageSource(visualBlueprint?.brand.darkLogoUrl, ''),
    },
    colors: {
      primary,
      secondary: normalizeColor(config.secondaryColor) || '#f7f2ea',
      accent,
      background: normalizeColor(config.backgroundColor),
    },
    typography: {
      heading: visualBlueprint?.typography.titleStyle || '',
      body: visualBlueprint?.typography.bodyStyle || '',
      mood: visualBlueprint?.brand.typographyMood || visualSystem.theme?.typographyMood || '',
    },
    assets: {
      heroImage: getUsableImageSource(visualBlueprint?.hero.imageUrl, config.heroImage),
    },
    content: {
      heroTitle: visualBlueprint?.hero.title || config.heroTitle || 'Votre bien merite une signature.',
      heroSubtitle: visualBlueprint?.hero.subtitle || config.heroSubtitle,
      primaryCtaLabel: visualBlueprint?.hero.cta || config.primaryCtaLabel || 'Estimer mon bien',
      heroVariant: config.heroVariant || 'premium',
      sectionOrder: composition.sectionOrder.join(','),
    },
    visualBlueprint,
    visualBlueprintDiagnostics: visualBlueprintResult.diagnostics,
    composition,
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
    ].filter(Boolean).join(' '),
    primaryButtonStyle: visualSystem.primaryButtonStyle,
    accentTextStyle: { color: accent } as CSSProperties,
  }
}

function createBlueprintClassNames(blueprint: VisualBlueprintV1 | null, mood: string) {
  if (!blueprint) return []

  return [
    'od-agency-identity',
    'od-blueprint-page',
    `od-bp-nav-${toClassValue(blueprint.navigation.style) || 'default'}`,
    `od-bp-hero-${toClassValue(blueprint.hero.layout) || 'default'}`,
    `od-bp-hero-align-${toClassValue(blueprint.hero.titleAlignment) || 'default'}`,
    `od-bp-hero-cta-${toClassValue(blueprint.hero.buttonPosition) || 'default'}`,
    `od-bp-section-${toClassValue(blueprint.sections.sectionSpacing || blueprint.sections.sectionBackgrounds) || 'default'}`,
    `od-bp-card-${toClassValue(blueprint.propertyCards.cardStyle) || 'default'}`,
    `od-bp-card-image-${toClassValue(blueprint.propertyCards.imageTreatment || blueprint.images.cropStyle) || 'default'}`,
    `od-bp-button-${toClassValue(blueprint.buttons.shape || blueprint.hero.buttonStyle) || 'default'}`,
    `od-bp-image-${toClassValue(blueprint.images.heroImageStyle || blueprint.images.cropStyle) || 'default'}`,
    `od-bp-type-${toClassValue(blueprint.typography.titleStyle || blueprint.brand.typographyMood) || 'default'}`,
    `od-bp-body-${toClassValue(blueprint.typography.bodyStyle) || 'default'}`,
    `od-bp-bg-${mood}`,
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

function normalizeColor(value?: string) {
  if (!value) return ''
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : ''
}

function getUsableImageSource(candidate: string | undefined, fallback: string) {
  if (!candidate) return fallback
  const value = candidate.trim()
  if (/^(https?:\/\/|data:image\/|blob:|\/)/i.test(value)) return value
  return fallback
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
