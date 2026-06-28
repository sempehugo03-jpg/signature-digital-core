export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, message: 'Method not allowed.' })
    return
  }

  const body = await readBody(request)
  const action = body.action
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    response.status(200).json({
      ok: false,
      message: 'Configuration Supabase serveur manquante pour les invitations.',
      missing: [
        !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
        !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : '',
      ].filter(Boolean),
    })
    return
  }

  try {
    if (action === 'createInvite') {
      const token = createToken()
      const invite = {
        id: `invite_${Date.now()}`,
        agency_id: body.agencyId,
        token,
        type: body.type || 'client_invite',
        status: 'active',
        email: body.email || '',
      }
      const created = await supabaseRequest(supabaseUrl, serviceRoleKey, 'invite_tokens', {
        method: 'POST',
        body: [invite],
      })
      response.status(200).json({ ok: true, invite: created[0] ?? invite, token })
      return
    }

    if (action === 'getInvite') {
      const invite = await getInvite(supabaseUrl, serviceRoleKey, body.token)
      response.status(invite ? 200 : 404).json(invite ? { ok: true, invite } : { ok: false, message: 'Invitation introuvable.' })
      return
    }

    if (action === 'completeInvite' || action === 'revokeInvite') {
      const status = action === 'completeInvite' ? 'used' : 'revoked'
      const invite = await updateInviteStatus(supabaseUrl, serviceRoleKey, body.token, status)
      response.status(200).json({ ok: true, invite })
      return
    }

    response.status(400).json({ ok: false, message: `Action invitation inconnue : ${action}.` })
  } catch (error) {
    response.status(200).json({
      ok: false,
      message: cleanError(error),
    })
  }
}

async function readBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body
  try {
    return JSON.parse(request.body)
  } catch {
    return {}
  }
}

async function getInvite(supabaseUrl, serviceRoleKey, token) {
  const result = await supabaseRequest(supabaseUrl, serviceRoleKey, `invite_tokens?token=eq.${encodeURIComponent(token)}&select=*`)
  return result[0]
}

async function updateInviteStatus(supabaseUrl, serviceRoleKey, token, status) {
  const result = await supabaseRequest(supabaseUrl, serviceRoleKey, `invite_tokens?token=eq.${encodeURIComponent(token)}`, {
    method: 'PATCH',
    body: { status },
  })
  return result[0]
}

async function supabaseRequest(supabaseUrl, serviceRoleKey, path, options = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(payload?.message || payload?.hint || 'Erreur Supabase invite_tokens.')
  return payload
}

function createToken() {
  return `invite_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}

function cleanError(error) {
  if (!(error instanceof Error)) return 'Erreur invitation inconnue.'
  return error.message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [hidden]')
}
