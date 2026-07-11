import type { CSSProperties } from 'react'
import type { VisualBlueprintV1 } from './visualBlueprint'

export type AnimationIntent = 'feedback' | 'reveal' | 'transition' | 'continuity'
export type AnimationLevel = 'reduced' | 'restrained' | 'expressive'

export type AnimationContract = {
  level: AnimationLevel
  effectiveLevel: AnimationLevel
  durations: {
    instant: string
    fast: string
    standard: string
    slow: string
  }
  easings: {
    standard: string
    enter: string
    exit: string
  }
  distance: {
    small: string
    medium: string
  }
  intentions: AnimationIntent[]
  className: string
  tokens: CSSProperties
}

const defaultDurations = {
  instant: '0ms',
  fast: '140ms',
  standard: '220ms',
  slow: '320ms',
}

const reducedDurations = {
  instant: '0ms',
  fast: '1ms',
  standard: '1ms',
  slow: '1ms',
}

const easings = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
}

export function resolveAnimationContract(
  blueprint: VisualBlueprintV1 | null,
  options: { privateSurface?: boolean } = {},
): AnimationContract {
  const level = resolveAnimationLevel(blueprint?.responsive.motionLevel)
  const effectiveLevel = options.privateSurface && level === 'expressive' ? 'restrained' : level
  const durations = effectiveLevel === 'reduced' ? reducedDurations : defaultDurations
  const smallDistance = effectiveLevel === 'expressive' ? '0.22rem' : effectiveLevel === 'reduced' ? '0rem' : '0.12rem'
  const mediumDistance = effectiveLevel === 'expressive' ? '0.44rem' : effectiveLevel === 'reduced' ? '0rem' : '0.24rem'

  return {
    level,
    effectiveLevel,
    durations,
    easings,
    distance: {
      small: smallDistance,
      medium: mediumDistance,
    },
    intentions: ['feedback', 'reveal', 'transition', 'continuity'],
    className: `od-motion-${effectiveLevel}`,
    tokens: {
      '--od-motion-instant': durations.instant,
      '--od-motion-fast': durations.fast,
      '--od-motion-standard': durations.standard,
      '--od-motion-slow': durations.slow,
      '--od-motion-ease-standard': easings.standard,
      '--od-motion-ease-enter': easings.enter,
      '--od-motion-ease-exit': easings.exit,
      '--od-motion-distance-small': smallDistance,
      '--od-motion-distance-medium': mediumDistance,
      '--od-token-animation': `var(--od-motion-standard) var(--od-motion-ease-standard)`,
    } as CSSProperties,
  }
}

function resolveAnimationLevel(value?: string): AnimationLevel {
  if (value === 'reduced' || value === 'expressive') return value
  return 'restrained'
}
