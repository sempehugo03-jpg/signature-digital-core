import type { CSSProperties } from 'react'
import { createRealEstateVisualTheme, type RealEstateVisualTheme } from './realEstateVisualThemeEngine'
import type { VisualBlueprintV1 } from './visualBlueprint'

export type RealEstateVisualVariant =
  | 'minimal'
  | 'premium'
  | 'luxury'
  | 'modern'
  | 'editorial'
  | 'dark'
  | 'light'
  | 'warm'
  | 'institutional'

type VisualSystemInput = {
  primaryColor: string
  accentColor: string
}

type VisualSystemOutput = {
  className: string
  tokens: CSSProperties
  primaryButtonStyle: CSSProperties
  mood: string
  theme: RealEstateVisualTheme | null
  cardVariant: RealEstateCardVariant
}

type RealEstateCardVariant =
  | 'editorial_luxury'
  | 'modern_premium'
  | 'minimal_light'
  | 'warm_local_trust'
  | 'institutional_sober'
  | 'dark_prestige'

type CardVariantDefinition = {
  radius: string
  shadow: string
  padding: string
  imageRatio: string
  imageRadius: string
  gap: string
  surface: string
  mutedSurface: string
  border: string
  titleSize: string
  titleWeight: string
  priceStyle: string
  badgeStyle: string
  density: string
}

const visualVariants = new Set<RealEstateVisualVariant>([
  'minimal',
  'premium',
  'luxury',
  'modern',
  'editorial',
  'dark',
  'light',
  'warm',
  'institutional',
])

const variantAliases: Record<string, RealEstateVisualVariant> = {
  luxe: 'luxury',
  luxurious: 'luxury',
  luxury_dark: 'dark',
  premium_light: 'premium',
  local_trust: 'institutional',
  modern_minimal: 'minimal',
  confiance: 'institutional',
  trust: 'institutional',
  sombre: 'dark',
  clair: 'light',
  chaleureux: 'warm',
}

const cardVariants: Record<RealEstateCardVariant, CardVariantDefinition> = {
  editorial_luxury: {
    radius: '0',
    shadow: 'none',
    padding: '0',
    imageRatio: '4 / 5.75',
    imageRadius: '0',
    gap: '1.9rem',
    surface: 'transparent',
    mutedSurface: 'rgba(255, 248, 239, 0.82)',
    border: 'rgba(214, 170, 80, 0.34)',
    titleSize: 'clamp(1.28rem, 2.35vw, 1.78rem)',
    titleWeight: '500',
    priceStyle: 'editorial',
    badgeStyle: 'refined',
    density: 'airy',
  },
  modern_premium: {
    radius: '1.35rem',
    shadow: '0 26px 86px -58px rgba(0, 0, 0, 0.42)',
    padding: '0.8rem',
    imageRatio: '4 / 5.1',
    imageRadius: '1rem',
    gap: '1.35rem',
    surface: '#fff',
    mutedSurface: '#f4f4f1',
    border: 'rgba(17, 24, 39, 0.1)',
    titleSize: 'clamp(1.1rem, 1.75vw, 1.32rem)',
    titleWeight: '700',
    priceStyle: 'strong',
    badgeStyle: 'clean',
    density: 'balanced',
  },
  minimal_light: {
    radius: '0.35rem',
    shadow: 'none',
    padding: '0',
    imageRatio: '1 / 1',
    imageRadius: '0.35rem',
    gap: '2rem',
    surface: 'transparent',
    mutedSurface: '#f5f5f2',
    border: 'rgba(17, 24, 39, 0.14)',
    titleSize: 'clamp(1.02rem, 1.5vw, 1.18rem)',
    titleWeight: '650',
    priceStyle: 'quiet',
    badgeStyle: 'minimal',
    density: 'airy',
  },
  warm_local_trust: {
    radius: '1.6rem',
    shadow: '0 28px 84px -58px rgba(74, 45, 19, 0.46)',
    padding: '0.85rem',
    imageRatio: '16 / 19',
    imageRadius: '1.25rem',
    gap: '1.45rem',
    surface: 'rgba(255, 255, 255, 0.72)',
    mutedSurface: '#f1e5d6',
    border: 'rgba(116, 82, 45, 0.14)',
    titleSize: 'clamp(1.12rem, 1.8vw, 1.38rem)',
    titleWeight: '700',
    priceStyle: 'warm',
    badgeStyle: 'soft',
    density: 'comfortable',
  },
  institutional_sober: {
    radius: '0.75rem',
    shadow: 'none',
    padding: '1rem',
    imageRatio: '16 / 11',
    imageRadius: '0.45rem',
    gap: '1.1rem',
    surface: '#fff',
    mutedSurface: '#f4f6f7',
    border: 'rgba(17, 24, 39, 0.18)',
    titleSize: 'clamp(1.02rem, 1.45vw, 1.18rem)',
    titleWeight: '750',
    priceStyle: 'structured',
    badgeStyle: 'sober',
    density: 'compact',
  },
  dark_prestige: {
    radius: '1.25rem',
    shadow: '0 34px 110px -62px rgba(0, 0, 0, 0.72)',
    padding: '0.85rem',
    imageRatio: '4 / 5.35',
    imageRadius: '0.95rem',
    gap: '1.6rem',
    surface: 'rgba(9, 17, 31, 0.92)',
    mutedSurface: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255, 255, 255, 0.16)',
    titleSize: 'clamp(1.14rem, 1.9vw, 1.45rem)',
    titleWeight: '650',
    priceStyle: 'prestige',
    badgeStyle: 'dark',
    density: 'balanced',
  },
}

