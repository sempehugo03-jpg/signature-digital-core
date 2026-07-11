export type VisualBlueprintSectionName =
  | 'brand'
  | 'layout'
  | 'hero'
  | 'header'
  | 'navigation'
  | 'footer'
  | 'sidebar'
  | 'container'
  | 'grid'
  | 'sections'
  | 'propertyCards'
  | 'buttons'
  | 'typography'
  | 'images'
  | 'forms'
  | 'dashboard'
  | 'mobileNavigation'
  | 'responsive'

export type VisualBlueprintDiagnosticLevel = 'info' | 'warning' | 'error'

export type VisualBlueprintDiagnostic = {
  level: VisualBlueprintDiagnosticLevel
  section: VisualBlueprintSectionName | 'root'
  property?: string
  value?: string
  fallback?: string
  message: string
}

export type VisualBlueprintBrand = {
  logoUrl?: string
  lightLogoUrl?: string
  darkLogoUrl?: string
  primaryColor?: string
  accentColor?: string
  backgroundPalette?: string
  typographyMood?: string
  generalMood?: string
  graphicStyle?: string
  themePreset?: string
}

export type VisualBlueprintLayout = {
  style?: string
  density?: string
  composition?: string
}

export type VisualBlueprintHero = {
  imageUrl?: string
  surface?: string
  style?: string
  layout?: string
  height?: string
  overlay?: string
  imageCrop?: string
  imagePosition?: string
  contentWidth?: string
  titleAlignment?: string
  titleWidth?: string
  titleSize?: string
  headlineScale?: string
  titleStyle?: string
  subtitleSize?: string
  subtitleStyle?: string
  buttonStyle?: string
  buttonPosition?: string
  secondaryCta?: string
  search?: string
  title?: string
  subtitle?: string
  cta?: string
}

export type VisualBlueprintHeader = {
  transparency?: string
  height?: string
  style?: string
  behavior?: string
}

export type VisualBlueprintNavigation = {
  style?: string
  mobileStyle?: string
  surface?: string
  density?: string
  behavior?: string
  logoMode?: string
  primaryCta?: string
  privateAccess?: string
  height?: string
  background?: string
  colors?: string
  linkColor?: string
  linkColors?: string
  spacing?: string
  transparency?: string
}

export type VisualBlueprintFooter = {
  style?: string
  background?: string
  spacing?: string
}

export type VisualBlueprintSidebar = {
  style?: string
  width?: string
  background?: string
}

export type VisualBlueprintContainer = {
  width?: string
  maxWidth?: string
  padding?: string
}

export type VisualBlueprintGrid = {
  gap?: string
  columns?: string
  density?: string
}

export type VisualBlueprintSections = {
  sectionOrder?: string
  sectionSpacing?: string
  defaultBackground?: string
  defaultMood?: string
  contentWidth?: string
  sectionBackgrounds?: string
}

export type VisualBlueprintPropertyCards = {
  cardStyle?: string
  imageRatio?: string
  imageTreatment?: string
  cardRadius?: string
  shadowStyle?: string
  spacing?: string
  informationStyle?: string
  priceStyle?: string
  badgeStyle?: string
}

export type VisualBlueprintButtons = {
  shape?: string
  background?: string
  textColor?: string
  size?: string
  borderStyle?: string
  hoverStyle?: string
  generalStyle?: string
}

export type VisualBlueprintTypography = {
  titleStyle?: string
  subtitleStyle?: string
  bodyStyle?: string
  hierarchy?: string
}

export type VisualBlueprintImages = {
  heroImageStyle?: string
  sectionImageStyle?: string
  treatment?: string
  cropStyle?: string
  overlays?: string
  mood?: string
}

export type VisualBlueprintForms = {
  style?: string
  density?: string
  fieldStyle?: string
}

export type VisualBlueprintDashboard = {
  style?: string
  density?: string
  cardStyle?: string
}

export type VisualBlueprintMobileNavigation = {
  style?: string
}

export type VisualBlueprintResponsive = {
  heroMobileHeight?: string
  mobileSpacing?: string
  mobileTypographyScale?: string
  cardBehavior?: string
}

