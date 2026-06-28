const adminSessionKey = 'signature_digital_admin'
const defaultAdminEmail = 'signature.digital.contact@gmail.com'
const defaultAdminPassword = 'Lasempe03'

export function getAdminCredentials() {
  return {
    email: import.meta.env.NEXT_PUBLIC_ADMIN_EMAIL || defaultAdminEmail,
    password: import.meta.env.NEXT_PUBLIC_ADMIN_PASSWORD || defaultAdminPassword,
  }
}

export function isAdminAuthenticated() {
  return window.sessionStorage.getItem(adminSessionKey) === 'true'
}

export function loginAdmin(email: string, password: string) {
  const credentials = getAdminCredentials()
  const authenticated = email.trim().toLowerCase() === credentials.email.toLowerCase() && password === credentials.password

  if (authenticated) {
    window.sessionStorage.setItem(adminSessionKey, 'true')
  }

  return authenticated
}

export function logoutAdmin() {
  window.sessionStorage.removeItem(adminSessionKey)
}