export function createRealEstateVisualSystem(
  blueprint: VisualBlueprintV1 | null,
  input: VisualSystemInput,
): VisualSystemOutput {
  if (!blueprint) {
    const fallbackBackground = normalizeColor(input.primaryColor) || '#19191d'

    return {
      className: '',
      tokens: {},
      primaryButtonStyle: {
        backgroundColor: fallbackBackground,
        border: `1px solid ${fallbackBackground}`,
        color: '#fff',
      },
      mood: 'default',
      theme: null,
      cardVariant: 'modern_premium',
    }
  }

  const theme = createRealEstateVisualTheme(blueprint, input)
  const mood = theme?.mood || getVisualMood(blueprint)
  const globalVariant = normalizeVisualVariant(
    blueprint?.brand.graphicStyle ||
    blueprint?.brand.generalMood ||
    blueprint?.brand.typographyMood ||
    theme?.visualTheme ||
    theme?.typographyMood ||
    mood,
    'premium',
  )
  const heroVariant = normalizeHeroVariant(blueprint?.hero.layout || theme?.composition || globalVariant)
  const visualCardVariant = normalizeVisualVariant(blueprint?.propertyCards.cardStyle || theme?.cardMood || globalVariant, globalVariant)
  const buttonVariant = normalizeVisualVariant(blueprint?.buttons.shape || blueprint?.hero.buttonStyle || theme?.buttonMood || globalVariant, globalVariant)
  const typographyVariant = normalizeVisualVariant(blueprint?.typography.titleStyle || blueprint?.brand.typographyMood || theme?.typographyMood || globalVariant, globalVariant)
  const navigationVariant = normalizeVisualVariant(blueprint?.navigation.style || blueprint?.header.style || theme?.composition || globalVariant, globalVariant)
  const sectionVariant = normalizeVisualVariant(blueprint?.sections.defaultMood || blueprint?.sections.sectionSpacing || theme?.surfaceStyle || globalVariant, globalVariant)
  const dashboardVariant = normalizeVisualVariant(blueprint?.dashboard.style || globalVariant, globalVariant)
  const formVariant = normalizeVisualVariant(blueprint?.forms.style || globalVariant, globalVariant)
  const mobileNavigationVariant = normalizeMobileNavigationVariant(blueprint?.mobileNavigation.style || blueprint?.navigation.mobileStyle)
  const cardVariant = resolveCardVariant(blueprint, theme, visualCardVariant)
  const cardVariantDefinition = cardVariants[cardVariant]
  const hasInnerFrame = /cadre|filet|frame|border/.test([
    blueprint.hero.overlay,
    blueprint.hero.style,
    blueprint.images.overlays,
  ].join(' ').toLowerCase())

  const primary = normalizeColor(blueprint?.brand.primaryColor) || normalizeColor(input.primaryColor) || '#19191d'
  const accent = normalizeColor(blueprint?.brand.accentColor) || normalizeColor(input.accentColor) || '#b08d57'
  const buttonBackground = normalizeColor(blueprint?.buttons.background) || (theme?.buttonMood === 'luxury_gold' ? accent : primary)
  const buttonColor = normalizeColor(blueprint?.buttons.textColor) || (theme?.buttonMood === 'luxury_gold' ? primary : '#fff')
  const buttonBorder = normalizeBorderStyle(blueprint?.buttons.borderStyle, buttonBackground)

  const tokens = compactCssProperties({
    ...theme?.tokens,
    '--od-token-primary': primary || theme?.tokens['--od-theme-primary'],
    '--od-token-accent': accent || theme?.tokens['--od-theme-accent'],
    '--od-token-surface': theme?.tokens['--od-theme-surface'] || resolveSurfaceToken(mood),
    '--od-token-muted-surface': theme?.tokens['--od-theme-muted-surface'],
    '--od-token-line': theme?.tokens['--od-theme-line'] || resolveLineToken(mood),
    '--od-token-section-spacing': normalizeSpacingPreset(blueprint?.sections.sectionSpacing) || theme?.tokens['--od-theme-section-spacing'],
    '--od-token-mobile-spacing': normalizeSpacingPreset(blueprint?.responsive.mobileSpacing) || theme?.tokens['--od-theme-mobile-spacing'],
    '--od-token-container-width': normalizeCssLength(blueprint?.sections.contentWidth) || theme?.tokens['--od-theme-container-width'],
    '--od-token-grid-gap': normalizeCssLength(blueprint?.grid.gap || blueprint?.propertyCards.spacing) || theme?.tokens['--od-theme-grid-gap'],
    '--od-token-radius-card': normalizeCssLength(blueprint?.propertyCards.cardRadius) || theme?.tokens['--od-theme-card-radius'] || cardVariantDefinition.radius,
    '--od-token-radius-button': resolveButtonRadius(buttonVariant) || theme?.tokens['--od-theme-button-radius'],
    '--od-token-shadow-card': normalizeShadowStyle(blueprint?.propertyCards.shadowStyle) || theme?.tokens['--od-theme-card-shadow'] || cardVariantDefinition.shadow,
    '--od-token-border': buttonBorder,
    '--od-token-button-bg': buttonBackground,
    '--od-token-button-color': buttonColor,
    '--od-token-button-size': normalizeCssLength(blueprint?.buttons.size) || theme?.tokens['--od-theme-button-size'],
    '--od-token-animation': resolveAnimationToken(globalVariant),
    '--od-token-hero-height': normalizeCssLength(blueprint?.hero.height) || theme?.tokens['--od-theme-hero-height'],
    '--od-token-hero-overlay': normalizeHeroOverlay(blueprint?.hero.overlay),
    '--od-token-hero-mobile-height': normalizeCssLength(blueprint?.responsive.heroMobileHeight) || theme?.tokens['--od-theme-hero-mobile-height'],
    '--od-token-title-width': normalizeCssLength(blueprint?.hero.titleWidth || blueprint?.hero.contentWidth) || theme?.tokens['--od-theme-title-width'],
    '--od-token-title-size': normalizeCssLength(blueprint?.hero.titleSize) || theme?.tokens['--od-theme-title-size'],
    '--od-token-subtitle-size': normalizeCssLength(blueprint?.hero.subtitleSize) || theme?.tokens['--od-theme-subtitle-size'],
    '--od-token-image-ratio': normalizeAspectRatio(blueprint?.propertyCards.imageRatio) || theme?.tokens['--od-theme-image-ratio'] || cardVariantDefinition.imageRatio,
    '--od-token-nav-height': normalizeCssLength(blueprint?.header.height || blueprint?.navigation.height),
    '--od-token-nav-bg': normalizeColor(blueprint?.navigation.background),
    '--od-token-nav-color': normalizeColor(blueprint?.navigation.colors || blueprint?.navigation.linkColor || blueprint?.navigation.linkColors),
    '--od-token-nav-gap': normalizeCssLength(blueprint?.navigation.spacing),
    '--od-card-surface': cardVariantDefinition.surface,
    '--od-card-muted-surface': cardVariantDefinition.mutedSurface,
    '--od-card-border': cardVariantDefinition.border,
    '--od-card-radius': normalizeCssLength(blueprint?.propertyCards.cardRadius) || cardVariantDefinition.radius,
    '--od-card-shadow': normalizeShadowStyle(blueprint?.propertyCards.shadowStyle) || cardVariantDefinition.shadow,
    '--od-card-padding': normalizeCssLength(blueprint?.propertyCards.padding) || cardVariantDefinition.padding,
    '--od-card-image-ratio': normalizeAspectRatio(blueprint?.propertyCards.imageRatio) || cardVariantDefinition.imageRatio,
    '--od-card-image-radius': normalizeCssLength(blueprint?.propertyCards.imageRadius || blueprint?.propertyCards.cardRadius) || cardVariantDefinition.imageRadius,
    '--od-card-gap': normalizeCssLength(blueprint?.propertyCards.spacing) || cardVariantDefinition.gap,
    '--od-card-title-size': normalizeCssLength(blueprint?.propertyCards.titleSize) || cardVariantDefinition.titleSize,
    '--od-card-title-weight': normalizeCssText(blueprint?.propertyCards.titleWeight) || cardVariantDefinition.titleWeight,
    '--od-card-price-style': cardVariantDefinition.priceStyle,
    '--od-card-badge-style': cardVariantDefinition.badgeStyle,
    '--od-card-density': cardVariantDefinition.density,
  })

  return {
    className: [
      'od-visual-system',
      theme ? `od-theme-${theme.visualTheme}` : '',
      theme ? `od-theme-density-${theme.density}` : '',
      theme ? `od-theme-imagery-${theme.imagery}` : '',
      theme ? `od-theme-contrast-${theme.contrast}` : '',
      theme ? `od-theme-composition-${theme.composition}` : '',
      theme ? `od-theme-surface-${theme.surfaceStyle}` : '',
      hasInnerFrame ? 'od-theme-inner-frame' : '',
      `od-vs-layout-${globalVariant}`,
      `od-vs-header-${navigationVariant}`,
      `od-vs-nav-${navigationVariant}`,
      `od-vs-footer-${globalVariant}`,
      `od-vs-sidebar-${globalVariant}`,
      `od-vs-container-${sectionVariant}`,
      `od-vs-grid-${visualCardVariant}`,
      `od-vs-hero-${heroVariant}`,
      `od-vs-section-${sectionVariant}`,
      `od-vs-card-${visualCardVariant}`,
      `od-card-variant-${cardVariant.replace(/_/g, '-')}`,
      `od-vs-button-${buttonVariant}`,
      `od-vs-type-${typographyVariant}`,
      `od-vs-form-${formVariant}`,
      `od-vs-dashboard-${dashboardVariant}`,
      `od-vs-mobile-${mobileNavigationVariant}`,
    ].filter(Boolean).join(' '),
    tokens,
    primaryButtonStyle: {
      backgroundColor: buttonBackground,
      border: buttonBorder,
      color: buttonColor,
    },
    mood,
    theme,
    cardVariant,
  }
}

