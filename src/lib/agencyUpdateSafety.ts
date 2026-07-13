import type {
  DuplicateRealEstateAgencyInput,
  RealEstateAgencyRuntime,
  RealEstateEnabledModules,
} from '../data/realEstateAgencyConfig'
import { parseVisualBlueprintV1Result } from './visualBlueprint'

export type AgencyUpdateSafetyResult = {
  safe: boolean
  blockers: string[]
  warnings: string[]
  changedFields: string[]
}

const protectedScalarFields: Array<keyof DuplicateRealEstateAgencyInput> = [
  'agencyName',
  'city',
  'email',
  'phone',
  'address',
  'websiteUrl',
  'logoUrl',
  'themePreset',
  'heroVariant',
  'heroTitle',
  'heroSubtitle',
  'primaryCtaLabel',
  'sectionOrder',
  'visualBlueprint',
  'mode',
  'status',
  'agencyKind',
]

export function resolveAgencyUpdateSafety(
  currentAgency: RealEstateAgencyRuntime | undefined,
  nextConfig: DuplicateRealEstateAgencyInput,
): AgencyUpdateSafetyResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const changedFields = currentAgency ? getChangedFields(currentAgency, nextConfig) : ['created']

  if (!currentAgency) {
    return { safe: true, blockers, warnings, changedFields }
  }

  const current = currentAgency.modelConfig
  const nextDomain = nextConfig.domainConfig
  const currentDomain = current.domainConfig

  if (nextConfig.agencySlug && nextConfig.agencySlug !== current.agencySlug) {
    blockers.push("Le slug agence ne peut pas changer pendant une mise a jour.")
  }

  if ((nextConfig.agencyKind ?? current.agencyKind) !== current.agencyKind) {
    blockers.push("Le type client/pilote/test ne doit pas changer silencieusement.")
  }

  if (current.status === 'active' && nextConfig.status && nextConfig.status !== current.status) {
    warnings.push("Agence active : le statut technique change. Confirmez que ce changement est volontaire.")
  }

  if (current.status === 'active' && nextConfig.mode && nextConfig.mode !== current.mode) {
    warnings.push("Agence active : le mode change. Verifiez que ce n'est pas une activation ou desactivation involontaire.")
  }

  if (currentDomain?.customDomain && !nextDomain?.customDomain) {
    blockers.push("Le domaine personnalise verifie doit etre conserve.")
  }

  if (currentDomain?.customDomain && nextDomain?.customDomain && currentDomain.customDomain !== nextDomain.customDomain) {
    warnings.push('Le domaine personnalise change. Verifiez les DNS et le fallback avant sauvegarde.')
  }

  if (!nextConfig.importedProperties && currentAgency.agencyConfig.properties.length > 0) {
    warnings.push('Les annonces existantes ne sont pas remplacees par cette sauvegarde et seront conservees.')
  }

  if (
    nextConfig.importedProperties
    && nextConfig.importedProperties.length < currentAgency.agencyConfig.properties.length
  ) {
    warnings.push('La configuration contient moins d annonces que l agence actuelle. Verifiez qu aucune suppression silencieuse n est attendue.')
  }

  if (nextConfig.visualBlueprint?.trim()) {
    const blueprintResult = parseVisualBlueprintV1Result(nextConfig.visualBlueprint)
    const blueprintErrors = blueprintResult.diagnostics.filter((diagnostic) => diagnostic.level === 'error')
    if (!blueprintResult.blueprint || blueprintErrors.length > 0) {
      blockers.push('Le VisualBlueprint contient des erreurs bloquantes.')
    }
  }

  const disabledModulesWithData = getDisabledModulesWithData(current.enabledModules, resolveNextModules(current.enabledModules, nextConfig.enabledModules), currentAgency)
  disabledModulesWithData.forEach((moduleLabel) => {
    warnings.push(`Le module "${moduleLabel}" est desactive alors que des donnees existent. Les donnees seront conservees pour reactivation.`)
  })

  return {
    safe: blockers.length === 0,
    blockers,
    warnings,
    changedFields,
  }
}

