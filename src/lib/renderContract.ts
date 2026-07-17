import type { CSSProperties } from 'react'
import type {
  PublicHeroAlignment,
  PublicHeroHeadlineScale,
  PublicHeroHeight,
  PublicHeroLayout,
  PublicHeroSurface,
} from './publicHeroSystem'
import type {
  PublicNavigationBehavior,
  PublicNavigationDensity,
  PublicNavigationLogoMode,
  PublicNavigationSurface,
  PublicNavigationVisibility,
} from './publicNavigationSystem'
import type {
  PublicPropertyCardBorder,
  PublicPropertyCardDensity,
  PublicPropertyCardHover,
  PublicPropertyCardImageRatio,
  PublicPropertyCardOrientation,
  PublicPropertyCardPricePosition,
  PublicPropertyCardRadius,
  PublicPropertyCardShadow,
  PublicPropertyCardVariant,
} from './publicPropertyCardSystem'
import type {
  PublicFormDensity,
  PublicFormFieldStyle,
  PublicFormLayout,
  PublicFormVariant,
} from './publicFormSystem'
import type {
  PrivateWorkspaceCardStyle,
  PrivateWorkspaceDensity,
  PrivateWorkspaceNavigation,
  PrivateWorkspaceSurface,
} from './privateWorkspaceSystem'
import {
  resolveRealEstateComposition,
  type PublicRealEstateSectionKey,
  type RealEstateCompositionConfig,
} from './realEstateCompositionSystem'
import {
  parseVisualBlueprintV1Result,
  type VisualBlueprintDiagnostic,
  type VisualBlueprintV1,
} from './visualBlueprint'

export type RenderContractInput = {
  visualBlueprint?: string
  fallbackSectionOrder?: string
  logoUrl?: string
  heroImage?: string
  sectionImages?: string[]
  typographyHeading?: string
  typographyBody?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
}

export type RenderContractDebugRow = {
  label: string
  requested: string
  resolved: string
  applied: string
  status: 'ok' | 'fallback' | 'partial'
}

export type RenderContract = {
  blueprint: VisualBlueprintV1 | null
  diagnostics: VisualBlueprintDiagnostic[]
  composition: RealEstateCompositionConfig
  hero: {
    layout: PublicHeroLayout
    surface: PublicHeroSurface
    height: PublicHeroHeight
    alignment: PublicHeroAlignment
    headlineScale: PublicHeroHeadlineScale
    overlay: 'soft' | 'dark' | 'light' | 'none'
  }
  navigation: {
    surface: PublicNavigationSurface
    density: PublicNavigationDensity
    behavior: PublicNavigationBehavior
    logoMode: PublicNavigationLogoMode
    primaryCta: PublicNavigationVisibility
    privateAccess: PublicNavigationVisibility
  }
  sections: {
    order: PublicRealEstateSectionKey[]
  }
  propertyCards: {
    variant: PublicPropertyCardVariant
    orientation: PublicPropertyCardOrientation
    imageRatio: PublicPropertyCardImageRatio
    density: PublicPropertyCardDensity
    pricePosition: PublicPropertyCardPricePosition
    showBadges: boolean
    radius: PublicPropertyCardRadius
    border: PublicPropertyCardBorder
    shadow: PublicPropertyCardShadow
    spacing: PublicPropertyCardDensity
    hover: PublicPropertyCardHover
    showExcerpt: boolean
    maxFeatures: number
  }
  forms: {
    variant: PublicFormVariant
    density: PublicFormDensity
    layout: PublicFormLayout
    fieldStyle: PublicFormFieldStyle
    buttonStyle: string
  }
  dashboard: {
    density: PrivateWorkspaceDensity
    surface: PrivateWorkspaceSurface
    navigation: PrivateWorkspaceNavigation
    cardStyle: PrivateWorkspaceCardStyle
  }
  palette: {
    primary: string
    secondary: string
    accent: string
    background: string
    source: 'visual-pack' | 'blueprint' | 'fallback'
  }
  typography: {
    heading: string
    body: string
    headingFontFamily: string
    bodyFontFamily: string
    source: 'visual-pack' | 'blueprint' | 'fallback'
  }
  images: {
    logoUrl: string
    heroImage: string
    sectionImages: string[]
    source: 'visual-pack' | 'blueprint' | 'fallback'
  }
  tokens: CSSProperties
  debugRows: RenderContractDebugRow[]
}

