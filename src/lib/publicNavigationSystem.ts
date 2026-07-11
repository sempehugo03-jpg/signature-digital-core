import type { AgencyIdentity } from './agencyIdentity'

export type PublicNavigationSurface = 'light' | 'dark' | 'transparent'
export type PublicNavigationDensity = 'compact' | 'standard'
export type PublicNavigationBehavior = 'static' | 'sticky'
export type PublicNavigationLogoMode = 'auto' | 'light' | 'dark'
export type PublicNavigationVisibility = 'visible' | 'hidden'

export type PublicNavigationTarget = {
  route: string
  anchor?: string
}

export type PublicNavigationLink = {
  id: 'home' | 'properties' | 'agency' | 'contact'
  label: string
  icon: string
  target: PublicNavigationTarget
}

export type PublicNavigationAction = {
  id: 'primaryCta' | 'privateAccess'
  label: string
  icon: string
  target: PublicNavigationTarget
  visible: boolean
}

export type PublicNavigationConfig = {
  surface: PublicNavigationSurface
  density: PublicNavigationDensity
  behavior: PublicNavigationBehavior
  logoMode: PublicNavigationLogoMode
  showPrimaryCta: boolean
  showPrivateAccess: boolean
  links: PublicNavigationLink[]
  primaryCta: PublicNavigationAction
  privateAccess: PublicNavigationAction
  logo: {
    src: string
    alt: string
    mode: Exclude<PublicNavigationLogoMode, 'auto'>
  }
  className: string
}

export type ResolvePublicNavigationInput = {
  agencyIdentity: AgencyIdentity
  baseRoute: string
  canShowProperties: boolean
  canEstimate: boolean
  hasPrivateSpace: boolean
}

export function resolvePublicNavigation(input: ResolvePublicNavigationInput): PublicNavigationConfig {
  const blueprint = input.agencyIdentity.visualBlueprint
  const surface = resolveSurface(blueprint?.navigation.surface || blueprint?.navigation.style)
  const density = resolveDensity(blueprint?.navigation.density || blueprint?.navigation.style)
  const behavior = resolveBehavior(blueprint?.navigation.behavior || blueprint?.header.behavior || blueprint?.navigation.style)
  const logoMode = resolveLogoMode(blueprint?.navigation.logoMode)
  const showPrimaryCta = resolveVisibility(blueprint?.navigation.primaryCta) !== 'hidden'
  const showPrivateAccess = resolveVisibility(blueprint?.navigation.privateAccess) !== 'hidden'
  const propertiesTarget = input.canShowProperties
    ? { route: `${input.baseRoute}/biens` }
    : { route: input.baseRoute, anchor: 'contact' }
  const primaryTarget = input.canEstimate
    ? { route: `${input.baseRoute}/estimation` }
    : input.canShowProperties
      ? propertiesTarget
      : { route: input.baseRoute, anchor: 'contact' }
  const resolvedLogoMode = logoMode === 'auto'
    ? surface === 'dark' || surface === 'transparent' ? 'light' : 'dark'
    : logoMode
  const logoSrc = selectLogo(input.agencyIdentity, resolvedLogoMode)

  return {
    surface,
    density,
    behavior,
    logoMode,
    showPrimaryCta,
    showPrivateAccess,
    links: [
      { id: 'home', label: 'Accueil', icon: 'home', target: { route: input.baseRoute } },
      ...(input.canShowProperties ? [{ id: 'properties' as const, label: 'Biens', icon: 'building', target: propertiesTarget }] : []),
      { id: 'agency', label: 'Agence', icon: 'agents', target: { route: input.baseRoute, anchor: 'methode' } },
      { id: 'contact', label: 'Contact', icon: 'message', target: { route: input.baseRoute, anchor: 'contact' } },
    ],
    primaryCta: {
      id: 'primaryCta',
      label: input.canEstimate ? input.agencyIdentity.content.primaryCtaLabel : input.canShowProperties ? 'Voir les biens' : 'Nous contacter',
      icon: input.canEstimate ? 'calculator' : input.canShowProperties ? 'building' : 'message',
      target: primaryTarget,
      visible: showPrimaryCta,
    },
    privateAccess: {
      id: 'privateAccess',
      label: 'Accès privé',
      icon: 'user',
      target: { route: `${input.baseRoute}/connexion` },
      visible: showPrivateAccess && input.hasPrivateSpace,
    },
    logo: {
      src: logoSrc,
      alt: input.agencyIdentity.brand.name,
      mode: resolvedLogoMode,
    },
    className: [
      'od-public-nav',
      `od-public-nav-surface-${surface}`,
      `od-public-nav-density-${density}`,
      `od-public-nav-behavior-${behavior}`,
      `od-public-nav-logo-${resolvedLogoMode}`,
    ].join(' '),
  }
}

function resolveSurface(value?: string): PublicNavigationSurface {
  const normalized = toClassValue(value)
  if (normalized === 'light' || normalized === 'dark' || normalized === 'transparent') return normalized
  if (normalized === 'solid' || normalized === 'opaque' || normalized === 'white') return 'light'
  if (normalized === 'black' || normalized === 'navy') return 'dark'
  return 'transparent'
}

function resolveDensity(value?: string): PublicNavigationDensity {
  return toClassValue(value) === 'compact' ? 'compact' : 'standard'
}

function resolveBehavior(value?: string): PublicNavigationBehavior {
  const normalized = toClassValue(value)
  return normalized === 'sticky' || normalized === 'fixed' ? 'sticky' : 'static'
}

function resolveLogoMode(value?: string): PublicNavigationLogoMode {
  const normalized = toClassValue(value)
  if (normalized === 'light' || normalized === 'dark') return normalized
  return 'auto'
}

function resolveVisibility(value?: string): PublicNavigationVisibility {
  return toClassValue(value) === 'hidden' ? 'hidden' : 'visible'
}

function selectLogo(identity: AgencyIdentity, mode: Exclude<PublicNavigationLogoMode, 'auto'>) {
  if (mode === 'light') return identity.logos.lightLogoUrl || identity.logos.logoUrl
  return identity.logos.darkLogoUrl || identity.logos.logoUrl
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
