import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, PointerEvent, ReactNode } from 'react'
import {
  demoAccounts,
  fallbackPropertyImage,
  formatTemplatePrice,
  templateImmobilierConfig as defaultTemplateImmobilierConfig,
  type RealEstateAgencyConfig,
  type RealEstateAgent,
  type RealEstateDocument,
  type RealEstateOffer,
  type RealEstatePhoto,
  type RealEstateProperty,
  type RealEstateReport,
  type RealEstateRequest,
  type RealEstateSeller,
  type RealEstateVisit,
} from '../../data/realEstateTemplate'
import {
  addPropertyDocument,
  addPropertyDocumentFile,
  addPropertyPhoto,
  addPropertyPhotoFile,
  addReport,
  addVisit,
  createRequest,
  deactivateAgent,
} from '../../real-estate-engine/data/realEstateRepository'
import {
  acceptRealEstateInvitation,
  createRealEstateInvitation,
  findRealEstateInvitation,
  findRealEstateUserByCredentials,
  type RealEstateInvitation,
} from '../../lib/realEstateInvitationFlow'
import {
  resolvePublicNavigation,
  type PublicNavigationConfig,
  type PublicNavigationTarget,
} from '../../lib/publicNavigationSystem'
import {
  resolvePublicHero,
  type PublicHeroConfig,
} from '../../lib/publicHeroSystem'
import {
  resolvePublicSections,
  type PublicSectionConfig,
} from '../../lib/publicSectionsSystem'
import {
  resolvePublicPropertyCardConfig,
  type PublicPropertyCardConfig,
} from '../../lib/publicPropertyCardSystem'
import {
  resolvePublicProof,
  type PublicProofConfig,
} from '../../lib/publicProofSystem'
import {
  resolvePublicCta,
  type PublicCtaConfig,
} from '../../lib/publicCtaSystem'
import {
  resolvePublicForm,
  type PublicFormConfig,
} from '../../lib/publicFormSystem'
import { enqueueAndSendEmailEvent } from '../../lib/emailEventSystem'
import {
  resolvePrivateWorkspace,
  type PrivateWorkspaceConfig,
  type PrivateWorkspaceRole,
} from '../../lib/privateWorkspaceSystem'
import {
  copyInvitationLink,
  createAgentAccount,
  createSellerAccount,
  deleteAgentAccount,
  reactivateAgentAccount,
  resolveAccountProvisioning,
  suspendAgentAccount,
  updateSellerAccount,
  type Agent,
  type Owner,
  type Seller,
} from '../../lib/accountProvisioning'
import {
  createDefaultPublicPropertyCollectionState,
  createPublicPropertyCollectionSearch,
  parsePublicPropertyCollectionState,
  resolvePublicPropertyCollection,
  sanitizePublicPropertyCollectionState,
  type PublicPropertyCollectionSort,
  type PublicPropertyCollectionState,
} from '../../lib/publicPropertyCollectionSystem'
import {
  getRequiredModuleForRealEstateView,
  isModuleEnabled,
  realEstateModuleUnavailableMessage,
  resolveAgencyAccessMode,
  type RealEstateModuleName,
} from '../../data/realEstateAgencyConfig'
import { resolveAgencyIdentity } from '../../lib/agencyIdentity'
import {
  createMailtoHref,
  createTelHref,
  formatOpeningHours,
  resolveAgencyContactIdentity,
} from '../../lib/agencyContactLegalIdentity'
import {
  complianceTreatments,
  createConsentRecord,
  getLatestConsentRecord,
  getOrCreateVisitorId,
  saveConsentRecord,
  validateAgencyComplianceConfig,
  type ConsentDecision,
  type ConsentPurpose,
} from '../../lib/agencyCompliance'
import { getFirstName, resolveExperienceCopy, type ExperienceRole } from '../../lib/experienceCopy'
import {
  buildPublicPageImageRoles,
  createLegacyPublicPageConfig,
  getPublicPageImage,
  sortPublicPageSections,
  type PublicPageCta,
  type PublicPageConfig,
  type PublicPageSectionConfig,
} from '../../lib/publicPageConfig'
import type { RenderContract } from '../../lib/renderContract'
import './opus-domus-template.css'

type TemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'estimation' | 'invitation' | 'mentions-legales' | 'confidentialite' | 'cookies'
type Navigate = (route: string) => void
type NavMode = 'public' | 'seller' | 'agent' | 'owner'
type ActionKind = 'new-property' | 'edit-property' | 'photo' | 'document' | 'visit' | 'report' | 'agent' | 'seller-access' | 'requests' | 'disable-agent'
type TemplateSessionRole = 'vendeur' | 'agent' | 'patron'
type TemplateSession = { agencyId: string; agencySlug?: string; email: string; role: TemplateSessionRole; name: string; propertyId?: string }
type ActionValues = Record<string, string>
type ActionPayload = ActionValues & {
  photoFile?: File
  documentFile?: File
}
type TemplateSellerAccess = {
  id: string
  agencyId: string
  propertyId: string
  name: string
  email: string
  phone: string
  password: string
}
type TemplateDataState = {
  properties: RealEstateProperty[]
  agents: RealEstateAgent[]
  sellers: RealEstateSeller[]
  sellerAccesses: TemplateSellerAccess[]
  visits: RealEstateVisit[]
  documents: RealEstateDocument[]
  photos: RealEstatePhoto[]
  reports: RealEstateReport[]
  offers: RealEstateOffer[]
  requests: RealEstateRequest[]
}
type SetTemplateData = (updater: (current: TemplateDataState) => TemplateDataState) => void
type TemplateLoginRoute = 'vendeur' | 'agent' | 'patron'
type AccountForm = {
  firstName: string
  lastName: string
  email: string
  role: string
  propertyId: string
}

let templateImmobilierConfig: RealEstateAgencyConfig = defaultTemplateImmobilierConfig
let baseRoute = `/demo/${defaultTemplateImmobilierConfig.agencySlug}`
let templateActivationHref = `/activation/${defaultTemplateImmobilierConfig.agencySlug}`
const templateSessionStorageKey = 'signatureDigitalTemplateSession'
const templateDataStorageKey = 'signatureDigitalTemplateData'
const templateRequestsStorageKey = 'signatureDigitalTemplateRequests'
const propertyCollectionReturnStorageKey = 'signatureDigitalPropertyCollectionReturn'

const estimationSteps = [
  'Type de bien',
  'Localisation',
  'Caracteristiques',
  'Etat du bien',
  'Projet',
  'Coordonnees',
  'Confirmation',
]

function readTemplateSession(): TemplateSession | null {
  try {
    const raw = window.localStorage.getItem(templateSessionStorageKey)
    const session = raw ? JSON.parse(raw) as TemplateSession : null
    if (session && session.agencyId !== templateImmobilierConfig.agencyId) return null
    return session
  } catch {
    return null
  }
}

function writeTemplateSession(session: TemplateSession) {
  window.localStorage.setItem(templateSessionStorageKey, JSON.stringify(session))
}

function appendLocalTemplateRequest(values: ActionValues) {
  const current = JSON.parse(window.localStorage.getItem(getAgencyStorageKey(templateRequestsStorageKey)) || '[]') as ActionValues[]
  window.localStorage.setItem(getAgencyStorageKey(templateRequestsStorageKey), JSON.stringify([{ id: `request-${Date.now()}`, ...values }, ...current]))
}

function enqueuePublicRequestEmails(kind: 'estimation' | 'visit' | 'contact' | 'callback', values: ActionValues) {
  const eventPrefix = `${kind}-request` as const
  const prospectName = values.name || values.nom || values.prenom || values.email || 'Bonjour'
  const prospectEmail = values.email
  const contactIdentity = resolveAgencyContactIdentity(templateImmobilierConfig)
  const agencyEmail = contactIdentity.recipients[kind === 'visit' ? 'visit' : kind]
  const sharedVariables = {
    firstName: prospectName,
    agencyName: templateImmobilierConfig.agencyName,
    demoUrl: baseRoute,
  }

  if (prospectEmail) {
    enqueueAndSendEmailEvent({
      event: `${eventPrefix}-client`,
      agencyId: templateImmobilierConfig.agencyId,
      recipient: { email: prospectEmail, name: prospectName },
      variables: sharedVariables,
      idempotencyKey: `${eventPrefix}|client|${templateImmobilierConfig.agencyId}|${prospectEmail}|${Date.now()}`,
    })
  }

  if (agencyEmail) {
    enqueueAndSendEmailEvent({
      event: `${eventPrefix}-agency`,
      agencyId: templateImmobilierConfig.agencyId,
      recipient: { email: agencyEmail, name: templateImmobilierConfig.agencyName },
      variables: sharedVariables,
      idempotencyKey: `${eventPrefix}|agency|${templateImmobilierConfig.agencyId}|${prospectEmail || values.phone || values.telephone}|${Date.now()}`,
    })
  }
}

function configureTemplateRuntime(agencyConfig: RealEstateAgencyConfig, activationHref?: string) {
  templateImmobilierConfig = agencyConfig
  baseRoute = `/demo/${agencyConfig.agencySlug}`
  templateActivationHref = activationHref || `/activation/${agencyConfig.agencySlug}`
}

function getAgencyAccess() {
  return resolveAgencyAccessMode(templateImmobilierConfig, templateActivationHref)
}

function getExperienceCopy(input: {
  role?: ExperienceRole
  firstName?: string
  propertyCount?: number
  agentCount?: number
  sellerCount?: number
  requestCount?: number
  nextAction?: string
}) {
  return resolveExperienceCopy({
    ...input,
    agencyName: templateImmobilierConfig.agencyName,
    agencyMode: getAgencyAccess().mode,
  })
}

function openActivation(onNavigate?: Navigate) {
  openRoute(getAgencyAccess().activationHref, onNavigate)
}

function redirectDemoWrite(onNavigate?: Navigate) {
  if (getAgencyAccess().canWrite) return false
  openActivation(onNavigate)
  return true
}

function moduleEnabled(moduleName: RealEstateModuleName) {
  return isModuleEnabled(templateImmobilierConfig, moduleName)
}

function viewModuleEnabled(view: TemplateView) {
  const requiredModule = getRequiredModuleForRealEstateView(view)
  return !requiredModule || moduleEnabled(requiredModule)
}

function routeForRoleEnabled(route: TemplateLoginRoute) {
  const routeModules: Record<TemplateLoginRoute, RealEstateModuleName> = {
    vendeur: 'sellerSpace',
    agent: 'agentSpace',
    patron: 'ownerSpace',
  }

  return moduleEnabled(routeModules[route])
}

function getAgencyStorageKey(key: string) {
  return `${key}:${templateImmobilierConfig.agencyId}`
}

function createInitialTemplateData(): TemplateDataState {
  return {
    properties: templateImmobilierConfig.properties,
    agents: templateImmobilierConfig.agents,
    sellers: templateImmobilierConfig.sellers,
    sellerAccesses: [],
    visits: templateImmobilierConfig.visits,
    documents: templateImmobilierConfig.documents,
    photos: templateImmobilierConfig.photos,
    reports: templateImmobilierConfig.reports,
    offers: templateImmobilierConfig.offers,
    requests: templateImmobilierConfig.requests,
  }
}

function readTemplateData(): TemplateDataState {
  try {
    const raw = window.localStorage.getItem(getAgencyStorageKey(templateDataStorageKey)) ||
      (templateImmobilierConfig.agencyId === defaultTemplateImmobilierConfig.agencyId
        ? window.localStorage.getItem(templateDataStorageKey)
        : null)
    return raw ? { ...createInitialTemplateData(), ...JSON.parse(raw) as TemplateDataState } : createInitialTemplateData()
  } catch {
    return createInitialTemplateData()
  }
}

function writeTemplateData(data: TemplateDataState) {
  window.localStorage.setItem(getAgencyStorageKey(templateDataStorageKey), JSON.stringify(data))
}

function useTemplateData() {
  const [data, setDataState] = useState(readTemplateData)

  function setData(updater: (current: TemplateDataState) => TemplateDataState) {
    setDataState((current) => {
      const next = updater(current)
      writeTemplateData(next)
      return next
    })
  }

  return [data, setData] as const
}

function findProperty(data: TemplateDataState, propertyId?: string) {
  return data.properties.find((property) => property.id === propertyId && property.agencyId === templateImmobilierConfig.agencyId)
}

function findPropertyByTitle(data: TemplateDataState, title?: string) {
  return data.properties.find((property) => property.title === title && property.agencyId === templateImmobilierConfig.agencyId)
}

function documentsByProperty(data: TemplateDataState, propertyId: string) {
  return data.documents.filter((document) => document.propertyId === propertyId && document.agencyId === templateImmobilierConfig.agencyId)
}

function visitsByProperty(data: TemplateDataState, propertyId: string) {
  return data.visits.filter((visit) => visit.propertyId === propertyId && visit.agencyId === templateImmobilierConfig.agencyId)
}

function reportsByProperty(data: TemplateDataState, propertyId: string) {
  return data.reports.filter((report) => report.propertyId === propertyId && report.agencyId === templateImmobilierConfig.agencyId)
}

function offersByProperty(data: TemplateDataState, propertyId: string) {
  return data.offers.filter((offer) => offer.propertyId === propertyId && offer.agencyId === templateImmobilierConfig.agencyId)
}

function requestsByProperty(data: TemplateDataState, propertyId: string) {
  return data.requests.filter((request) => request.propertyId === propertyId && request.agencyId === templateImmobilierConfig.agencyId)
}

function photosByProperty(data: TemplateDataState, propertyId: string) {
  return data.photos.filter((photo) => photo.propertyId === propertyId && photo.agencyId === templateImmobilierConfig.agencyId)
}

function sellerPropertyId(data: TemplateDataState, session: TemplateSession | null) {
  if (session?.role !== 'vendeur') return ''
  if (session.propertyId) return session.propertyId
  const sellerAccess = data.sellerAccesses.find((item) => item.email === session.email)
  if (sellerAccess) return sellerAccess.propertyId
  return data.sellers.find((item) => item.email === session.email)?.propertyId ?? ''
}

function updateProperty(data: TemplateDataState, propertyId: string, updater: (property: RealEstateProperty) => RealEstateProperty) {
  return {
    ...data,
    properties: data.properties.map((property) => property.id === propertyId ? updater(property) : property),
  }
}

function localId(prefix: string) {
  return `${prefix}-${Date.now()}`
}