const defaultColors = {
  primary: '#19191d',
  secondary: '#f7f2ea',
  accent: '#b08d57',
  background: '#fbfaf7',
}

const propertyCardDefaults: Record<PublicPropertyCardVariant, Omit<RenderContract['propertyCards'], 'maxFeatures'>> = {
  visual: {
    variant: 'visual',
    orientation: 'vertical',
    imageRatio: 'portrait',
    density: 'minimal',
    pricePosition: 'overlay',
    showBadges: false,
    radius: 'rounded',
    border: 'none',
    shadow: 'minimal',
    spacing: 'standard',
    hover: 'image-zoom',
    showExcerpt: false,
  },
  editorial: {
    variant: 'editorial',
    orientation: 'vertical',
    imageRatio: 'portrait',
    density: 'minimal',
    pricePosition: 'content',
    showBadges: false,
    radius: 'subtle',
    border: 'none',
    shadow: 'minimal',
    spacing: 'standard',
    hover: 'image-zoom',
    showExcerpt: true,
  },
  compact: {
    variant: 'compact',
    orientation: 'vertical',
    imageRatio: 'landscape',
    density: 'compact',
    pricePosition: 'top',
    showBadges: true,
    radius: 'rounded',
    border: 'subtle',
    shadow: 'minimal',
    spacing: 'compact',
    hover: 'subtle',
    showExcerpt: false,
  },
  horizontal: {
    variant: 'horizontal',
    orientation: 'horizontal',
    imageRatio: 'landscape',
    density: 'standard',
    pricePosition: 'content',
    showBadges: true,
    radius: 'subtle',
    border: 'subtle',
    shadow: 'minimal',
    spacing: 'standard',
    hover: 'lift',
    showExcerpt: true,
  },
  investment: {
    variant: 'investment',
    orientation: 'vertical',
    imageRatio: 'landscape',
    density: 'compact',
    pricePosition: 'top',
    showBadges: true,
    radius: 'none',
    border: 'strong',
    shadow: 'none',
    spacing: 'compact',
    hover: 'subtle',
    showExcerpt: false,
  },
}

export function resolveRenderContract(input: RenderContractInput): RenderContract {
  const parsed = parseVisualBlueprintV1Result(input.visualBlueprint)
  const blueprint = parsed.blueprint
  const composition = resolveRealEstateComposition(blueprint, input.fallbackSectionOrder)
  const palette = resolvePalette(input, blueprint)
  const typography = resolveTypography(input, blueprint)
  const images = resolveImages(input, blueprint)
  const hero = resolveHero(blueprint, composition)
  const navigation = resolveNavigation(blueprint)
  const propertyCards = resolvePropertyCards(blueprint, composition)
  const forms = resolveForms(blueprint)
  const dashboard = resolveDashboard(blueprint)
  const tokens = {
    '--od-render-heading-font': typography.headingFontFamily,
    '--od-render-body-font': typography.bodyFontFamily,
    '--od-render-hero-object-position': normalizeHeroObjectPosition(blueprint?.hero.imagePosition),
    '--od-token-title-width': normalizeHeroWidth(blueprint?.hero.titleWidth || blueprint?.hero.contentWidth),
    '--od-token-primary': palette.primary,
    '--od-token-accent': palette.accent,
    '--od-token-surface': palette.background,
    '--od-theme-primary': palette.primary,
    '--od-theme-accent': palette.accent,
    '--od-theme-surface': palette.background,
  } as CSSProperties

  return {
    blueprint,
    diagnostics: parsed.diagnostics,
    composition,
    hero,
    navigation,
    sections: {
      order: composition.sectionOrder,
    },
    propertyCards,
    forms,
    dashboard,
    palette,
    typography,
    images,
    tokens,
    debugRows: createDebugRows({
      blueprint,
      hero,
      navigation,
      propertyCards,
      palette,
      typography,
      images,
      sectionOrder: composition.sectionOrder,
    }),
  }
}

