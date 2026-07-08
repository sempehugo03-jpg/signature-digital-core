import type { VisualBlueprintV1 } from './visualBlueprint'

export type DesignGrammarFamily =
  | 'editorial_luxury'
  | 'modern_premium'
  | 'warm_local_trust'
  | 'minimal_prestige'

export type DesignGrammarInput = {
  visualBlueprint?: VisualBlueprintV1 | null
  agencyIdentity?: {
    visualTheme?: string
    mood?: string
    themePreset?: string
    heroVariant?: string
    typographyMood?: string
    propertyCardStyle?: string
    buttonMood?: string
    visualPreset?: string
  }
}

export type DesignGrammarDecision = {
  family: DesignGrammarFamily
  emotionalIntent: string
  images: {
    scale: 'dominant' | 'balanced' | 'human' | 'restrained'
    crop: 'editorial' | 'clean' | 'natural' | 'minimal'
    rhythm: 'immersive' | 'structured' | 'reassuring' | 'quiet'
  }
  typography: {
    mood: 'elegant_serif' | 'modern_sans' | 'warm_editorial' | 'restrained_sans'
    hierarchy: 'strong' | 'clear' | 'soft' | 'selective'
    titleBehavior: 'statement' | 'direct' | 'welcoming' | 'precise'
  }
  spacing: {
    scale: 'generous' | 'balanced' | 'comfortable' | 'spacious'
    mobile: 'breathing' | 'efficient' | 'soft' | 'minimal'
  }
  cards: {
    density: 'low' | 'medium' | 'comfortable' | 'reduced'
    imagePriority: 'high' | 'medium' | 'human' | 'measured'
    surface: 'transparent' | 'white' | 'warm' | 'quiet'
  }
  buttons: {
    mood: 'premium_statement' | 'confident_action' | 'soft_guidance' | 'discreet_precision'
    shape: 'sharp' | 'pill' | 'soft' | 'minimal'
    emphasis: 'high' | 'strong' | 'medium' | 'low'
  }
  sections: {
    rhythm: 'storytelling' | 'systematic' | 'reassuring' | 'editorial_pause'
    density: 'airy' | 'balanced' | 'comfortable' | 'minimal'
  }
  contrast: 'high' | 'balanced' | 'soft' | 'quiet'
  storytelling: 'slow_premium' | 'clear_value' | 'trust_building' | 'silent_prestige'
}

