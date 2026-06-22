export type AssistantScope = 'global' | 'agency'

export type AssistantPlanStatus = 'Fonctionnel localement' | 'Simulé' | 'Prêt à connecter' | 'À connecter plus tard'

export type AssistantActionType =
  | 'createAgency'
  | 'createEstimatePage'
  | 'createAgencyPage'
  | 'createWhatsappButton'
  | 'applyPremiumMood'
  | 'activateDocuments'
  | 'activateVisits'
  | 'generateEmails'
  | 'createPaymentLink'
  | 'createPropertyDraft'
  | 'generateSeoIdeas'
  | 'performanceDashboard'
  | 'missingChecklist'
  | 'manualReview'

export type AssistantContext = {
  scope: AssistantScope
  agency?: {
    id: string
    name: string
    sector: string
    city: string
    propertyCount: number
    activeModules: number
    modules: Record<string, boolean>
  }
  totals: {
    agencies: number
    pages: number
    buttons: number
    activeModules: number
  }
}

export type AssistantActionProposal = {
  id: string
  type: AssistantActionType
  title: string
  description: string
  target: string
  status: AssistantPlanStatus
  details: string[]
}

export type AssistantPlan = {
  summary: string
  actions: AssistantActionProposal[]
  safetyNotes: string[]
  simulatedLater: string[]
}

const globalExamples = [
  'Crée une agence immobilière premium à Tarbes',
  'Ajoute une page estimation vendeur',
  'Ajoute un bouton WhatsApp dans l’espace vendeur',
  'Prépare les emails patron, agent et vendeur',
  'Crée un lien paiement simulé',
  'Donne-moi des idées SEO pour agences immobilières',
  'Analyse les performances des agences',
]

const agencyExamples = [
  'Rends cette agence plus premium',
  'Crée une annonce simple',
  'Ajoute une page location courte durée',
  'Ajoute un bouton estimation sur le site public',
  'Active documents et visites',
  'Prépare les emails d’accès',
  'Prépare un lien paiement',
  'Vérifie ce qu’il manque avant de l’envoyer au client',
]

export function getAssistantExamples(scope: AssistantScope) {
  return scope === 'global' ? globalExamples : agencyExamples
}