function normalizeHeroObjectPosition(value?: string) {
  const cleaned = cleanText(value)
  if (!cleaned) return 'center'
  if (/^(left|center|right)(\s+(top|center|bottom))?$/.test(cleaned)) return cleaned
  if (/^(top|bottom)$/.test(cleaned)) return `center ${cleaned}`
  return 'center'
}

function normalizeHeroWidth(value?: string) {
  const cleaned = cleanText(value)
  return cleaned || '34rem'
}

function resolvePalette(input: RenderContractInput, blueprint: VisualBlueprintV1 | null): RenderContract['palette'] {
  const packPrimary = normalizeNonDefaultColor(input.primaryColor, defaultColors.primary)
  const packSecondary = normalizeNonDefaultColor(input.secondaryColor, defaultColors.secondary)
  const packAccent = normalizeNonDefaultColor(input.accentColor, defaultColors.accent)
  const packBackground = normalizeNonDefaultColor(input.backgroundColor, defaultColors.background)
  const blueprintPrimary = normalizeColor(blueprint?.brand.primaryColor)
  const blueprintAccent = normalizeColor(blueprint?.brand.accentColor)
  const source = packPrimary || packSecondary || packAccent || packBackground
    ? 'visual-pack'
    : blueprintPrimary || blueprintAccent
      ? 'blueprint'
      : 'fallback'

  return {
    primary: packPrimary || blueprintPrimary || normalizeColor(input.primaryColor) || defaultColors.primary,
    secondary: packSecondary || normalizeColor(input.secondaryColor) || defaultColors.secondary,
    accent: packAccent || blueprintAccent || normalizeColor(input.accentColor) || defaultColors.accent,
    background: packBackground || normalizeColor(input.backgroundColor) || defaultColors.background,
    source,
  }
}

function resolveTypography(input: RenderContractInput, blueprint: VisualBlueprintV1 | null): RenderContract['typography'] {
  const packHeading = cleanText(input.typographyHeading)
  const packBody = cleanText(input.typographyBody)
  const blueprintHeading = cleanText(blueprint?.typography.titleStyle || blueprint?.brand.typographyMood)
  const blueprintBody = cleanText(blueprint?.typography.bodyStyle)
  const heading = packHeading || blueprintHeading || 'Editorial serif'
  const body = packBody || blueprintBody || 'Modern sans'
  const source = packHeading || packBody ? 'visual-pack' : blueprintHeading || blueprintBody ? 'blueprint' : 'fallback'

  return {
    heading,
    body,
    headingFontFamily: toFontFamily(heading, 'heading'),
    bodyFontFamily: toFontFamily(body, 'body'),
    source,
  }
}

function resolveImages(input: RenderContractInput, blueprint: VisualBlueprintV1 | null): RenderContract['images'] {
  const packHero = getUsableImageSource(input.heroImage)
  const blueprintHero = getUsableImageSource(blueprint?.hero.imageUrl)
  const logoUrl = getUsableImageSource(input.logoUrl || blueprint?.brand.logoUrl)
  const sectionImages = Array.isArray(input.sectionImages)
    ? input.sectionImages.map((image) => getUsableImageSource(image)).filter(Boolean)
    : []

  return {
    logoUrl,
    heroImage: packHero || blueprintHero || '',
    sectionImages,
    source: packHero || sectionImages.length || logoUrl ? 'visual-pack' : blueprintHero ? 'blueprint' : 'fallback',
  }
}

function resolveHero(blueprint: VisualBlueprintV1 | null, composition: RealEstateCompositionConfig): RenderContract['hero'] {
  const layout = resolveHeroLayout(blueprint?.hero.layout, composition.imageDominance)
  const surface = resolveHeroSurface(blueprint?.hero.surface, blueprint?.hero.overlay, getBlueprintMood(blueprint))
  const height = resolveHeroHeight(blueprint?.hero.height, composition.imageDominance, composition.density)
  const alignment = resolveHeroAlignment(blueprint?.hero.titleAlignment, layout)

  return {
    layout,
    surface,
    height,
    alignment,
    headlineScale: resolveHeroHeadlineScale(blueprint?.hero.headlineScale || blueprint?.hero.titleSize, composition.imageDominance, composition.density),
    overlay: resolveHeroOverlay(blueprint?.hero.overlay, surface),
  }
}