export type NormalizedVisualBlueprintV1 = {
  version: 'v1'
  raw: string
  diagnostics: VisualBlueprintDiagnostic[]
  brand: VisualBlueprintBrand
  layout: VisualBlueprintLayout
  hero: VisualBlueprintHero
  header: VisualBlueprintHeader
  navigation: VisualBlueprintNavigation
  footer: VisualBlueprintFooter
  sidebar: VisualBlueprintSidebar
  container: VisualBlueprintContainer
  grid: VisualBlueprintGrid
  sections: VisualBlueprintSections
  propertyCards: VisualBlueprintPropertyCards
  buttons: VisualBlueprintButtons
  typography: VisualBlueprintTypography
  images: VisualBlueprintImages
  forms: VisualBlueprintForms
  dashboard: VisualBlueprintDashboard
  mobileNavigation: VisualBlueprintMobileNavigation
  responsive: VisualBlueprintResponsive
}

export type VisualBlueprintV1 = NormalizedVisualBlueprintV1

export type VisualBlueprintParseResult = {
  blueprint: VisualBlueprintV1 | null
  diagnostics: VisualBlueprintDiagnostic[]
}

type NormalizerContext = {
  section: VisualBlueprintSectionName
  property: string
  diagnostics: VisualBlueprintDiagnostic[]
}

type Normalizer = (value: string, context: NormalizerContext) => string | undefined

const visualBlueprintSections = new Set<VisualBlueprintSectionName>([
  'brand',
  'layout',
  'hero',
  'header',
  'navigation',
  'footer',
  'sidebar',
  'container',
  'grid',
  'sections',
  'propertyCards',
  'buttons',
  'typography',
  'images',
  'forms',
  'dashboard',
  'mobileNavigation',
  'responsive',
])

const visualVariantValues = [
  'minimal',
  'premium',
  'luxury',
  'modern',
  'editorial',
  'dark',
  'light',
  'warm',
  'institutional',
  'modern-premium',
  'editorial-luxury',
  'warm-local-trust',
  'minimal-prestige',
  'dark-prestige',
] as const

const layoutValues = ['full-bleed', 'split-left', 'split-right', 'split', 'centered', 'minimal', 'image-overlay', 'luxury', 'video-ready'] as const
const heroLayoutValues = ['full', ...layoutValues] as const
const heroSurfaceValues = ['light', 'dark', 'transparent'] as const
const heroHeightValues = ['compact', 'standard', 'large', 'screen'] as const
const heroHeadlineScaleValues = ['display', 'xl', 'lg'] as const
const alignmentValues = ['left', 'center', 'right'] as const
const positionValues = ['left', 'center', 'right', 'inline', 'bottom'] as const
const spacingValues = ['compact', 'balanced', 'airy', 'editorial', 'dense', 'luxury', 'premium'] as const
const imageTreatmentValues = ['natural', 'rounded', 'cinematic', 'editorial-crop', 'cover', 'contain'] as const
const cardStyleValues = ['magazine', 'minimal', 'luxury-shadow', 'structured', 'editorial-grid', 'default'] as const
const buttonShapeValues = ['pill', 'sharp', 'soft', 'luxury-gold', 'rounded', 'none'] as const
const mobileNavigationValues = ['bottom-bar', 'drawer', 'fullscreen'] as const
const themePresetValues = ['luxury_dark', 'premium_light', 'local_trust', 'modern_minimal'] as const
const compositionPresetValues = ['editorial-immersive', 'commercial-direct', 'institutional-trust', 'local-human', 'data-investment'] as const
const navigationSurfaceValues = ['light', 'dark', 'transparent'] as const
const navigationDensityValues = ['compact', 'standard'] as const
const navigationBehaviorValues = ['static', 'sticky'] as const
const navigationLogoModeValues = ['auto', 'light', 'dark'] as const
const navigationVisibilityValues = ['visible', 'hidden'] as const

const aliasMap = {
  fullbleed: 'full-bleed',
  full_bleed: 'full-bleed',
  fullscreen: 'full-bleed',
  split_left: 'split-left',
  splitright: 'split-right',
  split_right: 'split-right',
  image_overlay: 'image-overlay',
  imageoverlay: 'image-overlay',
  centre: 'center',
  centered: 'centered',
  luxury_shadow: 'luxury-shadow',
  editorial_grid: 'editorial-grid',
  editorial_crop: 'editorial-crop',
  luxury_gold: 'luxury-gold',
  bottom_bar: 'bottom-bar',
  full_screen: 'fullscreen',
  dark_mode: 'dark',
  darkmode: 'dark',
  premium_light: 'premium',
  luxury_dark: 'luxury',
  local_trust: 'warm-local-trust',
  modern_minimal: 'minimal',
  editorial_immersive: 'editorial-immersive',
  commercial_direct: 'commercial-direct',
  institutional_trust: 'institutional-trust',
  local_human: 'local-human',
  data_investment: 'data-investment',
} as const

