const maxInstructionLength = 1200

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {}
    const validation = validateInput(body)
    if (!validation.ok) {
      response.status(400).json({ message: validation.message })
      return
    }

    const mode = process.env.BLUEPRINT_ASSISTANT_MODE === 'live' && process.env.OPENAI_API_KEY ? 'live' : 'simulation'
    const result = mode === 'live'
      ? await runOpenAiAssistant(body)
      : createSimulatedProposal(body)

    const output = normalizeAssistantOutput(result, body, mode)
    const outputValidation = validateOutput(output)
    if (!outputValidation.ok) {
      response.status(422).json({ message: outputValidation.message, ...output })
      return
    }

    response.status(200).json(output)
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? sanitizeError(error.message) : 'Assistant indisponible.',
    })
  }
}

function validateInput(body) {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Payload absent.' }
  if (!body.projectId || typeof body.projectId !== 'string') return { ok: false, message: 'projectId requis.' }
  if (body.agencyId && typeof body.agencyId !== 'string') return { ok: false, message: 'agencyId invalide.' }
  if (!body.instruction || typeof body.instruction !== 'string') return { ok: false, message: 'Instruction requise.' }
  if (body.instruction.length > maxInstructionLength) return { ok: false, message: 'Instruction trop longue.' }
  if (/modifier\s+le\s+code|code|fichier|auth|permission|annonce|stripe/i.test(body.instruction)) {
    return { ok: false, message: 'Cette demande sort du perimetre Blueprint.' }
  }
  if (!body.currentBlueprint || typeof body.currentBlueprint !== 'string') return { ok: false, message: 'Blueprint actuel requis.' }
  if (!body.currentBlueprint.includes('VisualBlueprint:') || !body.currentBlueprint.includes('version: v1')) {
    return { ok: false, message: 'Blueprint v1 actuel requis.' }
  }
  if (!body.capabilities || typeof body.capabilities !== 'object') return { ok: false, message: 'Catalogue de capacites requis.' }
  return { ok: true }
}

async function runOpenAiAssistant(body) {
  const model = process.env.BLUEPRINT_ASSISTANT_MODEL || 'gpt-4.1-mini'
  const prompt = [
    'Tu es un assistant strict de modification VisualBlueprint v1 pour Signature Digital.',
    'Tu dois retourner uniquement du JSON valide avec proposedBlueprint, changes, unsupportedRequests, warnings.',
    'Tu conserves les donnees non concernees.',
    'Tu utilises uniquement les sections, cles et valeurs du catalogue fourni.',
    'Tu refuses toute demande de code, auth, permissions, annonces, workflow ou capacite absente.',
    '',
    `Instruction francaise:\n${body.instruction}`,
    '',
    `Blueprint actuel:\n${body.currentBlueprint}`,
    '',
    `ClientBrief utile:\n${JSON.stringify(body.clientBrief || {}, null, 2)}`,
    '',
    `Catalogue:\n${JSON.stringify(body.capabilities, null, 2)}`,
  ].join('\n')

  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'Retourne uniquement du JSON valide. Ne modifie jamais le code.' },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!apiResponse.ok) {
    throw new Error(`OpenAI indisponible: ${apiResponse.status}`)
  }
  const payload = await apiResponse.json()
  const content = payload?.choices?.[0]?.message?.content || ''
  return JSON.parse(content)
}

