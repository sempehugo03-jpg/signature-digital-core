import { completeInvite, createInvite, getInvite } from './signature-digital-invites-client'

export type RealEstateInvitationRole = 'seller' | 'agent' | 'owner'
export type RealEstateTemplateRole = 'vendeur' | 'agent' | 'patron'

export type RealEstateInvitation = {
  id: string
  agencyId: string
  agencySlug: string
  email: string
  role: RealEstateInvitationRole
  propertyId?: string
  token: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  name: string
  phone: string
  createdAt: string
  expiresAt: string
}

export type RealEstateInvitationUser = {
  id: string
  agencyId: string
  agencySlug: string
  email: string
  role: RealEstateTemplateRole
  name: string
  phone: string
  password: string
  propertyId?: string
  createdAt: string
}

export type RealEstateInvitationResult = {
  invitation: RealEstateInvitation
  invitationUrl: string
  emailStatus: 'sent' | 'fallback'
}

const invitationsStorageKey = 'signatureDigitalTemplateInvitations'
const usersStorageKey = 'signatureDigitalTemplateUsers'

export async function createRealEstateInvitation(input: {
  agencyId: string
  agencySlug: string
  email: string
  role: RealEstateInvitationRole
  name: string
  phone?: string
  propertyId?: string
}) {
  const email = input.email.trim().toLowerCase()
  const now = new Date()
  const fallbackToken = createLocalToken(input, now)
  let token = fallbackToken

  try {
    const result = await createInvite({
      agencyId: input.agencyId,
      email,
      token: fallbackToken,
      type: inviteTypeFromRole(input.role),
    })
    if (result.ok && result.token) token = result.token
  } catch {
    token = fallbackToken
  }

  const invitation: RealEstateInvitation = {
    id: `real-estate-invitation-${Date.now()}`,
    agencyId: input.agencyId,
    agencySlug: input.agencySlug,
    email,
    role: input.role,
    propertyId: input.propertyId,
    token,
    status: 'pending',
    name: input.name.trim() || email,
    phone: input.phone?.trim() ?? '',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }

  saveInvitation(invitation)
  const invitationUrl = buildInvitationUrl(input.agencySlug, token)

  return {
    invitation,
    invitationUrl,
    emailStatus: 'fallback',
  } satisfies RealEstateInvitationResult
}

export async function findRealEstateInvitation(token: string) {
  const localInvitation = readInvitations().find((invitation) => invitation.token === token)
  if (localInvitation) return localInvitation
  const decodedInvitation = decodeLocalToken(token)

  try {
    const result = await getInvite(token)
    if (result.ok && decodedInvitation) return decodedInvitation
  } catch {
    return decodedInvitation
  }

  return decodedInvitation
}

export async function acceptRealEstateInvitation(token: string, password: string) {
  const invitation = await findRealEstateInvitation(token)
  if (!invitation) throw new Error('Invitation introuvable.')
  if (invitation.status !== 'pending') throw new Error('Invitation expirée.')
  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    saveInvitation({ ...invitation, status: 'expired' })
    throw new Error('Invitation expirée.')
  }

  const user: RealEstateInvitationUser = {
    id: `real-estate-user-${Date.now()}`,
    agencyId: invitation.agencyId,
    agencySlug: invitation.agencySlug,
    email: invitation.email,
    role: templateRoleFromInvitationRole(invitation.role),
    name: invitation.name,
    phone: invitation.phone,
    password,
    propertyId: invitation.propertyId,
    createdAt: new Date().toISOString(),
  }

  saveUser(user)
  saveInvitation({ ...invitation, status: 'accepted' })

  try {
    await completeInvite(token, password)
  } catch {
    // The local access is valid even when the server-side invite endpoint is unavailable.
  }

  return user
}

export function findRealEstateUserByCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  return readUsers().find((user) => user.email === normalizedEmail && user.password === password) ?? null
}

function readInvitations() {
  return readStorage<RealEstateInvitation>(invitationsStorageKey)
}

function readUsers() {
  return readStorage<RealEstateInvitationUser>(usersStorageKey)
}

function saveInvitation(invitation: RealEstateInvitation) {
  const next = [
    invitation,
    ...readInvitations().filter((item) => item.token !== invitation.token && item.email !== invitation.email),
  ]
  window.localStorage.setItem(invitationsStorageKey, JSON.stringify(next))
}

function saveUser(user: RealEstateInvitationUser) {
  const next = [
    user,
    ...readUsers().filter((item) => item.email !== user.email),
  ]
  window.localStorage.setItem(usersStorageKey, JSON.stringify(next))
}

function readStorage<T>(key: string) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}

function inviteTypeFromRole(role: RealEstateInvitationRole) {
  if (role === 'seller') return 'seller_invite'
  if (role === 'agent') return 'agent_invite'
  return 'manager_invite'
}

function templateRoleFromInvitationRole(role: RealEstateInvitationRole): RealEstateTemplateRole {
  if (role === 'seller') return 'vendeur'
  if (role === 'agent') return 'agent'
  return 'patron'
}

function buildInvitationUrl(agencySlug: string, token: string) {
  const origin = window.location.origin
  return `${origin}/demo/${agencySlug}/invitation?token=${encodeURIComponent(token)}`
}

function createLocalToken(input: {
  agencyId: string
  agencySlug: string
  email: string
  role: RealEstateInvitationRole
  name: string
  phone?: string
  propertyId?: string
}, now: Date) {
  const payload = {
    agencyId: input.agencyId,
    agencySlug: input.agencySlug,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    propertyId: input.propertyId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    nonce: Math.random().toString(16).slice(2, 10),
  }

  return `rei_${encodeBase64Url(JSON.stringify(payload))}`
}

function decodeLocalToken(token: string): RealEstateInvitation | null {
  if (!token.startsWith('rei_')) return null

  try {
    const payload = JSON.parse(decodeBase64Url(token.slice(4))) as Partial<RealEstateInvitation> & { nonce?: string }
    if (!payload.agencyId || !payload.agencySlug || !payload.email || !payload.role || !payload.createdAt || !payload.expiresAt) {
      return null
    }

    return {
      id: `real-estate-invitation-${payload.nonce ?? Date.now()}`,
      agencyId: payload.agencyId,
      agencySlug: payload.agencySlug,
      email: payload.email.toLowerCase(),
      role: payload.role,
      propertyId: payload.propertyId,
      token,
      status: 'pending',
      name: payload.name || payload.email,
      phone: payload.phone || '',
      createdAt: payload.createdAt,
      expiresAt: payload.expiresAt,
    }
  } catch {
    return null
  }
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padding = '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(`${normalized}${padding}`)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
