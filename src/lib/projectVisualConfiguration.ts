import type { Project, VisualConfigurationSource } from '../data/projectStore'
import { resolveProjectLovableOutput } from './lovableOutput'
import { parseVisualBlueprintV1Result } from './visualBlueprint'

export type ProjectVisualConfiguration = {
  blueprintRaw: string
  blueprintValid: boolean
  source: VisualConfigurationSource
  visualPackStatus: 'complete' | 'partial' | 'missing'
  unsupportedCapabilities: number
  warnings: string[]
  blockers: string[]
}

export function resolveProjectVisualConfiguration(project: Project): ProjectVisualConfiguration {
  const lovableOutput = resolveProjectLovableOutput(project)
  const projectBlueprint = (project.visualBlueprint ?? '').trim()
  const outputBlueprint = (lovableOutput.visualBlueprint.raw ?? '').trim()
  const blueprintRaw = projectBlueprint || outputBlueprint
  const blueprintResult = parseVisualBlueprintV1Result(blueprintRaw)
  const source = resolveVisualConfigurationSource(project, projectBlueprint, outputBlueprint)
  const visualPackStatus = resolveVisualPackStatus(lovableOutput)
  const warnings: string[] = []
  const blockers: string[] = []

  if (!blueprintRaw || !blueprintResult.blueprint) {
    blockers.push('Le VisualBlueprint est absent ou invalide.')
  }

  if (!project.lovableOutput) {
    warnings.push('Retour Lovable complet absent : le VisualBlueprint seul peut suffire.')
  } else if (project.lovableOutputStatus === 'invalid' && blueprintResult.blueprint) {
    warnings.push('Retour Lovable partiel ou incomplet : le pack visuel peut etre complete plus tard.')
  }

  if (visualPackStatus !== 'complete') {
    warnings.push(visualPackStatus === 'missing'
      ? 'Pack visuel absent : logo, typographies et photos home restent facultatifs.'
      : 'Pack visuel incomplet : la demo peut etre creee avec les fallbacks.')
  }

  if (!lovableOutput.visualPack.logo.url) {
    warnings.push('Logo absent : facultatif pour creer la demo SD.')
  }

  if (!lovableOutput.visualPack.homeImages.length) {
    warnings.push('Photos home absentes : facultatif pour creer la demo SD.')
  }

  return {
    blueprintRaw,
    blueprintValid: Boolean(blueprintRaw && blueprintResult.blueprint),
    source,
    visualPackStatus,
    unsupportedCapabilities: lovableOutput.unsupportedCapabilities.length,
    warnings,
    blockers,
  }
}

function resolveVisualConfigurationSource(
  project: Project,
  projectBlueprint: string,
  outputBlueprint: string,
): VisualConfigurationSource {
  if (project.visualConfigurationSource) return project.visualConfigurationSource
  if (project.lovableOutput && projectBlueprint && projectBlueprint === outputBlueprint) return 'lovable-output'
  if (projectBlueprint) return 'legacy-project'
  if (outputBlueprint) return 'lovable-output'
  return 'legacy-project'
}

function resolveVisualPackStatus(output: ReturnType<typeof resolveProjectLovableOutput>): ProjectVisualConfiguration['visualPackStatus'] {
  const colorCount = Object.values(output.visualPack.colors).filter(Boolean).length
  const hasTypography = Boolean(output.visualPack.typography.heading || output.visualPack.typography.body)
  const hasLogo = Boolean(output.visualPack.logo.url)
  const hasImages = output.visualPack.homeImages.length > 0

  if (hasLogo && colorCount >= 2 && hasTypography && hasImages) return 'complete'
  if (hasLogo || colorCount > 0 || hasTypography || hasImages) return 'partial'
  return 'missing'
}