export function analyzeAssistantRequest(input: string, context: AssistantContext): AssistantPlan {
  const normalized = normalizeText(input)
  const city = extractCity(input, context.agency?.city ?? 'Tarbes')
  const agencyLabel = context.agency?.name ?? `la dernière agence locale disponible à ${city}`
  const actions: AssistantActionProposal[] = []
  const addAction = (proposal: Omit<AssistantActionProposal, 'id'>) => {
    actions.push({
      ...proposal,
      id: `${proposal.type}-${actions.length + 1}`,
    })
  }

  if (hasCreateAgencyIntent(normalized)) {
    addAction({
      type: 'createAgency',
      title: `Créer une agence immobilière premium à ${city}`,
      description: 'Créer une agence locale avec modules public, patron, agent, vendeur et ambiance premium sobre.',
      target: '/admin/agences',
      status: 'Fonctionnel localement',
      details: [
        `Nom proposé : Signature Immobilier ${city}`,
        'Aucune API, aucune authentification réelle et aucun paiement réel.',
        'Les accès et paiements restent simulés dans le localStorage.',
      ],
    })
  }

  if (normalized.includes('estimation')) {
    addAction({
      type: 'createEstimatePage',
      title: 'Créer une page Estimation vendeur',
      description: `Créer une page locale et un bouton visible sur le site public de ${agencyLabel}.`,
      target: context.agency ? `/demo/immobilier/agence/${context.agency.id}/public` : '/admin/agences',
      status: 'Fonctionnel localement',
      details: [
        'Page : Estimation vendeur',
        'Bouton : Estimer mon bien',
        'Formulaire et traitement simulés, connexion métier à faire plus tard.',
      ],
    })
  }

  if (normalized.includes('page') && !normalized.includes('estimation')) {
    const pageTitle = normalized.includes('location courte') ? 'Location courte durée' : 'Page locale'
    addAction({
      type: 'createAgencyPage',
      title: `Créer une page ${pageTitle}`,
      description: `Créer une page locale publiée pour ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/pages` : '/admin/agences',
      status: 'Fonctionnel localement',
      details: [
        `Page : ${pageTitle}`,
        'Emplacement : site public de l’agence.',
        'Contenu local simulé, à enrichir avec les vrais textes métier plus tard.',
      ],
    })
  }

  if (normalized.includes('whatsapp')) {
    const placement = normalized.includes('vendeur') ? 'vendeur' : normalized.includes('agent') ? 'agent' : 'public'
    addAction({
      type: 'createWhatsappButton',
      title: 'Ajouter un bouton WhatsApp simulé',
      description: `Ajouter un bouton de contact WhatsApp dans l’espace ${placement} de ${agencyLabel}.`,
      target: context.agency ? getPlacementLabel(context.agency.id, placement) : '/admin/agences',
      status: 'Simulé',
      details: [
        'Le bouton est enregistré localement.',
        'La destination ouvre une page de préparation locale, aucun vrai message WhatsApp n’est envoyé.',
      ],
    })
  }

  if (normalized.includes('premium')) {
    addAction({
      type: 'applyPremiumMood',
      title: 'Appliquer une ambiance premium sobre',
      description: `Ajuster l’ambiance, le ton et les modules de ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/ambiance` : '/admin/apparence',
      status: 'Fonctionnel localement',
      details: [
        'Positionnement : premium sobre, clair et rassurant.',
        'Couleurs : bleu nuit, crème et doré doux.',
        'Les assets visuels restent à brancher ou importer plus tard.',
      ],
    })
  }

  if (normalized.includes('documents')) {
    addAction({
      type: 'activateDocuments',
      title: 'Activer le module Documents',
      description: `Rendre le module Documents actif pour ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/modules` : '/admin/modules',
      status: 'Fonctionnel localement',
      details: ['Activation locale du module.', 'Stockage documentaire réel à connecter plus tard.'],
    })
  }

  if (normalized.includes('visites')) {
    addAction({
      type: 'activateVisits',
      title: 'Activer le module Visites',
      description: `Rendre le module Visites actif pour ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/modules` : '/admin/modules',
      status: 'Fonctionnel localement',
      details: ['Activation locale du module.', 'Synchronisation calendrier réelle à connecter plus tard.'],
    })
  }

  if (normalized.includes('email') || normalized.includes('mail')) {
    addAction({
      type: 'generateEmails',
      title: 'Préparer les emails patron, agent et vendeur',
      description: `Générer des prévisualisations email locales pour ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/emails` : '/admin/agences',
      status: 'Simulé',
      details: [
        'Emails : patron, agent, vendeur.',
        'Aucun email réel n’est envoyé.',
        'Service d’envoi à connecter plus tard.',
      ],
    })
  }

  if (normalized.includes('paiement') || normalized.includes('payment')) {
    addAction({
      type: 'createPaymentLink',
      title: 'Créer un lien paiement simulé',
      description: `Préparer un lien de paiement local pour ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/paiement` : '/admin/agences',
      status: 'Simulé',
      details: [
        'Lien local /payment/:agencyId.',
        'Aucun appel Stripe.',
        'Paiement réel à connecter plus tard.',
      ],
    })
  }

  if (normalized.includes('annonce') || normalized.includes('bien')) {
    addAction({
      type: 'createPropertyDraft',
      title: 'Créer une annonce brouillon locale',
      description: `Créer une annonce simple pour ${agencyLabel} si aucune annonce n’existe.`,
      target: context.agency ? `/admin/agences/${context.agency.id}/annonces` : '/admin/agences',
      status: 'Fonctionnel localement',
      details: [
        `Ville proposée : ${city}`,
        'Statut : brouillon.',
        'Les imports automatiques d’annonces restent simulés.',
      ],
    })
  }

  if (normalized.includes('seo')) {
    addAction({
      type: 'generateSeoIdeas',
      title: 'Générer des idées SEO simulées',
      description: `Préparer des idées de pages SEO autour de ${context.agency?.city ?? city}.`,
      target: '/admin/assistant',
      status: 'Simulé',
      details: [
        `site web agence immobilière ${context.agency?.city ?? city}`,
        'suivi vendeur immobilier',
        'espace vendeur agence immobilière',
        `estimation bien ${context.agency?.city ?? city}`,
      ],
    })
  }

  if (normalized.includes('performance') || normalized.includes('performances')) {
    addAction({
      type: 'performanceDashboard',
      title: 'Afficher un dashboard performance simulé',
      description: 'Synthétiser les métriques locales disponibles dans le navigateur.',
      target: '/admin/assistant',
      status: 'Simulé',
      details: [
        `Agences actives : ${context.totals.agencies}`,
        `Pages créées : ${context.totals.pages}`,
        `Boutons actifs : ${context.totals.buttons}`,
        `Modules actifs : ${context.totals.activeModules}`,
        'Données réelles à connecter plus tard.',
      ],
    })
  }

  if (
    normalized.includes('manque') ||
    normalized.includes('verifie') ||
    normalized.includes('checklist') ||
    normalized.includes('envoyer au client')
  ) {
    addAction({
      type: 'missingChecklist',
      title: 'Vérifier ce qu’il manque avant envoi client',
      description: `Créer une checklist locale pour ${agencyLabel}.`,
      target: context.agency ? `/admin/agences/${context.agency.id}` : '/admin/agences',
      status: 'Simulé',
      details: buildMissingChecklist(context),
    })
  }

  if (actions.length === 0) {
    addAction({
      type: 'manualReview',
      title: 'Préparer une revue manuelle',
      description: 'La demande ne correspond pas encore à une action automatique locale.',
      target: context.agency ? `/admin/agences/${context.agency.id}` : '/admin',
      status: 'Prêt à connecter',
      details: [
        'L’assistant affiche le plan mais n’appliquera aucune modification automatique.',
        'Cette intention pourra être enrichie dans le moteur simulé, puis connectée à OpenAI plus tard.',
      ],
    })
  }

  return {
    summary: `Plan local pour : "${input.trim() || 'demande vide'}"`,
    actions,
    safetyNotes: [
      'Aucune API OpenAI n’est appelée.',
      'Aucune clé API, aucun Supabase supplémentaire, aucun Stripe réel et aucune auth réelle.',
      'Rien n’est appliqué sans validation explicite.',
    ],
    simulatedLater: [
      'IA réelle : à connecter plus tard.',
      'Paiement réel : à connecter plus tard.',
      'Envoi email réel : à connecter plus tard.',
      'Données analytics réelles : à connecter plus tard.',
    ],
  }
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function hasCreateAgencyIntent(normalized: string) {
  return normalized.includes('agence') && (normalized.includes('cree') || normalized.includes('creer') || normalized.includes('nouvelle'))
}

function extractCity(input: string, fallback: string) {
  const match = input.match(/\b(?:à|a|sur|pour)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,36})/i)
  const city = match?.[1]
    ?.split(/[,.!?]/)[0]
    ?.replace(/\b(premium|immobilière|immobilier|locale|simple)\b/gi, '')
    ?.trim()

  return city || fallback
}

function getPlacementLabel(agencyId: string, placement: string) {
  if (placement === 'vendeur') return `/demo/immobilier/agence/${agencyId}/vendeur`
  if (placement === 'agent') return `/demo/immobilier/agence/${agencyId}/agent`
  return `/demo/immobilier/agence/${agencyId}/public`
}

function buildMissingChecklist(context: AssistantContext) {
  const checklist = [
    context.agency ? `Agence : ${context.agency.name}` : 'Choisir une agence locale à auditer.',
    context.agency?.propertyCount ? 'Annonce : au moins un bien existe.' : 'Annonce : créer ou publier un premier bien.',
    context.agency?.modules.documents ? 'Documents : module actif.' : 'Documents : module à activer.',
    context.agency?.modules.visits ? 'Visites : module actif.' : 'Visites : module à activer.',
    'Emails : prévisualisations à relire.',
    'Paiement : lien simulé à vérifier.',
    'Statut : données réelles à connecter plus tard.',
  ]

  return checklist
}