function resolveNavigation(blueprint: VisualBlueprintV1 | null): RenderContract['navigation'] {
  const surface = resolveNavigationSurface(blueprint?.navigation.surface || blueprint?.navigation.style)

  return {
    surface,
    density: toClassValue(blueprint?.navigation.density || blueprint?.navigation.style) === 'compact' ? 'compact' : 'standard',
    behavior: /^(sticky|fixed)$/.test(toClassValue(blueprint?.navigation.behavior || blueprint?.header.behavior || blueprint?.navigation.style)) ? 'sticky' : 'static',
    logoMode: resolveLogoMode(blueprint?.navigation.logoMode),
    primaryCta: toClassValue(blueprint?.navigation.primaryCta) === 'hidden' ? 'hidden' : 'visible',
    privateAccess: toClassValue(blueprint?.navigation.privateAccess) === 'hidden' ? 'hidden' : 'visible',
  }
}

function resolvePropertyCards(blueprint: VisualBlueprintV1 | null, composition: RealEstateCompositionConfig): RenderContract['propertyCards'] {
  const cards = blueprint?.propertyCards
  const variant = resolveCardVariant(cards?.variant || cards?.cardStyle, composition)
  const defaults = propertyCardDefaults[variant]
  const density = resolveCardDensity(cards?.density || cards?.informationStyle, defaults.density)

  return {
    variant,
    orientation: resolveCardOrientation(cards?.orientation, defaults.orientation, variant),
    imageRatio: resolveImageRatio(cards?.imageRatio, defaults.imageRatio),
    density,
    pricePosition: resolvePricePosition(cards?.pricePosition || cards?.priceStyle, defaults.pricePosition),
    showBadges: resolveBooleanVisibility(cards?.badges || cards?.badgeStyle, defaults.showBadges),
    radius: resolveRadius(cards?.radius || cards?.cardRadius, defaults.radius),
    border: resolveBorder(cards?.border, defaults.border),
    shadow: resolveShadow(cards?.shadow || cards?.shadowStyle, defaults.shadow),
    spacing: resolveCardDensity(cards?.spacing, defaults.spacing),
    hover: resolveHover(cards?.hover, defaults.hover),
    showExcerpt: resolveBooleanVisibility(cards?.excerpt, defaults.showExcerpt),
    maxFeatures: resolveMaxFeatures(variant, density),
  }
}

function resolveForms(blueprint: VisualBlueprintV1 | null): RenderContract['forms'] {
  const forms = blueprint?.forms
  return {
    variant: resolveFormVariant(forms?.variant || forms?.style),
    density: resolveFormDensity(forms?.density),
    layout: resolveFormLayout(forms?.layout),
    fieldStyle: resolveFormFieldStyle(forms?.fieldStyle),
    buttonStyle: blueprint?.buttons.shape || 'default',
  }
}

function resolveDashboard(blueprint: VisualBlueprintV1 | null): RenderContract['dashboard'] {
  const dashboard = blueprint?.dashboard
  const style = toClassValue(dashboard?.style)

  return {
    density: resolveWorkspaceDensity(dashboard?.density),
    surface: style === 'minimal' ? 'quiet' : 'elevated',
    navigation: toClassValue(dashboard?.navigation) === 'sidebar' ? 'sidebar' : 'topbar',
    cardStyle: resolveWorkspaceCardStyle(dashboard?.cards || dashboard?.cardStyle),
  }
}

