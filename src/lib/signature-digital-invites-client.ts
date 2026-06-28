type InviteAction = 'createInvite' | 'getInvite' | 'completeInvite' | 'revokeInvite'

export function postInvite(action: InviteAction, payload: Record<string, unknown>) {
  return fetch('/api/invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  }).then((response) => response.json() as Promise<{
    ok: boolean
    message?: string
    invite?: unknown
    token?: string
  }>)
}

export function createInvite(payload: Record<string, unknown>) {
  return postInvite('createInvite', payload)
}

export function getInvite(token: string) {
  return postInvite('getInvite', { token })
}

export function completeInvite(token: string, password: string) {
  return postInvite('completeInvite', { token, password })
}

export function revokeInvite(token: string) {
  return postInvite('revokeInvite', { token })
}