function getChangedFields(currentAgency: RealEstateAgencyRuntime, nextConfig: DuplicateRealEstateAgencyInput) {
  const current = currentAgency.modelConfig
  const changed = new Set<string>()

  protectedScalarFields.forEach((field) => {
    const nextValue = nextConfig[field]
    const currentValue = getCurrentScalarValue(current, field)
    if (nextValue !== undefined && nextValue !== currentValue) {
      changed.add(String(field))
    }
  })

  if (nextConfig.colors && (
    nextConfig.colors.primaryColor !== current.primaryColor
    || nextConfig.colors.secondaryColor !== current.secondaryColor
    || nextConfig.colors.accentColor !== current.accentColor
  )) {
    changed.add('colors')
  }

  if (nextConfig.enabledModules && modulesChanged(current.enabledModules, resolveNextModules(current.enabledModules, nextConfig.enabledModules))) {
    changed.add('enabledModules')
  }

  if (nextConfig.domainConfig && JSON.stringify(nextConfig.domainConfig) !== JSON.stringify(current.domainConfig)) {
    changed.add('domainConfig')
  }

  if (nextConfig.importedProperties && nextConfig.importedProperties.length !== currentAgency.agencyConfig.properties.length) {
    changed.add('importedProperties')
  }

  return Array.from(changed)
}

function getCurrentScalarValue(
  current: RealEstateAgencyRuntime['modelConfig'],
  field: keyof DuplicateRealEstateAgencyInput,
) {
  const sharedFields: Array<keyof RealEstateAgencyRuntime['modelConfig']> = [
    'agencyName',
    'city',
    'agencySlug',
    'logoUrl',
    'email',
    'phone',
    'address',
    'websiteUrl',
    'painPoint',
    'objective',
    'visualStyle',
    'variant',
    'themePreset',
    'heroVariant',
    'heroTitle',
    'heroSubtitle',
    'primaryCtaLabel',
    'sectionOrder',
    'visualBlueprint',
    'mode',
    'status',
    'agencyKind',
  ]
  if (sharedFields.includes(field as keyof RealEstateAgencyRuntime['modelConfig'])) {
    return current[field as keyof RealEstateAgencyRuntime['modelConfig']]
  }
  return undefined
}

function resolveNextModules(current: RealEstateEnabledModules, next?: Partial<RealEstateEnabledModules>): RealEstateEnabledModules {
  return {
    ...current,
    ...next,
  }
}

function modulesChanged(current: RealEstateEnabledModules, next: RealEstateEnabledModules) {
  return Object.keys(current).some((key) => current[key as keyof RealEstateEnabledModules] !== next[key as keyof RealEstateEnabledModules])
}

function getDisabledModulesWithData(
  currentModules: RealEstateEnabledModules,
  nextModules: RealEstateEnabledModules | undefined,
  runtime: RealEstateAgencyRuntime,
) {
  if (!nextModules) return []

  const checks: Array<[keyof RealEstateEnabledModules, string, boolean]> = [
    ['publicProperties', 'Biens publics', runtime.agencyConfig.properties.length > 0],
    ['propertyDetail', 'Fiche bien', runtime.agencyConfig.properties.length > 0],
    ['sellerSpace', 'Espace vendeur', runtime.dataConfig.sellers.length > 0],
    ['agentSpace', 'Espace agent', runtime.dataConfig.agents.length > 0],
    ['ownerSpace', 'Espace patron', runtime.dataConfig.agents.length > 0],
    ['visits', 'Visites', runtime.dataConfig.visits.length > 0],
    ['documents', 'Documents', runtime.dataConfig.documents.length > 0],
    ['offers', 'Offres', runtime.dataConfig.offers.length > 0],
    ['reports', 'Comptes rendus', runtime.dataConfig.reports.length > 0],
  ]

  return checks
    .filter(([key, , hasData]) => currentModules[key] && !nextModules[key] && hasData)
    .map(([, label]) => label)
}
