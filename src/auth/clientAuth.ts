const clientSessionKey = 'signature-digital-client-space'

export type ClientSession = {
  projectId: string
  email: string
  password?: string
}

export function loginClientSpace(projectId: string, email: string, password?: string) {
  const session: ClientSession = { projectId, email, password }
  window.sessionStorage.setItem(clientSessionKey, JSON.stringify(session))
}

export function getClientSession() {
  try {
    const raw = window.sessionStorage.getItem(clientSessionKey)

    return raw ? JSON.parse(raw) as ClientSession : null
  } catch {
    return null
  }
}

export function logoutClientSpace() {
  window.sessionStorage.removeItem(clientSessionKey)
}
