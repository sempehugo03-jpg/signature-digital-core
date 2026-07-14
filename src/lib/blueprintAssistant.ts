import type { Project } from '../data/projectStore'
import type { ClientBrief } from '../types/clientBrief'
import { formatEngineCapabilitiesForAssistant, resolveEngineCapabilities, type EngineCapabilityCatalog } from './engineCapabilities'
import { parseVisualBlueprintV1Result, type VisualBlueprintDiagnostic } from './visualBlueprint'

export type BlueprintAssistantChange = {
  section: string
  property: string
  before?: string
  after?: string
  summary: string
}

export type BlueprintAssistantResponse = {
  proposedBlueprint: string
  changes: BlueprintAssistantChange[]
  unsupportedRequests: string[]
  warnings: string[]
  mode: 'simulation' | 'live'
  diagnostics: VisualBlueprintDiagnostic[]
}

export type BlueprintAssistantResult = {
  ok: boolean
  response?: BlueprintAssistantResponse
  diagnostics: VisualBlueprintDiagnostic[]
  message: string
}

export type BlueprintAssistantRequest = {
  instruction: string
  currentBlueprint: string
  clientBrief: ClientBrief
  projectId: string
  agencyId?: string
  capabilities?: EngineCapabilityCatalog
}

export async function requestBlueprintAssistant(input: BlueprintAssistantRequest): Promise<BlueprintAssistantResult> {
  const instruction = input.instruction.trim()
  if (!instruction) {
    return { ok: false, diagnostics: [], message: 'Ajoutez une demande en francais.' }
  }
  if (instruction.length > 1200) {
    return { ok: false, diagnostics: [], message: 'Demande trop longue. Limitez-la a 1200 caracteres.' }
  }

  const payload = {
    instruction,
    currentBlueprint: input.currentBlueprint,
    clientBrief: {
      agency: input.clientBrief.agency,
      commercial: input.clientBrief.commercial,
      perception: input.clientBrief.perception,
      desiredOutcomes: input.clientBrief.desiredOutcomes,
    },
    projectId: input.projectId,
    agencyId: input.agencyId,
    capabilities: input.capabilities ?? resolveEngineCapabilities(),
  }

  try {
    const response = await fetch('/api/blueprint-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({})) as Partial<BlueprintAssistantResponse> & { message?: string }
    if (!response.ok || !data.proposedBlueprint) {
      return { ok: false, diagnostics: [], message: data.message || "Assistant indisponible. Verifiez la configuration serveur." }
    }

    return validateBlueprintAssistantResponse({
      proposedBlueprint: data.proposedBlueprint,
      changes: data.changes ?? [],
      unsupportedRequests: data.unsupportedRequests ?? [],
      warnings: data.warnings ?? [],
      mode: data.mode ?? 'simulation',
      diagnostics: [],
    })
  } catch {
    return {
      ok: false,
      diagnostics: [],
      message: "Assistant indisponible. Lancez l'endpoint serveur ou utilisez le mode technique.",
    }
  }
}

export function validateBlueprintAssistantResponse(response: BlueprintAssistantResponse): BlueprintAssistantResult {
  const parseResult = parseVisualBlueprintV1Result(response.proposedBlueprint)
  const blockingDiagnostics = parseResult.diagnostics.filter((diagnostic) => (
    diagnostic.level === 'error' ||
    diagnostic.message.toLowerCase().includes('inconnue')
  ))

  if (!response.proposedBlueprint.trim().startsWith('VisualBlueprint:')) {
    const nextResponse = { ...response, diagnostics: parseResult.diagnostics }
    return { ok: false, response: nextResponse, diagnostics: parseResult.diagnostics, message: 'Le Blueprint propose doit commencer par VisualBlueprint:.' }
  }
  if (!response.proposedBlueprint.includes('version: v1')) {
    const nextResponse = { ...response, diagnostics: parseResult.diagnostics }
    return { ok: false, response: nextResponse, diagnostics: parseResult.diagnostics, message: 'Le Blueprint propose doit declarer version: v1.' }
  }
  if (!parseResult.blueprint || blockingDiagnostics.length) {
    const nextResponse = { ...response, diagnostics: parseResult.diagnostics }
    return { ok: false, response: nextResponse, diagnostics: parseResult.diagnostics, message: 'Le Blueprint propose contient des erreurs ou des cles non reconnues.' }
  }

  const nextResponse = { ...response, diagnostics: parseResult.diagnostics }
  return { ok: true, response: nextResponse, diagnostics: parseResult.diagnostics, message: response.mode === 'simulation' ? 'Proposition simulee validee.' : 'Proposition IA validee.' }
}

export function buildBlueprintAssistantContextSummary(project: Project, clientBrief: ClientBrief) {
  return [
    `Projet: ${project.companyName || clientBrief.agency.companyName || project.id}`,
    `Agence: ${clientBrief.agency.companyName || 'non renseignee'}`,
    `Ville: ${clientBrief.agency.city || 'non renseignee'}`,
    `Objectif: ${clientBrief.commercial.primaryGoal || 'non renseigne'}`,
    `Perception: ${clientBrief.perception.primaryPerception || 'non renseignee'}`,
    `Catalogue: ${formatEngineCapabilitiesForAssistant(resolveEngineCapabilities()).slice(0, 1000)}...`,
  ].join('\n')
}