function createDebugRows(input: {
  blueprint: VisualBlueprintV1 | null
  hero: RenderContract['hero']
  navigation: RenderContract['navigation']
  propertyCards: RenderContract['propertyCards']
  palette: RenderContract['palette']
  typography: RenderContract['typography']
  images: RenderContract['images']
  sectionOrder: PublicRealEstateSectionKey[]
}): RenderContractDebugRow[] {
  return [
    row('Hero', [
      input.blueprint?.hero.layout,
      input.blueprint?.hero.surface,
      input.blueprint?.hero.height,
      input.blueprint?.hero.titleAlignment,
    ], [
      input.hero.layout,
      input.hero.surface,
      input.hero.height,
      input.hero.alignment,
    ], [
      `od-hero-layout-${input.hero.layout}`,
      `od-hero-surface-${input.hero.surface}`,
      `od-hero-height-${input.hero.height}`,
    ], input.blueprint?.hero.layout ? 'ok' : 'fallback'),
    row('Navigation', [
      input.blueprint?.navigation.surface || input.blueprint?.navigation.style,
      input.blueprint?.navigation.density,
      input.blueprint?.navigation.behavior,
    ], [
      input.navigation.surface,
      input.navigation.density,
      input.navigation.behavior,
    ], [
      `od-public-nav-surface-${input.navigation.surface}`,
      `od-public-nav-density-${input.navigation.density}`,
    ], input.blueprint?.navigation.surface || input.blueprint?.navigation.style ? 'ok' : 'fallback'),
    row('Palette', [
      input.blueprint?.brand.primaryColor,
      input.blueprint?.brand.accentColor,
    ], [
      input.palette.primary,
      input.palette.secondary,
      input.palette.accent,
      input.palette.background,
    ], [
      '--od-token-primary',
      '--od-token-accent',
      '--agency-primary',
    ], input.palette.source === 'fallback' ? 'fallback' : 'ok'),
    row('Typographies', [
      input.blueprint?.typography.titleStyle || input.blueprint?.brand.typographyMood,
      input.blueprint?.typography.bodyStyle,
    ], [
      input.typography.heading,
      input.typography.body,
    ], [
      '--od-render-heading-font',
      '--od-render-body-font',
    ], input.typography.source === 'fallback' ? 'fallback' : 'ok'),
    row('Cartes', [
      input.blueprint?.propertyCards.variant || input.blueprint?.propertyCards.cardStyle,
      input.blueprint?.propertyCards.imageRatio,
      input.blueprint?.propertyCards.density,
    ], [
      input.propertyCards.variant,
      input.propertyCards.imageRatio,
      input.propertyCards.density,
    ], [
      `od-property-card-variant-${input.propertyCards.variant}`,
      `od-property-card-ratio-${input.propertyCards.imageRatio}`,
    ], input.blueprint?.propertyCards.variant || input.blueprint?.propertyCards.cardStyle ? 'ok' : 'fallback'),
    row('SectionOrder', [input.blueprint?.sections.sectionOrder], [input.sectionOrder.join(', ')], ['resolvePublicSections.order'], input.blueprint?.sections.sectionOrder ? 'ok' : 'fallback'),
    row('Images', [
      input.blueprint?.hero.imageUrl,
      input.blueprint?.brand.logoUrl,
    ], [
      input.images.heroImage || 'fallback actuel',
      `${input.images.sectionImages.length} image(s) section`,
      input.images.logoUrl || 'logo absent',
    ], ['Hero image', 'images sections'], input.images.source === 'fallback' ? 'fallback' : input.images.sectionImages.length ? 'ok' : 'partial'),
  ]
}

function row(label: string, requested: Array<string | undefined>, resolved: string[], applied: string[], status: RenderContractDebugRow['status']): RenderContractDebugRow {
  return {
    label,
    requested: requested.filter(Boolean).join(' / ') || 'Non demande',
    resolved: resolved.filter(Boolean).join(' / ') || 'Fallback',
    applied: applied.filter(Boolean).join(' / ') || 'Fallback CSS',
    status,
  }
}

function resolveHeroLayout(value: string | undefined, imageDominance: string): PublicHeroLayout {
  const normalized = toClassValue(value)
  if (normalized === 'full' || normalized === 'full-bleed' || normalized === 'fullscreen' || normalized === 'image-overlay') return 'full'
  if (normalized === 'split-left' || normalized === 'split') return 'split-left'
  if (normalized === 'split-right') return 'split-right'
  if (normalized === 'center' || normalized === 'centered' || normalized === 'centered-statement') return 'centered'
  if (normalized === 'minimal') return 'minimal'
  if (imageDominance === 'strong') return 'full'
  if (imageDominance === 'data') return 'split-right'
  return 'split-left'
}

function resolveHeroSurface(value: string | undefined, overlay: string | undefined, mood: string): PublicHeroSurface {
  const normalized = toClassValue(value || overlay || mood)
  if (normalized === 'light' || normalized === 'dark' || normalized === 'transparent') return normalized
  if (/dark|navy|black|night|cinematic|luxury/.test(normalized)) return 'dark'
  if (/minimal|white|cream|warm|light/.test(normalized)) return 'light'
  return 'dark'
}