function resolveCardVariant(
  blueprint: VisualBlueprintV1,
  theme: RealEstateVisualTheme | null,
  fallback: RealEstateVisualVariant,
): RealEstateCardVariant {
  const signal = [
    theme?.visualTheme,
    theme?.cardMood,
    theme?.mood,
    fallback,
    blueprint.brand.generalMood,
    blueprint.brand.graphicStyle,
    blueprint.brand.typographyMood,
    blueprint.brand.backgroundPalette,
    blueprint.propertyCards.cardStyle,
    blueprint.propertyCards.imageTreatment,
    blueprint.propertyCards.badgeStyle,
    blueprint.propertyCards.informationStyle,
    blueprint.propertyCards.priceStyle,
    blueprint.sections.defaultMood,
    blueprint.sections.sectionBackgrounds,
    blueprint.images.mood,
    blueprint.images.cropStyle,
  ].join(' ').toLowerCase()

  if (/dark|black|night|noir|sombre/.test(signal) && /prestige|premium|luxury|luxe|navy|gold|or\b/.test(signal)) return 'dark_prestige'
  if (/editorial|luxury|luxe|magazine|cinematic|serif|gold|ivory|premium/.test(signal)) return 'editorial_luxury'
  if (/institutional|institutionnel|sober|sobre|corporate|cabinet|structured/.test(signal)) return 'institutional_sober'
  if (/trust|local|warm|human|humain|proxim|rassur|chaleur|chaleureux|natural/.test(signal)) return 'warm_local_trust'
  if (/minimal|light|white|clair|clean space|quiet/.test(signal)) return 'minimal_light'
  if (/modern|clean|sharp|net|system/.test(signal)) return 'modern_premium'

  return fallback === 'institutional'
    ? 'institutional_sober'
    : fallback === 'minimal' || fallback === 'light'
      ? 'minimal_light'
      : fallback === 'warm'
        ? 'warm_local_trust'
        : fallback === 'dark'
          ? 'dark_prestige'
          : 'modern_premium'
}

