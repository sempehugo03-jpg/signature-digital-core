import type { VisualBlueprintV1 } from './visualBlueprint'

export type RealEstateVisualThemeName =
  | 'editorial_luxury'
  | 'modern_premium'
  | 'warm_local_trust'
  | 'minimal_prestige'

export type RealEstateVisualTheme = {
  visualTheme: RealEstateVisualThemeName
  mood: 'dark' | 'warm' | 'light' | 'default'
  density: 'airy' | 'balanced' | 'compact'
  imagery: 'cinematic' | 'natural' | 'editorial' | 'minimal'
  contrast: 'soft' | 'balanced' | 'high'
  composition: 'centered' | 'split' | 'editorial' | 'structured'
  typographyMood: 'serif_premium' | 'modern_sans' | 'mixed_editorial'
  surfaceStyle: 'cream' | 'white' | 'dark' | 'soft_gradient'
  cardMood: 'magazine' | 'minimal' | 'luxury_shadow' | 'structured'
  buttonMood: 'pill' | 'sharp' | 'soft' | 'luxury_gold'
  tokens: Record<string, string>
}

type ThemeInput = {
  primaryColor: string
  accentColor: string
}

const themes: Record<RealEstateVisualThemeName, RealEstateVisualTheme> = {
  editorial_luxury: {
    visualTheme: 'editorial_luxury',
    mood: 'warm',
    density: 'airy',
    imagery: 'cinematic',
    contrast: 'high',
    composition: 'editorial',
    typographyMood: 'mixed_editorial',
    surfaceStyle: 'cream',
    cardMood: 'magazine',
    buttonMood: 'luxury_gold',
    tokens: {
      '--od-theme-surface': '#fff8ef',
      '--od-theme-muted-surface': '#f3eadc',
      '--od-theme-line': '#e8dcca',
      '--od-theme-section-spacing': '9rem',
      '--od-theme-mobile-spacing': '6.25rem',
      '--od-theme-container-width': '1180px',
      '--od-theme-grid-gap': '1.8rem',
      '--od-theme-card-radius': '0',
      '--od-theme-card-shadow': 'none',
      '--od-theme-button-radius': '0',
      '--od-theme-button-size': '3.65rem',
      '--od-theme-hero-height': 'min(100svh, 920px)',
      '--od-theme-hero-mobile-height': 'min(100svh, 760px)',
      '--od-theme-title-width': '50rem',
      '--od-theme-title-size': 'clamp(3.45rem, 8vw, 5.45rem)',
      '--od-theme-subtitle-size': '1.05rem',
      '--od-theme-image-ratio': '4 / 5',
    },
  },
  modern_premium: {
    visualTheme: 'modern_premium',
    mood: 'default',
    density: 'balanced',
    imagery: 'natural',
    contrast: 'balanced',
    composition: 'structured',
    typographyMood: 'modern_sans',
    surfaceStyle: 'white',
    cardMood: 'structured',
    buttonMood: 'pill',
    tokens: {
      '--od-theme-surface': '#f7f7f5',
      '--od-theme-muted-surface': '#efefeb',
      '--od-theme-line': '#e4e1dc',
      '--od-theme-section-spacing': '7rem',
      '--od-theme-mobile-spacing': '5rem',
      '--od-theme-container-width': '1160px',
      '--od-theme-grid-gap': '1.35rem',
      '--od-theme-card-radius': '1rem',
      '--od-theme-card-shadow': '0 22px 70px -52px rgba(0, 0, 0, 0.36)',
      '--od-theme-button-radius': '999px',
      '--od-theme-button-size': '3.4rem',
      '--od-theme-hero-height': '86svh',
      '--od-theme-hero-mobile-height': '74svh',
      '--od-theme-title-width': '50rem',
      '--od-theme-title-size': 'clamp(3.05rem, 7vw, 5rem)',
      '--od-theme-subtitle-size': '1rem',
      '--od-theme-image-ratio': '4 / 5',
    },
  },
  warm_local_trust: {
    visualTheme: 'warm_local_trust',
    mood: 'warm',
    density: 'balanced',
    imagery: 'natural',
    contrast: 'soft',
    composition: 'centered',
    typographyMood: 'serif_premium',
    surfaceStyle: 'cream',
    cardMood: 'luxury_shadow',
    buttonMood: 'soft',
    tokens: {
      '--od-theme-surface': '#fbf4ea',
      '--od-theme-muted-surface': '#f1e5d6',
      '--od-theme-line': '#e8dac7',
      '--od-theme-section-spacing': '7.5rem',
      '--od-theme-mobile-spacing': '5.5rem',
      '--od-theme-container-width': '1120px',
      '--od-theme-grid-gap': '1.45rem',
      '--od-theme-card-radius': '1.25rem',
      '--od-theme-card-shadow': '0 26px 80px -56px rgba(74, 45, 19, 0.44)',
      '--od-theme-button-radius': '1.1rem',
      '--od-theme-button-size': '3.45rem',
      '--od-theme-hero-height': '84svh',
      '--od-theme-hero-mobile-height': '72svh',
      '--od-theme-title-width': '48rem',
      '--od-theme-title-size': 'clamp(3rem, 7vw, 4.85rem)',
      '--od-theme-subtitle-size': '1.02rem',
      '--od-theme-image-ratio': '16 / 19',
    },
  },
  minimal_prestige: {
    visualTheme: 'minimal_prestige',
    mood: 'light',
    density: 'airy',
    imagery: 'minimal',
    contrast: 'high',
    composition: 'centered',
    typographyMood: 'modern_sans',
    surfaceStyle: 'white',
    cardMood: 'minimal',
    buttonMood: 'sharp',
    tokens: {
      '--od-theme-surface': '#fafafa',
      '--od-theme-muted-surface': '#f0f0ee',
      '--od-theme-line': '#dedbd6',
      '--od-theme-section-spacing': '9.5rem',
      '--od-theme-mobile-spacing': '6rem',
      '--od-theme-container-width': '1060px',
      '--od-theme-grid-gap': '2rem',
      '--od-theme-card-radius': '0.35rem',
      '--od-theme-card-shadow': 'none',
      '--od-theme-button-radius': '0.35rem',
      '--od-theme-button-size': '3.25rem',
      '--od-theme-hero-height': '82svh',
      '--od-theme-hero-mobile-height': '70svh',
      '--od-theme-title-width': '44rem',
      '--od-theme-title-size': 'clamp(3.1rem, 7.5vw, 5.2rem)',
      '--od-theme-subtitle-size': '0.98rem',
      '--od-theme-image-ratio': '1 / 1',
    },
  },
}