function applyContentAction(
  data: TemplateDataState,
  action: ActionKind,
  values: ActionValues,
  forcedPropertyId?: string,
  assignedAgentId?: string,
): TemplateDataState {
  if (action === 'agent') {
    const firstName = values.prenom || 'Nouvel'
    const lastName = values.nom || 'Agent'
    const newAgent: RealEstateAgent = {
      id: localId('agent'),
      agencyId: templateImmobilierConfig.agencyId,
      name: `${firstName} ${lastName}`,
      email: values.email || 'agent-local@example.fr',
      phone: values.telephone || 'Telephone a completer',
      role: values.role || 'Conseiller',
      activeListings: 0,
      active: true,
      assignedPropertyIds: [],
    }

    return { ...data, agents: [...data.agents, newAgent] }
  }

  if (action === 'new-property') {
    const imageUrl = values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl
    const propertyId = localId('property')
    const title = values.titre || 'Nouveau bien'
    const newProperty: RealEstateProperty = {
      ...templateImmobilierConfig.properties[0],
      id: propertyId,
      agencyId: templateImmobilierConfig.agencyId,
      title,
      address: values.adresse || 'Adresse a completer',
      price: values.prix || 'Prix a completer',
      priceValue: Number(values.prix?.replace(/[^\d]/g, '')) || 0,
      surface: values.surface || 'Surface a completer',
      rooms: values.pieces || 'Pieces a completer',
      description: values.description_courte || 'Description courte a completer.',
      imageUrl,
      images: [imageUrl],
      photos: [imageUrl],
      documents: [],
      visits: [],
      reports: [],
      offers: [],
      progress: 10,
      assignedAgentId: assignedAgentId || data.agents[0]?.id || templateImmobilierConfig.agents[0].id,
      sellerId: '',
    }
    const newPhoto: RealEstatePhoto = {
      id: localId('photo'),
      agencyId: templateImmobilierConfig.agencyId,
      propertyId,
      url: imageUrl,
      label: 'Photo principale',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    return {
      ...data,
      properties: [...data.properties, newProperty],
      photos: [...data.photos, newPhoto],
      agents: data.agents.map((agent) => agent.id === newProperty.assignedAgentId
        ? { ...agent, activeListings: agent.activeListings + 1, assignedPropertyIds: [...new Set([...agent.assignedPropertyIds, propertyId])] }
        : agent),
    }
  }

  const targetProperty = forcedPropertyId ? findProperty(data, forcedPropertyId) : findPropertyByTitle(data, values.bien)
  if (!targetProperty) return data

  if (action === 'edit-property') {
    return updateProperty(data, targetProperty.id, (property) => ({
      ...property,
      title: values.titre || property.title,
      address: values.adresse || property.address,
      price: values.prix || property.price,
      priceValue: values.prix ? Number(values.prix.replace(/[^\d]/g, '')) || property.priceValue : property.priceValue,
      description: values.description_courte || property.description,
      surface: values.surface || property.surface,
      rooms: values.pieces || property.rooms,
      highlights: values.points_forts
        ? values.points_forts.split(',').map((item) => item.trim()).filter(Boolean)
        : property.highlights,
    }))
  }

  if (action === 'photo') {
    const url = values.image_url_ou_upload_simule || targetProperty.imageUrl
    const photo: RealEstatePhoto = {
      id: localId('photo'),
      agencyId: templateImmobilierConfig.agencyId,
      propertyId: targetProperty.id,
      url,
      label: values.libelle_photo || 'Photo ajoutee',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    return updateProperty(
      { ...data, photos: [...data.photos, photo] },
      targetProperty.id,
      (property) => ({
        ...property,
        imageUrl: property.imageUrl || url,
        images: [...property.images, url],
        photos: [...property.photos, url],
      }),
    )
  }

  if (action === 'document') {
    const documentId = localId('document')
    const document: RealEstateDocument = {
      id: documentId,
      agencyId: templateImmobilierConfig.agencyId,
      propertyId: targetProperty.id,
      title: values.nom_document || 'Document ajoute',
      name: values.nom_document || 'Document ajoute',
      type: values.type_document || 'autre',
      property: targetProperty.title,
      status: 'Ajoute',
      url: values.url || '#',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    return updateProperty(
      { ...data, documents: [...data.documents, document] },
      targetProperty.id,
      (property) => ({ ...property, documents: [...property.documents, documentId] }),
    )
  }

  if (action === 'visit') {
    const visitId = localId('visit')
    const visit: RealEstateVisit = {
      id: visitId,
      agencyId: templateImmobilierConfig.agencyId,
      propertyId: targetProperty.id,
      property: targetProperty.address.split(',')[0] || targetProperty.title,
      date: values.date || new Date().toISOString().slice(0, 10),
      time: values.heure || '10:00',
      buyer: values.visiteur || 'Visiteur',
      buyerName: values.visiteur || 'Visiteur',
      note: values.note || 'Visite ajoutee.',
      status: values.statut || 'Confirme',
      agent: data.agents.find((agent) => agent.id === targetProperty.assignedAgentId)?.name || 'Agence',
    }

    return updateProperty(
      { ...data, visits: [...data.visits, visit] },
      targetProperty.id,
      (property) => ({ ...property, visits: [...property.visits, visitId], progress: Math.max(property.progress, 65) }),
    )
  }

  if (action === 'report') {
    const visitId = values.visite_liee?.split(' - ')[0] || targetProperty.visits[0] || ''
    const reportId = localId('report')
    const report: RealEstateReport = {
      id: reportId,
      agencyId: templateImmobilierConfig.agencyId,
      propertyId: targetProperty.id,
      visitId,
      content: values.prochaine_action
        ? `${values.compte_rendu || 'Compte rendu ajoute.'} Prochaine action : ${values.prochaine_action}.`
        : values.compte_rendu || 'Compte rendu ajoute.',
      interestLevel: values.niveau_interet || 'moyen',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    return updateProperty(
      { ...data, reports: [...data.reports, report] },
      targetProperty.id,
      (property) => ({ ...property, reports: [...property.reports, reportId], progress: Math.max(property.progress, 70) }),
    )
  }

  return data
}

async function completeRepositoryAction(
  action: ActionKind,
  values: ActionPayload,
  data: TemplateDataState,
  setData: SetTemplateData,
  forcedPropertyId?: string,
  assignedAgentId?: string,
) {
  const agencyId = templateImmobilierConfig.agencyId

  if (action === 'new-property' || action === 'edit-property') {
    setData((current) => applyContentAction(current, action, values, forcedPropertyId, assignedAgentId))
    return
  }

  if (action === 'seller-access') {
    const targetProperty = forcedPropertyId ? findProperty(data, forcedPropertyId) : findPropertyByTitle(data, values.bien)
    if (!targetProperty) throw new Error('Choisissez un bien.')

    const name = requireActionValue(values.nom_vendeur, 'Ajoutez un nom vendeur.')
    const email = requireActionValue(values.email_vendeur, 'Ajoutez un email vendeur.').toLowerCase()
    const invitation = await createRealEstateInvitation({
      agencyId,
      agencySlug: templateImmobilierConfig.agencySlug,
      role: 'seller',
      name,
      email,
      phone: values.telephone_vendeur,
      propertyId: targetProperty.id,
    })

    values.invitation_link = invitation.invitationUrl
    values.email_status = invitation.emailStatus
    values.invitation_role = 'seller'
    return
  }

  if (action === 'agent') {
    const name = [values.prenom, values.nom].filter(Boolean).join(' ') || 'Nouvel agent'
    requireActionValue(name, "Ajoutez un nom d'agent.")
    const email = requireActionValue(values.email, 'Ajoutez un email agent.').toLowerCase()
    const invitation = await createRealEstateInvitation({
      agencyId,
      agencySlug: templateImmobilierConfig.agencySlug,
      role: 'agent',
      name,
      email,
      phone: values.telephone,
    })

    values.invitation_link = invitation.invitationUrl
    values.email_status = invitation.emailStatus
    values.invitation_role = 'agent'
    return
  }

  if (action === 'requests') {
    const selectedProperty = forcedPropertyId ? findProperty(data, forcedPropertyId) : findPropertyByTitle(data, values.bien)
    const request = await createRequest(agencyId, {
      type: 'visit',
      propertyId: selectedProperty?.id ?? forcedPropertyId ?? '',
      contact: values.nom,
      detail: values.message,
      name: values.nom,
      phone: values.telephone,
      email: values.email,
      message: values.message || 'Demande de visite',
      status: 'new',
    })

    setData((current) => ({
      ...current,
      requests: [request, ...current.requests.filter((item) => item.id !== request.id)],
    }))
    appendLocalTemplateRequest({
      agencyId,
      type: 'Demande visite',
      propertyId: request.propertyId,
      name: values.nom,
      phone: values.telephone,
      email: values.email,
      message: values.message,
      status: 'Nouvelle',
    })
    enqueuePublicRequestEmails('visit', values)
    return
  }

  const targetProperty = forcedPropertyId ? findProperty(data, forcedPropertyId) : findPropertyByTitle(data, values.bien)
  if (!targetProperty) throw new Error('Choisissez un bien.')

  if (action === 'photo') {
    const label = values.libelle_photo || values.photoFile?.name || 'Photo ajoutee'
    const photo = values.photoFile
      ? await addPropertyPhotoFile(agencyId, targetProperty.id, {
          file: values.photoFile,
          label,
          altText: label || targetProperty.title,
        })
      : await addPropertyPhoto(agencyId, targetProperty.id, {
          url: requireActionValue(values.lien_photo, 'Ajoutez un lien de photo.'),
          storagePath: values.lien_photo,
          label,
          fileName: label,
          altText: label || targetProperty.title,
        })

    setData((current) => mergePhoto(current, targetProperty.id, photo))
    return
  }

  if (action === 'document') {
    const name = requireActionValue(values.nom_document || values.documentFile?.name, 'Ajoutez un nom de document.')
    const document = values.documentFile
      ? await addPropertyDocumentFile(agencyId, targetProperty.id, {
          file: values.documentFile,
          name,
          title: name,
          type: values.type_document || 'autre',
          documentType: values.type_document || 'autre',
          status: 'Ajoute',
        })
      : await addPropertyDocument(agencyId, targetProperty.id, {
          name,
          title: name,
          type: values.type_document || 'autre',
          documentType: values.type_document || 'autre',
          url: requireActionValue(values.lien_document, 'Ajoutez un lien de document.'),
          storagePath: values.lien_document,
          fileName: name,
          status: 'Ajoute',
        })

    setData((current) => mergeDocument(current, targetProperty.id, { ...document, property: targetProperty.title }))
    return
  }

  if (action === 'visit') {
    requireActionValue(values.date, 'Ajoutez une date de visite.')
    requireActionValue(values.heure, 'Ajoutez une heure de visite.')
    requireActionValue(values.visiteur, 'Ajoutez un nom de visiteur.')
    const visit = await addVisit(agencyId, targetProperty.id, {
      date: values.date,
      time: values.heure,
      buyer: values.visiteur,
      buyerName: values.visiteur,
      note: values.note,
      status: values.statut,
      agent: data.agents.find((agent) => agent.id === targetProperty.assignedAgentId)?.name || 'Agence',
    })

    setData((current) => mergeVisit(current, targetProperty.id, {
      ...visit,
      property: targetProperty.address.split(',')[0] || targetProperty.title,
    }))
    return
  }

  if (action === 'report') {
    requireActionValue(values.compte_rendu, 'Ajoutez un compte rendu.')
    const visitId = readSelectedVisitId(values.visite_liee, targetProperty.visits[0])
    const content = values.prochaine_action
      ? `${values.compte_rendu || 'Compte rendu ajoute.'} Prochaine action : ${values.prochaine_action}.`
      : values.compte_rendu || 'Compte rendu ajoute.'
    const report = await addReport(agencyId, targetProperty.id, {
      visitId,
      content,
      interestLevel: values.niveau_interet || 'moyen',
    })

    setData((current) => mergeReport(current, targetProperty.id, report))
  }
}

function requireActionValue(value: string | undefined, message: string) {
  const normalized = value?.trim() ?? ''
  if (!normalized) throw new Error(message)
  return normalized
}

async function disableAgentWithRepository(agentId: string, setData: SetTemplateData) {
  await deactivateAgent(templateImmobilierConfig.agencyId, agentId)
  setData((current) => ({
    ...current,
    agents: current.agents.map((agent) => agent.id === agentId ? { ...agent, active: false } : agent),
  }))
}

function mergePhoto(data: TemplateDataState, propertyId: string, photo: RealEstatePhoto): TemplateDataState {
  return updateProperty(
    { ...data, photos: [photo, ...data.photos.filter((item) => item.id !== photo.id)] },
    propertyId,
    (property) => ({
      ...property,
      imageUrl: property.imageUrl || photo.url,
      images: photo.url ? [...new Set([photo.url, ...property.images])] : property.images,
      photos: photo.url ? [...new Set([photo.url, ...property.photos])] : property.photos,
    }),
  )
}

function mergeDocument(data: TemplateDataState, propertyId: string, document: RealEstateDocument): TemplateDataState {
  return updateProperty(
    { ...data, documents: [document, ...data.documents.filter((item) => item.id !== document.id)] },
    propertyId,
    (property) => ({ ...property, documents: [...new Set([document.id, ...property.documents])] }),
  )
}

function mergeVisit(data: TemplateDataState, propertyId: string, visit: RealEstateVisit): TemplateDataState {
  return updateProperty(
    { ...data, visits: [visit, ...data.visits.filter((item) => item.id !== visit.id)] },
    propertyId,
    (property) => ({ ...property, visits: [...new Set([visit.id, ...property.visits])], progress: Math.max(property.progress, 65) }),
  )
}

function mergeReport(data: TemplateDataState, propertyId: string, report: RealEstateReport): TemplateDataState {
  return updateProperty(
    { ...data, reports: [report, ...data.reports.filter((item) => item.id !== report.id)] },
    propertyId,
    (property) => ({ ...property, reports: [...new Set([report.id, ...property.reports])], progress: Math.max(property.progress, 70) }),
  )
}

function mergeSellerAccess(
  data: TemplateDataState,
  propertyId: string,
  seller: RealEstateSeller,
  access: TemplateSellerAccess,
): TemplateDataState {
  return updateProperty(
    {
      ...data,
      sellers: [seller, ...data.sellers.filter((item) => item.id !== seller.id && item.email !== seller.email)],
      sellerAccesses: [
        access,
        ...data.sellerAccesses.filter((item) => item.id !== access.id && item.email !== access.email),
      ],
    },
    propertyId,
    (property) => ({ ...property, sellerId: seller.id }),
  )
}

function mergeAcceptedInvitationUser(
  data: TemplateDataState,
  user: {
    id: string
    agencyId: string
    email: string
    role: TemplateSessionRole
    name: string
    phone: string
    password: string
    propertyId?: string
  },
): TemplateDataState {
  if (user.role === 'vendeur' && user.propertyId) {
    const seller: RealEstateSeller = {
      id: user.id,
      agencyId: user.agencyId,
      name: user.name,
      email: user.email,
      propertyId: user.propertyId,
    }
    const access: TemplateSellerAccess = {
      id: user.id,
      agencyId: user.agencyId,
      propertyId: user.propertyId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
    }

    return mergeSellerAccess(data, user.propertyId, seller, access)
  }

  if (user.role === 'agent') {
    const agent: RealEstateAgent = {
      id: user.id,
      agencyId: user.agencyId,
      name: user.name,
      email: user.email,
      phone: user.phone || 'Telephone a completer',
      role: 'Conseiller',
      activeListings: 0,
      active: true,
      assignedPropertyIds: [],
    }

    return {
      ...data,
      agents: [agent, ...data.agents.filter((item) => item.email !== user.email && item.id !== user.id)],
    }
  }

  return data
}

function readSelectedVisitId(value?: string, fallback = '') {
  if (!value) return fallback
  if (!value.includes(' - ')) return fallback
  return value.split(' - ')[0] || fallback
}

export function OpusDomusTemplate({
  view = 'public',
  propertyId,
  agencyConfig = defaultTemplateImmobilierConfig,
  activationHref,
  onNavigate,
}: {
  view?: TemplateView
  propertyId?: string
  agencyConfig?: RealEstateAgencyConfig
  activationHref?: string
  onNavigate?: Navigate
}) {
  configureTemplateRuntime(agencyConfig, activationHref)
  const access = getAgencyAccess()
  const privateViews: TemplateView[] = ['vendeur', 'agent', 'patron']
  const session = readTemplateSession()

  if (!viewModuleEnabled(view)) {
    return <TemplateModuleUnavailable onNavigate={onNavigate} />
  }

  if (access.mode === 'active' && privateViews.includes(view) && session?.agencyId !== templateImmobilierConfig.agencyId) {
    return <TemplateLogin onNavigate={onNavigate} />
  }

  if (view === 'estimation') return <EstimationTunnel onNavigate={onNavigate} />
  if (view === 'connexion') return <TemplateLogin onNavigate={onNavigate} />
  if (view === 'vendeur') return <SellerSpace onNavigate={onNavigate} />
  if (view === 'agent') return <AgentSpace onNavigate={onNavigate} />
  if (view === 'patron') return <OwnerSpace onNavigate={onNavigate} />
  if (view === 'biens') return <PublicPropertyCollectionPage onNavigate={onNavigate} />
  if (view === 'bien') return <PropertyDetail propertyId={propertyId} onNavigate={onNavigate} />
  if (view === 'invitation') return <RealEstateInvitationPage onNavigate={onNavigate} />
  if (view === 'mentions-legales') return <LegalNoticePage onNavigate={onNavigate} />
  if (view === 'confidentialite') return <PrivacyPolicyPage onNavigate={onNavigate} />
  if (view === 'cookies') return <CookiePolicyPage onNavigate={onNavigate} />

  return <TemplateLanding onNavigate={onNavigate} />
}

function TemplateModuleUnavailable({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig, ['od-login-page'])

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <section className="od-login-card">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <div>
          <span className="od-kicker">Agence</span>
          <h1>{realEstateModuleUnavailableMessage}</h1>
        </div>
        <button className="od-tunnel-next" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          Retour
        </button>
      </section>
    </main>
  )
}

function formatPropertyPrice(property: RealEstateProperty) {
  const price = normalizePropertyPriceLabel(property.price)
  if (price) return price
  return property.priceValue > 0 ? formatTemplatePrice(property.priceValue) : 'Prix sur demande'
}

function normalizePropertyPriceLabel(value?: string) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/prix\s+sur\s+demande/i.test(trimmed)) return 'Prix sur demande'
  const withoutDecimals = trimmed.replace(/([,.]\d{2})(\s?€|\s?eur)?$/i, '$2')
  const normalized = withoutDecimals
    .replace(/\bEUR\b/i, '€')
    .replace(/\s*€\s*$/, ' €')
    .replace(/\s+/g, ' ')
    .trim()
  if (/^\d+$/.test(normalized)) return formatTemplatePrice(Number(normalized))
  return /€/.test(normalized) ? normalized : `${normalized} €`
}

function TemplateLanding({ onNavigate }: { onNavigate?: Navigate }) {
  const canShowProperties = moduleEnabled('publicProperties')
  const canShowPropertyDetail = moduleEnabled('propertyDetail')
  const canEstimate = moduleEnabled('estimation')
  const canShowSellerSpace = moduleEnabled('sellerSpace')
  const hasPrivateSpace = moduleEnabled('sellerSpace') || moduleEnabled('agentSpace') || moduleEnabled('ownerSpace')
  const featured = canShowProperties ? templateImmobilierConfig.properties.slice(0, 3) : []
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const contactIdentity = agencyIdentity.contactIdentity.normalized
  const navigationConfig = resolvePublicNavigation({
    agencyIdentity,
    baseRoute,
    canShowProperties,
    canEstimate,
    hasPrivateSpace,
  })
  const heroConfig = resolvePublicHero({
    agencyIdentity,
    baseRoute,
    canEstimate,
    canShowProperties,
  })
  const sectionsConfig = resolvePublicSections(agencyIdentity)
  const propertyCardConfig = resolvePublicPropertyCardConfig(agencyIdentity)
  const proofConfig = resolvePublicProof({
    agencyIdentity,
    properties: templateImmobilierConfig.properties,
    agents: templateImmobilierConfig.agents,
  })
  const contactCta = resolvePublicCta({
    agencyIdentity,
    baseRoute,
    context: 'contact',
    canEstimate,
    canShowProperties,
    hasPrivateSpace,
  })
  const publicPageConfig = templateImmobilierConfig.publicPageConfig ?? createLegacyPublicPageConfig({
    canShowProperties,
    canShowSellerSpace,
    canEstimate,
    canShowReviews: Boolean(proofConfig),
  })
  const imageRoles = buildPublicPageImageRoles({
    heroImage: agencyIdentity.assets.heroImage,
    sectionImages: agencyIdentity.assets.sectionImages,
    configuredRoles: publicPageConfig.imageRoles,
    source: publicPageConfig.source,
  })
  const sortedSections = sortPublicPageSections(publicPageConfig)
  const heroSection = sortedSections.find((section) => section.enabled && section.type === 'hero')
  const ctaCapabilities = { canEstimate, canShowProperties, canShowSellerSpace, hasPrivateSpace }
  const publicHeroConfig = resolvePublicPageHeroConfig(heroConfig, heroSection, imageRoles, ctaCapabilities)
  const runtimeData: PublicPageRuntimeData = {
    agencyIdentity,
    sectionsConfig,
    propertyCardConfig,
    featured,
    proofConfig,
    contactCta,
    contactIdentity,
    imageRoles,
    buttons: agencyIdentity.renderContract.buttons,
    publicPageConfig,
    canShowProperties,
    canShowPropertyDetail,
    canShowSellerSpace,
    canEstimate,
    hasPrivateSpace,
    onNavigate,
  }

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style} data-composition={agencyIdentity.composition.id}>
      <PublicHero config={publicHeroConfig} navigationConfig={navigationConfig} buttons={agencyIdentity.renderContract.buttons} onNavigate={onNavigate} />

      {sortedSections
        .filter((section) => section.enabled && section.type !== 'hero')
        .map((section) => renderPublicPageSection(section, runtimeData))}

      <AgencyFooter agencyIdentity={agencyIdentity} />
    </main>
  )
}

type PublicPageRuntimeData = {
  agencyIdentity: ReturnType<typeof resolveAgencyIdentity>
  sectionsConfig: ReturnType<typeof resolvePublicSections>
  propertyCardConfig: PublicPropertyCardConfig
  featured: RealEstateProperty[]
  proofConfig: PublicProofConfig | null
  contactCta: PublicCtaConfig
  contactIdentity: ReturnType<typeof resolveAgencyContactIdentity>['normalized']
  imageRoles: ReturnType<typeof buildPublicPageImageRoles>
  buttons: RenderContract['buttons']
  publicPageConfig: PublicPageConfig
  canShowProperties: boolean
  canShowPropertyDetail: boolean
  canShowSellerSpace: boolean
  canEstimate: boolean
  hasPrivateSpace: boolean
  onNavigate?: Navigate
}

function renderPublicPageSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  const sectionConfig = resolveSectionWrapperConfig(section, runtime.sectionsConfig)
  const children = renderPublicPageSectionContent(section, runtime)
  const style = {
    '--od-public-page-desktop-order': section.desktopOrder ?? 0,
    '--od-public-page-mobile-order': section.mobileOrder ?? section.desktopOrder ?? 0,
  } as CSSProperties

  return (
    <PublicSection config={sectionConfig} key={section.id} style={style}>
      {children}
    </PublicSection>
  )
}

function renderPublicPageSectionContent(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData): ReactNode | null {
  if (section.type === 'properties') return renderPropertiesSection(section, runtime)
  if (section.type === 'method' || section.type === 'agencyStory') return renderEditorialSection(section, runtime)
  if (section.type === 'sellerSpace') return renderSellerSpaceSection(section, runtime)
  if (section.type === 'reviews') return renderReviewsSection(section, runtime)
  if (section.type === 'estimate') return renderEstimateSection(section, runtime)
  if (section.type === 'contact') return renderContactSection(section, runtime)
  return null
}

function renderPropertiesSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  if (!runtime.canShowProperties) return null
  const image = getPublicPageImage(section, runtime.imageRoles)
  const primaryCta = getRenderableCta(section.primaryCta, runtime)
  const secondaryCta = getRenderableCta(section.secondaryCta, runtime)
  const variant = section.variant || 'legacy-grid'
  const [featuredProperty, ...secondaryProperties] = runtime.featured

  return (
    <div className={`od-public-page-properties od-public-page-properties--${variant}`}>
      <div className="od-section-heading">
        <div>
          {section.eyebrow && <span className="od-kicker">{section.eyebrow}</span>}
          <h2>{section.title || (runtime.publicPageConfig.source === 'legacy-fallback' ? 'Nos exclusivites' : 'Biens disponibles')}</h2>
          {section.description && <p>{section.description}</p>}
          {section.emphasis && <p className="od-public-page-emphasis-copy">{section.emphasis}</p>}
        </div>
        {renderPublicPageCtas([primaryCta, secondaryCta], runtime)}
      </div>
      {image && <img className="od-section-image" src={image} alt="" loading="lazy" />}
      {variant === 'featured-first' && featuredProperty ? (
        <div className="od-public-page-properties-featured">
          <div className="od-public-page-featured-card">
            {renderPublicPropertyCard(featuredProperty, runtime)}
          </div>
          <div className="od-public-page-property-stack">
            {secondaryProperties.map((property) => renderPublicPropertyCard(property, runtime))}
          </div>
        </div>
      ) : (
        <div className={`od-property-grid ${variant === 'dense-grid' ? 'od-public-page-properties-dense' : ''}`} data-public-page-variant={variant}>
          {runtime.featured.map((property) => renderPublicPropertyCard(property, runtime))}
        </div>
      )}
    </div>
  )
}

function renderEditorialSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  const image = getPublicPageImage(section, runtime.imageRoles)
  const primaryCta = getRenderableCta(section.primaryCta, runtime)
  const secondaryCta = getRenderableCta(section.secondaryCta, runtime)
  const variant = section.variant || (section.type === 'method' ? 'steps' : 'image-text')
  const shouldShowSteps = section.type === 'method' && (variant === 'steps' || runtime.publicPageConfig.source === 'legacy-fallback')

  return (
    <div className={`od-public-page-editorial od-public-page-editorial--${variant}`}>
      {image && <img className="od-section-image od-public-page-editorial-media" src={image} alt="" loading="lazy" />}
      <div className="od-public-page-section-copy">
        {section.eyebrow && <span className="od-kicker">{section.eyebrow}</span>}
        {section.title && <h2>{section.title}</h2>}
        {section.description && <p>{section.description}</p>}
        {section.emphasis && <p className="od-public-page-emphasis-copy">{section.emphasis}</p>}
        {renderPublicPageCtas([primaryCta, secondaryCta], runtime)}
      </div>
      {shouldShowSteps && (
        <div className="od-method-list">
          {[
            ['01', 'Valoriser le bien', 'Chaque annonce est pensee comme une presentation, pas comme une simple fiche.'],
            ['02', 'Qualifier les demandes', 'Les contacts sont mieux structures pour eviter les visites inutiles.'],
            ['03', 'Accompagner', 'Le vendeur garde une vision claire des visites, retours, offres et documents.'],
          ].map(([number, title, text]) => (
            <article className="od-method-step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function renderSellerSpaceSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  if (!runtime.canShowSellerSpace) return null
  const image = getPublicPageImage(section, runtime.imageRoles)
  const primaryCta = getRenderableCta(section.primaryCta, runtime)
  const secondaryCta = getRenderableCta(section.secondaryCta, runtime)
  const variant = section.variant || 'legacy-dashboard'
  const showDashboard = variant !== 'promise'

  return (
    <div className={`od-seller-section od-public-page-seller--${variant}`} data-public-page-variant={variant}>
      <div>
        {section.eyebrow && <span className="od-kicker">{section.eyebrow}</span>}
        {section.title && <h2>{section.title}</h2>}
        {section.description && <p>{section.description}</p>}
        {section.emphasis && <p className="od-public-page-emphasis-copy">{section.emphasis}</p>}
        {renderPublicPageCtas([primaryCta, secondaryCta], runtime)}
      </div>
      <div className="od-seller-visual-stack">
        {image && <img className="od-section-image od-section-image--seller" src={image} alt="" loading="lazy" />}
        {showDashboard && <SellerPanel />}
      </div>
    </div>
  )
}

function renderReviewsSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  if (!runtime.proofConfig) return null
  const image = getPublicPageImage(section, runtime.imageRoles)
  const variant = section.variant || 'legacy-proof'

  return (
    <div className={`od-public-page-reviews od-public-page-reviews--${variant}`}>
      {(section.eyebrow || section.title || section.description || section.emphasis || image) && (
        <div className="od-public-page-section-copy">
          {section.eyebrow && <span className="od-kicker">{section.eyebrow}</span>}
          {section.title && <h2>{section.title}</h2>}
          {section.description && <p>{section.description}</p>}
          {section.emphasis && <p className="od-public-page-emphasis-copy">{section.emphasis}</p>}
          {image && <img className="od-section-image" src={image} alt="" loading="lazy" />}
        </div>
      )}
      <PublicProof config={runtime.proofConfig} />
    </div>
  )
}

function renderEstimateSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  if (!runtime.canEstimate) return null
  const primaryCta = getRenderableCta(section.primaryCta ?? { label: 'Demander une estimation', action: 'estimate' }, runtime)
  const secondaryCta = getRenderableCta(section.secondaryCta, runtime)
  const variant = section.variant || 'cta-estimate'

  return (
    <div className={`od-public-page-estimate od-public-page-estimate--${variant}`}>
      <div>
        {section.eyebrow && <span className="od-kicker">{section.eyebrow}</span>}
        <h2>{section.title || (runtime.publicPageConfig.source === 'legacy-fallback' ? 'Une estimation indicative en 3 minutes.' : 'Demandez une estimation')}</h2>
        {section.description && <p>{section.description}</p>}
        {section.emphasis && <p className="od-public-page-emphasis-copy">{section.emphasis}</p>}
      </div>
      {renderPublicPageCtas([primaryCta, secondaryCta], runtime)}
    </div>
  )
}

function renderContactSection(section: PublicPageSectionConfig, runtime: PublicPageRuntimeData) {
  const image = getPublicPageImage(section, runtime.imageRoles)
  const primaryCta = getRenderableCta(section.primaryCta, runtime)
  const secondaryCta = getRenderableCta(section.secondaryCta, runtime)
  const cta = primaryCta
    ? { ...runtime.contactCta, label: primaryCta.label, target: toPublicPageTarget(primaryCta), visible: true }
    : runtime.contactCta
  const variant = section.variant || 'legacy-contact'

  return (
    <div className={`od-public-page-contact od-public-page-contact--${variant}`}>
      {image && variant !== 'compact' && <img className="od-section-image" src={image} alt="" loading="lazy" />}
      <div className="od-public-page-section-copy">
        {section.eyebrow && <span className="od-kicker">{section.eyebrow}</span>}
        {section.title && <h2>{section.title}</h2>}
        {section.description && <p>{section.description}</p>}
        {section.emphasis && <p className="od-public-page-emphasis-copy">{section.emphasis}</p>}
        <AgencyContactList contactIdentity={runtime.contactIdentity} />
        <div className="od-public-page-actions">
          <button
            className={getPublicPageButtonClassName(runtime.buttons, 'primary')}
            type="button"
            onClick={() => openNavigationTarget(cta.target, runtime.onNavigate)}
          >
            {cta.label} <span aria-hidden="true">-&gt;</span>
          </button>
          {renderPublicPageCtas([secondaryCta], runtime)}
        </div>
      </div>
    </div>
  )
}

type PublicPageCapabilityContext = {
  canEstimate: boolean
  canShowProperties: boolean
  canShowSellerSpace: boolean
  hasPrivateSpace: boolean
}

function renderPublicPropertyCard(property: RealEstateProperty, runtime: PublicPageRuntimeData) {
  return (
    <PublicPropertyCard
      key={property.id}
      property={property}
      config={runtime.propertyCardConfig}
      onOpen={runtime.canShowPropertyDetail ? () => openRoute(`${baseRoute}/bien/${property.id}`, runtime.onNavigate) : undefined}
    />
  )
}

function renderPublicPageCtas(
  ctas: Array<PublicPageCta | undefined>,
  runtime: PublicPageRuntimeData,
) {
  const renderable = ctas.filter(Boolean) as PublicPageCta[]
  if (!renderable.length) return null

  return (
    <div className="od-public-page-actions">
      {renderable.map((cta, index) => (
        <button
          className={getPublicPageButtonClassName(runtime.buttons, index === 0 ? 'primary' : 'secondary')}
          key={`${cta.action}-${cta.label}`}
          type="button"
          onClick={() => openNavigationTarget(toPublicPageTarget(cta), runtime.onNavigate)}
        >
          {cta.label} <span aria-hidden="true">-&gt;</span>
        </button>
      ))}
    </div>
  )
}

function getPublicPageButtonClassName(buttons: RenderContract['buttons'], priority: 'primary' | 'secondary') {
  const variant = priority === 'secondary' && buttons.variant === 'solid' ? 'outline' : buttons.variant
  return [
    'od-public-cta',
    `od-public-cta-priority-${priority}`,
    `od-public-cta-variant-${variant}`,
    `od-public-cta-shape-${buttons.shape}`,
    `od-public-cta-hover-${buttons.hover}`,
  ].join(' ')
}

function getRenderableCta<TContext extends PublicPageCapabilityContext>(cta: PublicPageCta | undefined, context: TContext) {
  if (!cta || cta.action === 'none') return undefined
  if (cta.action === 'estimate') return context.canEstimate ? cta : undefined
  if (cta.action === 'properties') return context.canShowProperties ? cta : undefined
  if (cta.action === 'sellerSpace') return context.canShowSellerSpace ? cta : undefined
  if (cta.action === 'privateSpace') return context.hasPrivateSpace ? cta : undefined
  return cta
}

function resolvePublicPageHeroConfig(
  config: PublicHeroConfig,
  section: PublicPageSectionConfig | undefined,
  imageRoles: ReturnType<typeof buildPublicPageImageRoles>,
  capabilities: PublicPageCapabilityContext,
): PublicHeroConfig {
  if (!section) return config
  const title = section.title || config.title
  const image = getPublicPageImage(section, imageRoles)
  const primaryCta = getRenderableCta(section.primaryCta, capabilities)
  const secondaryCta = getRenderableCta(section.secondaryCta, capabilities)
  const variant = section.variant || 'legacy'
  const variantConfig: Partial<PublicHeroConfig> = variant === 'editorial-split'
    ? { layout: 'split-left', height: 'screen', alignment: 'left', headlineScale: 'display' }
    : variant === 'compact'
      ? { height: 'compact', headlineScale: 'lg' }
      : {}

  return {
    ...config,
    ...variantConfig,
    className: [
      config.className,
      `od-public-page-hero-variant-${toClassValue(variant)}`,
      section.surface ? `od-public-page-surface-${toClassValue(section.surface)}` : '',
    ].filter(Boolean).join(' '),
    eyebrow: section.eyebrow || config.eyebrow,
    title,
    titleLines: createPublicPageTitleLines(title, config.titleLines),
    subtitle: section.description || config.subtitle,
    image: {
      ...config.image,
      src: image || config.image.src,
    },
    primaryCta: primaryCta
      ? { ...config.primaryCta, label: primaryCta.label, target: toPublicPageTarget(primaryCta), visible: true }
      : config.primaryCta,
    secondaryAction: secondaryCta
      ? { ...config.secondaryAction, label: secondaryCta.label, target: toPublicPageTarget(secondaryCta), visible: true }
      : {
        ...config.secondaryAction,
        visible: variant !== 'compact' && config.secondaryAction.visible && (capabilities.canEstimate || capabilities.canShowProperties),
      },
    searchAction: variant === 'compact' ? { ...config.searchAction, visible: false } : config.searchAction,
  }
}

function resolveSectionWrapperConfig(
  section: PublicPageSectionConfig,
  sectionsConfig: ReturnType<typeof resolvePublicSections>,
): PublicSectionConfig {
  const key = sectionTypeToLegacySectionKey(section.type)
  const base = sectionsConfig.sections[key]
  return {
    ...base,
    id: section.id,
    className: [
      base.className,
      `od-public-page-section--${section.type}`,
      section.variant ? `od-public-page-variant-${toClassValue(section.variant)}` : '',
      section.surface ? `od-public-page-surface-${toClassValue(section.surface)}` : '',
    ].filter(Boolean).join(' '),
  }
}

function sectionTypeToLegacySectionKey(sectionType: PublicPageSectionConfig['type']): PublicSectionConfig['key'] {
  if (sectionType === 'properties') return 'properties'
  if (sectionType === 'sellerSpace') return 'sellerSpace'
  if (sectionType === 'reviews') return 'reviews'
  if (sectionType === 'contact' || sectionType === 'estimate') return 'contact'
  return 'method'
}

function toPublicPageTarget(cta: PublicPageCta): PublicNavigationTarget {
  if (cta.action === 'estimate') return { route: `${baseRoute}/estimation` }
  if (cta.action === 'properties') return { route: `${baseRoute}/biens` }
  if (cta.action === 'sellerSpace') return { route: `${baseRoute}/vendeur` }
  if (cta.action === 'privateSpace') return { route: `${baseRoute}/connexion` }
  if (cta.action === 'contact') return { route: baseRoute, anchor: 'contact' }
  return { route: baseRoute }
}

function createPublicPageTitleLines(title: string, fallback: string[]) {
  if (!title.trim()) return fallback
  return title.split(/\s*\/\s*|\n/).map((line) => line.trim()).filter(Boolean)
}

function toClassValue(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function PublicProof({ config }: { config: PublicProofConfig }) {
  return (
    <div className={config.className}>
      {config.items.map((item) => (
        <article className="od-public-proof-item" key={`${item.value}-${item.label}`}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.context && <small>{item.context}</small>}
        </article>
      ))}
    </div>
  )
}

function AgencyContactList({ contactIdentity }: { contactIdentity: ReturnType<typeof resolveAgencyContactIdentity>['normalized'] }) {
  const telHref = createTelHref(contactIdentity.publicContact.publicPhone)
  const mailHref = createMailtoHref(contactIdentity.publicContact.publicEmail)
  const address = [
    contactIdentity.postalAddress.addressLine1,
    contactIdentity.postalAddress.addressLine2,
    [contactIdentity.postalAddress.postalCode, contactIdentity.postalAddress.city].filter(Boolean).join(' '),
    contactIdentity.postalAddress.country,
  ].filter(Boolean).join(', ')

  return (
    <div className="od-agency-contact-list">
      {telHref && <a href={telHref}>{contactIdentity.publicContact.publicPhone}</a>}
      {mailHref && <a href={mailHref}>{contactIdentity.publicContact.publicEmail}</a>}
      {address && <span>{address}</span>}
      {contactIdentity.professionalIdentity.feesUrl && <a href={contactIdentity.professionalIdentity.feesUrl}>Honoraires</a>}
    </div>
  )
}

function LegalPageShell({
  title,
  eyebrow,
  children,
  onNavigate,
}: {
  title: string
  eyebrow: string
  children: ReactNode
  onNavigate?: Navigate
}) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const navigationConfig = resolvePublicNavigation({
    agencyIdentity,
    baseRoute,
    canShowProperties: moduleEnabled('publicProperties'),
    canEstimate: moduleEnabled('estimation'),
    hasPrivateSpace: moduleEnabled('sellerSpace') || moduleEnabled('agentSpace') || moduleEnabled('ownerSpace'),
  })

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <PublicNavigation config={navigationConfig} onNavigate={onNavigate} />
      <section className="od-legal-page">
        <span className="od-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </section>
      <AgencyFooter agencyIdentity={agencyIdentity} />
    </main>
  )
}

function LegalNoticePage({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const identity = agencyIdentity.contactIdentity.normalized
  const professional = identity.professionalIdentity
  const address = formatPostalAddress(identity)

  return (
    <LegalPageShell title="Mentions legales" eyebrow="Documents agence" onNavigate={onNavigate}>
      <p className="od-legal-disclaimer">Modele genere depuis les donnees agence. A verifier par l'agence avant mise en production.</p>
      <dl className="od-legal-grid">
        <LegalInfo label="Editeur" value={professional.legalName || professional.tradeName || agencyIdentity.brand.name} />
        <LegalInfo label="Nom commercial" value={professional.tradeName} />
        <LegalInfo label="Forme juridique" value={professional.legalForm} />
        <LegalInfo label="Adresse" value={address} />
        <LegalInfo label="Email" value={identity.publicContact.publicEmail} />
        <LegalInfo label="Telephone" value={identity.publicContact.publicPhone} />
        <LegalInfo label="SIREN / immatriculation" value={professional.registrationNumber} />
        <LegalInfo label="RCS" value={professional.rcsCity} />
        <LegalInfo label="TVA intracommunautaire" value={professional.vatNumber} />
        <LegalInfo label="Capital social" value={professional.shareCapital} />
        <LegalInfo label="Responsable publication" value={identity.publication.publicationDirector} />
        <LegalInfo label="Carte professionnelle" value={professional.professionalCardNumber} />
        <LegalInfo label="Carte delivree par" value={professional.cardIssuedBy} />
        <LegalInfo label="Garantie financiere" value={professional.financialGuarantee} />
        <LegalInfo label="Assurance professionnelle" value={professional.professionalInsurance} />
        <LegalInfo label="Mediateur" value={professional.mediatorName} href={professional.mediatorUrl} />
        <LegalInfo label="Honoraires" value={professional.feesUrl || identity.legalDocumentLinks.feesUrl} href={professional.feesUrl || identity.legalDocumentLinks.feesUrl} />
        <LegalInfo label="Hebergeur" value="Hebergement a confirmer par Signature Digital avant mise en production." />
      </dl>
    </LegalPageShell>
  )
}

function PrivacyPolicyPage({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const compliance = agencyIdentity.compliance
  const identity = agencyIdentity.contactIdentity.normalized

  return (
    <LegalPageShell title="Politique de confidentialite" eyebrow="Donnees personnelles" onNavigate={onNavigate}>
      <p className="od-legal-disclaimer">
        Ce document de travail decrit les traitements prevus par la plateforme. Les bases legales doivent etre confirmees par l'agence avant approbation.
      </p>
      <dl className="od-legal-grid">
        <LegalInfo label="Responsable du traitement" value={identity.professionalIdentity.legalName || identity.professionalIdentity.tradeName || agencyIdentity.brand.name} />
        <LegalInfo label="Contact droits" value={compliance.privacyPolicy.dataRightsContactEmail || identity.publicContact.publicEmail} />
        <LegalInfo label="Version" value={compliance.privacyPolicy.version} />
        <LegalInfo label="Statut" value={compliance.privacyPolicy.status} />
      </dl>
      <div className="od-legal-treatment-list">
        {complianceTreatments.map((treatment) => (
          <article className="od-legal-treatment" key={treatment.id}>
            <h2>{treatment.label}</h2>
            <LegalList title="Donnees collectees" items={treatment.data} />
            <p><strong>Finalite :</strong> {treatment.purpose}</p>
            <p><strong>Base legale :</strong> {treatment.legalBasis}</p>
            <LegalList title="Destinataires" items={treatment.recipients} />
            <p><strong>Duree configurable :</strong> {compliance.privacyPolicy.retention[treatment.retentionKey]} mois</p>
          </article>
        ))}
      </div>
      <p>
        Les personnes concernees peuvent demander l'acces, la rectification, l'effacement, l'opposition ou la limitation
        du traitement via le contact indique ci-dessus.
      </p>
    </LegalPageShell>
  )
}

function CookiePolicyPage({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const validation = validateAgencyComplianceConfig(agencyIdentity.compliance, agencyIdentity.contactIdentity.normalized)
  const visitorId = getOrCreateVisitorId(agencyIdentity.agencyId)
  const latestAudience = getLatestConsentRecord(agencyIdentity.agencyId, visitorId, 'audience')

  return (
    <LegalPageShell title="Cookies et consentements" eyebrow="Cookies" onNavigate={onNavigate}>
      <p className="od-legal-disclaimer">
        L'audit actuel n'a detecte aucun traceur marketing ou analytics tiers actif dans la template. Les stockages
        locaux necessaires servent au fonctionnement de la session, des demandes, invitations et preferences.
      </p>
      <dl className="od-legal-grid">
        <LegalInfo label="Cookies necessaires" value="Toujours actifs pour faire fonctionner la plateforme." />
        <LegalInfo label="Mesure audience" value={agencyIdentity.compliance.cookiePolicy.categories.audience ? 'Configuree' : 'Non configuree'} />
        <LegalInfo label="Marketing" value={agencyIdentity.compliance.cookiePolicy.categories.marketing ? 'Configure' : 'Non configure'} />
        <LegalInfo label="Contenus tiers" value={agencyIdentity.compliance.cookiePolicy.categories.thirdPartyContent ? 'Configure' : 'Non configure'} />
        <LegalInfo label="Personnalisation" value={agencyIdentity.compliance.cookiePolicy.categories.personalization ? 'Configuree' : 'Non configuree'} />
        <LegalInfo label="Dernier choix audience" value={latestAudience?.decision} />
      </dl>
      {validation.hasNonNecessaryCookies ? (
        <CookieConsentControls agencyIdentity={agencyIdentity} />
      ) : (
        <p>Aucun consentement cookie facultatif n'est requis tant que seuls les stockages necessaires sont utilises.</p>
      )}
    </LegalPageShell>
  )
}

function CookieConsentPanel({ agencyIdentity }: { agencyIdentity: ReturnType<typeof resolveAgencyIdentity> }) {
  const validation = validateAgencyComplianceConfig(agencyIdentity.compliance, agencyIdentity.contactIdentity.normalized)
  const [visible, setVisible] = useState(() => {
    if (!validation.hasNonNecessaryCookies) return false
    const visitorId = getOrCreateVisitorId(agencyIdentity.agencyId)
    return !getLatestConsentRecord(agencyIdentity.agencyId, visitorId, 'audience')
  })

  if (!visible) return null

  function decide(decision: ConsentDecision) {
    saveCookieDecision(agencyIdentity, decision)
    setVisible(false)
  }

  return (
    <div className="od-cookie-banner" role="dialog" aria-label="Gestion des cookies">
      <p>
        Cette agence peut utiliser des cookies facultatifs selon les categories configurees. Vous pouvez accepter ou
        refuser sans bloquer l'acces au site.
      </p>
      <div>
        <button type="button" onClick={() => decide('refused')}>Tout refuser</button>
        <button type="button" onClick={() => decide('accepted')}>Tout accepter</button>
        <a href={`${baseRoute}/cookies#gestion`}>Personnaliser</a>
      </div>
    </div>
  )
}

function CookieConsentControls({ agencyIdentity }: { agencyIdentity: ReturnType<typeof resolveAgencyIdentity> }) {
  const [version, setVersion] = useState(0)
  const visitorId = getOrCreateVisitorId(agencyIdentity.agencyId)
  const purposes = ([
    ['audience', 'Mesure audience', agencyIdentity.compliance.cookiePolicy.categories.audience],
    ['marketing', 'Marketing', agencyIdentity.compliance.cookiePolicy.categories.marketing],
    ['third-party-content', 'Contenus tiers', agencyIdentity.compliance.cookiePolicy.categories.thirdPartyContent],
    ['personalization', 'Personnalisation', agencyIdentity.compliance.cookiePolicy.categories.personalization],
  ] satisfies Array<[ConsentPurpose, string, boolean]>).filter(([, , enabled]) => enabled)

  function decide(purpose: ConsentPurpose, decision: ConsentDecision) {
    saveConsentRecord(createConsentRecord({
      agencyId: agencyIdentity.agencyId,
      visitorId,
      purpose,
      decision,
      policyVersion: agencyIdentity.compliance.consentSettings.policyVersion,
    }))
    setVersion((current) => current + 1)
  }

  return (
    <div className="od-cookie-controls" id="gestion" data-version={version}>
      {purposes.map(([purpose, label]) => {
        const current = getLatestConsentRecord(agencyIdentity.agencyId, visitorId, purpose)
        return (
          <article key={purpose}>
            <h2>{label}</h2>
            <p>Choix actuel : {current?.decision ?? 'aucun choix'}</p>
            <div>
              <button type="button" onClick={() => decide(purpose, 'accepted')}>Accepter</button>
              <button type="button" onClick={() => decide(purpose, 'refused')}>Refuser</button>
              <button type="button" onClick={() => decide(purpose, 'withdrawn')}>Retirer</button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function saveCookieDecision(agencyIdentity: ReturnType<typeof resolveAgencyIdentity>, decision: ConsentDecision) {
  const visitorId = getOrCreateVisitorId(agencyIdentity.agencyId)
  const purposes: ConsentPurpose[] = ['audience', 'marketing', 'third-party-content', 'personalization']
  purposes.forEach((purpose) => {
    saveConsentRecord(createConsentRecord({
      agencyId: agencyIdentity.agencyId,
      visitorId,
      purpose,
      decision,
      policyVersion: agencyIdentity.compliance.consentSettings.policyVersion,
    }))
  })
}

function FormPrivacyNotice({ agencyIdentity }: { agencyIdentity: ReturnType<typeof resolveAgencyIdentity> }) {
  const contact = agencyIdentity.compliance.privacyPolicy.dataRightsContactEmail || agencyIdentity.brand.email

  return (
    <p className="od-form-privacy">
      {agencyIdentity.compliance.formPrivacyNotices.shortNotice}
      {' '}Responsable : {agencyIdentity.brand.name}. Champs obligatoires signales dans le formulaire.
      {' '}Droits : {contact || 'contact a renseigner'}.
      {' '}<a href={`${baseRoute}/confidentialite`}>Confidentialite</a>.
    </p>
  )
}

function MarketingConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="od-marketing-consent">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>J'accepte de recevoir des communications commerciales distinctes de cette demande.</span>
    </label>
  )
}

function LegalInfo({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null
  return (
    <div className="od-legal-info">
      <dt>{label}</dt>
      <dd>{href ? <a href={href}>{value}</a> : value}</dd>
    </div>
  )
}

function LegalList({ title, items }: { title: string; items: string | readonly string[] }) {
  const list = Array.isArray(items) ? items : [items]
  return (
    <div>
      <strong>{title}</strong>
      <ul>
        {list.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

function formatPostalAddress(agencyIdentity: ReturnType<typeof resolveAgencyIdentity>['contactIdentity']['normalized']) {
  return [
    agencyIdentity.postalAddress.addressLine1,
    agencyIdentity.postalAddress.addressLine2,
    [agencyIdentity.postalAddress.postalCode, agencyIdentity.postalAddress.city].filter(Boolean).join(' '),
    agencyIdentity.postalAddress.country,
  ].filter(Boolean).join(', ')
}

function AgencyFooter({ agencyIdentity }: { agencyIdentity: ReturnType<typeof resolveAgencyIdentity> }) {
  const identity = agencyIdentity.contactIdentity.normalized
  const contactLinks = [
    identity.publicContact.publicPhone ? { label: identity.publicContact.publicPhone, href: createTelHref(identity.publicContact.publicPhone) } : null,
    identity.publicContact.publicEmail ? { label: identity.publicContact.publicEmail, href: createMailtoHref(identity.publicContact.publicEmail) } : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>
  const address = [
    identity.postalAddress.addressLine1,
    identity.postalAddress.addressLine2,
    [identity.postalAddress.postalCode, identity.postalAddress.city].filter(Boolean).join(' '),
    identity.postalAddress.country,
  ].filter(Boolean).join(', ')
  const socialLinks = Object.entries(identity.socialLinks).filter((entry): entry is [string, string] => Boolean(entry[1]))
  const legalLinks = [
    identity.professionalIdentity.feesUrl ? ['Honoraires', identity.professionalIdentity.feesUrl] as const : null,
    ['Mentions legales', `${baseRoute}/mentions-legales`] as const,
    ['Confidentialite', `${baseRoute}/confidentialite`] as const,
    ['Cookies', `${baseRoute}/cookies`] as const,
    ['Gerer mes cookies', `${baseRoute}/cookies#gestion`] as const,
  ].filter(Boolean) as Array<readonly [string, string]>

  const footer = agencyIdentity.renderContract.footer

  return (
    <footer className={`od-footer od-agency-footer od-footer-layout-${footer.layout} od-footer-surface-${footer.surface}`}>
      <div>
        <strong>{agencyIdentity.brand.name}</strong>
        {address && <span>{address}</span>}
        {identity.publication.publicationDirector && <span>Responsable publication : {identity.publication.publicationDirector}</span>}
        <span>{new Date().getFullYear()} - Tous droits reserves.</span>
      </div>
      {contactLinks.length > 0 && (
        <div>
          {contactLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
        </div>
      )}
      <div>
        {formatOpeningHours(identity.openingHours).map((day) => (
          <span key={day.day}>{day.label} : {day.value}</span>
        ))}
      </div>
      {socialLinks.length > 0 && (
        <div>
          {socialLinks.map(([key, href]) => <a href={href} key={key}>{key}</a>)}
        </div>
      )}
      {legalLinks.length > 0 && (
        <div>
          {legalLinks.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
        </div>
      )}
      <CookieConsentPanel agencyIdentity={agencyIdentity} />
    </footer>
  )
}

function PublicPropertyCollectionPage({ onNavigate }: { onNavigate?: Navigate }) {
  const canShowProperties = moduleEnabled('publicProperties')
  const canShowPropertyDetail = moduleEnabled('propertyDetail')
  const canEstimate = moduleEnabled('estimation')
  const hasPrivateSpace = moduleEnabled('sellerSpace') || moduleEnabled('agentSpace') || moduleEnabled('ownerSpace')
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const navigationConfig = resolvePublicNavigation({
    agencyIdentity,
    baseRoute,
    canShowProperties,
    canEstimate,
    hasPrivateSpace,
  })
  const propertyCardConfig = resolvePublicPropertyCardConfig(agencyIdentity)
  const agencyId = templateImmobilierConfig.agencyId
  const properties = templateImmobilierConfig.properties
  const agencyProperties = useMemo(
    () => properties.filter((property) => property.agencyId === agencyId),
    [agencyId, properties],
  )
  const [collectionState, setCollectionState] = useState<PublicPropertyCollectionState>(readCollectionStateFromLocation)
  const collection = useMemo(
    () => resolvePublicPropertyCollection(agencyProperties, collectionState),
    [agencyProperties, collectionState],
  )

  useEffect(() => {
    const handlePopState = () => setCollectionState(readCollectionStateFromLocation())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function updateCollectionState(updates: Partial<PublicPropertyCollectionState>) {
    const nextState = sanitizePublicPropertyCollectionState({
      ...collectionState,
      ...updates,
      page: updates.page ?? 1,
    })
    setCollectionState(nextState)
    window.history.pushState({}, '', `${baseRoute}/biens${createPublicPropertyCollectionSearch(nextState)}`)
  }

  function resetCollection() {
    const nextState = createDefaultPublicPropertyCollectionState()
    setCollectionState(nextState)
    window.history.pushState({}, '', `${baseRoute}/biens`)
  }

  const hasActiveFilters = createPublicPropertyCollectionSearch({ ...collectionState, page: 1 }) !== ''
  const pageStart = collection.filteredCount ? (collection.page - 1) * collection.pageSize + 1 : 0
  const pageEnd = Math.min(collection.page * collection.pageSize, collection.filteredCount)

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style} data-composition={agencyIdentity.composition.id}>
      <PublicNavigation config={navigationConfig} onNavigate={onNavigate} />

      <section className="od-property-collection-hero">
        <div>
          <span className="od-kicker">Biens disponibles</span>
          <h1>La collection complete de {agencyIdentity.brand.name}</h1>
          <p>
            {collection.allCount > 0
              ? `${collection.allCount} bien${collection.allCount > 1 ? 's' : ''} public${collection.allCount > 1 ? 's' : ''} a explorer.`
              : 'Aucun bien public disponible pour le moment.'}
          </p>
        </div>
        <button className="od-outline-button" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          Retour a l'accueil
        </button>
      </section>

      {canShowProperties ? (
        <section className="od-property-collection" aria-labelledby="property-collection-title">
          <div className="od-property-collection-heading">
            <div>
              <span className="od-kicker">Recherche</span>
              <h2 id="property-collection-title">Tous les biens</h2>
            </div>
            <p>
              {collection.filteredCount === collection.allCount
                ? `${collection.filteredCount} resultat${collection.filteredCount > 1 ? 's' : ''}`
                : `${collection.filteredCount} resultat${collection.filteredCount > 1 ? 's' : ''} sur ${collection.allCount}`}
            </p>
          </div>

          <div className="od-property-collection-controls" aria-label="Filtres des biens">
            <label>
              Rechercher
              <input
                type="search"
                value={collectionState.query}
                placeholder="Titre, ville, type..."
                onChange={(event) => updateCollectionState({ query: event.target.value })}
              />
            </label>
            <label>
              Type
              <select value={collectionState.type} onChange={(event) => updateCollectionState({ type: event.target.value })}>
                <option value="">Tous les types</option>
                {collection.typeOptions.map((type) => <option value={type} key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              Ville
              <select value={collectionState.location} onChange={(event) => updateCollectionState({ location: event.target.value })}>
                <option value="">Toutes les villes</option>
                {collection.locationOptions.map((location) => <option value={location} key={location}>{location}</option>)}
              </select>
            </label>
            <label>
              Prix min.
              <input
                inputMode="numeric"
                value={collectionState.priceMin}
                placeholder="Ex. 300000"
                onChange={(event) => updateCollectionState({ priceMin: event.target.value })}
              />
            </label>
            <label>
              Prix max.
              <input
                inputMode="numeric"
                value={collectionState.priceMax}
                placeholder="Ex. 900000"
                onChange={(event) => updateCollectionState({ priceMax: event.target.value })}
              />
            </label>
            <label>
              Surface min.
              <input
                inputMode="numeric"
                value={collectionState.surfaceMin}
                placeholder="m2"
                onChange={(event) => updateCollectionState({ surfaceMin: event.target.value })}
              />
            </label>
            <label>
              Pieces min.
              <input
                inputMode="numeric"
                value={collectionState.roomsMin}
                placeholder="Ex. 3"
                onChange={(event) => updateCollectionState({ roomsMin: event.target.value })}
              />
            </label>
            <label>
              Trier
              <select value={collectionState.sort} onChange={(event) => updateCollectionState({ sort: event.target.value as PublicPropertyCollectionSort })}>
                <option value="default">Ordre par defaut</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix decroissant</option>
                <option value="surface-asc">Surface croissante</option>
                <option value="surface-desc">Surface decroissante</option>
              </select>
            </label>
            {hasActiveFilters && (
              <button className="od-property-collection-reset" type="button" onClick={resetCollection}>
                Reinitialiser
              </button>
            )}
          </div>

          {collection.allCount === 0 ? (
            <div className="od-property-collection-empty">
              <span className="od-kicker">Collection vide</span>
              <h3>Aucun bien public n'est encore disponible.</h3>
              <p>Les annonces publiees par l'agence apparaitront ici automatiquement.</p>
            </div>
          ) : collection.filteredCount === 0 ? (
            <div className="od-property-collection-empty">
              <span className="od-kicker">Aucun resultat</span>
              <h3>Aucun bien ne correspond a ces criteres.</h3>
              <p>Modifiez votre recherche ou reinitialisez les filtres pour retrouver toute la collection.</p>
              <button className="od-outline-button" type="button" onClick={resetCollection}>Reinitialiser</button>
            </div>
          ) : (
            <>
              <p className="od-property-collection-range">
                Affichage {pageStart}-{pageEnd} sur {collection.filteredCount}
              </p>
              <div className="od-property-grid od-property-collection-grid">
                {collection.visibleProperties.map((property) => (
                  <PublicPropertyCard
                    key={property.id}
                    property={property}
                    config={propertyCardConfig}
                    onOpen={canShowPropertyDetail ? () => {
                      rememberPropertyCollectionReturnRoute()
                      openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)
                    } : undefined}
                  />
                ))}
              </div>
              {collection.pageCount > 1 && (
                <nav className="od-property-collection-pagination" aria-label="Pagination des biens">
                  <button
                    type="button"
                    disabled={collection.page === 1}
                    onClick={() => updateCollectionState({ page: collection.page - 1 })}
                  >
                    Precedent
                  </button>
                  <span>Page {collection.page} / {collection.pageCount}</span>
                  <button
                    type="button"
                    disabled={collection.page === collection.pageCount}
                    onClick={() => updateCollectionState({ page: collection.page + 1 })}
                  >
                    Suivant
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="od-property-collection-empty">
          <span className="od-kicker">Module inactif</span>
          <h1>{realEstateModuleUnavailableMessage}</h1>
          <button className="od-tunnel-next" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
            Retour
          </button>
        </section>
      )}

      <AgencyFooter agencyIdentity={agencyIdentity} />
    </main>
  )
}

function readCollectionStateFromLocation() {
  if (typeof window === 'undefined') return createDefaultPublicPropertyCollectionState()
  return parsePublicPropertyCollectionState(new URLSearchParams(window.location.search))
}

function rememberPropertyCollectionReturnRoute() {
  if (typeof window === 'undefined') return
  const route = `${window.location.pathname}${window.location.search}`
  window.sessionStorage.setItem(getAgencyStorageKey(propertyCollectionReturnStorageKey), route)
}

function readPropertyCollectionReturnRoute() {
  if (typeof window === 'undefined') return `${baseRoute}/biens`
  const route = window.sessionStorage.getItem(getAgencyStorageKey(propertyCollectionReturnStorageKey))
  return route?.startsWith(`${baseRoute}/biens`) ? route : `${baseRoute}/biens`
}

function PublicHero({
  config,
  navigationConfig,
  buttons,
  onNavigate,
}: {
  config: PublicHeroConfig
  navigationConfig: PublicNavigationConfig
  buttons: RenderContract['buttons']
  onNavigate?: Navigate
}) {
  const navigateTo = (target: PublicNavigationTarget) => openNavigationTarget(target, onNavigate)

  return (
    <section className={config.className}>
      <div className="od-hero-media" aria-hidden="true">
        <img
          className="od-hero-image"
          src={config.image.src}
          alt=""
          width={1280}
          height={1600}
        />
      </div>
      <div className="od-hero-overlay" />
      <PublicNavigation config={navigationConfig} onNavigate={onNavigate} />
      <div className="od-hero-content">
        <span>{config.eyebrow}</span>
        <h1>
          {config.titleLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {index > 0 && <br />}
              {config.italicAccent && index === config.titleLines.length - 1 && config.titleLines.length > 1 ? (
                <em>{line}</em>
              ) : (
                line
              )}
            </span>
          ))}
        </h1>
        <p>{config.subtitle}</p>
        <div className="od-hero-actions">
          <button className={getPublicPageButtonClassName(buttons, 'primary')} type="button" onClick={() => navigateTo(config.primaryCta.target)}>
            {config.primaryCta.label}
          </button>
          {config.secondaryAction.visible && (
            <button className={getPublicPageButtonClassName(buttons, 'secondary')} type="button" onClick={() => navigateTo(config.secondaryAction.target)}>
              {config.secondaryAction.label}
            </button>
          )}
        </div>
        {config.searchAction.visible && (
          <button className="od-hero-search" type="button" onClick={() => navigateTo(config.searchAction.target)}>
            <span>
              <small>Recherche</small>
              <strong>{config.searchAction.label}</strong>
            </span>
            <span aria-hidden="true">Afficher</span>
          </button>
        )}
      </div>
    </section>
  )
}

function PublicSection({ config, children, style }: { config: PublicSectionConfig; children: ReactNode | null; style?: CSSProperties }) {
  if (!children) return null

  return (
    <section className={config.className} id={config.id} style={style}>
      <div className={config.innerClassName}>
        {children}
      </div>
    </section>
  )
}

function PublicNavigation({ config, onNavigate }: { config: PublicNavigationConfig; onNavigate?: Navigate }) {
  const [open, setOpen] = useState(false)
  const mobilePanelId = 'od-public-navigation-panel'
  const navigateTo = (target: PublicNavigationTarget) => {
    setOpen(false)
    openNavigationTarget(target, onNavigate)
  }

  return (
    <nav className={config.className} aria-label="Navigation publique">
      <button className="od-brand od-public-nav-brand" type="button" onClick={() => navigateTo({ route: baseRoute })}>
        {config.logo.src ? (
          <img className="od-brand-logo" src={config.logo.src} alt={config.logo.alt} />
        ) : (
          config.logo.alt
        )}
      </button>
      <div className="od-public-nav-links">
        {config.links.map((link) => (
          <button key={link.id} type="button" onClick={() => navigateTo(link.target)}>
            {link.label}
          </button>
        ))}
      </div>
      <div className="od-public-nav-actions">
        <DemoActivationCta onNavigate={onNavigate} />
        {config.primaryCta.visible && (
          <button className="od-public-nav-cta" type="button" onClick={() => navigateTo(config.primaryCta.target)}>
            {config.primaryCta.label}
          </button>
        )}
        {config.privateAccess.visible && (
          <button className="od-public-nav-private" type="button" onClick={() => navigateTo(config.privateAccess.target)}>
            {config.privateAccess.label}
          </button>
        )}
        <button
          className="od-public-nav-menu"
          type="button"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls={mobilePanelId}
          onClick={() => setOpen((current) => !current)}
        >
          Menu
        </button>
      </div>
      <div className={open ? 'od-public-nav-panel is-open' : 'od-public-nav-panel'} id={mobilePanelId}>
        <DemoActivationCta onNavigate={onNavigate} />
        {[...config.links, config.primaryCta, config.privateAccess]
          .filter((item) => !('visible' in item) || item.visible)
          .map((item) => (
            <button key={item.id} type="button" onClick={() => navigateTo(item.target)}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
      </div>
    </nav>
  )
}

function DemoActivationCta({ onNavigate }: { onNavigate?: Navigate }) {
  const access = getAgencyAccess()
  const copy = getExperienceCopy({ role: 'public' })
  if (!access.showActivationCta) return null

  return (
    <button className="od-demo-activation-cta" type="button" onClick={() => openActivation(onNavigate)}>
      {copy.activationCta}
    </button>
  )
}

function TemplateMobileNav({ mode = 'public', navigationConfig, onNavigate }: { mode?: NavMode; navigationConfig?: PublicNavigationConfig; onNavigate?: Navigate }) {
  const currentPath = window.location.pathname
  const currentHash = window.location.hash
  const [collapsed, setCollapsed] = useState(false)
  const hasPrivateSpace = moduleEnabled('sellerSpace') || moduleEnabled('agentSpace') || moduleEnabled('ownerSpace')
  const effectivePublicNavigationConfig = mode === 'public'
    ? navigationConfig ?? resolvePublicNavigation({
      agencyIdentity: resolveAgencyIdentity(templateImmobilierConfig),
      baseRoute,
      canShowProperties: moduleEnabled('publicProperties'),
      canEstimate: moduleEnabled('estimation'),
      hasPrivateSpace,
    })
    : undefined
  const privateWorkspace = mode === 'public'
    ? null
    : resolvePrivateWorkspace({
      role: mode as PrivateWorkspaceRole,
      agencyIdentity: resolveAgencyIdentity(templateImmobilierConfig),
      baseRoute,
      isModuleEnabled: moduleEnabled,
    })

  useEffect(() => {
    let lastY = window.scrollY

    function onScroll() {
      const nextY = window.scrollY
      const goingDown = nextY > lastY + 8
      const goingUp = nextY < lastY - 8
      if (nextY < 80 || goingUp) setCollapsed(false)
      if (goingDown && nextY > 160) setCollapsed(true)
      lastY = nextY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const publicItems = effectivePublicNavigationConfig
    ? [
      ...effectivePublicNavigationConfig.links.map((link) => [link.icon, link.label, navigationTargetToRoute(link.target)] as [string, string, string]),
      ...(effectivePublicNavigationConfig.primaryCta.visible ? [[effectivePublicNavigationConfig.primaryCta.icon, effectivePublicNavigationConfig.primaryCta.label, navigationTargetToRoute(effectivePublicNavigationConfig.primaryCta.target)] as [string, string, string]] : []),
      ...(effectivePublicNavigationConfig.privateAccess.visible ? [[effectivePublicNavigationConfig.privateAccess.icon, effectivePublicNavigationConfig.privateAccess.label, navigationTargetToRoute(effectivePublicNavigationConfig.privateAccess.target)] as [string, string, string]] : []),
    ]
    : []
  const items = mode === 'public'
    ? publicItems
    : privateWorkspace?.navigation.items.map((item) => [item.icon, item.label, item.route] as [string, string, string]) ?? []

  return (
    <nav className={collapsed ? 'od-mobile-nav is-collapsed' : 'od-mobile-nav'} aria-label={mode === 'public' ? 'Navigation publique mobile' : 'Navigation template immobilier'}>
      <div>
        {items.map(([icon, label, route]) => {
          const [path, hash] = route.split('#')
          const active = hash
            ? currentPath === path && currentHash === `#${hash}`
            : (currentPath === path && !currentHash) ||
              (label === 'Espaces' && currentPath.startsWith(`${baseRoute}/`) && currentPath !== `${baseRoute}/estimation`)

          return (
            <button className={active ? 'active' : ''} key={`${label}-${route}`} type="button" onClick={() => openRoute(route, onNavigate)}>
              <NavIcon name={icon} />
              <small>{label}</small>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
    building: <path d="M5 21V5h14v16M9 9h2M13 9h2M9 13h2M13 13h2M9 17h6" />,
    agents: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 21a6 6 0 0 1 12 0m1-6a5 5 0 0 1 5 5" />,
    archive: <path d="M4 7h16M6 7v14h12V7M8 3h8l2 4H6l2-4Zm2 8h4" />,
    calculator: <path d="M6 3h12v18H6zM9 7h6M9 11h1M12 11h1M15 11h1M9 15h1M12 15h1M15 15h1" />,
    calendar: <path d="M7 3v3m10-3v3M4 8h16M5 5h14v16H5zM8 12h3M13 12h3M8 16h3" />,
    document: <path d="M7 3h7l4 4v14H7zM14 3v5h5M10 12h6M10 16h6" />,
    edit: <path d="m4 16.5-.5 4 4-.5L19 8.5 15.5 5 4 16.5Zm9.5-9.5 3.5 3.5" />,
    offer: <path d="M4 7h16v11H4zM7 7V5h10v2M8 13h8M8 16h5" />,
    message: <path d="M4 5h16v11H8l-4 4z" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0" />,
  }

  return (
    <svg aria-hidden="true" className="od-nav-icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function SellerPanel() {
  const [data] = useTemplateData()
  const property = data.properties[0] ?? templateImmobilierConfig.properties[0]
  const visits = visitsByProperty(data, property.id)
  const offers = offersByProperty(data, property.id)
  const documents = documentsByProperty(data, property.id)
  const reports = reportsByProperty(data, property.id)
  const nextVisit = visits[0]
  const lastReport = reports[0]
  const copy = getExperienceCopy({ role: 'seller', propertyCount: property ? 1 : 0, nextAction: nextVisit ? 'Preparer la prochaine visite programmee.' : undefined })
  const visitsEmpty = copy.emptyState('visits')
  const reportsEmpty = copy.emptyState('reports')

  return (
    <article className="od-seller-panel">
      <div className="od-panel-top">
        <span>{property.address}</span>
        <span>Mandat actif</span>
      </div>
      <div className="od-progress-row">
        <div>
          <small>Progression</small>
          <strong>{property.progress} %</strong>
        </div>
        <div>
          <small>Prochaine visite</small>
          <span>{nextVisit ? `${nextVisit.date} - ${nextVisit.time}` : visitsEmpty.text}</span>
        </div>
      </div>
      <div className="od-progress"><span /></div>
      <div className="od-panel-stats">
        <Stat value={`${visits.length}`} label="Visites" />
        <Stat value={`${offers.length}`} label="Offres" />
        <Stat value={`${documents.length}`} label="Documents" />
      </div>
      <div className="od-panel-actions">
        <p><b>Dernier compte rendu</b> {lastReport?.content ?? reportsEmpty.text}</p>
        <p><b>Prochaine action</b> {copy.nextAction}</p>
      </div>
    </article>
  )
}

function EstimationTunnel({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig, ['od-estimation-page'])
  const formConfig = resolvePublicForm(agencyIdentity, 'estimation')
  const [step, setStep] = useState(0)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [form, setForm] = useState({
    type: '',
    city: '',
    address: '',
    surface: '',
    rooms: '',
    bedrooms: '',
    outside: '',
    condition: '',
    project: '',
    firstName: '',
    phone: '',
    email: '',
  })
  const isConfirmation = step === estimationSteps.length - 1
  const progress = ((step + 1) / estimationSteps.length) * 100

  function next() {
    setStep((current) => Math.min(current + 1, estimationSteps.length - 1))
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (step === 5) {
      if (redirectDemoWrite(onNavigate)) return
      appendLocalTemplateRequest({
        agencyId: templateImmobilierConfig.agencyId,
        type: 'Demande estimation',
        propertyId: 'appartement-haussmannien',
        name: form.firstName,
        phone: form.phone,
        email: form.email,
        message: `${form.type} - ${form.city} - ${form.project}`,
        status: 'Nouvelle',
      })
      enqueuePublicRequestEmails('estimation', {
        agencyId: templateImmobilierConfig.agencyId,
        name: form.firstName,
        phone: form.phone,
        email: form.email,
        message: `${form.type} - ${form.city} - ${form.project}`,
      })
    }
    next()
  }

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <section className="od-tunnel">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <div className="od-tunnel-progress" aria-label={`Etape ${step + 1} sur ${estimationSteps.length}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="od-kicker">Estimation - {estimationSteps[step]}</p>

        {!isConfirmation && (
          <form className={`od-tunnel-card ${formConfig.className}`} onSubmit={submit}>
            {step === 0 && (
              <TunnelChoice
                title="Quel type de bien souhaitez-vous estimer ?"
                options={['Appartement', 'Maison', 'Immeuble', 'Terrain']}
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
              />
            )}
            {step === 1 && (
              <TunnelFields title="Ou se situe le bien ?">
                <TextField label="Ville" value={form.city} onChange={(city) => setForm({ ...form, city })} />
                <TextField label="Adresse ou quartier" value={form.address} onChange={(address) => setForm({ ...form, address })} />
              </TunnelFields>
            )}
            {step === 2 && (
              <TunnelFields title="Quelles sont ses caracteristiques ?">
                <TextField label="Surface" value={form.surface} onChange={(surface) => setForm({ ...form, surface })} />
                <TextField label="Pieces" value={form.rooms} onChange={(rooms) => setForm({ ...form, rooms })} />
                <TextField label="Chambres" value={form.bedrooms} onChange={(bedrooms) => setForm({ ...form, bedrooms })} />
                <TunnelChoice
                  compact
                  title="Exterieur"
                  options={['Oui', 'Non']}
                  value={form.outside}
                  onChange={(outside) => setForm({ ...form, outside })}
                />
              </TunnelFields>
            )}
            {step === 3 && (
              <TunnelChoice
                title="Dans quel etat est le bien ?"
                options={['A renover', 'Bon etat', 'Renove', 'Haut de gamme']}
                value={form.condition}
                onChange={(condition) => setForm({ ...form, condition })}
              />
            )}
            {step === 4 && (
              <TunnelChoice
                title="Quel est votre projet ?"
                options={['Vendre maintenant', 'Sous 3 mois', 'Sous 6 mois', 'Simple estimation']}
                value={form.project}
                onChange={(project) => setForm({ ...form, project })}
              />
            )}
            {step === 5 && (
              <TunnelFields title="Qui doit-on rappeler ?">
                <TextField label="Prenom" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} />
                <TextField label="Telephone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
              </TunnelFields>
            )}
            {step === 5 && (
              <>
                <FormPrivacyNotice agencyIdentity={agencyIdentity} />
                {agencyIdentity.compliance.formPrivacyNotices.requireMarketingConsent && (
                  <MarketingConsentCheckbox checked={marketingConsent} onChange={setMarketingConsent} />
                )}
              </>
            )}
            <div className="od-tunnel-actions">
              <button className="od-tunnel-back" type="button" onClick={back} disabled={step === 0}>Retour</button>
              <button className="od-tunnel-next" type="submit">{step === 5 ? 'Transmettre' : 'Continuer'}</button>
            </div>
          </form>
        )}

        {isConfirmation && (
          <div className={`od-tunnel-card od-confirmation ${formConfig.className}`} role="status">
            <span className="od-confirmation-mark">OK</span>
            <h1>Votre demande a bien ete transmise.</h1>
            <p>Un conseiller vous rappellera pour affiner l'estimation.</p>
            <button className="od-tunnel-next" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
              Retour a l'accueil
            </button>
          </div>
        )}
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function TunnelChoice({
  title,
  options,
  value,
  onChange,
  compact = false,
}: {
  title: string
  options: string[]
  value: string
  onChange: (value: string) => void
  compact?: boolean
}) {
  return (
    <div>
      <h1 className={compact ? 'od-tunnel-small-title' : ''}>{title}</h1>
      <div className={compact ? 'od-choice-grid od-choice-grid-compact' : 'od-choice-grid'}>
        {options.map((option) => (
          <button className={value === option ? 'selected' : ''} key={option} type="button" onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function TunnelFields({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      <div className="od-field-grid">{children}</div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  ariaInvalid,
  ariaDescribedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  ariaInvalid?: boolean
  ariaDescribedBy?: string
}) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TemplateLogin({ onNavigate }: { onNavigate?: Navigate }) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [data] = useTemplateData()
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig, ['od-login-page'])
  const formConfig = resolvePublicForm(agencyIdentity, 'login')
  const errorId = 'login-error'
  const copy = getExperienceCopy({ role: 'public' })

  function submit(event: FormEvent) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const account = Object.values(demoAccounts).find((item) => item.email === normalizedEmail)

    if (account && password === account.password) {
      if (!routeForRoleEnabled(account.route as TemplateLoginRoute)) {
        setError(realEstateModuleUnavailableMessage)
        return
      }

      const agencySeller = data.sellers.find((item) => item.email.toLowerCase() === normalizedEmail)
      const agencyAgent = data.agents.find((item) => item.email.toLowerCase() === normalizedEmail)
      writeTemplateSession({
        agencyId: templateImmobilierConfig.agencyId,
        agencySlug: templateImmobilierConfig.agencySlug,
        email: account.email,
        role: account.role,
        name: agencySeller?.name ?? agencyAgent?.name ?? account.name,
        propertyId: account.role === 'vendeur' ? agencySeller?.propertyId : undefined,
      })
      openRoute(`${baseRoute}/${account.route}`, onNavigate)
      return
    }

    const invitedUser = findRealEstateUserByCredentials(normalizedEmail, password)
    if (invitedUser && invitedUser.agencyId === templateImmobilierConfig.agencyId) {
      const invitedRoute = invitedUser.role === 'vendeur' ? 'vendeur' : invitedUser.role === 'patron' ? 'patron' : 'agent'
      if (!routeForRoleEnabled(invitedRoute)) {
        setError(realEstateModuleUnavailableMessage)
        return
      }

      writeTemplateSession({
        agencyId: invitedUser.agencyId,
        agencySlug: invitedUser.agencySlug,
        email: invitedUser.email,
        role: invitedUser.role,
        name: invitedUser.name,
        propertyId: invitedUser.propertyId,
      })
      openRoute(`${baseRoute}/${invitedRoute}`, onNavigate)
      return
    }

    const sellerAccess = data.sellerAccesses.find((item) =>
      item.email.toLowerCase() === normalizedEmail && item.agencyId === templateImmobilierConfig.agencyId
    )
    if (!sellerAccess || password !== sellerAccess.password) {
      setError('Identifiants incorrects.')
      return
    }

    if (!routeForRoleEnabled('vendeur')) {
      setError(realEstateModuleUnavailableMessage)
      return
    }

    writeTemplateSession({
      agencyId: sellerAccess.agencyId,
      agencySlug: templateImmobilierConfig.agencySlug,
      email: sellerAccess.email,
      role: 'vendeur',
      name: sellerAccess.name,
      propertyId: sellerAccess.propertyId,
    })
    openRoute(`${baseRoute}/vendeur`, onNavigate)
  }

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <section className="od-login-card">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <div>
          <span className="od-kicker">Acces prive</span>
          <h1>{copy.workspaceTitle}</h1>
          <p>{copy.workspaceIntro}</p>
        </div>
        <form className={`od-form ${formConfig.className}`} onSubmit={submit}>
          <TextField label="Email" type="email" value={email} onChange={setEmail} ariaInvalid={Boolean(error)} ariaDescribedBy={error ? errorId : undefined} />
          <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} ariaInvalid={Boolean(error)} ariaDescribedBy={error ? errorId : undefined} />
          {error && <p className="od-error" id={errorId} role="alert">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
        <button className="od-login-back" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>Retour template publique</button>
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function RealEstateInvitationPage({ onNavigate }: { onNavigate?: Navigate }) {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [invitation, setInvitation] = useState<RealEstateInvitation | null>(null)
  const [, setData] = useTemplateData()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(token ? 'Verification de l invitation...' : 'Invitation introuvable.')
  const [pending, setPending] = useState(false)
  const copy = getExperienceCopy({ role: invitation?.role === 'owner' ? 'owner' : invitation?.role === 'seller' ? 'seller' : 'agent' })

  useEffect(() => {
    if (!token) return
    void findRealEstateInvitation(token).then((found) => {
      if (!found) {
        setStatus('Invitation introuvable.')
        return
      }
      if (found.agencyId !== templateImmobilierConfig.agencyId) {
        setInvitation(null)
        setStatus('Invitation introuvable.')
        return
      }
      setInvitation(found)
      if (found.status !== 'pending' || new Date(found.expiresAt).getTime() < Date.now()) {
        setStatus('Invitation expiree.')
        return
      }
      setStatus('Invitation trouvee. Creez votre mot de passe.')
    })
  }, [token])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (redirectDemoWrite(onNavigate)) {
      setStatus(copy.confirmation('demo-write-locked'))
      return
    }
    if (!invitation) {
      setStatus('Invitation introuvable.')
      return
    }
    if (!password) {
      setStatus('Ajoutez un mot de passe.')
      return
    }
    if (password !== confirmPassword) {
      setStatus('Les mots de passe ne correspondent pas.')
      return
    }
    const invitationRoute = invitation.role === 'seller' ? 'vendeur' : invitation.role === 'owner' ? 'patron' : 'agent'
    if (!routeForRoleEnabled(invitationRoute)) {
      setStatus(realEstateModuleUnavailableMessage)
      return
    }

    setPending(true)
    try {
      const user = await acceptRealEstateInvitation(invitation.token, password)
      setData((current) => mergeAcceptedInvitationUser(current, user))
      writeTemplateSession({
        agencyId: user.agencyId,
        agencySlug: user.agencySlug,
        email: user.email,
        role: user.role,
        name: user.name,
        propertyId: user.propertyId,
      })
      setStatus('Acces cree avec succes.')
      openRoute(`${baseRoute}/${user.role === 'vendeur' ? 'vendeur' : user.role === 'patron' ? 'patron' : 'agent'}`, onNavigate)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invitation introuvable.')
    } finally {
      setPending(false)
    }
  }

  const title = invitation?.role === 'seller'
    ? 'Creer votre acces vendeur'
    : invitation?.role === 'owner'
      ? 'Creer votre acces patron'
      : 'Creer votre acces agent'
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig, ['od-login-page'])

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <section className="od-login-card">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <span className="od-kicker">Invitation</span>
        <h1>{title}</h1>
        <p>{status}</p>
        <form className="od-form" onSubmit={submit}>
          <TextField label="Email" type="email" value={invitation?.email ?? ''} onChange={() => undefined} />
          <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <TextField label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={setConfirmPassword} />
          <FormPrivacyNotice agencyIdentity={agencyIdentity} />
          <button className="od-tunnel-next" type="submit" disabled={pending || !invitation || invitation.status !== 'pending'}>
            {pending ? 'Creation...' : 'Creer mon acces'}
          </button>
        </form>
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function PropertyDetail({ propertyId, onNavigate }: { propertyId?: string; onNavigate?: Navigate }) {
  const session = readTemplateSession()
  const [data, setData] = useTemplateData()
  const requestedProperty = findProperty(data, propertyId) ?? data.properties[0] ?? templateImmobilierConfig.properties[0]
  const sellerBoundPropertyId = sellerPropertyId(data, session)
  const property = session?.role === 'vendeur' && sellerBoundPropertyId
    ? findProperty(data, sellerBoundPropertyId) ?? requestedProperty
    : requestedProperty
  const documents = documentsByProperty(data, property.id)
  const visits = visitsByProperty(data, property.id)
  const reports = reportsByProperty(data, property.id)
  const offers = offersByProperty(data, property.id)
  const requests = requestsByProperty(data, property.id)
  const photos = photosByProperty(data, property.id)
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [activity, setActivity] = useState<string[]>([])
  const isPublic = !session
  const canEdit = session?.role === 'agent' || session?.role === 'patron'
  const canUseSellerSpace = moduleEnabled('sellerSpace')
  const canUseVisits = moduleEnabled('visits')
  const canUseDocuments = moduleEnabled('documents')
  const canUseReports = moduleEnabled('reports')
  const canUseOffers = moduleEnabled('offers')
  const mode: NavMode = session?.role === 'vendeur' ? 'seller' : session?.role === 'patron' ? 'owner' : session?.role === 'agent' ? 'agent' : 'public'
  const galleryImages = createPublicPropertyGallery(property, photos)
  const primaryImage = galleryImages[0] ?? property.imageUrl
  const agencyIdentity = resolveAgencyIdentity(
    templateImmobilierConfig,
    isPublic ? ['od-property-detail-page', 'od-detail-theme-shell'] : ['od-space-page', 'od-detail-theme-shell'],
  )
  const canShowProperties = moduleEnabled('publicProperties')
  const canEstimate = moduleEnabled('estimation')
  const hasPrivateSpace = moduleEnabled('sellerSpace') || moduleEnabled('agentSpace') || moduleEnabled('ownerSpace')
  const navigationConfig = resolvePublicNavigation({
    agencyIdentity,
    baseRoute,
    canShowProperties,
    canEstimate,
    hasPrivateSpace,
  })
  const propertyCardConfig = resolvePublicPropertyCardConfig(agencyIdentity)
  const visitFormConfig = resolvePublicForm(agencyIdentity, 'visit-request')
  const visitCta = resolvePublicCta({
    agencyIdentity,
    baseRoute,
    context: 'property-detail',
    canEstimate,
    canShowProperties,
    hasPrivateSpace,
  })
  const publicAgent = findPublicPropertyAgent(data, property)
  const similarProperties = resolveSimilarPublicProperties(data.properties, property)
  const detailHeroClass = canEdit
    ? 'od-property-detail-hero od-mandate-hero'
    : isPublic
      ? 'od-property-detail-hero od-public-property-hero od-public-property-detail-hero'
      : 'od-property-detail-hero'
  const detailCopy = getExperienceCopy({
    role: session?.role === 'patron' ? 'owner' : session?.role === 'agent' ? 'agent' : session?.role === 'vendeur' ? 'seller' : 'public',
    firstName: getFirstName(session?.name),
    propertyCount: data.properties.length,
    requestCount: requests.length,
  })
  const visitsEmpty = detailCopy.emptyState('visits')
  const reportsEmpty = detailCopy.emptyState('reports')
  const offersEmpty = detailCopy.emptyState('offers')
  const documentsEmpty = detailCopy.emptyState('documents')
  const requestsEmpty = detailCopy.emptyState('requests')

  async function completeDetailAction(action: ActionKind, values: ActionPayload) {
    if (redirectDemoWrite(onNavigate)) {
      throw new Error(detailCopy.confirmation('demo-write-locked'))
    }
    await completeRepositoryAction(action, values, data, setData, property.id)
    setActivity((current) => [actionConfirmation(action), ...current].slice(0, 3))
  }

  function openManagementAction(action: ActionKind) {
    if (redirectDemoWrite(onNavigate)) return
    setActiveAction(action)
  }

  function archiveProperty() {
    setArchiveConfirm(false)
    setActivity((current) => ['Bien archive.', ...current].slice(0, 3))
  }

  if (isPublic) {
    return (
      <main className={agencyIdentity.className} style={agencyIdentity.style} data-composition={agencyIdentity.composition.id}>
        <PublicNavigation config={navigationConfig} onNavigate={onNavigate} />

        <section className={detailHeroClass}>
          <PublicPropertyGallery images={galleryImages} title={property.title} />
          <div className="od-public-property-summary">
            <button className="od-text-link" type="button" onClick={() => openRoute(readPropertyCollectionReturnRoute(), onNavigate)}>
              Retour aux biens
            </button>
            <span className="od-kicker">{property.type || 'Bien immobilier'}</span>
            <h1>{property.title || property.type || 'Bien immobilier'}</h1>
            <p>{property.city || 'Localisation sur demande'}</p>
            <strong>{formatPropertyPrice(property)}</strong>
            <PropertyFeatureList property={property} />
            <button className={visitCta.className} type="button" onClick={() => document.getElementById('demande-visite')?.scrollIntoView({ behavior: 'smooth' })}>
              {visitCta.label}
            </button>
          </div>
        </section>

        <section className="od-public-property-detail-grid" aria-label="Details du bien">
          {property.description && (
            <article className="od-public-property-panel od-public-property-description">
              <span className="od-kicker">Description</span>
              <h2>Se projeter dans le bien</h2>
              <p>{property.description}</p>
            </article>
          )}

          {property.highlights.length > 0 && (
            <article className="od-public-property-panel">
              <span className="od-kicker">Prestations</span>
              <h2>Points forts</h2>
              <div className="od-public-property-highlights">
                {property.highlights.map((highlight) => (
                  <span key={highlight}>{highlight}</span>
                ))}
              </div>
            </article>
          )}

          <article className="od-public-property-panel">
            <span className="od-kicker">Localisation</span>
            <h2>{property.city || 'Adresse sur demande'}</h2>
            <p>
              {property.city
                ? `Le bien est presente dans le secteur ${property.city}. L'adresse detaillee est communiquee lors de l'echange avec l'agence.`
                : "L'adresse detaillee sera confirmee par l'agence lors de votre demande."}
            </p>
            <div className="od-public-property-location-card" aria-hidden="true">
              <span>{property.city || templateImmobilierConfig.city}</span>
            </div>
          </article>

          <article className="od-public-property-panel od-public-property-agent">
            <span className="od-kicker">{publicAgent ? 'Contact agent' : 'Contact agence'}</span>
            <h2>{publicAgent?.name ?? agencyIdentity.brand.name}</h2>
            <p>{publicAgent?.role ?? `Equipe ${agencyIdentity.brand.name}`}</p>
            <div>
              {(publicAgent?.phone || agencyIdentity.brand.phone) && <a href={createTelHref(publicAgent?.phone ?? agencyIdentity.brand.phone)}>{publicAgent?.phone ?? agencyIdentity.brand.phone}</a>}
              {(publicAgent?.email || agencyIdentity.brand.email) && <a href={createMailtoHref(publicAgent?.email ?? agencyIdentity.brand.email)}>{publicAgent?.email ?? agencyIdentity.brand.email}</a>}
            </div>
          </article>

          <PublicVisitRequestForm property={property} formConfig={visitFormConfig} onSubmit={completeDetailAction} />
        </section>

        {similarProperties.length > 0 && (
          <section className="od-public-property-similar" aria-labelledby="similar-properties-title">
            <div className="od-section-heading">
              <div>
                <span className="od-kicker">Selection</span>
                <h2 id="similar-properties-title">Biens similaires</h2>
              </div>
              <button className="od-text-link" type="button" onClick={() => openRoute(`${baseRoute}/biens`, onNavigate)}>
                Voir toute la collection
              </button>
            </div>
            <div className="od-property-grid">
              {similarProperties.map((similarProperty) => (
                <PublicPropertyCard
                  key={similarProperty.id}
                  property={similarProperty}
                  config={propertyCardConfig}
                  onOpen={() => openRoute(`${baseRoute}/bien/${similarProperty.id}`, onNavigate)}
                />
              ))}
            </div>
          </section>
        )}

        <AgencyFooter agencyIdentity={agencyIdentity} />
      </main>
    )
  }

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <header className={canEdit ? 'od-space-header od-mandate-header' : 'od-space-header'}>
        <button className="od-brand" type="button" onClick={() => openRoute(canEdit ? `${baseRoute}/${session?.role === 'patron' ? 'patron' : 'agent'}` : baseRoute, onNavigate)}>
          {canEdit ? 'Mandats' : templateImmobilierConfig.agencyName}
        </button>
        <span>{canEdit ? 'Mandats' : 'Fiche bien'}</span>
        {canEdit ? (
          <div className="od-mandate-actions">
            <button type="button" onClick={() => openManagementAction('seller-access')}>Partager</button>
            <button type="button" aria-label="Modifier l'annonce" onClick={() => openManagementAction('edit-property')}>
              <NavIcon name="edit" />
              <span>Modifier</span>
            </button>
            {archiveConfirm ? (
              <span className="od-archive-confirm">
                <small>Archiver ce bien ?</small>
                <button type="button" onClick={archiveProperty}>Confirmer</button>
                <button type="button" onClick={() => setArchiveConfirm(false)}>Annuler</button>
              </span>
            ) : (
              <button type="button" aria-label="Archiver le bien" onClick={() => setArchiveConfirm(true)}>
                <NavIcon name="archive" />
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>
            {session ? session.name : 'Connexion'}
          </button>
        )}
      </header>

      <section className={detailHeroClass}>
        <PhotoCarousel images={galleryImages.length ? galleryImages : [primaryImage]} alt={property.title} />
        <div>
          <div className="od-detail-toolbar">
            <span className="od-kicker">{property.address}</span>
          </div>
          <h1>{property.title}</h1>
          <strong>{formatPropertyPrice(property)}</strong>
          <p>{property.description}</p>
          {canEdit && (
            <div className="od-mandate-card-stats">
              <span>Progression {property.progress} %</span>
              {canUseVisits && <span>{visits.length} visites</span>}
              {canUseOffers && <span>{offers.length} offres</span>}
              <span>{requests.length} en attente</span>
            </div>
          )}
          <div className="od-detail-actions">
            {isPublic && <button className="od-solid-action" type="button" onClick={() => openManagementAction('requests')}>Demander une visite</button>}
            {canEdit && canUseSellerSpace && <button className="od-solid-action" type="button" onClick={() => openManagementAction('seller-access')}>Partager l'espace vendeur</button>}
            {canEdit && <button className="od-solid-action od-solid-action-light" type="button" onClick={() => openManagementAction('photo')}>Ajouter photo</button>}
          </div>
        </div>
      </section>

      {!canEdit && (
        <section className="od-space-stats od-space-stats-light">
          <Stat value={property.surface} label="Surface" />
          <Stat value={property.rooms} label="Pieces" />
          {!isPublic && <Stat value={`${property.progress} %`} label="Progression" />}
        </section>
      )}

      <section className="od-management-layout od-detail-layout">
        <Panel title={isPublic ? 'Points forts' : 'Apercu'} id="apercu">
          {!isPublic && <LineItem title="Description complete" text={property.description} />}
          {property.highlights.map((highlight) => <LineItem key={highlight} title={highlight} text="Point fort du bien" />)}
        </Panel>
        {!isPublic && canUseVisits && (
          <Panel title="Visites" id="visites" action={canEdit ? <PanelAction label="+ Ajouter une visite" onClick={() => openManagementAction('visit')} /> : null}>
            {visits.length
              ? visits.map((visit) => <LineItem key={visit.id} title={`${visit.date} - ${visit.time}`} text={`${visit.buyerName} - ${visit.status}`} />)
              : <LineItem title={visitsEmpty.title} text={visitsEmpty.text} />}
          </Panel>
        )}
        {!isPublic && canUseReports && (
          <Panel title="Comptes rendus" id="reports-detail" action={canEdit ? <PanelAction label="+ Ajouter un compte rendu" onClick={() => openManagementAction('report')} /> : null}>
            {reports.length ? reports.map((report) => <LineItem key={report.id} title={`${report.createdAt} - interet ${report.interestLevel}`} text={report.content} />) : <LineItem title={reportsEmpty.title} text={reportsEmpty.text} />}
          </Panel>
        )}
        {!isPublic && canUseOffers && (
          <Panel title="Offres" id="offres">
            {offers.length ? offers.map((offer) => <LineItem key={offer.id} title={`${offer.buyerName} - ${offer.amount}`} text={offer.status} />) : <LineItem title={offersEmpty.title} text={offersEmpty.text} />}
          </Panel>
        )}
        {!isPublic && canUseDocuments && (
          <Panel title="Documents" id="documents" action={canEdit ? <PanelAction label="+ Ajouter un document" onClick={() => openManagementAction('document')} /> : null}>
            {documents.length
              ? documents.map((document) => <DocumentLineItem key={document.id} document={document} />)
              : <LineItem title={documentsEmpty.title} text={documentsEmpty.text} />}
          </Panel>
        )}
        {canEdit && (
          <Panel title="Demandes">
            {requests.length ? requests.map((request) => <LineItem key={request.id} title={request.type} text={`${request.name} - ${request.status}`} />) : <LineItem title={requestsEmpty.title} text={requestsEmpty.text} />}
          </Panel>
        )}
      </section>

      {activity.length > 0 && (
        <section className="od-action-feed">
          {activity.map((item) => <p key={item}>{item}</p>)}
        </section>
      )}

      <ActionModal
        key={activeAction ?? 'closed'}
        action={activeAction}
        onClose={() => setActiveAction(null)}
        onConfirm={completeDetailAction}
        propertyOptions={[property]}
        visitOptions={visits}
        requestsMode={!session ? 'form' : 'list'}
        requests={requests.map((request) => `${request.type} - ${request.name} - ${request.message}`)}
      />
      <TemplateMobileNav mode={mode} onNavigate={onNavigate} />
    </main>
  )
}

function PublicPropertyGallery({ images, title }: { images: string[]; title: string }) {
  const uniqueImages = images.length ? images : [fallbackPropertyImage]

  return (
    <div className="od-public-property-gallery" aria-label={`Galerie ${title}`}>
      <img className="od-public-property-gallery-main" src={uniqueImages[0]} alt={title} />
      {uniqueImages.length > 1 && (
        <div className="od-public-property-gallery-strip">
          {uniqueImages.slice(1, 4).map((image, index) => (
            <img src={image} alt={`${title} photo ${index + 2}`} key={`${image}-${index}`} />
          ))}
        </div>
      )}
      <span>{uniqueImages.length} photo{uniqueImages.length > 1 ? 's' : ''}</span>
    </div>
  )
}

function PropertyFeatureList({ property }: { property: RealEstateProperty }) {
  const features = [
    ['Surface', property.surface],
    ['Pieces', property.rooms],
    ['Chambres', property.bedrooms],
    ['Type', property.type],
  ].filter((feature): feature is [string, string] => Boolean(feature[1]))

  return (
    <dl className="od-public-property-features">
      {features.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function PublicVisitRequestForm({
  property,
  formConfig,
  onSubmit,
}: {
  property: RealEstateProperty
  formConfig: PublicFormConfig
  onSubmit: (action: ActionKind, values: ActionPayload) => void | Promise<void>
}) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const [values, setValues] = useState({ nom: '', email: '', telephone: '', message: '' })
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const errorId = 'visit-request-error'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!values.nom.trim()) {
      setError('Indiquez votre nom pour demander une visite.')
      return
    }

    if (!values.email.trim() && !values.telephone.trim()) {
      setError("Ajoutez un email ou un telephone pour que l'agence puisse vous recontacter.")
      return
    }

    setPending(true)
    try {
      await onSubmit('requests', {
        bien: property.title,
        nom: values.nom,
        email: values.email,
        telephone: values.telephone,
        message: values.message || `Demande de visite pour ${property.title}`,
      })
      setConfirmed(true)
      setValues({ nom: '', email: '', telephone: '', message: '' })
    } catch (error) {
      setError(readActionError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <article className="od-public-property-panel od-public-property-request" id="demande-visite">
      <span className="od-kicker">Visite</span>
      <h2>Demander une visite</h2>
      <p>Un conseiller vous recontacte pour confirmer les disponibilites et repondre a vos questions.</p>
      {confirmed ? (
        <div className="od-public-property-confirmation" role="status">
          Votre demande a bien ete transmise.
        </div>
      ) : (
        <form className={`od-form ${formConfig.className}`} onSubmit={submit}>
          <label>
            <span>Nom</span>
            <input
              value={values.nom}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setValues({ ...values, nom: event.target.value })}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={values.email}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
            />
          </label>
          <label>
            <span>Telephone</span>
            <input value={values.telephone} onChange={(event) => setValues({ ...values, telephone: event.target.value })} />
          </label>
          <label>
            <span>Message</span>
            <input value={values.message} placeholder="Vos disponibilites ou questions" onChange={(event) => setValues({ ...values, message: event.target.value })} />
          </label>
          {error && <p className="od-error" id={errorId} role="alert">{error}</p>}
          <FormPrivacyNotice agencyIdentity={agencyIdentity} />
          {agencyIdentity.compliance.formPrivacyNotices.requireMarketingConsent && (
            <MarketingConsentCheckbox checked={marketingConsent} onChange={setMarketingConsent} />
          )}
          <button className="od-solid-action" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? 'Transmission...' : 'Envoyer la demande'}
          </button>
        </form>
      )}
    </article>
  )
}

function createPublicPropertyGallery(property: RealEstateProperty, photos: RealEstatePhoto[]) {
  return [
    ...new Set([
      ...photos.map((photo) => photo.url),
      ...property.images,
      property.imageUrl,
      fallbackPropertyImage,
    ]),
  ].filter(Boolean)
}

function findPublicPropertyAgent(data: TemplateDataState, property: RealEstateProperty) {
  return data.agents.find((agent) => agent.id === property.assignedAgentId && agent.active)
    ?? data.agents.find((agent) => agent.assignedPropertyIds.includes(property.id) && agent.active)
    ?? data.agents.find((agent) => agent.active)
}

function resolveSimilarPublicProperties(properties: RealEstateProperty[], currentProperty: RealEstateProperty) {
  return properties
    .filter((property) => property.agencyId === currentProperty.agencyId && property.id !== currentProperty.id)
    .map((property, index) => ({
      property,
      index,
      score: scoreSimilarProperty(property, currentProperty),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map((item) => item.property)
}

function scoreSimilarProperty(property: RealEstateProperty, currentProperty: RealEstateProperty) {
  let score = 0
  if (property.type && property.type === currentProperty.type) score += 4
  if (property.city && property.city === currentProperty.city) score += 3

  const price = property.priceValue || readNumericPropertyValue(property.price)
  const currentPrice = currentProperty.priceValue || readNumericPropertyValue(currentProperty.price)
  if (price && currentPrice) {
    const priceDelta = Math.abs(price - currentPrice) / currentPrice
    if (priceDelta <= 0.15) score += 2
    else if (priceDelta <= 0.3) score += 1
  }

  const surface = readNumericPropertyValue(property.surface)
  const currentSurface = readNumericPropertyValue(currentProperty.surface)
  if (surface && currentSurface) {
    const surfaceDelta = Math.abs(surface - currentSurface) / currentSurface
    if (surfaceDelta <= 0.2) score += 1
  }

  return score
}

function readNumericPropertyValue(value?: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0
  if (!value) return 0
  const parsed = Number(value.replace(/[^\d]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function SellerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const session = readTemplateSession()
  const [data] = useTemplateData()
  const sellerAccess = data.sellerAccesses.find((item) => item.email === session?.email)
  const seller = sellerAccess
    ? data.sellers.find((item) => item.id === sellerAccess.id || item.email === sellerAccess.email) ?? {
        id: sellerAccess.id,
        agencyId: sellerAccess.agencyId,
        name: sellerAccess.name,
        email: sellerAccess.email,
        propertyId: sellerAccess.propertyId,
      }
    : data.sellers.find((item) => item.email === session?.email) ?? data.sellers[0] ?? templateImmobilierConfig.sellers[0]
  const property = findProperty(data, seller.propertyId) ?? data.properties[0] ?? templateImmobilierConfig.properties[0]
  const visits = visitsByProperty(data, property.id)
  const reports = reportsByProperty(data, property.id)
  const offers = offersByProperty(data, property.id)
  const documents = documentsByProperty(data, property.id)
  const photos = photosByProperty(data, property.id)
  const nextVisit = visits[0]
  const lastReport = reports[0]
  const sellerImages = [...new Set(photos.length ? photos.map((photo) => photo.url) : property.images)].filter(Boolean)
  const canUseVisits = moduleEnabled('visits')
  const canUseDocuments = moduleEnabled('documents')
  const canUseReports = moduleEnabled('reports')
  const canUseOffers = moduleEnabled('offers')
  const hasSellerStats = canUseVisits || canUseOffers || canUseDocuments
  const copy = getExperienceCopy({
    role: 'seller',
    firstName: getFirstName(seller.name || session?.name),
    propertyCount: property ? 1 : 0,
    nextAction: nextVisit ? 'Preparez la prochaine visite programmee' : undefined,
  })
  const visitsEmpty = copy.emptyState('visits')
  const reportsEmpty = copy.emptyState('reports')
  const offersEmpty = copy.emptyState('offers')
  const documentsEmpty = copy.emptyState('documents')

  return (
    <PrivatePage title="Espace vendeur" mode="seller" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-seller">
        <div>
          <span className="od-kicker">Espace vendeur</span>
          <h1>{copy.greeting}</h1>
          <p>{copy.workspaceIntro}</p>
        </div>
        <button className="od-icon-button" type="button" aria-label="Notifications">
          <NavIcon name="message" />
        </button>
      </section>

      <section className="od-vendor-showcase">
        <article className="od-vendor-card">
          <PhotoCarousel images={sellerImages.length ? sellerImages : [property.imageUrl]} alt={property.title} />
          <span>{property.address}</span>
          <h2>{property.title}</h2>
          <p>Prix affiche : {formatPropertyPrice(property)}</p>
          <p>{property.description}</p>
          <div className="od-vendor-progress">
            <div>
              <small>Progression</small>
              <strong>{property.progress} %</strong>
            </div>
            <div className="od-progress"><span style={{ width: `${property.progress}%` }} /></div>
            <div className="od-progress-steps">
              <span>Mise en vente</span>
              <span>Signature</span>
            </div>
          </div>
          <button className="od-solid-action od-card-action" type="button" onClick={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)}>
            Voir la fiche complete
          </button>
        </article>
      </section>

      {hasSellerStats && <section className="od-space-stats od-space-stats-light">
        {canUseVisits && <Stat value={`${visits.length}`} label="Visites" />}
        {canUseOffers && <Stat value={`${offers.length}`} label="Offres" />}
        {canUseDocuments && <Stat value={`${documents.length}`} label="Documents" />}
      </section>}

      <section className="od-seller-followup-grid">
        {canUseVisits && <SpaceCard
          id="visites"
          title="Prochaine visite"
          text={nextVisit ? `${nextVisit.date} - ${nextVisit.time}. ${nextVisit.buyerName} - ${nextVisit.note} Statut ${nextVisit.status}.` : visitsEmpty.text}
        />}
        {canUseReports && <SpaceCard
          title="Dernier compte rendu"
          text={lastReport?.content ?? reportsEmpty.text}
        />}
        {canUseOffers && <SpaceCard id="offres" title="Offres recues" text={offers.map((offer) => `${offer.buyerName} - ${offer.amount}`).join(' / ') || offersEmpty.text} />}
      </section>

      {canUseDocuments && <section className="od-seller-documents">
        <Panel title="Documents" id="documents-detail">
          {documents.length
            ? documents.map((document) => <DocumentLineItem key={document.id} document={document} />)
            : <EmptyState title={documentsEmpty.title} text={documentsEmpty.text} />}
        </Panel>
      </section>}
    </PrivatePage>
  )
}

function AgentSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const session = readTemplateSession()
  const [data, setData] = useTemplateData()
  const agent = data.agents.find((item) => item.email === session?.email) ?? data.agents[0] ?? templateImmobilierConfig.agents[0]
  const localProperties = data.properties.filter((property) => agent.assignedPropertyIds.includes(property.id))
  const agentVisits = data.visits.filter((visit) => localProperties.some((property) => property.id === visit.propertyId))
  const todayVisits = agentVisits.slice(0, 3)
  const agentOffers = data.offers.filter((offer) => localProperties.some((property) => property.id === offer.propertyId))
  const [activity, setActivity] = useState<string[]>([])
  const canUseVisits = moduleEnabled('visits')
  const canUseOffers = moduleEnabled('offers')
  const copy = getExperienceCopy({
    role: 'agent',
    firstName: getFirstName(agent.name),
    propertyCount: localProperties.length,
    requestCount: data.requests.length,
    nextAction: todayVisits.length ? 'Preparez les visites du jour' : undefined,
  })
  const visitsEmpty = copy.emptyState('visits')
  const mandatesEmpty = copy.emptyState('mandates')

  function openProtectedAction(action: ActionKind) {
    if (redirectDemoWrite(onNavigate)) return
    setActiveAction(action)
  }

  async function completeAction(action: ActionKind, values: ActionValues) {
    if (redirectDemoWrite(onNavigate)) {
      throw new Error(copy.confirmation('demo-write-locked'))
    }
    await completeRepositoryAction(action, values, data, setData, undefined, agent.id)
    setActivity((current) => [actionConfirmation(action), ...current].slice(0, 3))
  }

  return (
    <PrivatePage title="Espace agent" mode="agent" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">Espace agent</span>
        <h1>{copy.greeting}</h1>
        <p>{copy.workspaceIntro}</p>
        <div className="od-private-actions">
          <button className="od-icon-button" type="button" aria-label="Recherche">
            <NavIcon name="building" />
          </button>
          <button className="od-icon-button" type="button" aria-label="Notifications">
            <NavIcon name="message" />
          </button>
          <button className="od-solid-action" type="button" onClick={() => openProtectedAction('new-property')}>+ Nouveau bien</button>
        </div>
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value={`${localProperties.length}`} label="Mandats actifs" />
        {canUseVisits && <Stat value={`${agentVisits.length}`} label="Visites" />}
        {canUseOffers && <Stat value={`${agentOffers.length}`} label="Offres en cours" />}
      </section>

      <section className="od-dashboard-grid">
        {canUseVisits && <Panel title="Aujourd'hui" id="visites">
          {todayVisits.length
            ? todayVisits.map((visit) => (
              <LineItem key={visit.id} title={`${visit.time} ${visit.property}`} text={visit.buyerName || visit.buyer} />
            ))
            : <LineItem title={visitsEmpty.title} text={visitsEmpty.text} />}
        </Panel>}
        <Panel title="Mes mandats" id="biens">
          {localProperties.length ? localProperties.map((property) => (
            <MandateCard
              key={property.id}
              property={property}
              visits={visitsByProperty(data, property.id).length}
              showVisits={canUseVisits}
              onOpen={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)}
            />
          )) : <EmptyState title={mandatesEmpty.title} text={mandatesEmpty.text} actionLabel={mandatesEmpty.actionLabel} onAction={() => openProtectedAction('new-property')} />}
        </Panel>
      </section>
      {activity.length > 0 && (
        <section className="od-action-feed">
          {activity.map((item) => <p key={item}>{item}</p>)}
        </section>
      )}
      <ActionModal
        key={activeAction ?? 'closed'}
        action={activeAction}
        onClose={() => setActiveAction(null)}
        onConfirm={completeAction}
        propertyOptions={localProperties}
        visitOptions={agentVisits}
      />
    </PrivatePage>
  )
}

function OwnerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const [data, setData] = useTemplateData()
  const agents = data.agents
  const localProperties = data.properties
  const [activity, setActivity] = useState<string[]>([])
  const [agentToDisable, setAgentToDisable] = useState<string | null>(null)
  const enabledModuleKeys = useMemo(() => Object.entries(templateImmobilierConfig.enabledModules ?? {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key), [])
  const resolveCurrentAccountProvisioning = useCallback(() => resolveAccountProvisioning({
    agencyId: templateImmobilierConfig.agencyId,
    agencySlug: templateImmobilierConfig.agencySlug,
    ownerName: demoAccounts.owner.name,
    ownerEmail: demoAccounts.owner.email,
    agents: data.agents,
    sellers: data.sellers,
    modules: enabledModuleKeys,
  }), [data.agents, data.sellers, enabledModuleKeys])
  const [accountProvisioning, setAccountProvisioning] = useState(resolveCurrentAccountProvisioning)
  const refreshAccountProvisioning = useCallback(() => {
    setAccountProvisioning(resolveCurrentAccountProvisioning())
  }, [resolveCurrentAccountProvisioning])

  const canUseAgentSpace = moduleEnabled('agentSpace')
  const canUseVisits = moduleEnabled('visits')
  const canUseOffers = moduleEnabled('offers')
  const copy = getExperienceCopy({
    role: 'owner',
    firstName: getFirstName(demoAccounts.owner.name),
    propertyCount: localProperties.length,
    agentCount: agents.length,
    sellerCount: data.sellers.length,
    requestCount: data.requests.length,
  })
  const agentsEmpty = copy.emptyState('agents')
  const propertiesEmpty = copy.emptyState('properties')
  const requestsEmpty = copy.emptyState('requests')

  function openProtectedAction(action: ActionKind) {
    if (redirectDemoWrite(onNavigate)) return
    setActiveAction(action)
  }

  function openDisableAgent(agentId: string) {
    if (redirectDemoWrite(onNavigate)) return
    setAgentToDisable(agentId)
  }

  function openAccessManagement() {
    openRoute(`${baseRoute}/patron#acces`, onNavigate)
  }

  async function disableAgent(agentId: string) {
    if (redirectDemoWrite(onNavigate)) return
    await disableAgentWithRepository(agentId, setData)
    const agent = accountProvisioning.accounts.find((account) => account.role === 'agent' && (account as Agent).sourceAgentId === agentId) as Agent | undefined
    if (agent) suspendAgentAccount(agent.id)
    refreshAccountProvisioning()
    setAgentToDisable(null)
    setActivity((current) => ['Agent desactive.', ...current].slice(0, 3))
  }

  async function completeAction(action: ActionKind, values: ActionValues) {
    if (redirectDemoWrite(onNavigate)) {
      throw new Error(copy.confirmation('demo-write-locked'))
    }
    await completeRepositoryAction(action, values, data, setData, undefined, data.agents[0]?.id)
    setActivity((current) => [actionConfirmation(action), ...current].slice(0, 3))
  }

  return (
    <PrivatePage title="Espace patron" mode="owner" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">Espace patron</span>
        <h1>{copy.workspaceTitle}</h1>
        <p>{copy.workspaceIntro}</p>
        <div className="od-private-actions">
          {canUseAgentSpace && <button className="od-solid-action od-solid-action-light" type="button" onClick={openAccessManagement}>+ {agentsEmpty.actionLabel}</button>}
          <button className="od-solid-action" type="button" onClick={() => openProtectedAction('new-property')}>+ Nouveau bien</button>
        </div>
      </section>

      <section className="od-space-stats od-space-stats-light">
        {canUseAgentSpace && <Stat value={`${agents.length}`} label="Agents" />}
        <Stat value={`${localProperties.length}`} label="Mandats actifs" />
        {canUseVisits && <Stat value={`${data.visits.length}`} label="Visites cette semaine" />}
        {canUseOffers && <Stat value={`${data.offers.length}`} label="Offres en cours" />}
      </section>

      <section className="od-management-layout">
        {canUseAgentSpace && <Panel title="Agents" id="agents">
          {agents.length ? agents.map((agent) => (
            <article className="od-agent-row" key={agent.id}>
              <LineItem
                title={agent.name}
                text={`${agent.role} - ${agent.activeListings} biens suivis`}
                status={agent.active ? 'actif' : 'inactif'}
              />
              {agentToDisable === agent.id ? (
                <div className="od-confirm-row">
                  <button type="button" onClick={() => disableAgent(agent.id)}>Confirmer</button>
                  <button type="button" onClick={() => setAgentToDisable(null)}>Annuler</button>
                </div>
              ) : (
                <button type="button" onClick={() => openDisableAgent(agent.id)}>Desactiver</button>
              )}
            </article>
          )) : <EmptyState title={agentsEmpty.title} text={agentsEmpty.text} actionLabel={agentsEmpty.actionLabel} onAction={openAccessManagement} />}
        </Panel>}
        <Panel title="Biens de l'agence" id="biens">
          {localProperties.length ? localProperties.map((property) => (
            <MandateCard
              key={property.id}
              property={property}
              visits={visitsByProperty(data, property.id).length}
              showVisits={canUseVisits}
              onOpen={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)}
            />
          )) : <EmptyState title={propertiesEmpty.title} text={propertiesEmpty.text} actionLabel={propertiesEmpty.actionLabel} onAction={() => openProtectedAction('new-property')} />}
        </Panel>
        <Panel title="Demandes" id="demandes">
          {data.requests.length ? data.requests.map((request) => (
            <LineItem key={request.id} title={request.type} text={`${request.name || request.contact} - ${request.status}`} />
          )) : <EmptyState title={requestsEmpty.title} text={requestsEmpty.text} />}
        </Panel>
        <Panel title="Gestion des acces" id="acces">
          <AccountAccessManagement
            accounts={accountProvisioning.accounts}
            properties={localProperties}
            onCreateAgent={(form) => {
              if (redirectDemoWrite(onNavigate)) return
              const account = createAgentAccount({
                agencyId: templateImmobilierConfig.agencyId,
                agencySlug: templateImmobilierConfig.agencySlug,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                displayRole: form.role,
                modules: enabledModuleKeys,
              })
              setData((current) => ({
                ...current,
                agents: [
                  {
                    id: account.id,
                    agencyId: templateImmobilierConfig.agencyId,
                    name: `${account.firstName} ${account.lastName}`.trim(),
                    role: account.displayRole,
                    activeListings: 0,
                    phone: '',
                    email: account.email,
                    active: account.active,
                    assignedPropertyIds: [],
                  },
                  ...current.agents.filter((agent) => agent.email !== account.email),
                ],
              }))
              refreshAccountProvisioning()
              setActivity((current) => ['Compte agent cree.', ...current].slice(0, 3))
            }}
            onSuspendAgent={(account) => {
              if (redirectDemoWrite(onNavigate)) return
              suspendAgentAccount(account.id)
              setData((current) => ({
                ...current,
                agents: current.agents.map((agent) => agent.email === account.email ? { ...agent, active: false } : agent),
              }))
              refreshAccountProvisioning()
            }}
            onReactivateAgent={(account) => {
              if (redirectDemoWrite(onNavigate)) return
              reactivateAgentAccount(account.id)
              setData((current) => ({
                ...current,
                agents: current.agents.map((agent) => agent.email === account.email ? { ...agent, active: true } : agent),
              }))
              refreshAccountProvisioning()
            }}
            onDeleteAgent={(account) => {
              if (redirectDemoWrite(onNavigate)) return
              deleteAgentAccount(account.id)
              setData((current) => ({
                ...current,
                agents: current.agents.filter((agent) => agent.email !== account.email),
              }))
              refreshAccountProvisioning()
            }}
            onCreateSeller={(form) => {
              if (redirectDemoWrite(onNavigate)) return
              const propertyId = form.propertyId || localProperties[0]?.id || ''
              const account = createSellerAccount({
                agencyId: templateImmobilierConfig.agencyId,
                agencySlug: templateImmobilierConfig.agencySlug,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                propertyId,
                modules: enabledModuleKeys,
              })
              setData((current) => ({
                ...current,
                sellers: [
                  {
                    id: account.id,
                    agencyId: templateImmobilierConfig.agencyId,
                    name: `${account.firstName} ${account.lastName}`.trim(),
                    email: account.email,
                    propertyId,
                  },
                  ...current.sellers.filter((seller) => seller.email !== account.email),
                ],
              }))
              refreshAccountProvisioning()
              setActivity((current) => ['Compte vendeur cree.', ...current].slice(0, 3))
            }}
            onUpdateSeller={(account, form) => {
              if (redirectDemoWrite(onNavigate)) return
              const updated = updateSellerAccount(account.id, form)
              if (!updated) return
              setData((current) => ({
                ...current,
                sellers: current.sellers.map((seller) => seller.email === account.email
                  ? {
                    ...seller,
                    name: `${updated.firstName} ${updated.lastName}`.trim(),
                    email: updated.email,
                    propertyId: updated.propertyId || seller.propertyId,
                  }
                  : seller),
              }))
              refreshAccountProvisioning()
            }}
          />
        </Panel>
      </section>
      <ActionModal
        key={activeAction ?? 'closed'}
        action={activeAction}
        onClose={() => setActiveAction(null)}
        onConfirm={completeAction}
        propertyOptions={localProperties}
        visitOptions={data.visits}
        requests={data.requests.map((request) => `${request.type} - ${request.contact} - ${request.detail}`)}
      />
      {activity.length > 0 && (
        <section className="od-action-feed">
          {activity.map((item) => <p key={item}>{item}</p>)}
        </section>
      )}
    </PrivatePage>
  )
}

function AccountAccessManagement({
  accounts,
  properties,
  onCreateAgent,
  onSuspendAgent,
  onReactivateAgent,
  onDeleteAgent,
  onCreateSeller,
  onUpdateSeller,
}: {
  accounts: Array<Owner | Agent | Seller>
  properties: RealEstateProperty[]
  onCreateAgent: (form: AccountForm) => void
  onSuspendAgent: (account: Agent) => void
  onReactivateAgent: (account: Agent) => void
  onDeleteAgent: (account: Agent) => void
  onCreateSeller: (form: AccountForm) => void
  onUpdateSeller: (account: Seller, form: AccountForm) => void
}) {
  const [agentForm, setAgentForm] = useState<AccountForm>(createEmptyAccountForm('Conseiller', properties[0]?.id ?? ''))
  const [sellerForm, setSellerForm] = useState<AccountForm>(createEmptyAccountForm('Vendeur', properties[0]?.id ?? ''))
  const [editingSellerId, setEditingSellerId] = useState('')
  const [copiedLink, setCopiedLink] = useState('')
  const owners = accounts.filter((account) => account.role === 'owner')
  const agents = accounts.filter((account): account is Agent => account.role === 'agent')
  const sellers = accounts.filter((account): account is Seller => account.role === 'seller')

  async function copyLink(account: Owner | Agent | Seller) {
    const link = copyInvitationLink(account)
    await navigator.clipboard?.writeText(link).catch(() => undefined)
    setCopiedLink(account.email)
    window.setTimeout(() => setCopiedLink(''), 1800)
  }

  function submitAgent(event: FormEvent) {
    event.preventDefault()
    if (!agentForm.email.trim()) return
    onCreateAgent(agentForm)
    setAgentForm(createEmptyAccountForm('Conseiller', properties[0]?.id ?? ''))
  }

  function submitSeller(event: FormEvent) {
    event.preventDefault()
    if (!sellerForm.email.trim()) return
    const existingSeller = sellers.find((seller) => seller.id === editingSellerId)
    if (existingSeller) {
      onUpdateSeller(existingSeller, sellerForm)
      setEditingSellerId('')
    } else {
      onCreateSeller(sellerForm)
    }
    setSellerForm(createEmptyAccountForm('Vendeur', properties[0]?.id ?? ''))
  }

  function editSeller(seller: Seller) {
    setEditingSellerId(seller.id)
    setSellerForm({
      firstName: seller.firstName,
      lastName: seller.lastName,
      email: seller.email,
      role: 'Vendeur',
      propertyId: seller.propertyId ?? properties[0]?.id ?? '',
    })
  }

  return (
    <div className="od-access-management">
      <div className="od-access-summary">
        <Stat value={`${owners.length}`} label="Patron" />
        <Stat value={`${agents.length}`} label="Agents" />
        <Stat value={`${sellers.length}`} label="Vendeurs" />
      </div>

      <div className="od-access-grid">
        <form className="od-access-form" onSubmit={submitAgent}>
          <h3>Creer un agent</h3>
          <AccountTextField label="Prenom" value={agentForm.firstName} onChange={(value) => setAgentForm((current) => ({ ...current, firstName: value }))} />
          <AccountTextField label="Nom" value={agentForm.lastName} onChange={(value) => setAgentForm((current) => ({ ...current, lastName: value }))} />
          <AccountTextField label="Email" type="email" value={agentForm.email} onChange={(value) => setAgentForm((current) => ({ ...current, email: value }))} />
          <AccountTextField label="Role" value={agentForm.role} onChange={(value) => setAgentForm((current) => ({ ...current, role: value }))} />
          <button className="od-solid-action" type="submit">Creer agent</button>
        </form>

        <form className="od-access-form" onSubmit={submitSeller}>
          <h3>{editingSellerId ? 'Modifier un vendeur' : 'Creer un vendeur'}</h3>
          <AccountTextField label="Prenom" value={sellerForm.firstName} onChange={(value) => setSellerForm((current) => ({ ...current, firstName: value }))} />
          <AccountTextField label="Nom" value={sellerForm.lastName} onChange={(value) => setSellerForm((current) => ({ ...current, lastName: value }))} />
          <AccountTextField label="Email" type="email" value={sellerForm.email} onChange={(value) => setSellerForm((current) => ({ ...current, email: value }))} />
          <label className="od-field">
            <span>Bien rattache</span>
            <select value={sellerForm.propertyId} onChange={(event) => setSellerForm((current) => ({ ...current, propertyId: event.target.value }))}>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
            </select>
          </label>
          <button className="od-solid-action" type="submit">{editingSellerId ? 'Enregistrer vendeur' : 'Creer vendeur'}</button>
        </form>
      </div>

      <div className="od-access-list">
        {accounts.map((account) => (
          <article className="od-access-row" key={`${account.role}-${account.email}`}>
            <LineItem
              title={`${account.firstName} ${account.lastName}`}
              text={`${account.email} - ${account.role} - ${account.accountStatus}`}
              status={account.suspended ? 'suspendu' : account.active ? 'actif' : 'inactif'}
            />
            <div className="od-access-actions">
              <button type="button" onClick={() => void copyLink(account)}>
                {copiedLink === account.email ? 'Lien copie' : 'Copier le lien'}
              </button>
              {account.role === 'agent' && (
                <>
                  {account.suspended
                    ? <button type="button" onClick={() => onReactivateAgent(account)}>Reactiver</button>
                    : <button type="button" onClick={() => onSuspendAgent(account)}>Suspendre</button>}
                  <button type="button" onClick={() => onDeleteAgent(account)}>Supprimer</button>
                </>
              )}
              {account.role === 'seller' && <button type="button" onClick={() => editSeller(account)}>Modifier</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function AccountTextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function createEmptyAccountForm(role: string, propertyId: string): AccountForm {
  return {
    firstName: '',
    lastName: '',
    email: '',
    role,
    propertyId,
  }
}

function PrivatePage({
  title,
  mode,
  children,
  onNavigate,
}: {
  title: string
  mode: PrivateWorkspaceRole
  children: ReactNode
  onNavigate?: Navigate
}) {
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig, ['od-space-page', `od-space-page-${mode}`])
  const workspace = resolvePrivateWorkspace({
    role: mode as PrivateWorkspaceRole,
    agencyIdentity,
    baseRoute,
    isModuleEnabled: moduleEnabled,
  })

  return (
    <main className={`${agencyIdentity.className} ${workspace.className}`} style={agencyIdentity.style} data-private-workspace={workspace.role}>
      <header className="od-space-header">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <span>{title}</span>
        <PrivateWorkspaceNavigation workspace={workspace} onNavigate={onNavigate} />
        <DemoActivationCta onNavigate={onNavigate} />
        <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>Changer d'espace</button>
      </header>
      {children}
      <TemplateMobileNav mode={mode} onNavigate={onNavigate} />
    </main>
  )
}

function PrivateWorkspaceNavigation({ workspace, onNavigate }: { workspace: PrivateWorkspaceConfig; onNavigate?: Navigate }) {
  const currentPath = window.location.pathname
  const currentHash = window.location.hash

  return (
    <nav className="od-private-nav" aria-label="Navigation privee">
      {workspace.navigation.items.map((item) => {
        const [path, hash] = item.route.split('#')
        const active = hash ? currentPath === path && currentHash === `#${hash}` : currentPath === path && !currentHash

        return (
          <button className={active ? 'active' : ''} key={item.id} type="button" onClick={() => openRoute(item.route, onNavigate)}>
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function MandateCard({
  property,
  visits,
  showVisits = true,
  onOpen,
}: {
  property: RealEstateProperty
  visits: number
  showVisits?: boolean
  onOpen: () => void
}) {
  return (
    <button className="od-mandate-card" type="button" onClick={onOpen}>
      <img src={property.imageUrl} alt={property.title} />
      <span>{property.address}</span>
      <strong>{property.title}</strong>
      <small>{showVisits ? `${property.surface} - ${visits} visites en attente` : property.surface}</small>
      <b>{formatPropertyPrice(property)}</b>
      <div className="od-progress"><span style={{ width: `${property.progress}%` }} /></div>
    </button>
  )
}

function PublicPropertyCard({ property, config, onOpen }: { property: RealEstateProperty; config: PublicPropertyCardConfig; onOpen?: () => void }) {
  const pointerStartX = useRef(0)
  const pointerDeltaX = useRef(0)
  const images = [...new Set(property.images.length ? property.images : [property.imageUrl || fallbackPropertyImage])].filter(Boolean)
  const price = formatPropertyPrice(property)
  const location = property.address || property.city
  const featureItems = createPropertyCardFeatures(property, config.maxFeatures)
  const badgeLabel = property.type || property.city || 'Bien'

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    pointerStartX.current = event.clientX
    pointerDeltaX.current = 0
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    pointerDeltaX.current = Math.max(pointerDeltaX.current, Math.abs(event.clientX - pointerStartX.current))
  }

  function handleClick() {
    if (!onOpen) return
    if (pointerDeltaX.current > 10) return
    onOpen()
  }

  return (
    <article
      className={config.className}
      role={onOpen ? 'link' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Voir ${property.title}` : property.title}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen?.()
        }
      }}
    >
      <div className="od-property-media">
        <PhotoCarousel images={images} alt={property.title} />
        {config.showBadges && <span className="od-property-badge">{badgeLabel}</span>}
        {(config.pricePosition === 'top' || config.pricePosition === 'overlay') && (
          <strong className="od-property-price od-property-price--media">{price}</strong>
        )}
      </div>
      <div className="od-property-meta">
        <div>
          <p>{location}</p>
          <h3>{property.title}</h3>
          {config.showExcerpt && property.description && <small className="od-property-description">{property.description}</small>}
          <span className="od-property-features">
            {featureItems.map((item) => <span key={item}>{item}</span>)}
          </span>
        </div>
        {config.pricePosition === 'content' && <strong className="od-property-price">{price}</strong>}
      </div>
      {config.pricePosition === 'footer' && <strong className="od-property-price od-property-price--footer">{price}</strong>}
    </article>
  )
}

function createPropertyCardFeatures(property: RealEstateProperty, maxFeatures: number) {
  return [
    property.surface,
    property.rooms,
    property.bedrooms ? `${property.bedrooms} ch.` : '',
    property.type,
  ].filter(Boolean).slice(0, maxFeatures)
}

function PhotoCarousel({ images, alt }: { images: string[]; alt: string }) {
  const uniqueImages = [...new Set(images)].filter(Boolean)

  return (
    <div className="od-photo-carousel" aria-label="Photos du bien">
      <div>
        {uniqueImages.map((image, index) => (
          <img src={image} alt={`${alt} photo ${index + 1}`} key={image} />
        ))}
      </div>
      {uniqueImages.length > 1 && (
        <div className="od-photo-dots" aria-hidden="true">
          {uniqueImages.map((image, index) => <span key={`${image}-${index}`} />)}
        </div>
      )}
    </div>
  )
}

function Panel({ title, id, action, children }: { title: string; id?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="od-panel" id={id}>
      <header className="od-panel-heading">
        <h2>{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  )
}

function PanelAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="od-panel-action" type="button" onClick={onClick}>
      {label}
    </button>
  )
}

function DocumentLineItem({ document }: { document: RealEstateDocument }) {
  const canOpen = Boolean(document.url && document.url !== '#')

  return (
    <article className="od-line-item od-document-line">
      <strong>{document.name || document.title}</strong>
      <span>{document.type}</span>
      <StatusBadge label={document.status} />
      {canOpen ? (
        <a className="od-line-link" href={document.url} target="_blank" rel="noreferrer" download={document.name || document.title}>
          Ouvrir
        </a>
      ) : (
        <span className="od-line-muted">Document en attente</span>
      )}
    </article>
  )
}

function LineItem({ title, text, href, status }: { title: string; text: string; href?: string; status?: string }) {
  const canOpen = Boolean(href && href !== '#')

  return (
    <article className="od-line-item">
      <strong>{title}</strong>
      <span>{text}</span>
      {status && <StatusBadge label={status} />}
      {canOpen && <a className="od-line-link" href={href} target="_blank" rel="noreferrer">Ouvrir</a>}
    </article>
  )
}

function StatusBadge({ label }: { label: string }) {
  return <span className="od-status-badge">{label}</span>
}

function EmptyState({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <article className="od-empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
      {actionLabel && onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
    </article>
  )
}

function SpaceCard({ title, text, id }: { title: string; text: string; id?: string }) {
  return (
    <article className="od-space-card" id={id}>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

function ActionModal({
  action,
  onClose,
  onConfirm,
  propertyOptions = templateImmobilierConfig.properties,
  visitOptions = templateImmobilierConfig.visits,
  requestsMode = 'list',
  requests = [],
}: {
  action: ActionKind | null
  onClose: () => void
  onConfirm?: (action: ActionKind, values: ActionPayload) => void | Promise<void>
  propertyOptions?: RealEstateProperty[]
  visitOptions?: RealEstateVisit[]
  requestsMode?: 'list' | 'form'
  requests?: string[]
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [documentFileName, setDocumentFileName] = useState('')
  const [submittedValues, setSubmittedValues] = useState<ActionPayload | null>(null)
  const agencyIdentity = resolveAgencyIdentity(templateImmobilierConfig)
  const formConfig = resolvePublicForm(agencyIdentity, 'private-action')
  const errorId = 'private-action-error'

  if (!action) return null
  const currentAction = action

  const titles: Record<ActionKind, string> = {
    'new-property': 'Nouveau bien',
    'edit-property': "Modifier l'annonce",
    photo: 'Ajouter photo',
    document: 'Ajouter document',
    visit: 'Programmer visite',
    report: 'Ajouter compte rendu',
    agent: 'Ajouter agent',
    'seller-access': 'Creer espace vendeur',
    requests: 'Demandes recues',
    'disable-agent': 'Desactiver agent',
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget as HTMLFormElement)
    const values = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)])) as ActionPayload
    const photoFile = formData.get('photo_file')
    const documentFile = formData.get('document_file')
    if (photoFile instanceof File && photoFile.size > 0) values.photoFile = photoFile
    if (documentFile instanceof File && documentFile.size > 0) values.documentFile = documentFile
    setPending(true)
    setError('')

    try {
      await onConfirm?.(currentAction, values)
      setSubmittedValues(values)
      setConfirmed(true)
    } catch (error) {
      setError(readActionError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="od-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="od-action-modal" role="dialog" aria-modal="true" aria-label={titles[action]} onClick={(event) => event.stopPropagation()}>
        <button className="od-modal-close" type="button" onClick={onClose}>Fermer</button>
        <span className="od-kicker">Action</span>
        <h2>{titles[action]}</h2>
        {action === 'requests' && requestsMode === 'list' ? (
          <div className="od-request-list">
            {requests.map((request) => <LineItem key={request} title={request.split(' - ')[0]} text={request.split(' - ').slice(1).join(' - ')} />)}
          </div>
        ) : confirmed ? (
          <ActionConfirmation action={action} values={submittedValues} />
        ) : (
          <form className={`od-form ${formConfig.className}`} onSubmit={submit}>
            <ActionFields
              action={action}
              propertyOptions={propertyOptions}
              visitOptions={visitOptions}
              photoPreview={photoPreview}
              documentFileName={documentFileName}
              onPhotoPreview={setPhotoPreview}
              onDocumentFileName={setDocumentFileName}
            />
            {error && <p className="od-error" id={errorId} role="alert">{error}</p>}
            <button type="submit" disabled={pending} aria-busy={pending} aria-describedby={error ? errorId : undefined}>{pending ? 'Validation...' : 'Valider'}</button>
          </form>
        )}
      </section>
    </div>
  )
}

function readActionError(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "L'action n'a pas pu etre enregistree. Reessayez dans un instant."
}

function ActionConfirmation({ action, values }: { action: ActionKind; values: ActionPayload | null }) {
  if ((action === 'seller-access' || action === 'agent') && values) {
    const email = action === 'seller-access' ? values.email_vendeur : values.email
    const title = action === 'seller-access' ? 'Invitation vendeur envoyee.' : 'Invitation agent envoyee.'
    const fallback = values.email_status === 'fallback'

    return (
      <div className="od-action-confirmation od-seller-access-summary">
        <p>{fallback ? "Invitation creee. L'envoi email n'est pas configure dans cet environnement." : title}</p>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          {values.invitation_link && (
            <div>
              <dt>Lien invitation</dt>
              <dd>{values.invitation_link}</dd>
            </div>
          )}
        </dl>
      </div>
    )
  }

  return <p className="od-action-confirmation">{actionConfirmation(action)}</p>
}

function ActionFields({
  action,
  propertyOptions,
  visitOptions,
  photoPreview,
  documentFileName,
  onPhotoPreview,
  onDocumentFileName,
}: {
  action: ActionKind
  propertyOptions: RealEstateProperty[]
  visitOptions: RealEstateVisit[]
  photoPreview: string
  documentFileName: string
  onPhotoPreview: (value: string) => void
  onDocumentFileName: (value: string) => void
}) {
  if (action === 'agent') {
    return (
      <>
        <ActionInput label="Prenom" name="prenom" />
        <ActionInput label="Nom" name="nom" />
        <ActionInput label="Email" name="email" type="email" />
        <ActionInput label="Telephone" name="telephone" />
        <ActionInput label="Role" name="role" />
      </>
    )
  }

  if (action === 'requests') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Nom" name="nom" />
        <ActionInput label="Telephone" name="telephone" />
        <ActionInput label="Email" name="email" type="email" />
        <ActionInput label="Message" name="message" />
      </>
    )
  }

  if (action === 'photo') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <FileField
          label="Choisir une photo"
          name="photo_file"
          accept="image/*"
          fileName={photoPreview ? 'Photo selectionnee' : ''}
          onChange={(file) => {
            onPhotoPreview(file ? URL.createObjectURL(file) : '')
          }}
        />
        {photoPreview && <img className="od-file-preview" src={photoPreview} alt="Apercu photo" />}
        <ActionInput label="Lien photo" name="lien_photo" />
        <ActionInput label="Libelle photo" name="libelle_photo" />
      </>
    )
  }

  if (action === 'document') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Nom document" name="nom_document" />
        <SelectField label="Type document" name="type_document" options={['mandat', 'DPE', 'diagnostic', 'offre', 'compromis', 'autre']} />
        <FileField
          label="Choisir un document"
          name="document_file"
          accept=".pdf,image/*,.doc,.docx"
          fileName={documentFileName}
          onChange={(file) => onDocumentFileName(file?.name ?? '')}
        />
        <ActionInput label="Lien document" name="lien_document" />
      </>
    )
  }

  if (action === 'seller-access') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Nom vendeur" name="nom_vendeur" />
        <ActionInput label="Email vendeur" name="email_vendeur" type="email" />
        <ActionInput label="Telephone vendeur" name="telephone_vendeur" />
      </>
    )
  }

  if (action === 'visit') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Date" name="date" type="date" />
        <ActionInput label="Heure" name="heure" type="time" />
        <ActionInput label="Visiteur" name="visiteur" />
        <ActionInput label="Note" name="note" />
        <SelectField label="Statut" name="statut" options={['Confirme', 'A confirmer', 'Reporte']} />
      </>
    )
  }

  if (action === 'report') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <SelectField label="Visite liee" name="visite_liee" options={visitOptions.length ? visitOptions.map((visit) => `${visit.id} - ${visit.buyerName}`) : ['Aucune visite selectionnee']} />
        <ActionTextarea label="Compte rendu" name="compte_rendu" />
        <SelectField label="Niveau interet" name="niveau_interet" options={['faible', 'moyen', 'fort']} />
        <ActionInput label="Prochaine action" name="prochaine_action" />
      </>
    )
  }

  if (action === 'edit-property') {
    const selectedProperty = propertyOptions[0]

    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Titre" name="titre" defaultValue={selectedProperty?.title} />
        <ActionInput label="Adresse" name="adresse" defaultValue={selectedProperty?.address} />
        <ActionInput label="Prix" name="prix" defaultValue={selectedProperty ? String(selectedProperty.priceValue) : ''} />
        <ActionInput label="Surface" name="surface" defaultValue={selectedProperty?.surface} />
        <ActionInput label="Pieces" name="pieces" defaultValue={selectedProperty?.rooms} />
        <ActionTextarea label="Description" name="description_courte" defaultValue={selectedProperty?.description} />
        <ActionTextarea label="Points forts" name="points_forts" defaultValue={selectedProperty?.highlights.join(', ')} />
      </>
    )
  }

  return (
    <>
      <ActionInput label="Titre" name="titre" />
      <ActionInput label="Adresse" name="adresse" />
      <ActionInput label="Prix" name="prix" />
      <ActionInput label="Surface" name="surface" />
      <ActionInput label="Pieces" name="pieces" />
      <ActionInput label="Description courte" name="description_courte" />
      <ActionInput label="Lien image" name="image_url_ou_upload_simule" />
    </>
  )
}

function FileField({
  label,
  name,
  accept,
  fileName,
  onChange,
}: {
  label: string
  name: string
  accept: string
  fileName: string
  onChange: (file: File | null) => void
}) {
  return (
    <label className="od-field od-file-field">
      <span>{label}</span>
      <input
        name={name}
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
      />
      <strong>{label}</strong>
      {fileName && <em>{fileName}</em>}
    </label>
  )
}

function ActionInput({
  label,
  name,
  type = 'text',
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
}) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} />
    </label>
  )
}

function ActionTextarea({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string
}) {
  return (
    <label className="od-field od-field-long">
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue} />
    </label>
  )
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <select name={name} defaultValue={options[0]}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function actionConfirmation(action: ActionKind) {
  const confirmations: Record<ActionKind, string> = {
    'new-property': 'Bien ajoute.',
    'edit-property': 'Annonce mise a jour.',
    photo: 'Photo ajoutee.',
    document: 'Document ajoute.',
    visit: 'Visite programmee.',
    report: 'Compte rendu ajoute au suivi vendeur.',
    agent: 'Invitation agent envoyee.',
    'seller-access': 'Invitation vendeur envoyee.',
    requests: 'Demande enregistree.',
    'disable-agent': 'Agent desactive.',
  }

  return confirmations[action]
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="od-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function navigationTargetToRoute(target: PublicNavigationTarget) {
  return target.anchor ? `${target.route}#${target.anchor}` : target.route
}

function openNavigationTarget(target: PublicNavigationTarget, onNavigate?: Navigate) {
  openRoute(navigationTargetToRoute(target), onNavigate)
}

function openRoute(route: string, onNavigate?: Navigate) {
  if (route.includes('#')) {
    const [path, hash] = route.split('#')
    if (onNavigate) onNavigate(route)
    else window.history.pushState({}, '', route)
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView())
    if (!onNavigate && path) window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }

  if (onNavigate) {
    onNavigate(route)
    return
  }

  window.location.assign(route)
}