function normalizeVisualVariant(value: string | undefined, fallback: RealEstateVisualVariant): RealEstateVisualVariant {
  const normalized = toClassValue(value)
  if (!normalized) return fallback
  if (/editorial-luxury|luxury-shadow|luxury-gold|serif-premium|mixed-editorial|magazine/.test(normalized)) return 'luxury'
  if (/modern-premium|modern-sans|structured/.test(normalized)) return 'modern'
  if (/warm-local-trust|cream|soft|natural/.test(normalized)) return 'warm'
  if (/minimal-prestige/.test(normalized)) return 'minimal'
  if (visualVariants.has(normalized as RealEstateVisualVariant)) return normalized as RealEstateVisualVariant
  return variantAliases[normalized] ?? fallback
}

function normalizeHeroVariant(value?: string) {
  const normalized = toClassValue(value)
  if (/split/.test(normalized)) return 'split'
  if (/center/.test(normalized)) return 'centered'
  if (/full|bleed|fullscreen|image-overlay/.test(normalized)) return 'full-bleed'
  if (/dark|luxury|luxe/.test(normalized)) return 'luxury'
  if (/minimal/.test(normalized)) return 'minimal'
  if (/video/.test(normalized)) return 'video-ready'
  return normalizeVisualVariant(normalized, 'premium')
}