function resolveHeroHeight(value: string | undefined, imageDominance: string, density: string): PublicHeroHeight {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'standard' || normalized === 'large' || normalized === 'screen') return normalized
  if (normalized === 'full' || normalized === 'fullscreen' || normalized === 'full-bleed' || normalized === '100svh') return 'screen'
  if (density === 'high') return 'standard'
  if (imageDominance === 'strong') return 'screen'
  return 'large'
}

function resolveHeroAlignment(value: string | undefined, layout: PublicHeroLayout): PublicHeroAlignment {
  const normalized = toClassValue(value)
  if (normalized === 'center' || normalized === 'centered') return 'center'
  if (layout === 'centered') return 'center'
  return 'left'
}

function resolveHeroHeadlineScale(value: string | undefined, imageDominance: string, density: string): PublicHeroHeadlineScale {
  const normalized = toClassValue(value)
  if (normalized === 'display' || normalized === 'xl' || normalized === 'lg') return normalized
  if (density === 'high') return 'lg'
  if (imageDominance === 'strong') return 'display'
  return 'xl'
}

function resolveHeroOverlay(value: string | undefined, surface: PublicHeroSurface) {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'light' || normalized === 'dark' || normalized === 'soft') return normalized
  if (surface === 'light') return 'light'
  if (surface === 'transparent') return 'soft'
  return 'dark'
}

function resolveNavigationSurface(value?: string): PublicNavigationSurface {
  const normalized = toClassValue(value)
  if (normalized === 'light' || normalized === 'dark' || normalized === 'transparent') return normalized
  if (normalized === 'solid' || normalized === 'opaque' || normalized === 'white') return 'light'
  if (normalized === 'black' || normalized === 'navy') return 'dark'
  return 'transparent'
}

function resolveLogoMode(value?: string): PublicNavigationLogoMode {
  const normalized = toClassValue(value)
  if (normalized === 'light' || normalized === 'dark') return normalized
  return 'auto'
}

function resolveCardVariant(value: string | undefined, composition: RealEstateCompositionConfig): PublicPropertyCardVariant {
  const normalized = toClassValue(value)
  if (normalized === 'visual' || normalized === 'editorial' || normalized === 'compact' || normalized === 'horizontal' || normalized === 'investment') return normalized
  if (normalized === 'magazine' || normalized === 'editorial-grid' || normalized === 'luxury-shadow') return 'editorial'
  if (normalized === 'minimal') return 'visual'
  if (normalized === 'structured') return 'compact'
  if (composition.imageDominance === 'strong') return 'visual'
  if (composition.imageDominance === 'data') return 'investment'
  if (composition.density === 'high') return 'compact'
  return 'editorial'
}

function resolveCardOrientation(value: string | undefined, fallback: PublicPropertyCardOrientation, variant: PublicPropertyCardVariant) {
  const normalized = toClassValue(value)
  if (normalized === 'horizontal') return 'horizontal'
  if (normalized === 'vertical') return 'vertical'
  return variant === 'horizontal' ? 'horizontal' : fallback
}

function resolveImageRatio(value: string | undefined, fallback: PublicPropertyCardImageRatio): PublicPropertyCardImageRatio {
  const normalized = toClassValue(value)
  const compact = value?.replace(/\s+/g, '') ?? ''
  if (normalized === 'portrait' || compact === '4/5') return 'portrait'
  if (normalized === 'landscape' || compact === '16/10' || compact === '3/2') return 'landscape'
  if (normalized === 'square' || compact === '1/1') return 'square'
  if (normalized === 'cinematic' || compact === '16/9') return 'cinematic'
  return fallback
}

function resolveCardDensity(value: string | undefined, fallback: PublicPropertyCardDensity): PublicPropertyCardDensity {
  const normalized = toClassValue(value)
  if (normalized === 'minimal' || normalized === 'standard' || normalized === 'compact') return normalized
  return fallback
}

