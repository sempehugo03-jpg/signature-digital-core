const adminSessionKey = 'signature-digital-admin'
const adminEmail = 'admin@signature-digital.fr'
const adminPassword = 'signature2026'

export function isAdminAuthenticated() {
  return window.sessionStorage.getItem(adminSessionKey) === 'connected'
}

export function loginAdmin(email: string, password: string) {
  const authenticated = email.trim().toLowerCase() === adminEmail && password === adminPassword

  if (authenticated) {
    window.sessionStorage.setItem(adminSessionKey, 'connected')
  }

  return authenticated
}

export function logoutAdmin() {
  window.sessionStorage.removeItem(adminSessionKey)
}