export const designGrammarDictionary: Record<DesignGrammarFamily, DesignGrammarDecision> = {
  editorial_luxury: {
    family: 'editorial_luxury',
    emotionalIntent: 'Produce desire, status, and premium confidence through editorial pacing.',
    images: {
      scale: 'dominant',
      crop: 'editorial',
      rhythm: 'immersive',
    },
    typography: {
      mood: 'elegant_serif',
      hierarchy: 'strong',
      titleBehavior: 'statement',
    },
    spacing: {
      scale: 'generous',
      mobile: 'breathing',
    },
    cards: {
      density: 'low',
      imagePriority: 'high',
      surface: 'transparent',
    },
    buttons: {
      mood: 'premium_statement',
      shape: 'sharp',
      emphasis: 'high',
    },
    sections: {
      rhythm: 'storytelling',
      density: 'airy',
    },
    contrast: 'high',
    storytelling: 'slow_premium',
  },
  modern_premium: {
    family: 'modern_premium',
    emotionalIntent: 'Produce clarity, confidence, and commercial premium value.',
    images: {
      scale: 'balanced',
      crop: 'clean',
      rhythm: 'structured',
    },
    typography: {
      mood: 'modern_sans',
      hierarchy: 'clear',
      titleBehavior: 'direct',
    },
    spacing: {
      scale: 'balanced',
      mobile: 'efficient',
    },
    cards: {
      density: 'medium',
      imagePriority: 'medium',
      surface: 'white',
    },
    buttons: {
      mood: 'confident_action',
      shape: 'pill',
      emphasis: 'strong',
    },
    sections: {
      rhythm: 'systematic',
      density: 'balanced',
    },
    contrast: 'balanced',
    storytelling: 'clear_value',
  },
  warm_local_trust: {
    family: 'warm_local_trust',
    emotionalIntent: 'Produce reassurance, proximity, and trust through warmer pacing.',
    images: {
      scale: 'human',
      crop: 'natural',
      rhythm: 'reassuring',
    },
    typography: {
      mood: 'warm_editorial',
      hierarchy: 'soft',
      titleBehavior: 'welcoming',
    },
    spacing: {
      scale: 'comfortable',
      mobile: 'soft',
    },
    cards: {
      density: 'comfortable',
      imagePriority: 'human',
      surface: 'warm',
    },
    buttons: {
      mood: 'soft_guidance',
      shape: 'soft',
      emphasis: 'medium',
    },
    sections: {
      rhythm: 'reassuring',
      density: 'comfortable',
    },
    contrast: 'soft',
    storytelling: 'trust_building',
  },
  minimal_prestige: {
    family: 'minimal_prestige',
    emotionalIntent: 'Produce prestige through restraint, silence, and selective emphasis.',
    images: {
      scale: 'restrained',
      crop: 'minimal',
      rhythm: 'quiet',
    },
    typography: {
      mood: 'restrained_sans',
      hierarchy: 'selective',
      titleBehavior: 'precise',
    },
    spacing: {
      scale: 'spacious',
      mobile: 'minimal',
    },
    cards: {
      density: 'reduced',
      imagePriority: 'measured',
      surface: 'quiet',
    },
    buttons: {
      mood: 'discreet_precision',
      shape: 'minimal',
      emphasis: 'low',
    },
    sections: {
      rhythm: 'editorial_pause',
      density: 'minimal',
    },
    contrast: 'quiet',
    storytelling: 'silent_prestige',
  },
}

export function translateVisualIntentToDesignGrammar(input: DesignGrammarInput = {}): DesignGrammarDecision {
  return designGrammarDictionary[resolveDesignGrammarFamily(input)]
}

export function resolveDesignGrammarFamily(input: DesignGrammarInput = {}): DesignGrammarFamily {
  const signal = normalizeSignal([
    input.agencyIdentity?.visualTheme,
    input.agencyIdentity?.mood,
    input.agencyIdentity?.themePreset,
    input.agencyIdentity?.heroVariant,
    input.agencyIdentity?.typographyMood,
    input.agencyIdentity?.propertyCardStyle,
    input.agencyIdentity?.buttonMood,
    input.agencyIdentity?.visualPreset,
    input.visualBlueprint?.brand.generalMood,
    input.visualBlueprint?.brand.graphicStyle,
    input.visualBlueprint?.brand.typographyMood,
    input.visualBlueprint?.brand.backgroundPalette,
    input.visualBlueprint?.layout.style,
    input.visualBlueprint?.hero.layout,
    input.visualBlueprint?.hero.overlay,
    input.visualBlueprint?.hero.titleStyle,
    input.visualBlueprint?.propertyCards.cardStyle,
    input.visualBlueprint?.sections.defaultMood,
    input.visualBlueprint?.sections.sectionSpacing,
    input.visualBlueprint?.buttons.generalStyle,
    input.visualBlueprint?.buttons.shape,
    input.visualBlueprint?.images.mood,
  ])

  if (/editorial|luxury|luxe|magazine|cinematic|elegant|premium|navy|ivory|gold|prestige-editorial/.test(signal)) {
    return 'editorial_luxury'
  }

  if (/trust|local|warm|human|humain|proxim|rassur|reassur|chaleur|family|community/.test(signal)) {
    return 'warm_local_trust'
  }

  if (/minimal|prestige|sober|sobre|quiet|clean-space|restraint|reduced|silent/.test(signal)) {
    return 'minimal_prestige'
  }

  if (/modern|clean|sharp|structured|system|performance|direct/.test(signal)) {
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