function resolvePricePosition(value: string | undefined, fallback: PublicPropertyCardPricePosition): PublicPropertyCardPricePosition {
  const normalized = toClassValue(value)
  if (normalized === 'top' || normalized === 'content' || normalized === 'footer' || normalized === 'overlay') return normalized
  return fallback
}

function resolveBooleanVisibility(value: string | undefined, fallback: boolean) {
  const normalized = toClassValue(value)
  if (normalized === 'visible') return true
  if (normalized === 'hidden') return false
  return fallback
}

function resolveRadius(value: string | undefined, fallback: PublicPropertyCardRadius): PublicPropertyCardRadius {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === '0' || normalized === '0px') return 'none'
  if (normalized === 'subtle') return 'subtle'
  if (normalized === 'rounded') return 'rounded'
  return fallback
}

function resolveBorder(value: string | undefined, fallback: PublicPropertyCardBorder): PublicPropertyCardBorder {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'subtle' || normalized === 'strong') return normalized
  return fallback
}

function resolveShadow(value: string | undefined, fallback: PublicPropertyCardShadow): PublicPropertyCardShadow {
  const normalized = toClassValue(value)
  if (normalized === 'none') return 'none'
  if (normalized === 'minimal' || normalized === 'soft') return 'minimal'
  if (normalized === 'elevated' || normalized === 'medium' || normalized === 'deep' || normalized === 'luxury') return 'elevated'
  return fallback
}

function resolveHover(value: string | undefined, fallback: PublicPropertyCardHover): PublicPropertyCardHover {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'subtle' || normalized === 'lift' || normalized === 'image-zoom') return normalized
  return fallback
}

function resolveMaxFeatures(variant: PublicPropertyCardVariant, density: PublicPropertyCardDensity) {
  if (variant === 'visual') return 2
  if (variant === 'investment' || density === 'compact') return 4
  return 3
}

function resolveFormVariant(value?: string): PublicFormVariant {
  const normalized = toClassValue(value)
  if (normalized === 'minimal' || normalized === 'standard' || normalized === 'guided') return normalized
  return 'standard'
}

function resolveFormDensity(value?: string): PublicFormDensity {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'airy') return normalized
  return 'standard'
}

function resolveFormLayout(value?: string): PublicFormLayout {
  return toClassValue(value) === 'split' ? 'split' : 'stacked'
}

function resolveFormFieldStyle(value?: string): PublicFormFieldStyle {
  const normalized = toClassValue(value)
  if (normalized === 'line' || normalized === 'filled') return normalized
  return 'bordered'
}

function resolveWorkspaceDensity(value?: string): PrivateWorkspaceDensity {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'airy') return normalized
  return 'standard'
}

function resolveWorkspaceCardStyle(value?: string): PrivateWorkspaceCardStyle {
  const normalized = toClassValue(value)
  if (normalized === 'flat' || normalized === 'bordered') return normalized
  return 'elevated'
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

function toFontFamily(value: string, role: 'heading' | 'body') {
  const cleaned = value
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
    .slice(0, 2)

  if (cleaned.length && !cleaned.some((item) => /style|mood|serif premium|modern sans|mixed editorial/i.test(item))) {
    return cleaned.map(quoteFontFamily).join(', ') + ', ' + (role === 'heading' ? 'ui-serif, Georgia, serif' : 'ui-sans-serif, system-ui, sans-serif')
  }

  if (/modern|sans|minimal|institutional/i.test(value)) return 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  return '"Playfair Display", Georgia, ui-serif, serif'
}

function quoteFontFamily(value: string) {
  if (/^(ui-|serif|sans-serif|monospace|system-ui|inherit|initial|unset)$/i.test(value)) return value
  return `"${value.replace(/"/g, '')}"`
}

function normalizeNonDefaultColor(value: string | undefined, defaultValue: string) {
  const color = normalizeColor(value)
  if (!color) return ''
  return color.toLowerCase() === defaultValue.toLowerCase() ? '' : color
}

function normalizeColor(value?: string) {
  if (!value) return ''
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : ''
}

function cleanText(value?: string) {
  return value?.trim() ?? ''
}

function getUsableImageSource(candidate?: string) {
  if (!candidate) return ''
  const value = candidate.trim()
  if (/^(https?:\/\/|data:image\/|blob:|\/)/i.test(value)) return value
  return ''
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