function normalizeMobileNavigationVariant(value?: string) {
  const normalized = toClassValue(value)
  if (/drawer/.test(normalized)) return 'drawer'
  if (/full/.test(normalized)) return 'fullscreen'
  return 'bottom-bar'
}

function getVisualMood(blueprint: VisualBlueprintV1 | null) {
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

function resolveSurfaceToken(mood: string) {
  if (mood === 'dark') return '#08111f'
  if (mood === 'warm') return '#fffaf3'
  return undefined
}

function resolveLineToken(mood: string) {
  if (mood === 'dark') return 'rgba(255, 255, 255, 0.14)'
  if (mood === 'warm') return '#eadfce'
  return undefined
}

function resolveButtonRadius(variant: RealEstateVisualVariant) {
  if (variant === 'minimal' || variant === 'modern' || variant === 'institutional') return '0.45rem'
  if (variant === 'editorial' || variant === 'luxury') return '0.9rem'
  return '999px'
}

function resolveAnimationToken(variant: RealEstateVisualVariant) {
  if (variant === 'minimal' || variant === 'institutional') return '160ms ease'
  if (variant === 'luxury' || variant === 'editorial') return '260ms cubic-bezier(.2,.8,.2,1)'
  return '200ms ease'
}

function compactCssProperties(values: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => Boolean(value))) as CSSProperties
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}

