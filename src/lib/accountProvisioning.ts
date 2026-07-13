import type { RealEstateAgent, RealEstateSeller } from '../data/realEstateTemplate'
import { getRealEstateAgencyRuntimeBySlug } from '../data/realEstateAgencyConfig'
import { enqueueAndSendEmailEvent } from './emailEventSystem'
import { resolveAgencyPublicUrls } from './agencyDomainSystem'

export type AccountRole = 'owner' | 'agent' | 'seller'
export type AccountStatus = 'draft' | 'pending' | 'active' | 'disabled'

export type BaseProvisionedAccount = {
  id: string
  agencyId: string
  agencySlug: string
  firstName: string
  lastName: string
  email: string
  role: AccountRole
  active: boolean
  suspended: boolean
  accountStatus: AccountStatus
  createdAt: string
  updatedAt: string
  permissions: string[]
  modules: string[]
  invitationToken: string
  invitationUrl: string
}

export type Owner = BaseProvisionedAccount & {
  role: 'owner'
}

export type Agent = BaseProvisionedAccount & {
  role: 'agent'
  displayRole: string
  sourceAgentId?: string
}

export type Seller = BaseProvisionedAccount & {
  role: 'seller'
  propertyId?: string
  sourceSellerId?: string
}

export type ProvisionedAccount = Owner | Agent | Seller

export type AccountProvisioningState = {
  agencyId: string
  accounts: ProvisionedAccount[]
}

export type AccountProvisioningSeed = {
  agencyId: string
  agencySlug: string
  ownerName: string
  ownerEmail: string
  agents: RealEstateAgent[]
  sellers: RealEstateSeller[]
  modules: string[]
}

export type CreateAccountInput = {
  agencyId: string
  agencySlug: string
  firstName: string
  lastName: string
  email: string
  modules: string[]
}

const accountProvisioningStorageKey = 'signatureDigitalAccountProvisioning'

export function resolveAccountProvisioning(seed: AccountProvisioningSeed): AccountProvisioningState {
  const currentAccounts = readAccounts()
  const seededAccounts = [
    seedOwner(seed),
    ...seed.agents.map((agent) => seedAgent(seed, agent)),
    ...seed.sellers.map((seller) => seedSeller(seed, seller)),
  ]
  const nextAccounts = mergeAccounts(currentAccounts, seededAccounts)

  if (typeof window !== 'undefined' && nextAccounts.length !== currentAccounts.length) {
    writeAccounts(nextAccounts)
  }

  return {
    agencyId: seed.agencyId,
    accounts: nextAccounts.filter((account) => account.agencyId === seed.agencyId),
  }
}

export function createAgentAccount(input: CreateAccountInput & { displayRole?: string }) {
  const now = new Date().toISOString()
  const account = withInvitation({
    id: createId('agent'),
    agencyId: input.agencyId,
    agencySlug: input.agencySlug,
    firstName: clean(input.firstName),
    lastName: clean(input.lastName) || 'Agent',
    email: normalizeEmail(input.email),
    role: 'agent',
    active: true,
    suspended: false,
    accountStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    permissions: ['properties:read', 'properties:write', 'visits:write', 'reports:write'],
    modules: input.modules,
    invitationToken: '',
    invitationUrl: '',
    displayRole: clean(input.displayRole) || 'Conseiller',
  } satisfies Agent)
  upsertAccount(account)
  enqueueAccountInvitation(account)
  return account
}

export function createSellerAccount(input: CreateAccountInput & { propertyId?: string }) {
  const now = new Date().toISOString()
  const account = withInvitation({
    id: createId('seller'),
    agencyId: input.agencyId,
    agencySlug: input.agencySlug,
    firstName: clean(input.firstName),
    lastName: clean(input.lastName) || 'Vendeur',
    email: normalizeEmail(input.email),
    role: 'seller',
    active: true,
    suspended: false,
    accountStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    permissions: ['seller-space:read', 'documents:read', 'reports:read'],
    modules: input.modules,
    invitationToken: '',
    invitationUrl: '',
    propertyId: input.propertyId,
  } satisfies Seller)
  upsertAccount(account)
  enqueueAccountInvitation(account)
  return account
}

