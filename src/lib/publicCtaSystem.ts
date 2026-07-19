import type { AgencyIdentity } from './agencyIdentity'
import type { PublicNavigationTarget } from './publicNavigationSystem'

export type PublicCtaAction = 'estimation' | 'properties' | 'contact' | 'visit-request' | 'private-access'
export type PublicCtaPriority = 'primary' | 'secondary' | 'text'
export type PublicCtaVariant = 'solid' | 'outline' | 'text'
export type PublicCtaSurface = 'light' | 'dark'
export type PublicCtaHover = 'none' | 'subtle' | 'lift'

export type PublicCtaConfig = {
  action: PublicCtaAction
  label: string
  target: PublicNavigationTarget
  priority: PublicCtaPriority
  variant: PublicCtaVariant
  surface: PublicCtaSurface
  hover: PublicCtaHover
  visible: boolean
  className: string
}

export type ResolvePublicCtaInput = {
  agencyIdentity: AgencyIdentity
  baseRoute: string
  context: 'hero' | 'contact' | 'collection' | 'property-detail' | 'navigation'
  canEstimate?: boolean
  canShowProperties?: boolean
  hasPrivateSpace?: boolean
}

export function resolvePublicCtas(input: ResolvePublicCtaInput): PublicCtaConfig[] {
  const primary = resolvePrimaryAction(input)
  const candidates = [
    createCta(input, primary, 'primary'),
    input.context !== 'property-detail' && input.canShowProperties ? createCta(input, 'properties', 'secondary') : null,
    input.context !== 'contact' ? createCta(input, 'contact', 'text') : null,
    input.hasPrivateSpace && input.context === 'navigation' ? createCta(input, 'private-access', 'text') : null,
  ].filter((item): item is PublicCtaConfig => Boolean(item))

  return dedupeCtas(candidates)
}

export function resolvePublicCta(input: ResolvePublicCtaInput): PublicCtaConfig {
  return resolvePublicCtas(input)[0] ?? createCta(input, 'contact', 'primary')
}

function resolvePrimaryAction(input: ResolvePublicCtaInput): PublicCtaAction {
  if (input.context === 'property-detail') return 'visit-request'
  if (input.context === 'collection' && input.canShowProperties) return 'properties'
  if (input.canEstimate) return 'estimation'
  if (input.canShowProperties) return 'properties'
  return 'contact'
}

function createCta(input: ResolvePublicCtaInput, action: PublicCtaAction, priority: PublicCtaPriority): PublicCtaConfig {
  const variant = priority === 'primary' ? resolveVariant(input.agencyIdentity.visualBlueprint?.buttons.variant) : priority === 'secondary' ? 'outline' : 'text'
  const surface = input.agencyIdentity.composition.ctaPriority === 'rare' ? 'dark' : 'light'
  const hover = resolveHover(input.agencyIdentity.visualBlueprint?.buttons.hover)
  const shape = resolveShape(input.agencyIdentity.visualBlueprint?.buttons.shape || input.agencyIdentity.visualBlueprint?.hero.buttonStyle)

  return {
    action,
    label: resolveLabel(action, input),
    target: resolveTarget(action, input.baseRoute),
    priority,
    variant,
    surface,
    hover,
    visible: isVisible(action, input),
    className: [
      'od-public-cta',
      `od-public-cta-action-${action}`,
      `od-public-cta-priority-${priority}`,
      `od-public-cta-variant-${variant}`,
      `od-public-cta-shape-${shape}`,
      `od-public-cta-surface-${surface}`,
      `od-public-cta-hover-${hover}`,
    ].join(' '),
  }
}

function resolveTarget(action: PublicCtaAction, baseRoute: string): PublicNavigationTarget {
  if (action === 'estimation') return { route: `${baseRoute}/estimation` }
  if (action === 'properties') return { route: `${baseRoute}/biens` }
  if (action === 'visit-request') return { route: baseRoute, anchor: 'demande-visite' }
  if (action === 'private-access') return { route: `${baseRoute}/connexion` }
  return { route: baseRoute, anchor: 'contact' }
}

function resolveLabel(action: PublicCtaAction, input: ResolvePublicCtaInput) {
  if (action === 'estimation') return input.agencyIdentity.content.primaryCtaLabel
  if (action === 'properties') return 'Voir les biens'
  if (action === 'visit-request') return 'Demander une visite'
  if (action === 'private-access') return 'Acces prive'
  return "Contacter l'agence"
}

function isVisible(action: PublicCtaAction, input: ResolvePublicCtaInput) {
  if (action === 'estimation') return Boolean(input.canEstimate)
  if (action === 'properties') return Boolean(input.canShowProperties)
  if (action === 'private-access') return Boolean(input.hasPrivateSpace)
  return true
}

function dedupeCtas(items: PublicCtaConfig[]) {
  const seen = new Set<PublicCtaAction>()
  return items.filter((item) => {
    if (!item.visible || seen.has(item.action)) return false
    seen.add(item.action)
    return true
  })
}

function resolveVariant(value?: string): PublicCtaVariant {
  const normalized = toClassValue(value)
  if (normalized === 'outline' || normalized === 'text') return normalized
  return 'solid'
}

function resolveHover(value?: string): PublicCtaHover {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'lift') return normalized
  return 'subtle'
}

function resolveShape(value?: string) {
  const normalized = toClassValue(value)
  if (['sharp', 'soft', 'subtle', 'luxury-gold', 'rounded', 'none'].includes(normalized)) return normalized
  return 'pill'
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
