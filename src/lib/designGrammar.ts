import type { VisualBlueprintV1 } from './visualBlueprint'

export type DesignGrammarFamily =
  | 'editorial_luxury'
  | 'modern_premium'
  | 'warm_local_trust'
  | 'minimal_prestige'

export type DesignGrammarRules = {
  family: DesignGrammarFamily
  imageScale: 'cinematic' | 'balanced' | 'human' | 'restrained'
  spacing: 'airy' | 'balanced' | 'warm' | 'minimal'
  typography: 'editorial_serif' | 'modern_sans' | 'warm_serif' | 'quiet_sans'
  contrast: 'high' | 'balanced' | 'soft' | 'quiet'
  cardDensity: 'editorial' | 'structured' | 'comfortable' | 'reduced'
  buttonMood: 'gold_statement' | 'confident' | 'soft_trust' | 'discreet'
  sectionRhythm: 'magazine' | 'systematic' | 'reassuring' | 'spacious'
  emotionalIntent: string
}

export type AgencyIdentitySignal = {
  visualTheme?: string
  mood?: string
  themePreset?: string
  heroVariant?: string
  typographyMood?: string
  propertyCardStyle?: string
  buttonMood?: string
  visualBlueprint?: VisualBlueprintV1 | null
}

export const designGrammarFamilies: Record<DesignGrammarFamily, DesignGrammarRules> = {
  editorial_luxury: {
    family: 'editorial_luxury',
    imageScale: 'cinematic',
    spacing: 'airy',
    typography: 'editorial_serif',
    contrast: 'high',
    cardDensity: 'editorial',
    buttonMood: 'gold_statement',
    sectionRhythm: 'magazine',
    emotionalIntent: 'Create desire, status, and premium confidence through editorial pacing and strong visual hierarchy.',
  },
  modern_premium: {
    family: 'modern_premium',
    imageScale: 'balanced',
    spacing: 'balanced',
    typography: 'modern_sans',
    contrast: 'balanced',
    cardDensity: 'structured',
    buttonMood: 'confident',
    sectionRhythm: 'systematic',
    emotionalIntent: 'Make the agency feel clear, efficient, reliable, and commercially premium.',
  },
  warm_local_trust: {
    family: 'warm_local_trust',
    imageScale: 'human',
    spacing: 'warm',
    typography: 'warm_serif',
    contrast: 'soft',
    cardDensity: 'comfortable',
    buttonMood: 'soft_trust',
    sectionRhythm: 'reassuring',
    emotionalIntent: 'Reassure sellers through proximity, warmth, clarity, and visible accompaniment.',
  },
  minimal_prestige: {
    family: 'minimal_prestige',
    imageScale: 'restrained',
    spacing: 'minimal',
    typography: 'quiet_sans',
    contrast: 'quiet',
    cardDensity: 'reduced',
    buttonMood: 'discreet',
    sectionRhythm: 'spacious',
    emotionalIntent: 'Signal prestige through restraint, precision, silence, and selective emphasis.',
  },
}

export function resolveDesignGrammar(signal: AgencyIdentitySignal = {}): DesignGrammarRules {
  return designGrammarFamilies[resolveDesignGrammarFamily(signal)]
}

export function resolveDesignGrammarFamily(signal: AgencyIdentitySignal = {}): DesignGrammarFamily {
  const source = normalizeSignal([
    signal.visualTheme,
    signal.mood,
    signal.themePreset,
    signal.heroVariant,
    signal.typographyMood,
    signal.propertyCardStyle,
    signal.buttonMood,
    signal.visualBlueprint?.brand.generalMood,
    signal.visualBlueprint?.brand.graphicStyle,
    signal.visualBlueprint?.brand.typographyMood,
    signal.visualBlueprint?.brand.backgroundPalette,
    signal.visualBlueprint?.hero.layout,
    signal.visualBlueprint?.hero.overlay,
    signal.visualBlueprint?.hero.titleStyle,
    signal.visualBlueprint?.propertyCards.cardStyle,
    signal.visualBlueprint?.sections.defaultMood,
    signal.visualBlueprint?.sections.sectionSpacing,
    signal.visualBlueprint?.buttons.generalStyle,
    signal.visualBlueprint?.buttons.shape,
    signal.visualBlueprint?.images.mood,
  ])

  if (/editorial|luxury|luxe|magazine|cinematic|elegant|premium|navy|ivory|gold|prestige-editorial/.test(source)) {
    return 'editorial_luxury'
  }

  if (/trust|local|warm|human|humain|proxim|rassur|chaleur|family|community/.test(source)) {
    return 'warm_local_trust'
  }

  if (/minimal|prestige|sober|sobre|quiet|clean-space|restraint|reduced/.test(source)) {
    return 'minimal_prestige'
  }

  if (/modern|clean|sharp|structured|system|premium-light|performance/.test(source)) {
    return 'modern_premium'
  }

  return 'modern_premium'
}

function normalizeSignal(values: Array<string | undefined>) {
  return values
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}