export function updateSellerAccount(accountId: string, updates: Partial<Pick<Seller, 'firstName' | 'lastName' | 'email' | 'propertyId'>>) {
  return updateAccount(accountId, (account) => {
    if (account.role !== 'seller') return account
    const nextAccount = {
      ...account,
      firstName: updates.firstName !== undefined ? clean(updates.firstName) : account.firstName,
      lastName: updates.lastName !== undefined ? clean(updates.lastName) : account.lastName,
      email: updates.email !== undefined ? normalizeEmail(updates.email) : account.email,
      propertyId: updates.propertyId !== undefined ? updates.propertyId : account.propertyId,
      updatedAt: new Date().toISOString(),
    }
    return withInvitation(nextAccount)
  }) as Seller | undefined
}

export function suspendAgentAccount(accountId: string) {
  return updateAccount(accountId, (account) => account.role === 'agent'
    ? { ...account, active: false, suspended: true, accountStatus: 'disabled', updatedAt: new Date().toISOString() }
    : account)
}

export function reactivateAgentAccount(accountId: string) {
  return updateAccount(accountId, (account) => account.role === 'agent'
    ? { ...account, active: true, suspended: false, accountStatus: 'active', updatedAt: new Date().toISOString() }
    : account)
}

export function deleteAgentAccount(accountId: string) {
  const account = readAccounts().find((item) => item.id === accountId && item.role === 'agent')
  if (!account) return undefined
  writeAccounts(readAccounts().filter((item) => item.id !== accountId))
  return account as Agent
}

export function copyInvitationLink(account: ProvisionedAccount) {
  return account.invitationUrl
}

function enqueueAccountInvitation(account: ProvisionedAccount) {
  const event = account.role === 'owner'
    ? 'account-invitation-owner'
    : account.role === 'agent'
      ? 'account-invitation-agent'
      : 'account-invitation-seller'

  enqueueAndSendEmailEvent({
    event,
    account: {
      agencyId: account.agencyId,
      agencySlug: account.agencySlug,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role === 'seller' ? 'vendeur' : account.role === 'agent' ? 'agent' : 'patron',
      invitationUrl: account.invitationUrl,
    },
  })
}

function seedOwner(seed: AccountProvisioningSeed): Owner {
  const name = splitName(seed.ownerName || 'Direction agence')
  const now = new Date().toISOString()
  return withInvitation({
    id: `${seed.agencyId}-owner`,
    agencyId: seed.agencyId,
    agencySlug: seed.agencySlug,
    firstName: name.firstName,
    lastName: name.lastName || 'Agence',
    email: normalizeEmail(seed.ownerEmail || `patron@${seed.agencySlug}.local`),
    role: 'owner',
    active: true,
    suspended: false,
    accountStatus: 'active',
    createdAt: now,
    updatedAt: now,
    permissions: ['accounts:write', 'agents:write', 'sellers:write', 'properties:write'],
    modules: seed.modules,
    invitationToken: '',
    invitationUrl: '',
  } satisfies Owner)
}

function seedAgent(seed: AccountProvisioningSeed, agent: RealEstateAgent): Agent {
  const name = splitName(agent.name)
  const now = new Date().toISOString()
  return withInvitation({
    id: `${seed.agencyId}-agent-${agent.id}`,
    agencyId: seed.agencyId,
    agencySlug: seed.agencySlug,
    firstName: name.firstName,
    lastName: name.lastName,
    email: normalizeEmail(agent.email),
    role: 'agent',
    active: agent.active,
    suspended: !agent.active,
    accountStatus: agent.active ? 'active' : 'disabled',
    createdAt: now,
    updatedAt: now,
    permissions: ['properties:read', 'properties:write', 'visits:write', 'reports:write'],
    modules: seed.modules,
    invitationToken: '',
    invitationUrl: '',
    displayRole: agent.role,
    sourceAgentId: agent.id,
  } satisfies Agent)
}