const normalizers: {
  [section in VisualBlueprintSectionName]: {
    [property: string]: Normalizer
  }
} = {
  brand: {
    logoUrl: normalizeUrl,
    lightLogoUrl: normalizeUrl,
    darkLogoUrl: normalizeUrl,
    primaryColor: normalizeColor,
    accentColor: normalizeColor,
    backgroundPalette: normalizeControlled(visualVariantValues),
    typographyMood: normalizeControlled([...visualVariantValues, 'serif-premium', 'modern-sans', 'mixed-editorial']),
    generalMood: normalizeControlled(visualVariantValues),
    graphicStyle: normalizeControlled(visualVariantValues),
    themePreset: normalizeThemePreset,
  },
  layout: {
    style: normalizeControlled(visualVariantValues),
    density: normalizeControlled(spacingValues),
    composition: normalizeComposition,
  },
  hero: {
    imageUrl: normalizeUrl,
    surface: normalizeControlled(heroSurfaceValues, 'dark'),
    style: normalizeControlled(visualVariantValues),
    layout: normalizeControlled(heroLayoutValues, 'full'),
    height: normalizeHeroHeight,
    overlay: normalizeOverlay,
    imageCrop: normalizeControlled(imageTreatmentValues),
    imagePosition: normalizeCssText,
    contentWidth: normalizeLength,
    titleAlignment: normalizeControlled(alignmentValues, 'left'),
    titleWidth: normalizeLength,
    titleSize: normalizeLength,
    headlineScale: normalizeControlled(heroHeadlineScaleValues, 'xl'),
    titleStyle: normalizeControlled([...visualVariantValues, 'serif-premium', 'modern-sans', 'mixed-editorial']),
    subtitleSize: normalizeLength,
    subtitleStyle: normalizeControlled([...visualVariantValues, 'serif-premium', 'modern-sans', 'mixed-editorial']),
    buttonStyle: normalizeControlled(buttonShapeValues),
    buttonPosition: normalizeControlled(positionValues),
    secondaryCta: normalizeControlled(navigationVisibilityValues, 'hidden'),
    search: normalizeControlled(navigationVisibilityValues, 'hidden'),
    title: normalizeContentText,
    subtitle: normalizeContentText,
    cta: normalizeContentText,
  },
  header: {
    transparency: normalizeOpacity,
    height: normalizeLength,
    style: normalizeControlled([...visualVariantValues, 'transparent', 'sticky', 'compact']),
    behavior: normalizeControlled(['fixed', 'sticky', 'static', 'default']),
  },
  navigation: {
    style: normalizeControlled([...visualVariantValues, 'transparent', 'compact', 'sticky']),
    mobileStyle: normalizeControlled(mobileNavigationValues),
    surface: normalizeControlled(navigationSurfaceValues, 'transparent'),
    density: normalizeControlled(navigationDensityValues, 'standard'),
    behavior: normalizeControlled(navigationBehaviorValues, 'static'),
    logoMode: normalizeControlled(navigationLogoModeValues, 'auto'),
    primaryCta: normalizeControlled(navigationVisibilityValues, 'visible'),
    privateAccess: normalizeControlled(navigationVisibilityValues, 'visible'),
    height: normalizeLength,
    background: normalizeColor,
    colors: normalizeColor,
    linkColor: normalizeColor,
    linkColors: normalizeColor,
    spacing: normalizeLength,
    transparency: normalizeOpacity,
  },
  footer: {
    style: normalizeControlled(visualVariantValues),
    background: normalizeColor,
    spacing: normalizeLength,
  },
  sidebar: {
    style: normalizeControlled(visualVariantValues),
    width: normalizeLength,
    background: normalizeColor,
  },
  container: {
    width: normalizeLength,
    maxWidth: normalizeLength,
    padding: normalizeLength,
  },
  grid: {
    gap: normalizeLength,
    columns: normalizeIntegerText,
    density: normalizeControlled(spacingValues),
  },
  sections: {
    sectionOrder: normalizeSectionOrder,
    sectionSpacing: normalizeControlled(spacingValues, 'balanced'),
    defaultBackground: normalizeColor,
    defaultMood: normalizeControlled(visualVariantValues),
    contentWidth: normalizeLength,
    sectionBackgrounds: normalizeCssText,
  },
  propertyCards: {
    cardStyle: normalizeControlled(cardStyleValues, 'structured'),
    imageRatio: normalizeAspectRatio,
    imageTreatment: normalizeControlled(imageTreatmentValues),
    cardRadius: normalizeLength,
    shadowStyle: normalizeShadow,
    spacing: normalizeLength,
    informationStyle: normalizeControlled(visualVariantValues),
    priceStyle: normalizeControlled(visualVariantValues),
    badgeStyle: normalizeControlled(visualVariantValues),
  },
  buttons: {
    shape: normalizeControlled(buttonShapeValues, 'pill'),
    background: normalizeColor,
    textColor: normalizeColor,
    size: normalizeLength,
    borderStyle: normalizeBorder,
    hoverStyle: normalizeColor,
    generalStyle: normalizeControlled(visualVariantValues),
  },
  typography: {
    titleStyle: normalizeControlled([...visualVariantValues, 'serif-premium', 'modern-sans', 'mixed-editorial']),
    subtitleStyle: normalizeControlled([...visualVariantValues, 'serif-premium', 'modern-sans', 'mixed-editorial']),
    bodyStyle: normalizeControlled([...visualVariantValues, 'serif-premium', 'modern-sans', 'mixed-editorial']),
    hierarchy: normalizeControlled([...visualVariantValues, 'strong', 'soft', 'balanced']),
  },
  images: {
    heroImageStyle: normalizeControlled(imageTreatmentValues),
    sectionImageStyle: normalizeControlled(imageTreatmentValues),
    treatment: normalizeControlled(imageTreatmentValues),
    cropStyle: normalizeControlled(imageTreatmentValues),
    overlays: normalizeOverlay,
    mood: normalizeControlled(visualVariantValues),
  },
  forms: {
    style: normalizeControlled(visualVariantValues),
    density: normalizeControlled(spacingValues),
    fieldStyle: normalizeControlled(visualVariantValues),
  },
  dashboard: {
    style: normalizeControlled(visualVariantValues),
    density: normalizeControlled(spacingValues),
    cardStyle: normalizeControlled(cardStyleValues),
  },
  mobileNavigation: {
    style: normalizeControlled(mobileNavigationValues),
  },
  responsive: {
    heroMobileHeight: normalizeLength,
    mobileSpacing: normalizeControlled(spacingValues),
    mobileTypographyScale: normalizeCssText,
    cardBehavior: normalizeControlled(['stacked', 'carousel', 'grid', 'compact']),
  },
}

