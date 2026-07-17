import type { AgencyIdentity } from './agencyIdentity'
import type { RealEstateModuleName } from '../data/realEstateAgencyConfig'

export type PrivateWorkspaceRole = 'seller' | 'agent' | 'owner'
export type PrivateWorkspaceDensity = 'compact' | 'standard' | 'airy'
export type PrivateWorkspaceSurface = 'quiet' | 'elevated'
export type PrivateWorkspaceNavigation = 'sidebar' | 'topbar'
export type PrivateWorkspaceCardStyle = 'flat' | 'bordered' | 'elevated'

export type PrivateWorkspaceNavItem = {
  id: string
  label: string
  icon: string
  route: string
  module?: RealEstateModuleName
}

export type PrivateWorkspaceAction = {
  id: string
  label: string
  action?: string
  route?: string
}

export type PrivateWorkspaceConfig = {
  role: PrivateWorkspaceRole
  density: PrivateWorkspaceDensity
  surface: PrivateWorkspaceSurface
  navigation: {
    mode: PrivateWorkspaceNavigation
    items: PrivateWorkspaceNavItem[]
  }
  primaryAction: PrivateWorkspaceAction
  availableSections: string[]
  cardStyle: PrivateWorkspaceCardStyle
  className: string
}

export type ResolvePrivateWorkspaceInput = {
  role: PrivateWorkspaceRole
  agencyIdentity: AgencyIdentity
  baseRoute: string
  isModuleEnabled: (moduleName: RealEstateModuleName) => boolean
}

export function resolvePrivateWorkspace(input: ResolvePrivateWorkspaceInput): PrivateWorkspaceConfig {
  const dashboard = input.agencyIdentity.renderContract.dashboard
  const density = dashboard.density
  const navigationMode = dashboard.navigation
  const cardStyle = dashboard.cardStyle
  const items = createNavigationItems(input.role, input.baseRoute).filter((item) => !item.module || input.isModuleEnabled(item.module))
  const primaryAction = resolvePrimaryAction(input.role, input.baseRoute, input.isModuleEnabled)
  const availableSections = items.map((item) => item.id)

  return {
    role: input.role,
    density,
    surface: dashboard.surface,
    navigation: {
      mode: navigationMode,
      items,
    },
    primaryAction,
    availableSections,
    cardStyle,
    className: [
      'od-private-workspace',
      `od-private-workspace-${input.role}`,
      `od-private-density-${density}`,
      `od-private-surface-${dashboard.surface}`,
      `od-private-nav-${navigationMode}`,
      `od-private-cards-${cardStyle}`,
    ].join(' '),
  }
}

function createNavigationItems(role: PrivateWorkspaceRole, baseRoute: string): PrivateWorkspaceNavItem[] {
  if (role === 'seller') {
    return [
      { id: 'home', label: 'Accueil', icon: 'home', route: `${baseRoute}/vendeur` },
      { id: 'visites', label: 'Visites', icon: 'calendar', route: `${baseRoute}/vendeur#visites`, module: 'visits' },
      { id: 'offres', label: 'Offres', icon: 'offer', route: `${baseRoute}/vendeur#offres`, module: 'offers' },
      { id: 'documents', label: 'Docs', icon: 'document', route: `${baseRoute}/vendeur#documents`, module: 'documents' },
      { id: 'profil', label: 'Profil', icon: 'user', route: `${baseRoute}/connexion` },
    ]
  }

  if (role === 'agent') {
    return [
      { id: 'home', label: 'Accueil', icon: 'home', route: `${baseRoute}/agent` },
      { id: 'biens', label: 'Biens', icon: 'building', route: `${baseRoute}/agent#biens` },
      { id: 'visites', label: 'Visites', icon: 'calendar', route: `${baseRoute}/agent#visites`, module: 'visits' },
      { id: 'demandes', label: 'Demandes', icon: 'message', route: `${baseRoute}/agent#demandes` },
      { id: 'profil', label: 'Profil', icon: 'user', route: `${baseRoute}/connexion` },
    ]
  }

  return [
    { id: 'home', label: 'Accueil', icon: 'home', route: `${baseRoute}/patron` },
    { id: 'biens', label: 'Biens', icon: 'building', route: `${baseRoute}/patron#biens` },
    { id: 'agents', label: 'Agents', icon: 'agents', route: `${baseRoute}/patron#agents`, module: 'agentSpace' },
    { id: 'access', label: 'Acces', icon: 'user', route: `${baseRoute}/patron#acces`, module: 'ownerSpace' },
    { id: 'demandes', label: 'Demandes', icon: 'message', route: `${baseRoute}/patron#demandes` },
    { id: 'profil', label: 'Profil', icon: 'user', route: `${baseRoute}/connexion` },
  ]
}

function resolvePrimaryAction(
  role: PrivateWorkspaceRole,
  baseRoute: string,
  isModuleEnabled: (moduleName: RealEstateModuleName) => boolean,
): PrivateWorkspaceAction {
  if (role === 'seller') return { id: 'property-detail', label: 'Voir la fiche complete', route: `${baseRoute}/bien` }
  if (role === 'agent') return { id: 'new-property', label: 'Nouveau bien', action: 'new-property' }
  if (isModuleEnabled('agentSpace')) return { id: 'agent', label: 'Ajouter agent', action: 'agent' }
  return { id: 'new-property', label: 'Nouveau bien', action: 'new-property' }
}