function seedSeller(seed: AccountProvisioningSeed, seller: RealEstateSeller): Seller {
  const name = splitName(seller.name)
  const now = new Date().toISOString()
  return withInvitation({
    id: `${seed.agencyId}-seller-${seller.id}`,
    agencyId: seed.agencyId,
    agencySlug: seed.agencySlug,
    firstName: name.firstName,
    lastName: name.lastName,
    email: normalizeEmail(seller.email),
    role: 'seller',
    active: true,
    suspended: false,
    accountStatus: 'active',
    createdAt: now,
    updatedAt: now,
    permissions: ['seller-space:read', 'documents:read', 'reports:read'],
    modules: seed.modules,
    invitationToken: '',
    invitationUrl: '',
    propertyId: seller.propertyId,
    sourceSellerId: seller.id,
  } satisfies Seller)
}

function upsertAccount(account: ProvisionedAccount) {
  writeAccounts(mergeAccounts(readAccounts(), [account]))
}

function updateAccount(accountId: string, updater: (account: ProvisionedAccount) => ProvisionedAccount) {
  let updated: ProvisionedAccount | undefined
  const nextAccounts = readAccounts().map((account) => {
    if (account.id !== accountId) return account
    updated = updater(account)
    return updated
  })
  writeAccounts(nextAccounts)
  return updated
}

function mergeAccounts(currentAccounts: ProvisionedAccount[], incomingAccounts: ProvisionedAccount[]) {
  const next = [...currentAccounts]
  incomingAccounts.forEach((incoming) => {
    const index = next.findIndex((account) =>
      account.id === incoming.id ||
      (account.agencyId === incoming.agencyId && account.email === incoming.email && account.role === incoming.role)
    )
    if (index === -1) {
      next.push(incoming)
      return
    }
    next[index] = {
      ...incoming,
      ...next[index],
      permissions: next[index].permissions.length ? next[index].permissions : incoming.permissions,
      modules: next[index].modules.length ? next[index].modules : incoming.modules,
    } as ProvisionedAccount
  })
  return next
}

function withInvitation<T extends ProvisionedAccount>(account: T): T {
  const token = account.invitationToken || createInvitationToken(account)
  return {
    ...account,
    invitationToken: token,
    invitationUrl: buildInvitationUrl(account.agencySlug, token),
  }
}

function createInvitationToken(account: ProvisionedAccount) {
  const payload = {
    agencyId: account.agencyId,
    agencySlug: account.agencySlug,
    email: account.email,
    role: account.role === 'seller' ? 'seller' : account.role,
    name: `${account.firstName} ${account.lastName}`.trim(),
    propertyId: account.role === 'seller' ? account.propertyId : undefined,
    createdAt: account.createdAt,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    nonce: account.id,
  }
  return `rei_${encodeBase64Url(JSON.stringify(payload))}`
}

function buildInvitationUrl(agencySlug: string, token: string) {
  const runtime = getRealEstateAgencyRuntimeBySlug(agencySlug)
  if (runtime) return `${resolveAgencyPublicUrls(runtime.modelConfig).primaryUrl}/invitation?token=${encodeURIComponent(token)}`
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/demo/${agencySlug}/invitation?token=${encodeURIComponent(token)}`
}

function readAccounts() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(accountProvisioningStorageKey) || '[]') as ProvisionedAccount[]
  } catch {
    return []
  }
}

function writeAccounts(accounts: ProvisionedAccount[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(accountProvisioningStorageKey, JSON.stringify(accounts))
}

function splitName(value: string) {
  const parts = clean(value).split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  }
}

function clean(value?: string) {
  return String(value || '').trim()
}

function normalizeEmail(value?: string) {
  return clean(value).toLowerCase()
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