export function parseVisualBlueprintV1(value?: string): VisualBlueprintV1 | null {
  return parseVisualBlueprintV1Result(value).blueprint
}

export function parseVisualBlueprintV1Result(value?: string): VisualBlueprintParseResult {
  const diagnostics: VisualBlueprintDiagnostic[] = []
  if (!value) return { blueprint: null, diagnostics }

  const lines = value.split(/\r?\n/)
  const hasRoot = lines.some((line) => line.trim() === 'VisualBlueprint:')
  const hasVersion = lines.some((line) => line.trim() === 'version: v1')

  if (!hasRoot) {
    diagnostics.push({
      level: 'error',
      section: 'root',
      message: 'Racine VisualBlueprint manquante.',
    })
  }

  if (!hasVersion) {
    diagnostics.push({
      level: 'error',
      section: 'root',
      property: 'version',
      fallback: 'Blueprint ignore',
      message: 'Version v1 manquante ou invalide.',
    })
  }

  if (!hasRoot || !hasVersion) return { blueprint: null, diagnostics }

  const blueprint = createEmptyBlueprint(value, diagnostics)
  let currentSection: VisualBlueprintSectionName | '' = ''

  lines.forEach((line) => {
    const sectionMatch = line.match(/^\s{2}([A-Za-z][A-Za-z0-9_-]*)\s*:\s*$/)
    if (sectionMatch) {
      const section = sectionMatch[1] as VisualBlueprintSectionName
      if (visualBlueprintSections.has(section)) {
        currentSection = section
        return
      }

      currentSection = ''
      diagnostics.push({
        level: 'warning',
        section: 'root',
        property: sectionMatch[1],
        message: 'Section VisualBlueprint inconnue ignoree.',
      })
      return
    }

    if (!currentSection) return

    const fieldMatch = line.match(/^\s{4}([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (!fieldMatch) return

    const property = fieldMatch[1]
    const rawValue = cleanVisualBlueprintValue(fieldMatch[2])
    if (!rawValue) return

    const normalizer = normalizers[currentSection][property]
    if (!normalizer) {
      diagnostics.push({
        level: 'warning',
        section: currentSection,
        property,
        value: rawValue,
        message: 'Propriete VisualBlueprint inconnue ignoree.',
      })
      return
    }

    const normalized = normalizer(rawValue, {
      section: currentSection,
      property,
      diagnostics,
    })
    if (!normalized) return

    writeBlueprintValue(blueprint, currentSection, property, normalized)
  })

  return { blueprint, diagnostics }
}

export function cleanVisualBlueprintValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, '')
}

function createEmptyBlueprint(raw: string, diagnostics: VisualBlueprintDiagnostic[]): VisualBlueprintV1 {
  return {
    version: 'v1',
    raw,
    diagnostics,
    brand: {},
    layout: {},
    hero: {},
    header: {},
    navigation: {},
    footer: {},
    sidebar: {},
    container: {},
    grid: {},
    sections: {},
    propertyCards: {},
    buttons: {},
    typography: {},
    images: {},
    forms: {},
    dashboard: {},
    mobileNavigation: {},
    responsive: {},
  }
}

function writeBlueprintValue(
  blueprint: VisualBlueprintV1,
  section: VisualBlueprintSectionName,
  property: string,
  value: string,
) {
  ;(blueprint[section] as { [property: string]: string })[property] = value
}

function normalizeControlled<T extends readonly string[]>(allowedValues: T, fallback?: T[number]): Normalizer {
  const allowed = new Set<string>(allowedValues)

  return (value, context) => {
    const normalized = normalizeClassLikeValue(value)
    const alias = readAlias(normalized)
    const candidate = alias || normalized

    if (allowed.has(candidate)) {
      if (alias) {
        context.diagnostics.push({
          level: 'info',
          section: context.section,
          property: context.property,
          value,
          fallback: candidate,
          message: 'Alias historique normalise.',
        })
      }
      return candidate
    }

    if (fallback) {
      context.diagnostics.push({
        level: 'warning',
        section: context.section,
        property: context.property,
        value,
        fallback,
        message: 'Valeur inconnue remplacee par un fallback.',
      })
      return fallback
    }

    context.diagnostics.push({
      level: 'warning',
      section: context.section,
      property: context.property,
      value,
      message: 'Valeur inconnue ignoree.',
    })
    return undefined
  }
}

function normalizeThemePreset(value: string, context: NormalizerContext) {
  const normalized = value.trim().toLowerCase().replace(/-/g, '_')
  if (themePresetValues.includes(normalized as (typeof themePresetValues)[number])) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Theme preset inconnu ignore.',
  })
  return undefined
}

