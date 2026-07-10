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
  const cardVariant = normalizeVisualVariant(blueprint?.propertyCards.cardStyle || theme?.cardMood || globalVariant, globalVariant)
  const buttonVariant = normalizeVisualVariant(blueprint?.buttons.shape || blueprint?.hero.buttonStyle || theme?.buttonMood || globalVariant, globalVariant)
  const typographyVariant = normalizeVisualVariant(blueprint?.typography.titleStyle || blueprint?.brand.typographyMood || theme?.typographyMood || globalVariant, globalVariant)
  const navigationVariant = normalizeVisualVariant(blueprint?.navigation.style || blueprint?.header.style || theme?.composition || globalVariant, globalVariant)
  const sectionVariant = normalizeVisualVariant(blueprint?.sections.defaultMood || blueprint?.sections.sectionSpacing || theme?.surfaceStyle || globalVariant, globalVariant)
  const dashboardVariant = normalizeVisualVariant(blueprint?.dashboard.style || globalVariant, globalVariant)
  const formVariant = normalizeVisualVariant(blueprint?.forms.style || globalVariant, globalVariant)
  const mobileNavigationVariant = normalizeMobileNavigationVariant(blueprint?.mobileNavigation.style || blueprint?.navigation.mobileStyle)
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
    '--od-token-radius-card': normalizeCssLength(blueprint?.propertyCards.cardRadius) || theme?.tokens['--od-theme-card-radius'],
    '--od-token-radius-button': resolveButtonRadius(buttonVariant) || theme?.tokens['--od-theme-button-radius'],
    '--od-token-shadow-card': normalizeShadowStyle(blueprint?.propertyCards.shadowStyle) || theme?.tokens['--od-theme-card-shadow'],
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
    '--od-token-image-ratio': normalizeAspectRatio(blueprint?.propertyCards.imageRatio) || theme?.tokens['--od-theme-image-ratio'],
    '--od-token-nav-height': normalizeCssLength(blueprint?.header.height || blueprint?.navigation.height),
    '--od-token-nav-bg': normalizeColor(blueprint?.navigation.background),
    '--od-token-nav-color': normalizeColor(blueprint?.navigation.colors || blueprint?.navigation.linkColor || blueprint?.navigation.linkColors),
    '--od-token-nav-gap': normalizeCssLength(blueprint?.navigation.spacing),
    '--od-token-nav-opacity': normalizeOpacity(blueprint?.navigation.transparency),
    '--od-token-section-background': normalizeColor(blueprint?.sections.sectionBackgrounds),
    '--od-token-mobile-title-scale': normalizeCssText(blueprint?.responsive.mobileTypographyScale),
    '--od-token-button-hover': normalizeColor(blueprint?.buttons.hoverStyle),
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
      `od-vs-grid-${cardVariant}`,
      `od-vs-hero-${heroVariant}`,
      `od-vs-section-${sectionVariant}`,
      `od-vs-card-${cardVariant}`,
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
  }
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

function normalizeOpacity(value?: string) {
  if (!value) return undefined
  const parsed = Number(value.trim())
  if (Number.isNaN(parsed)) return undefined
  return String(Math.min(1, Math.max(0, parsed)))
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

