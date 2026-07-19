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
  typographyStyle?: RenderTypographyStyle
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
}

export type RenderTypographyStyle = {
  displayWeight?: string
  displayTracking?: string
  italicAccent?: boolean
  bodyWeight?: string
  bodySize?: string
  eyebrowCase?: string
  eyebrowTracking?: string
  eyebrowSize?: string
  headlineScale?: string
  verticalRhythm?: string
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
  buttons: {
    variant: 'solid' | 'outline' | 'text'
    shape: string
    size: string
    border: string
    background: string
    textColor: string
    hover: 'none' | 'subtle' | 'lift'
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
    displayWeight: string
    displayTracking: string
    italicAccent: boolean
    bodyWeight: string
    bodySize: string
    eyebrowCase: string
    eyebrowTracking: string
    eyebrowSize: string
    verticalRhythm: string
    source: 'visual-pack' | 'blueprint' | 'fallback'
  }
  layout: {
    contentWidth: string
    narrowWidth: string
    sectionPaddingX: string
    sectionPaddingY: string
    mobileSectionPaddingY: string
    blockGap: string
    gridGap: string
    heroHeight: string
    heroMinHeight: string
    heroContentBottom: string
    heroContentGap: string
    heroCopyGap: string
    heroCtaMargin: string
    textImageColumns: string
    density: string
    source: 'blueprint' | 'composition' | 'fallback'
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
  const layout = resolveLayout(input, blueprint, composition, typography)
  const images = resolveImages(input, blueprint)
  const hero = resolveHero(input.visualBlueprint, blueprint, composition)
  const navigation = resolveNavigation(blueprint)
  const propertyCards = resolvePropertyCards(blueprint, composition)
  const forms = resolveForms(blueprint)
  const buttons = resolveButtons(blueprint, palette)
  const dashboard = resolveDashboard(blueprint)
  const tokens = {
    '--od-render-heading-font': typography.headingFontFamily,
    '--od-render-body-font': typography.bodyFontFamily,
    '--od-render-display-weight': typography.displayWeight,
    '--od-render-display-tracking': typography.displayTracking,
    '--od-render-display-font-style': typography.italicAccent ? 'italic' : 'normal',
    '--od-render-body-weight': typography.bodyWeight,
    '--od-render-body-size': typography.bodySize,
    '--od-render-eyebrow-transform': typography.eyebrowCase,
    '--od-render-eyebrow-tracking': typography.eyebrowTracking,
    '--od-render-eyebrow-size': typography.eyebrowSize,
    '--od-render-vertical-rhythm': typography.verticalRhythm,
    '--od-render-content-width': layout.contentWidth,
    '--od-render-narrow-width': layout.narrowWidth,
    '--od-render-section-padding-x': layout.sectionPaddingX,
    '--od-render-section-padding-y': layout.sectionPaddingY,
    '--od-render-mobile-section-padding-y': layout.mobileSectionPaddingY,
    '--od-render-block-gap': layout.blockGap,
    '--od-render-grid-gap': layout.gridGap,
    '--od-render-hero-height': layout.heroHeight,
    '--od-render-hero-min-height': layout.heroMinHeight,
    '--od-render-hero-content-bottom': layout.heroContentBottom,
    '--od-render-hero-content-gap': layout.heroContentGap,
    '--od-render-hero-copy-gap': layout.heroCopyGap,
    '--od-render-hero-cta-margin': layout.heroCtaMargin,
    '--od-render-text-image-columns': layout.textImageColumns,
    '--od-render-hero-object-position': normalizeHeroObjectPosition(blueprint?.hero.imagePosition),
    '--od-token-title-width': normalizeHeroWidth(blueprint?.hero.titleWidth || blueprint?.hero.contentWidth),
    '--od-token-primary': palette.primary,
    '--od-token-accent': palette.accent,
    '--od-token-surface': palette.background,
    '--od-token-button-bg': buttons.background,
    '--od-token-button-color': buttons.textColor,
    '--od-token-button-border': buttons.border,
    '--od-token-button-size': buttons.size,
    '--od-token-radius-button': resolveButtonRadius(buttons.shape),
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
    buttons,
    dashboard,
    palette,
    typography,
    layout,
    images,
    tokens,
    debugRows: createDebugRows({
      blueprint,
      hero,
      navigation,
      propertyCards,
      palette,
      typography,
      layout,
      images,
      buttons,
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
  const blueprintStyle = extractTypographyStyleFromBlueprintRaw(input.visualBlueprint)
  const style = { ...blueprintStyle, ...input.typographyStyle }
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
    displayWeight: normalizeFontWeight(style.displayWeight, '600'),
    displayTracking: normalizeTracking(style.displayTracking, '0'),
    italicAccent: Boolean(style.italicAccent),
    bodyWeight: normalizeFontWeight(style.bodyWeight, '400'),
    bodySize: normalizeLengthToken(style.bodySize, '1rem'),
    eyebrowCase: normalizeTextTransform(style.eyebrowCase),
    eyebrowTracking: normalizeTracking(style.eyebrowTracking, '0.16em'),
    eyebrowSize: normalizeLengthToken(style.eyebrowSize, '0.72rem'),
    verticalRhythm: normalizeLengthToken(style.verticalRhythm, '1.35rem'),
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

function resolveHero(rawBlueprint: string | undefined, blueprint: VisualBlueprintV1 | null, composition: RealEstateCompositionConfig): RenderContract['hero'] {
  const typographyStyle = extractTypographyStyleFromBlueprintRaw(rawBlueprint)
  const layout = resolveHeroLayout(blueprint?.hero.layout, composition.imageDominance)
  const surface = resolveHeroSurface(blueprint?.hero.surface, blueprint?.hero.overlay, getBlueprintMood(blueprint))
  const height = resolveHeroHeight(blueprint?.hero.height, composition.imageDominance, composition.density)
  const alignment = resolveHeroAlignment(blueprint?.hero.titleAlignment, layout)

  return {
    layout,
    surface,
    height,
    alignment,
    headlineScale: resolveHeroHeadlineScale(blueprint?.hero.headlineScale || blueprint?.hero.titleSize || typographyStyle.headlineScale, composition.imageDominance, composition.density),
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

function resolveLayout(
  input: RenderContractInput,
  blueprint: VisualBlueprintV1 | null,
  composition: RealEstateCompositionConfig,
  typography: RenderContract['typography'],
): RenderContract['layout'] {
  const rawLayout = extractLayoutStyleFromBlueprintRaw(input.visualBlueprint)
  const density = resolveLayoutDensity(blueprint?.layout.density || blueprint?.grid.density || rawLayout.density || composition.density)
  const contentWidth = normalizeCssLengthToken(blueprint?.container.maxWidth || blueprint?.container.width || blueprint?.sections.contentWidth, composition.contentWidth)
  const sectionPaddingX = normalizeCssLengthToken(blueprint?.container.padding || rawLayout.sectionPaddingX, density === 'dense' ? 'clamp(1rem, 3vw, 2rem)' : 'clamp(1.25rem, 4vw, 3rem)')
  const sectionPaddingY = normalizeSpacingToken(blueprint?.sections.sectionSpacing || rawLayout.sectionPaddingY, composition.sectionSpacing, density)
  const mobileSectionPaddingY = normalizeSpacingToken(blueprint?.responsive.mobileSpacing || rawLayout.mobileSectionPaddingY, composition.mobileSpacing, density)
  const gridGap = normalizeCssLengthToken(blueprint?.grid.gap || blueprint?.propertyCards.spacing || rawLayout.gridGap, spacingScale(density).gridGap)
  const blockGap = normalizeCssLengthToken(rawLayout.blockGap || typography.verticalRhythm, spacingScale(density).blockGap)
  const heroHeight = normalizeHeroHeightToken(blueprint?.hero.height, density)
  const heroMinHeight = heroHeight === 'min(62svh, 620px)' ? '460px' : heroHeight === 'min(78svh, 760px)' ? '560px' : '640px'
  const heroContentBottom = normalizeCssLengthToken(rawLayout.heroContentBottom, spacingScale(density).heroContentBottom)
  const heroContentGap = normalizeCssLengthToken(rawLayout.heroContentGap, spacingScale(density).heroContentGap)
  const heroCopyGap = normalizeCssLengthToken(rawLayout.heroCopyGap, spacingScale(density).heroCopyGap)
  const heroCtaMargin = normalizeCssLengthToken(rawLayout.heroCtaMargin, spacingScale(density).heroCtaMargin)

  return {
    contentWidth,
    narrowWidth: normalizeCssLengthToken(blueprint?.sections.contentWidth, composition.narrowWidth),
    sectionPaddingX,
    sectionPaddingY,
    mobileSectionPaddingY,
    blockGap,
    gridGap,
    heroHeight,
    heroMinHeight,
    heroContentBottom,
    heroContentGap,
    heroCopyGap,
    heroCtaMargin,
    textImageColumns: resolveTextImageColumns(blueprint?.hero.contentWidth || blueprint?.hero.titleWidth, density),
    density,
    source: blueprint?.container.maxWidth || blueprint?.container.width || blueprint?.container.padding || blueprint?.sections.sectionSpacing || blueprint?.grid.gap || blueprint?.layout.density || blueprint?.responsive.mobileSpacing
      ? 'blueprint'
      : composition.id
        ? 'composition'
        : 'fallback',
  }
}

function resolveButtons(blueprint: VisualBlueprintV1 | null, palette: RenderContract['palette']): RenderContract['buttons'] {
  const buttons = blueprint?.buttons
  const variant = resolveButtonVariant(buttons?.variant)
  const shape = resolveButtonShape(buttons?.shape || blueprint?.hero.buttonStyle)
  const background = normalizeColor(buttons?.background) || palette.primary
  const textColor = normalizeColor(buttons?.textColor) || '#ffffff'
  const border = buttons?.borderStyle || (variant === 'outline' ? `1px solid ${background}` : '1px solid transparent')

  return {
    variant,
    shape,
    size: buttons?.size || '3.5rem',
    border,
    background,
    textColor,
    hover: resolveButtonHover(buttons?.hover),
  }
}

function resolveButtonVariant(value?: string): RenderContract['buttons']['variant'] {
  const normalized = toClassValue(value)
  if (normalized === 'outline' || normalized === 'text') return normalized
  return 'solid'
}

function resolveButtonShape(value?: string): string {
  const normalized = toClassValue(value)
  if (['sharp', 'soft', 'subtle', 'luxury-gold', 'rounded', 'none'].includes(normalized)) return normalized
  return 'pill'
}

function resolveButtonHover(value?: string): RenderContract['buttons']['hover'] {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'lift') return normalized
  return 'subtle'
}

function resolveButtonRadius(shape: string) {
  if (shape === 'sharp' || shape === 'none') return '0'
  if (shape === 'subtle' || shape === 'luxury-gold') return '0.45rem'
  if (shape === 'soft' || shape === 'rounded') return '1rem'
  return '999px'
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
  layout: RenderContract['layout']
  images: RenderContract['images']
  buttons: RenderContract['buttons']
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
    row('Boutons', [
      input.blueprint?.buttons.variant,
      input.blueprint?.buttons.shape,
      input.blueprint?.buttons.size,
      input.blueprint?.buttons.background,
      input.blueprint?.buttons.textColor,
      input.blueprint?.buttons.borderStyle,
      input.blueprint?.buttons.hover,
    ], [
      input.buttons.variant,
      input.buttons.shape,
      input.buttons.size,
      input.buttons.background,
      input.buttons.textColor,
      input.buttons.border,
      input.buttons.hover,
    ], [
      `od-public-cta-variant-${input.buttons.variant}`,
      `od-public-cta-shape-${input.buttons.shape}`,
      `od-public-cta-hover-${input.buttons.hover}`,
      '--od-token-button-bg',
      '--od-token-button-size',
      '--od-token-radius-button',
    ], input.blueprint?.buttons.variant || input.blueprint?.buttons.shape ? 'ok' : 'fallback'),
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
      input.blueprint?.typography.display,
      input.blueprint?.typography.sans,
    ], [
      input.typography.heading,
      input.typography.body,
      input.typography.displayWeight,
      input.typography.displayTracking,
      input.typography.bodyWeight,
      input.typography.bodySize,
      input.typography.eyebrowCase,
      input.typography.eyebrowTracking,
    ], [
      '--od-render-heading-font',
      '--od-render-body-font',
      '--od-render-display-weight',
      '--od-render-display-tracking',
      '--od-render-body-weight',
      '--od-render-body-size',
      '--od-render-eyebrow-transform',
      '--od-render-eyebrow-tracking',
    ], input.typography.source === 'fallback' ? 'fallback' : 'ok'),
    row('Rythme et proportions', [
      input.blueprint?.container.maxWidth || input.blueprint?.container.width,
      input.blueprint?.container.padding,
      input.blueprint?.sections.sectionSpacing,
      input.blueprint?.responsive.mobileSpacing,
      input.blueprint?.grid.gap,
      input.blueprint?.layout.density,
      input.blueprint?.hero.height,
    ], [
      input.layout.contentWidth,
      input.layout.sectionPaddingX,
      input.layout.sectionPaddingY,
      input.layout.mobileSectionPaddingY,
      input.layout.gridGap,
      input.layout.blockGap,
      input.layout.heroHeight,
      input.layout.density,
    ], [
      '--od-render-content-width',
      '--od-render-section-padding-x',
      '--od-render-section-padding-y',
      '--od-render-mobile-section-padding-y',
      '--od-render-grid-gap',
      '--od-render-block-gap',
      '--od-render-hero-height',
    ], input.layout.source === 'fallback' ? 'fallback' : 'ok'),
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

function extractTypographyStyleFromBlueprintRaw(raw?: string): RenderTypographyStyle {
  if (!raw) return {}
  const typographySection = readYamlSection(raw, 'typography')
  const heroSection = readYamlSection(raw, 'hero')
  if (!typographySection && !heroSection) return {}
  const displaySection = readYamlSection(typographySection, 'display')
  const bodySection = readYamlSection(typographySection, 'body')
  const eyebrowSection = readYamlSection(typographySection, 'eyebrow')

  return {
    displayWeight: readYamlScalar(displaySection, 'weight'),
    displayTracking: readYamlScalar(displaySection, 'tracking'),
    italicAccent: parseBoolean(readYamlScalar(displaySection, 'italicAccent')),
    bodyWeight: readYamlScalar(bodySection, 'weight'),
    bodySize: readYamlScalar(bodySection, 'size'),
    eyebrowCase: readYamlScalar(eyebrowSection, 'case'),
    eyebrowTracking: readYamlScalar(eyebrowSection, 'tracking'),
    eyebrowSize: readYamlScalar(eyebrowSection, 'size'),
    headlineScale: readYamlScalar(typographySection, 'headlineScale') || readYamlScalar(heroSection, 'headlineScale'),
    verticalRhythm: readYamlScalar(typographySection, 'verticalRhythm'),
  }
}

function readYamlSection(raw: string, key: string): string {
  const lines = raw.split(/\r?\n/)
  const start = lines.findIndex((line) => new RegExp(`^\\s*${key}\\s*:\\s*$`, 'i').test(line))
  if (start < 0) return ''
  const baseIndent = lineIndent(lines[start])
  const collected: string[] = []

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() && lineIndent(line) <= baseIndent && /^[A-Za-z][\w-]*\s*:/.test(line.trim())) break
    collected.push(line.slice(Math.min(line.length, baseIndent + 2)))
  }

  return collected.join('\n')
}

function readYamlScalar(raw: string, key: string): string {
  const match = raw.match(new RegExp(`^\\s*${key}\\s*:\\s*([^\\n]+)$`, 'im'))
  return cleanText(match?.[1]?.replace(/^["']|["']$/g, ''))
}

function lineIndent(line: string) {
  return line.match(/^\s*/)?.[0].length ?? 0
}

function parseBoolean(value: string | undefined) {
  return /^(true|yes|oui|1)$/i.test(value ?? '')
}

function toFontFamily(value: string, role: 'heading' | 'body') {
  const cleaned = value
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
    .slice(0, 2)

  if (cleaned.length && !cleaned.some((item) => /style|mood|serif premium|modern sans|mixed editorial/i.test(item))) {
    return cleaned.map(quoteFontFamily).join(', ') + ', ' + (role === 'heading' ? 'ui-serif, serif' : 'ui-sans-serif, system-ui, sans-serif')
  }

  if (/modern|sans|minimal|institutional/i.test(value)) return 'ui-sans-serif, system-ui, sans-serif'
  return 'ui-serif, serif'
}

function normalizeFontWeight(value: string | undefined, fallback: string) {
  const normalized = cleanText(value)
  if (/^[1-9]00$/.test(normalized)) return normalized
  if (/^(normal|bold|lighter|bolder)$/i.test(normalized)) return normalized.toLowerCase()
  if (/light|thin/i.test(normalized)) return '300'
  if (/medium/i.test(normalized)) return '500'
  if (/semi|demi/i.test(normalized)) return '600'
  if (/bold|strong|fort/i.test(normalized)) return '700'
  return fallback
}

function normalizeTracking(value: string | undefined, fallback: string) {
  const normalized = cleanText(value)
  if (/^-?\d+(\.\d+)?(em|rem|px)$/.test(normalized)) return normalized
  if (/tight|serre|serré/i.test(normalized)) return '-0.02em'
  if (/wide|large|spac/i.test(normalized)) return '0.16em'
  if (/none|normal|0/.test(normalized)) return '0'
  return fallback
}

function normalizeLengthToken(value: string | undefined, fallback: string) {
  const normalized = cleanText(value)
  if (/^\d+(\.\d+)?(rem|em|px|%)$/.test(normalized)) return normalized
  if (/compact|dense|small|petit/i.test(normalized)) return '0.95rem'
  if (/large|grand/i.test(normalized)) return '1.12rem'
  return fallback
}

function normalizeCssLengthToken(value: string | undefined, fallback: string) {
  const normalized = cleanText(value).toLowerCase()
  if (/^\d+(\.\d+)?(rem|em|px|%|vw|vh|svh)$/.test(normalized)) return normalized
  if (/^clamp\([0-9a-z.,% -]+\)$/.test(normalized)) return normalized
  if (/^(min|max)\([0-9a-z.,% /-]+\)$/.test(normalized)) return normalized
  return fallback
}

function normalizeSpacingToken(value: string | undefined, fallback: string, density: string) {
  const normalized = toClassValue(value)
  const cssLength = normalizeCssLengthToken(value, '')
  if (cssLength) return cssLength
  const scale = spacingScale(density)
  if (normalized === 'compact' || normalized === 'dense') return scale.compactSection
  if (normalized === 'airy' || normalized === 'editorial') return scale.airySection
  if (normalized === 'luxury' || normalized === 'premium') return scale.luxurySection
  if (normalized === 'balanced' || normalized === 'standard') return scale.section
  return normalizeCssLengthToken(fallback, scale.section)
}

function normalizeHeroHeightToken(value: string | undefined, density: string) {
  const normalized = toClassValue(value)
  const cssLength = normalizeCssLengthToken(value, '')
  if (cssLength) return cssLength
  if (normalized === 'compact') return 'min(62svh, 620px)'
  if (normalized === 'standard') return 'min(78svh, 760px)'
  if (normalized === 'screen' || normalized === 'full' || normalized === 'fullscreen' || normalized === 'full-bleed') return 'min(100svh, 960px)'
  if (density === 'dense') return 'min(68svh, 680px)'
  return 'min(90svh, 860px)'
}

function resolveLayoutDensity(value: string | undefined) {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'dense' || normalized === 'high') return 'dense'
  if (normalized === 'airy' || normalized === 'editorial' || normalized === 'low' || normalized === 'luxury' || normalized === 'premium') return 'airy'
  return 'balanced'
}

function spacingScale(density: string) {
  if (density === 'dense') {
    return {
      section: 'clamp(4rem, 6vw, 5.75rem)',
      compactSection: 'clamp(3rem, 5vw, 4.5rem)',
      airySection: 'clamp(5rem, 8vw, 7rem)',
      luxurySection: 'clamp(5.5rem, 9vw, 7.5rem)',
      blockGap: '0.95rem',
      gridGap: 'clamp(0.75rem, 1.6vw, 1.1rem)',
      heroContentBottom: 'clamp(2.5rem, 6vh, 4rem)',
      heroContentGap: '0.85rem',
      heroCopyGap: '0.85rem',
      heroCtaMargin: '1.35rem',
    }
  }
  if (density === 'airy') {
    return {
      section: 'clamp(7rem, 11vw, 10rem)',
      compactSection: 'clamp(5.5rem, 8vw, 7rem)',
      airySection: 'clamp(8rem, 13vw, 11rem)',
      luxurySection: 'clamp(8.5rem, 14vw, 12rem)',
      blockGap: '1.65rem',
      gridGap: 'clamp(1.4rem, 3vw, 2.35rem)',
      heroContentBottom: 'clamp(4.5rem, 11vh, 8rem)',
      heroContentGap: '1.65rem',
      heroCopyGap: '1.45rem',
      heroCtaMargin: '3rem',
    }
  }
  return {
    section: 'clamp(5.5rem, 8vw, 7.5rem)',
    compactSection: 'clamp(4.5rem, 7vw, 6rem)',
    airySection: 'clamp(6.5rem, 10vw, 8.5rem)',
    luxurySection: 'clamp(7rem, 11vw, 9rem)',
    blockGap: '1.25rem',
    gridGap: 'clamp(1rem, 2.2vw, 1.5rem)',
    heroContentBottom: 'clamp(3.5rem, 9vh, 6rem)',
    heroContentGap: '1.25rem',
    heroCopyGap: '1.15rem',
    heroCtaMargin: '2.2rem',
  }
}

function resolveTextImageColumns(value: string | undefined, density: string) {
  const width = normalizeCssLengthToken(value, '')
  if (width) return `minmax(0, ${width}) minmax(0, 1fr)`
  if (density === 'dense') return 'minmax(0, 0.9fr) minmax(0, 1fr)'
  if (density === 'airy') return 'minmax(0, 0.82fr) minmax(0, 1.18fr)'
  return 'minmax(0, 1fr) minmax(0, 1fr)'
}

function extractLayoutStyleFromBlueprintRaw(raw?: string) {
  if (!raw) return {}
  const layoutSection = readYamlSection(raw, 'layout')
  const sectionsSection = readYamlSection(raw, 'sections')
  const heroSection = readYamlSection(raw, 'hero')
  const gridSection = readYamlSection(raw, 'grid')
  const responsiveSection = readYamlSection(raw, 'responsive')

  return {
    density: readYamlScalar(layoutSection, 'density'),
    sectionPaddingX: readYamlScalar(layoutSection, 'paddingX') || readYamlScalar(layoutSection, 'horizontalPadding'),
    sectionPaddingY: readYamlScalar(sectionsSection, 'paddingY') || readYamlScalar(sectionsSection, 'sectionSpacing'),
    mobileSectionPaddingY: readYamlScalar(responsiveSection, 'mobileSpacing'),
    gridGap: readYamlScalar(gridSection, 'gap'),
    blockGap: readYamlScalar(layoutSection, 'blockGap') || readYamlScalar(sectionsSection, 'blockGap'),
    heroContentBottom: readYamlScalar(heroSection, 'contentBottom') || readYamlScalar(heroSection, 'verticalPosition'),
    heroContentGap: readYamlScalar(heroSection, 'contentGap'),
    heroCopyGap: readYamlScalar(heroSection, 'copyGap'),
    heroCtaMargin: readYamlScalar(heroSection, 'ctaMargin') || readYamlScalar(heroSection, 'ctaSpacing'),
  }
}

function normalizeTextTransform(value: string | undefined) {
  const normalized = toClassValue(value)
  if (normalized === 'uppercase' || normalized === 'majuscule' || normalized === 'majuscules') return 'uppercase'
  if (normalized === 'lowercase') return 'lowercase'
  if (normalized === 'none' || normalized === 'normal') return 'none'
  return 'uppercase'
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
