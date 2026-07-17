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
  const navigation = input.agencyIdentity.renderContract.navigation
  const surface = navigation.surface
  const density = navigation.density
  const behavior = navigation.behavior
  const logoMode = navigation.logoMode
  const showPrimaryCta = navigation.primaryCta !== 'hidden'
  const showPrivateAccess = navigation.privateAccess !== 'hidden'
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

function selectLogo(identity: AgencyIdentity, mode: Exclude<PublicNavigationLogoMode, 'auto'>) {
  if (mode === 'light') return identity.logos.lightLogoUrl || identity.logos.logoUrl
  return identity.logos.darkLogoUrl || identity.logos.logoUrl
}