function createSimulatedProposal(body) {
  const instruction = body.instruction.toLowerCase()
  let proposedBlueprint = body.currentBlueprint
  const changes = []
  const unsupportedRequests = []
  const warnings = ['Mode simulation : aucune IA live configuree.']

  if (/video|parallax|3d|animation spectaculaire|nouvelle section|nouveau workflow/i.test(body.instruction)) {
    unsupportedRequests.push('Cette demande necessite une capacite absente du moteur.')
  }

  const replacements = [
    [/plus premium|premium|haut de gamme/, 'layout', 'composition', 'institutional-trust'],
    [/plus humain|humain|local/, 'layout', 'composition', 'local-human'],
    [/plus direct|conversion|commercial/, 'layout', 'composition', 'commercial-direct'],
    [/investissement|data|chiffres/, 'layout', 'composition', 'data-investment'],
    [/hero centre|centrer|centre/, 'hero', 'layout', 'centered'],
    [/hero split|image a droite|image à droite/, 'hero', 'layout', 'split-right'],
    [/navigation transparente|header transparent/, 'navigation', 'surface', 'transparent'],
    [/cartes compactes|compact/, 'propertyCards', 'variant', 'compact'],
    [/cartes visuelles|image-zoom|visuel/, 'propertyCards', 'variant', 'visual'],
    [/formulaire guide|guidé|guide/, 'forms', 'variant', 'guided'],
    [/animation reduite|réduite|reduced/, 'responsive', 'motionLevel', 'reduced'],
    [/animation expressive|expressive/, 'responsive', 'motionLevel', 'expressive'],
  ]

  for (const [pattern, section, property, value] of replacements) {
    if (!pattern.test(instruction)) continue
    const previous = readBlueprintValue(proposedBlueprint, section, property)
    proposedBlueprint = writeBlueprintValue(proposedBlueprint, section, property, value)
    if (previous !== value) {
      changes.push({ section, property, before: previous, after: value, summary: `${section}.${property} passe a ${value}.` })
    }
  }

  if (!changes.length && !unsupportedRequests.length) {
    warnings.push('La demande ne correspond a aucune modification sure du catalogue.')
  }

  return { proposedBlueprint, changes, unsupportedRequests, warnings }
}

function normalizeAssistantOutput(result, body, mode) {
  return {
    proposedBlueprint: typeof result.proposedBlueprint === 'string' ? result.proposedBlueprint : body.currentBlueprint,
    changes: Array.isArray(result.changes) ? result.changes.map(normalizeChange).filter(Boolean) : [],
    unsupportedRequests: Array.isArray(result.unsupportedRequests) ? result.unsupportedRequests.map(String).filter(Boolean) : [],
    warnings: Array.isArray(result.warnings) ? result.warnings.map(String).filter(Boolean) : [],
    mode,
  }
}

function normalizeChange(change) {
  if (!change || typeof change !== 'object') return null
  return {
    section: String(change.section || ''),
    property: String(change.property || ''),
    before: change.before === undefined ? undefined : String(change.before),
    after: change.after === undefined ? undefined : String(change.after),
    summary: String(change.summary || `${change.section}.${change.property} modifie.`),
  }
}

function validateOutput(output) {
  if (!output.proposedBlueprint.trim().startsWith('VisualBlueprint:')) return { ok: false, message: 'Blueprint propose invalide.' }
  if (!output.proposedBlueprint.includes('version: v1')) return { ok: false, message: 'Version Blueprint invalide.' }
  if (/```|<script|import\s|export\s|function\s/i.test(output.proposedBlueprint)) return { ok: false, message: 'Contenu non Blueprint detecte.' }
  return { ok: true }
}

function readBlueprintValue(blueprint, section, property) {
  const sectionPattern = new RegExp(`^\\s*${escapeRegExp(section)}:\\s*$`, 'mi')
  const sectionMatch = blueprint.match(sectionPattern)
  if (!sectionMatch || sectionMatch.index === undefined) return ''
  const after = blueprint.slice(sectionMatch.index + sectionMatch[0].length)
  const nextSection = after.search(/\n\s{2}[A-Za-z][A-Za-z0-9]*:\s*$/m)
  const block = nextSection >= 0 ? after.slice(0, nextSection) : after
  const propertyMatch = block.match(new RegExp(`^\\s{4}${escapeRegExp(property)}:\\s*(.+)$`, 'mi'))
  return propertyMatch?.[1]?.replace(/^"|"$/g, '').trim() || ''
}

function writeBlueprintValue(blueprint, section, property, value) {
  const lines = blueprint.split(/\r?\n/)
  const sectionIndex = lines.findIndex((line) => line.trim() === `${section}:`)
  if (sectionIndex < 0) {
    return `${blueprint.trim()}\n  ${section}:\n    ${property}: ${value}\n`
  }
  let insertIndex = sectionIndex + 1
  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    if (/^\s{2}[A-Za-z][A-Za-z0-9]*:\s*$/.test(lines[index])) break
    if (new RegExp(`^\\s{4}${escapeRegExp(property)}:`).test(lines[index])) {
      lines[index] = `    ${property}: ${value}`
      return lines.join('\n')
    }
    insertIndex = index + 1
  }
  lines.splice(insertIndex, 0, `    ${property}: ${value}`)
  return lines.join('\n')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sanitizeError(message) {
  return message
    .replace(/OPENAI_API_KEY=["']?[^"',\s}]+/gi, 'OPENAI_API_KEY=[hidden]')
    .slice(0, 220)
}
