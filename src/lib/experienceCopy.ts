export type ExperienceRole = 'owner' | 'agent' | 'seller' | 'public'
export type ExperienceAgencyMode = 'demo' | 'active' | 'paused' | 'archived' | 'deleted'

export type ExperienceCopyContext = {
  firstName?: string
  agencyName?: string
  role?: ExperienceRole
  agencyMode?: ExperienceAgencyMode
  propertyCount?: number
  agentCount?: number
  sellerCount?: number
  requestCount?: number
  nextAction?: string
}

export type ExperienceCopy = {
  greeting: string
  workspaceTitle: string
  workspaceIntro: string
  activationCta: string
  demoNotice: string
  nextAction: string
  emptyState: (kind: ExperienceEmptyStateKind) => { title: string; text: string; actionLabel?: string }
  confirmation: (kind: ExperienceConfirmationKind) => string
}

export type ExperienceEmptyStateKind =
  | 'agents'
  | 'properties'
  | 'sellers'
  | 'requests'
  | 'documents'
  | 'visits'
  | 'reports'
  | 'offers'
  | 'mandates'

export type ExperienceConfirmationKind =
  | 'agent-created'
  | 'seller-created'
  | 'property-created'
  | 'visit-created'
  | 'report-created'
  | 'demo-write-locked'

export function resolveExperienceCopy(context: ExperienceCopyContext): ExperienceCopy {
  const firstName = clean(context.firstName)
  const agencyName = clean(context.agencyName) || 'votre agence'
  const platformName = clean(context.agencyName) || 'votre plateforme'
  const role = context.role ?? 'public'
  const agencyMode = context.agencyMode ?? 'demo'
  const nextAction = clean(context.nextAction) || resolveDefaultNextAction(role, context)
  const demoNotice = agencyMode === 'demo'
    ? `Les actions reelles seront disponibles apres activation de ${agencyName}.`
    : ''

  return {
    greeting: firstName ? `Bonjour ${firstName}` : 'Bonjour',
    workspaceTitle: resolveWorkspaceTitle(role, agencyName, platformName),
    workspaceIntro: resolveWorkspaceIntro(role, context, agencyName, demoNotice),
    activationCta: `Activer ${agencyName}`,
    demoNotice,
    nextAction,
    emptyState: (kind) => resolveEmptyState(kind, role, agencyName, agencyMode),
    confirmation: (kind) => resolveConfirmation(kind, agencyName, agencyMode),
  }
}

export function getFirstName(fullName?: string) {
  return clean(fullName).split(/\s+/).filter(Boolean)[0] || ''
}

function resolveWorkspaceTitle(role: ExperienceRole, agencyName: string, platformName: string) {
  if (role === 'owner') return `Bienvenue chez ${agencyName}`
  if (role === 'agent') return `Votre activite chez ${agencyName}`
  if (role === 'seller') return `Bienvenue dans votre espace ${platformName}`
  return `Bienvenue chez ${agencyName}`
}

function resolveWorkspaceIntro(
  role: ExperienceRole,
  context: ExperienceCopyContext,
  agencyName: string,
  demoNotice: string,
) {
  const propertyCount = context.propertyCount ?? 0
  const agentCount = context.agentCount ?? 0
  const sellerCount = context.sellerCount ?? 0
  const requestCount = context.requestCount ?? 0
  const suffix = demoNotice ? ` ${demoNotice}` : ''

  if (role === 'owner') {
    return `Voici l'activite de ${agencyName} : ${propertyCount} bien(s), ${agentCount} agent(s), ${sellerCount} vendeur(s) et ${requestCount} demande(s).${suffix}`
  }
  if (role === 'agent') {
    return propertyCount
      ? `Vous suivez ${propertyCount} bien(s) en commercialisation. ${context.nextAction || 'Priorisez les visites et les demandes a traiter.'}${suffix}`
      : `Aucun bien ne vous est encore assigne. Ajoutez votre premiere annonce ou demandez un mandat a la direction.${suffix}`
  }
  if (role === 'seller') {
    return propertyCount
      ? `Votre bien, les visites, comptes rendus, documents et offres sont centralises ici.${suffix}`
      : `Votre suivi vendeur sera disponible des qu'un bien vous sera rattache.${suffix}`
  }
  return `Votre plateforme est preparee pour ${agencyName}.${suffix}`
}

