import type { Project } from '../data/projectStore'
import type { RealEstateAgencyRuntime } from '../data/realEstateAgencyConfig'
import { parseVisualBlueprintV1Result } from './visualBlueprint'
import { resolveProjectLovableOutput } from './lovableOutput'

export type DemoReviewCheckType = 'automatic' | 'manual'
export type DemoReviewCheckStatus = 'passed' | 'failed' | 'warning' | 'pending'

export type DemoReviewCheck = {
  id: string
  label: string
  type: DemoReviewCheckType
  status: DemoReviewCheckStatus
  detail: string
  required: boolean
}

export type DemoReviewReadiness = {
  ready: boolean
  blockers: string[]
  warnings: string[]
  checks: DemoReviewCheck[]
  manualRequiredIds: string[]
  progress: {
    passed: number
    total: number
  }
}

export function resolveDemoReviewReadiness(project: Project, agency: RealEstateAgencyRuntime | undefined): DemoReviewReadiness {
  const confirmed = new Set(project.demoReviewChecks ?? [])
  const output = resolveProjectLovableOutput(project)
  const unsupportedHigh = output.unsupportedCapabilities.filter((capability) => capability.importance === 'high')
  const hasListings = (project.importedProperties ?? []).length > 0
  const readyListings = (project.importedProperties ?? []).filter((property) => property.listingReviewStatus === 'ready')
  const enabledModules = agency?.modelConfig.enabledModules
  const privateSpacesActive = Boolean(enabledModules?.sellerSpace || enabledModules?.agentSpace || enabledModules?.ownerSpace)
  const visitRequestActive = Boolean(enabledModules?.visits || enabledModules?.propertyDetail)
  const checks: DemoReviewCheck[] = [
    automatic('agency', 'Agence creee', Boolean(agency), agency ? agency.routes.public : 'Aucune agence generee.', true),
    automatic('identity', 'Identite agence', Boolean(agency?.modelConfig.agencyName && agency?.modelConfig.agencySlug), agency?.modelConfig.agencyName || 'Identite incomplete.', true),
    automatic('visual-blueprint', 'VisualBlueprint valide', Boolean(parseVisualBlueprintV1Result(project.visualBlueprint).blueprint), project.lovableOutputStatus === 'validated' ? 'Blueprint valide depuis Lovable.' : 'Blueprint valide ou compatibilite manuelle.', true),
    automatic('listings-ready', 'Annonces pretes', !hasListings || readyListings.length === project.importedProperties.length, hasListings ? `${readyListings.length}/${project.importedProperties.length} annonce(s) prete(s).` : 'Aucune annonce fournie, non bloquant.', true),
    automatic('collection-route', 'Page collection', Boolean(agency?.routes.public), agency ? `${agency.routes.public}/biens` : 'Route agence absente.', true),
    automatic('property-detail-route', 'Fiche bien', Boolean(agency?.routes.property), agency ? agency.routes.property(':propertyId') : 'Route fiche bien absente.', true),
    automatic('forms', 'Formulaire estimation/contact', Boolean(agency?.routes.estimation && agency?.routes.public), agency ? `${agency.routes.estimation} et contact public.` : 'Routes formulaire absentes.', true),
    automatic('visit-request', 'Demande de visite', !visitRequestActive || Boolean(agency?.routes.property), visitRequestActive ? 'Module actif, fiche bien disponible.' : 'Module inactif, non requis.', true),
    automatic('private-spaces', 'Espaces prives', !privateSpacesActive || Boolean(agency?.routes.seller && agency?.routes.agent && agency?.routes.owner), privateSpacesActive ? 'Routes vendeur, agent et patron disponibles.' : 'Modules prives inactifs, non requis.', true),
    automatic('unsupported-high', 'Aucune capacite non supportee bloquante', unsupportedHigh.length === 0, unsupportedHigh.length ? `${unsupportedHigh.length} capacite(s) high a traiter.` : 'Aucune capacite high signalee.', true),
    manual('hero-quality', 'Hero controle manuellement', confirmed, true),
    manual('navigation-quality', 'Navigation controlee manuellement', confirmed, true),
    manual('sections-quality', 'Sections controlees manuellement', confirmed, true),
    manual('property-cards-quality', 'Cartes de biens controlees manuellement', confirmed, true),
    manual('texts-images-contrast', 'Textes, images et contraste controles', confirmed, true),
    manual('mobile-rendering', 'Rendu mobile controle', confirmed, true),
    manual('overall-impression', 'Impression generale validee', confirmed, true),
    manual('private-workspaces-quality', 'Espaces prives controles si actifs', confirmed, privateSpacesActive),
  ]
  const blockers = checks
    .filter((check) => check.required && (check.status === 'failed' || check.status === 'pending'))
    .map((check) => check.detail || check.label)
  const warnings = checks
    .filter((check) => check.status === 'warning')
    .map((check) => check.detail)
  const countedChecks = checks.filter((check) => check.required)

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    checks,
    manualRequiredIds: checks.filter((check) => check.type === 'manual' && check.required).map((check) => check.id),
    progress: {
      passed: countedChecks.filter((check) => check.status === 'passed').length,
      total: countedChecks.length,
    },
  }
}

function automatic(id: string, label: string, passed: boolean, detail: string, required: boolean): DemoReviewCheck {
  return {
    id,
    label,
    type: 'automatic',
    status: passed ? 'passed' : required ? 'failed' : 'warning',
    detail,
    required,
  }
}

function manual(id: string, label: string, confirmed: Set<string>, required: boolean): DemoReviewCheck {
  return {
    id,
    label,
    type: 'manual',
    status: !required ? 'warning' : confirmed.has(id) ? 'passed' : 'pending',
    detail: !required ? 'Non requis pour les modules actifs.' : confirmed.has(id) ? 'Confirme.' : 'Validation humaine requise.',
    required,
  }
}