export function createRealEstateVisualTheme(
  blueprint: VisualBlueprintV1 | null,
  input: ThemeInput,
): RealEstateVisualTheme | null {
  if (!blueprint) return null

  const visualTheme = resolveVisualTheme(blueprint)
  const baseTheme = themes[visualTheme]
  const detectedMood = getBlueprintMood(blueprint)
  const mood = visualTheme === 'editorial_luxury' && detectedMood === 'dark'
    ? baseTheme.mood
    : detectedMood || baseTheme.mood
  const primary = normalizeColor(blueprint.brand.primaryColor) || normalizeColor(input.primaryColor)
  const accent = normalizeColor(blueprint.brand.accentColor) || normalizeColor(input.accentColor)

  return {
    ...baseTheme,
    mood,
    tokens: {
      ...baseTheme.tokens,
      ...(primary ? { '--od-theme-primary': primary } : {}),
      ...(accent ? { '--od-theme-accent': accent } : {}),
    },
  }
}

function resolveVisualTheme(blueprint: VisualBlueprintV1): RealEstateVisualThemeName {
  const signal = [
    blueprint.brand.generalMood,
    blueprint.brand.graphicStyle,
    blueprint.brand.typographyMood,
    blueprint.brand.backgroundPalette,
    blueprint.brand.primaryColor,
    blueprint.brand.accentColor,
    blueprint.hero.layout,
    blueprint.hero.overlay,
    blueprint.hero.titleStyle,
    blueprint.propertyCards.cardStyle,
    blueprint.sections.defaultMood,
    blueprint.sections.sectionBackgrounds,
    blueprint.buttons.generalStyle,
    blueprint.buttons.background,
    blueprint.images.mood,
  ].join(' ').toLowerCase()

  if (/editorial|premium|luxury|luxe|magazine|cinematic|elegant|navy|ivory|gold|or\b|dor[ée]/.test(signal)) return 'editorial_luxury'
  if (/trust|local|warm|human|humain|proxim|rassur|chaleur/.test(signal)) return 'warm_local_trust'
  if (/minimal|prestige|sober|sobre|clean space|quiet/.test(signal)) return 'minimal_prestige'
  if (/modern|clean|sharp|net|structured|system/.test(signal)) return 'modern_premium'

  return 'modern_premium'
}

function getBlueprintMood(blueprint: VisualBlueprintV1) {
  const signal = [
    blueprint.brand.backgroundPalette,
    blueprint.brand.generalMood,
    blueprint.sections.defaultMood,
  ].join(' ').toLowerCase()

  if (/dark|navy|noir|black|night|sombre/.test(signal)) return 'dark'
  if (/cream|warm|beige|sand|chaleur|chaleureux/.test(signal)) return 'warm'
  if (/minimal|white|light|clair/.test(signal)) return 'light'
  return ''
}

function normalizeColor(value?: string) {
  if (!value) return ''
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : ''
}