function normalizeColor(value?: string) {
  if (!value) return ''
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : ''
}

function normalizeCssLength(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (/^\d+(\.\d+)?(px|rem|em|vh|svh|vw|%)$/.test(normalized)) return normalized
  if (/^\d+(\.\d+)?$/.test(normalized)) return `${normalized}px`
  if (/^clamp\([0-9a-z.,% -]+\)$/.test(normalized)) return normalized
  if (/^(min|max)\([0-9a-z.,% /-]+\)$/.test(normalized)) return normalized
  return undefined
}

function normalizeCssText(value?: string) {
  if (!value) return undefined
  const normalized = value.trim()
  return /^[a-zA-Z0-9#(),.%/ -]+$/.test(normalized) ? normalized : undefined
}

function normalizeSpacingPreset(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  const presets: Record<string, string> = {
    airy: '9rem',
    balanced: '7rem',
    compact: '4.5rem',
    editorial: '8rem',
    dense: '4rem',
    luxury: '8.5rem',
    premium: '7.5rem',
  }
  return presets[normalized] ?? normalizeCssLength(value)
}

function normalizeAspectRatio(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().replace(/\s+/g, '')
  if (/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(normalized)) return normalized.replace('/', ' / ')
  return undefined
}

function normalizeBorderStyle(value?: string, fallbackColor?: string) {
  if (!value) return fallbackColor ? `1px solid ${fallbackColor}` : '1px solid transparent'
  const normalized = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return `1px solid ${normalized}`
  if (/^\d+(\.\d+)?px\s+(solid|dashed|double)\s+#[0-9a-fA-F]{6}$/.test(normalized)) return normalized
  if (['none', 'transparent'].includes(normalized.toLowerCase())) return '1px solid transparent'
  return fallbackColor ? `1px solid ${fallbackColor}` : '1px solid transparent'
}

function normalizeHeroOverlay(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'dark') return 'linear-gradient(180deg, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.24) 46%, rgba(0, 0, 0, 0.64) 100%)'
  if (normalized === 'light') return 'linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08) 42%, #fff 100%)'
  if (normalized === 'soft') return 'linear-gradient(180deg, rgba(0, 0, 0, 0.38), rgba(0, 0, 0, 0.08) 44%, rgba(255, 255, 255, 0.88) 100%)'
  if (/^linear-gradient\([a-z0-9#(),.% /-]+\)$/i.test(value.trim())) return value.trim()
  return undefined
}

function normalizeShadowStyle(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  const presets: Record<string, string> = {
    none: 'none',
    subtle: '0 18px 50px -42px rgba(0, 0, 0, 0.36)',
    soft: '0 24px 70px -48px rgba(0, 0, 0, 0.42)',
    luxury: '0 28px 90px -52px rgba(0, 0, 0, 0.62)',
    strong: '0 30px 90px -46px rgba(0, 0, 0, 0.72)',
  }
  return presets[normalized]
}