function normalizeComposition(value: string, context: NormalizerContext) {
  const normalized = normalizeClassLikeValue(value)
  const aliases: { [key: string]: (typeof compositionPresetValues)[number] } = {
    editorial: 'editorial-immersive',
    immersive: 'editorial-immersive',
    luxury: 'editorial-immersive',
    premium: 'editorial-immersive',
    direct: 'commercial-direct',
    conversion: 'commercial-direct',
    commercial: 'commercial-direct',
    trust: 'institutional-trust',
    institutional: 'institutional-trust',
    credible: 'institutional-trust',
    local: 'local-human',
    human: 'local-human',
    warm: 'local-human',
    data: 'data-investment',
    investment: 'data-investment',
    expert: 'data-investment',
  }
  const candidate = aliases[normalized] ?? normalized
  if (compositionPresetValues.includes(candidate as (typeof compositionPresetValues)[number])) {
    if (candidate !== normalized) {
      context.diagnostics.push({
        level: 'info',
        section: context.section,
        property: context.property,
        value,
        fallback: candidate,
        message: 'Alias de composition normalise.',
      })
    }
    return candidate
  }

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    fallback: 'commercial-direct',
    message: 'Composition inconnue remplacee par le fallback.',
  })
  return 'commercial-direct'
}

function normalizeColor(value: string, context: NormalizerContext) {
  const normalized = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Couleur invalide ignoree. Utiliser le format #RRGGBB.',
  })
  return undefined
}