function resolveDefaultNextAction(role: ExperienceRole, context: ExperienceCopyContext) {
  if (role === 'owner') {
    if (!(context.agentCount ?? 0)) return 'Invitez votre premier agent'
    if (!(context.propertyCount ?? 0)) return 'Ajoutez votre premiere annonce'
    if (!(context.sellerCount ?? 0)) return 'Creez le premier espace vendeur'
    return 'Traitez les nouvelles demandes'
  }
  if (role === 'agent') {
    if (!(context.propertyCount ?? 0)) return 'Ajoutez votre premiere annonce'
    if (context.requestCount) return 'Traitez les demandes en attente'
    return 'Preparez la prochaine visite'
  }
  if (role === 'seller') {
    return context.propertyCount ? 'Consultez le dernier suivi de votre bien' : 'Attendez le rattachement de votre bien'
  }
  return 'Ouvrir la plateforme'
}

function resolveEmptyState(kind: ExperienceEmptyStateKind, role: ExperienceRole, agencyName: string, agencyMode: ExperienceAgencyMode) {
  const demoSuffix = agencyMode === 'demo' ? ` Disponible apres activation de ${agencyName}.` : ''
  const states: Record<ExperienceEmptyStateKind, { title: string; text: string; actionLabel?: string }> = {
    agents: {
      title: 'Aucun agent',
      text: 'Invitez votre premier agent pour structurer le suivi des biens.',
      actionLabel: 'Inviter un agent',
    },
    properties: {
      title: 'Aucun bien',
      text: 'Ajoutez votre premiere annonce pour commencer la commercialisation.',
      actionLabel: 'Ajouter une annonce',
    },
    sellers: {
      title: 'Aucun vendeur',
      text: 'Creez le premier espace vendeur pour centraliser documents, visites et retours.',
      actionLabel: 'Creer un espace vendeur',
    },
    requests: {
      title: 'Aucune demande',
      text: 'Les nouvelles demandes apparaitront ici des qu un prospect contactera l agence.',
    },
    documents: {
      title: 'Aucun document',
      text: 'Les documents du dossier seront centralises ici.',
    },
    visits: {
      title: 'Aucune visite',
      text: role === 'seller' ? 'Les visites programmees pour votre bien apparaitront ici.' : 'Les visites programmees apparaitront ici.',
    },
    reports: {
      title: 'Aucun compte rendu',
      text: 'Les comptes rendus de visite seront ajoutes ici pour garder le suivi clair.',
    },
    offers: {
      title: 'Aucune offre',
      text: 'Les offres recues apparaitront ici avec leur statut.',
    },
    mandates: {
      title: 'Aucun mandat',
      text: 'Les biens qui vous sont assignes apparaitront ici.',
      actionLabel: 'Ajouter un bien',
    },
  }
  const state = states[kind]
  return { ...state, text: `${state.text}${demoSuffix}` }
}

function resolveConfirmation(kind: ExperienceConfirmationKind, agencyName: string, agencyMode: ExperienceAgencyMode) {
  if (agencyMode === 'demo' && kind === 'demo-write-locked') {
    return `Activez ${agencyName} pour enregistrer cette action reelle.`
  }
  const confirmations: Record<ExperienceConfirmationKind, string> = {
    'agent-created': `Agent ajoute a ${agencyName}.`,
    'seller-created': `Espace vendeur cree pour ${agencyName}.`,
    'property-created': 'Annonce ajoutee a votre portefeuille.',
    'visit-created': 'Visite ajoutee au suivi.',
    'report-created': 'Compte rendu ajoute au suivi vendeur.',
    'demo-write-locked': `Activez ${agencyName} pour enregistrer cette action reelle.`,
  }
  return confirmations[kind]
}

function clean(value?: string) {
  return typeof value === 'string' ? value.trim() : ''
}