function normalizeUrl(value: string, context: NormalizerContext) {
  const normalized = value.trim()
  if (/^(https?:\/\/|data:image\/|blob:|\/)/i.test(normalized)) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'URL ou chemin image invalide ignore.',
  })
  return undefined
}

function normalizeLength(value: string, context: NormalizerContext) {
  const normalized = value.trim().toLowerCase()
  if (/^\d+(\.\d+)?(px|rem|em|vh|svh|vw|%)$/.test(normalized)) return normalized
  if (/^\d+(\.\d+)?$/.test(normalized)) {
    context.diagnostics.push({
      level: 'info',
      section: context.section,
      property: context.property,
      value,
      fallback: `${normalized}px`,
      message: 'Longueur numerique convertie en pixels.',
    })
    return `${normalized}px`
  }
  if (/^clamp\([0-9a-z.,% -]+\)$/.test(normalized)) return normalized
  if (/^(min|max)\([0-9a-z.,% /-]+\)$/.test(normalized)) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Longueur CSS invalide ignoree.',
  })
  return undefined
}

function normalizeHeroHeight(value: string, context: NormalizerContext) {
  const normalized = normalizeClassLikeValue(value)
  const candidate = readAlias(normalized) || normalized
  if (heroHeightValues.includes(candidate as (typeof heroHeightValues)[number])) return candidate

  return normalizeLength(value, context)
}

function normalizeOpacity(value: string, context: NormalizerContext) {
  const normalized = value.trim()
  const numberValue = Number(normalized)
  if (Number.isFinite(numberValue) && numberValue >= 0 && numberValue <= 1) return String(numberValue)

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Opacite invalide ignoree. Valeur attendue entre 0 et 1.',
  })
  return undefined
}

function normalizeAspectRatio(value: string, context: NormalizerContext) {
  const normalized = value.trim().replace(/\s+/g, '')
  if (/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(normalized)) return normalized.replace('/', ' / ')

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Ratio image invalide ignore.',
  })
  return undefined
}

function normalizeBorder(value: string, context: NormalizerContext) {
  const normalized = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return `1px solid ${normalized}`
  if (/^\d+(\.\d+)?px\s+(solid|dashed|double)\s+#[0-9a-fA-F]{6}$/.test(normalized)) return normalized
  if (['none', 'transparent'].includes(normalized.toLowerCase())) return '1px solid transparent'

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Bordure invalide ignoree.',
  })
  return undefined
}

function normalizeShadow(value: string, context: NormalizerContext) {
  const normalized = value.trim().toLowerCase()
  if (['none', 'soft', 'medium', 'deep', 'luxury'].includes(normalized)) return normalized
  if (/^0\s+\d+px\s+\d+px\s+rgba?\([0-9.,\s]+\)$/.test(normalized)) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Ombre invalide ignoree.',
  })
  return undefined
}

function normalizeOverlay(value: string, context: NormalizerContext) {
  const normalized = value.trim().toLowerCase()
  if (['dark', 'light', 'soft', 'none'].includes(normalized)) return normalized
  if (/^linear-gradient\([0-9a-z.,%#() /-]+\)$/.test(normalized)) return value.trim()

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    fallback: 'dark',
    message: 'Overlay inconnu remplace par un fallback.',
  })
  return 'dark'
}

function normalizeCssText(value: string, context: NormalizerContext) {
  const normalized = value.trim()
  if (/^[a-zA-Z0-9#(),.%/ -]+$/.test(normalized)) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Texte CSS non supporte ignore.',
  })
  return undefined
}

function normalizeIntegerText(value: string, context: NormalizerContext) {
  const normalized = value.trim()
  if (/^\d+$/.test(normalized)) return normalized

  context.diagnostics.push({
    level: 'warning',
    section: context.section,
    property: context.property,
    value,
    message: 'Nombre entier invalide ignore.',
  })
  return undefined
}

function normalizeSectionOrder(value: string) {
  return value.split(',').map((item) => normalizeClassLikeValue(item)).filter(Boolean).join(',')
}

function normalizeContentText(value: string) {
  return value.trim()
}

function normalizeClassLikeValue(value: string) {
  return value.trim().toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

function readAlias(value: string) {
  const direct = aliasMap[value as keyof typeof aliasMap]
  if (direct) return direct
  const underscored = value.replace(/-/g, '_')
  return aliasMap[underscored as keyof typeof aliasMap]
}
