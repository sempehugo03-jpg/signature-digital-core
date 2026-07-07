import { useEffect, useRef, useState } from 'react'
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
  getRequiredModuleForRealEstateView,
  isModuleEnabled,
  realEstateModuleUnavailableMessage,
  type RealEstateModuleName,
} from '../../data/realEstateAgencyConfig'
import { createRealEstateVisualSystem } from '../../lib/realEstateVisualSystem'
import { parseVisualBlueprintV1, type VisualBlueprintV1 } from '../../lib/visualBlueprint'
import './opus-domus-template.css'

type TemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'estimation' | 'invitation'
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

let templateImmobilierConfig: RealEstateAgencyConfig = defaultTemplateImmobilierConfig
let baseRoute = `/demo/${defaultTemplateImmobilierConfig.agencySlug}`
const templateSessionStorageKey = 'signatureDigitalTemplateSession'
const templateDataStorageKey = 'signatureDigitalTemplateData'
const templateRequestsStorageKey = 'signatureDigitalTemplateRequests'

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

function configureTemplateRuntime(agencyConfig: RealEstateAgencyConfig) {
  templateImmobilierConfig = agencyConfig
  baseRoute = `/demo/${agencyConfig.agencySlug}`
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
  onNavigate,
}: {
  view?: TemplateView
  propertyId?: string
  agencyConfig?: RealEstateAgencyConfig
  onNavigate?: Navigate
}) {
  configureTemplateRuntime(agencyConfig)

  if (!viewModuleEnabled(view)) {
    return <TemplateModuleUnavailable onNavigate={onNavigate} />
  }

  if (view === 'estimation') return <EstimationTunnel onNavigate={onNavigate} />
  if (view === 'connexion') return <TemplateLogin onNavigate={onNavigate} />
  if (view === 'vendeur') return <SellerSpace onNavigate={onNavigate} />
  if (view === 'agent') return <AgentSpace onNavigate={onNavigate} />
  if (view === 'patron') return <OwnerSpace onNavigate={onNavigate} />
  if (view === 'bien') return <PropertyDetail propertyId={propertyId} onNavigate={onNavigate} />
  if (view === 'invitation') return <RealEstateInvitationPage onNavigate={onNavigate} />

  return <TemplateLanding onNavigate={onNavigate} />
}

function TemplateModuleUnavailable({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = createAgencyIdentity(['od-login-page'])

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

type PublicSectionKey = 'properties' | 'method' | 'sellerSpace' | 'reviews' | 'contact'

function toBlueprintClassValue(value?: string) {
  return value
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'default'
    : 'default'
}

function normalizeColor(value?: string) {
  if (!value) return ''
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : ''
}

function normalizeCssLength(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (/^\d+(\.\d+)?(px|rem|em|vh|svh|vw|%)$/.test(normalized)) return normalized
  if (/^\d+(\.\d+)?$/.test(normalized)) return `${normalized}px`
  if (/^clamp\([0-9a-z.,% -]+\)$/.test(normalized)) return normalized
  if (/^(min|max)\([0-9a-z.,% /-]+\)$/.test(normalized)) return normalized
  return undefined
}

function normalizeSpacingPreset(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  const presets: Record<string, string> = {
    airy: '9rem',
    balanced: '7rem',
    compact: '4.5rem',
    editorial: '8rem',
    dense: '4rem',
  }
  return presets[normalized] ?? normalizeCssLength(value)
}

function normalizeCssText(value?: string) {
  if (!value) return undefined
  const normalized = value.trim()
  return /^[a-zA-Z0-9#(),.%/ -]+$/.test(normalized) ? normalized : undefined
}

function normalizeOpacity(value?: string) {
  if (!value) return undefined
  const parsed = Number(value.trim())
  if (Number.isNaN(parsed)) return undefined
  return String(Math.min(1, Math.max(0, parsed)))
}

function normalizeAspectRatio(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().replace(/\s+/g, '')
  if (/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(normalized)) return normalized.replace('/', ' / ')
  return undefined
}

function createAgencyIdentity(baseClassNames: string[] = []) {
  const visualBlueprint = parseVisualBlueprintV1(templateImmobilierConfig.visualBlueprint)
  const visualPrimary = templateImmobilierConfig.primaryColor || '#19191d'
  const visualAccent = templateImmobilierConfig.accentColor || '#b08d57'
  const visualSystem = createRealEstateVisualSystem(visualBlueprint, {
    primaryColor: visualPrimary,
    accentColor: visualAccent,
  })
  const visualMood = visualSystem.mood || getBlueprintMood(visualBlueprint)
  const blueprintClasses = visualBlueprint ? [
    'od-agency-identity',
    'od-blueprint-page',
    `od-bp-nav-${toBlueprintClassValue(visualBlueprint.navigation.style)}`,
    `od-bp-hero-${toBlueprintClassValue(visualBlueprint.hero.layout)}`,
    `od-bp-hero-align-${toBlueprintClassValue(visualBlueprint.hero.titleAlignment)}`,
    `od-bp-hero-cta-${toBlueprintClassValue(visualBlueprint.hero.buttonPosition)}`,
    `od-bp-section-${toBlueprintClassValue(visualBlueprint.sections.sectionSpacing || visualBlueprint.sections.sectionBackgrounds)}`,
    `od-bp-card-${toBlueprintClassValue(visualBlueprint.propertyCards.cardStyle)}`,
    `od-bp-card-image-${toBlueprintClassValue(visualBlueprint.propertyCards.imageTreatment || visualBlueprint.images.cropStyle)}`,
    `od-bp-button-${toBlueprintClassValue(visualBlueprint.buttons.shape || visualBlueprint.hero.buttonStyle)}`,
    `od-bp-image-${toBlueprintClassValue(visualBlueprint.images.heroImageStyle || visualBlueprint.images.cropStyle)}`,
    `od-bp-type-${toBlueprintClassValue(visualBlueprint.typography.titleStyle || visualBlueprint.brand.typographyMood)}`,
    `od-bp-body-${toBlueprintClassValue(visualBlueprint.typography.bodyStyle)}`,
    `od-bp-bg-${visualMood}`,
  ] : []
  const style = {
    ...visualSystem.tokens,
    '--agency-primary': visualPrimary,
    '--agency-accent': visualAccent,
    '--bp-nav-height': normalizeCssLength(visualBlueprint?.navigation.height),
    '--bp-nav-background': normalizeColor(visualBlueprint?.navigation.background),
    '--bp-nav-link-color': normalizeColor(visualBlueprint?.navigation.linkColor || visualBlueprint?.navigation.linkColors),
    '--bp-nav-gap': normalizeCssLength(visualBlueprint?.navigation.spacing),
    '--bp-nav-opacity': normalizeOpacity(visualBlueprint?.navigation.transparency),
    '--bp-hero-height': normalizeCssLength(visualBlueprint?.hero.height),
    '--bp-hero-overlay': normalizeHeroOverlay(visualBlueprint?.hero.overlay),
    '--bp-hero-mobile-height': normalizeCssLength(visualBlueprint?.responsive.heroMobileHeight),
    '--bp-title-width': normalizeCssLength(visualBlueprint?.hero.titleWidth),
    '--bp-title-size': normalizeCssLength(visualBlueprint?.hero.titleSize),
    '--bp-subtitle-size': normalizeCssLength(visualBlueprint?.hero.subtitleSize),
    '--bp-section-spacing': normalizeSpacingPreset(visualBlueprint?.sections.sectionSpacing),
    '--bp-section-background': normalizeColor(visualBlueprint?.sections.sectionBackgrounds),
    '--bp-content-width': normalizeCssLength(visualBlueprint?.sections.contentWidth),
    '--bp-mobile-spacing': normalizeCssLength(visualBlueprint?.responsive.mobileSpacing),
    '--bp-mobile-title-scale': normalizeCssText(visualBlueprint?.responsive.mobileTypographyScale),
    '--bp-card-radius': normalizeCssLength(visualBlueprint?.propertyCards.cardRadius),
    '--bp-card-gap': normalizeCssLength(visualBlueprint?.propertyCards.spacing),
    '--bp-card-ratio': normalizeAspectRatio(visualBlueprint?.propertyCards.imageRatio),
    '--bp-card-shadow': normalizeShadowStyle(visualBlueprint?.propertyCards.shadowStyle),
    '--bp-button-background': normalizeColor(visualBlueprint?.buttons.background) || visualPrimary,
    '--bp-button-color': normalizeColor(visualBlueprint?.buttons.textColor) || '#fff',
    '--bp-button-border': normalizeBorderStyle(visualBlueprint?.buttons.borderStyle, visualPrimary),
    '--bp-button-size': normalizeCssLength(visualBlueprint?.buttons.size),
    '--bp-button-hover': normalizeColor(visualBlueprint?.buttons.hoverStyle),
  } as CSSProperties

  return {
    visualBlueprint,
    visualPrimary,
    visualAccent,
    visualSystem,
    visualMood,
    className: ['od-page', ...baseClassNames, ...blueprintClasses, visualSystem.className].filter(Boolean).join(' '),
    style,
    primaryButtonStyle: visualSystem.primaryButtonStyle || createBlueprintButtonStyle(visualBlueprint, visualPrimary),
    accentTextStyle: { color: visualAccent } as CSSProperties,
  }
}

function normalizeBorderStyle(value?: string, fallbackColor?: string) {
  if (!value) return undefined
  const normalized = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return `1px solid ${normalized}`
  if (/^\d+(\.\d+)?px\s+(solid|dashed|double)\s+#[0-9a-fA-F]{6}$/.test(normalized)) return normalized
  if (['none', 'transparent'].includes(normalized.toLowerCase())) return '1px solid transparent'
  return fallbackColor ? `1px solid ${fallbackColor}` : undefined
}

function normalizeHeroOverlay(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'dark') return 'linear-gradient(180deg, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.24) 46%, rgba(0, 0, 0, 0.64) 100%)'
  if (normalized === 'light') return 'linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08) 42%, #fff 100%)'
  if (normalized === 'soft') return 'linear-gradient(180deg, rgba(0, 0, 0, 0.38), rgba(0, 0, 0, 0.08) 44%, rgba(255, 255, 255, 0.88) 100%)'
  if (/^linear-gradient\([a-z0-9#(),.% /-]+\)$/i.test(value.trim())) return value.trim()
  return undefined
}

function normalizeShadowStyle(value?: string) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  const presets: Record<string, string> = {
    none: 'none',
    subtle: '0 18px 50px -42px rgba(0, 0, 0, 0.36)',
    soft: '0 24px 70px -48px rgba(0, 0, 0, 0.42)',
    luxury: '0 28px 90px -52px rgba(0, 0, 0, 0.62)',
    strong: '0 30px 90px -46px rgba(0, 0, 0, 0.72)',
  }
  if (presets[normalized]) return presets[normalized]
  if (/^[0-9a-z(),.% -]+rgba?\([0-9,.% ]+\)[0-9a-z(),.% -]*$/i.test(value.trim())) return value.trim()
  return undefined
}

function createBlueprintButtonStyle(blueprint: VisualBlueprintV1 | null, fallbackBackground: string) {
  const background = normalizeColor(blueprint?.buttons.background) || fallbackBackground
  const color = normalizeColor(blueprint?.buttons.textColor) || '#fff'
  const border = normalizeBorderStyle(blueprint?.buttons.borderStyle, background)

  return {
    backgroundColor: background,
    border,
    color,
  } as CSSProperties
}

function getBlueprintMood(blueprint: VisualBlueprintV1 | null) {
  const mood = `${blueprint?.brand.backgroundPalette ?? ''} ${blueprint?.brand.typographyMood ?? ''}`.toLowerCase()
  if (/dark|navy|noir|black|night/.test(mood)) return 'dark'
  if (/cream|warm|beige|sand|chaleur/.test(mood)) return 'warm'
  if (/minimal|white|light|clair/.test(mood)) return 'light'
  return 'default'
}

function getBlueprintSectionOrder(blueprint: VisualBlueprintV1 | null, fallbackOrder?: string): PublicSectionKey[] {
  const defaultOrder: PublicSectionKey[] = ['properties', 'method', 'sellerSpace', 'reviews', 'contact']
  const source = blueprint?.sections.sectionOrder || fallbackOrder || ''
  const aliases: Record<string, PublicSectionKey> = {
    biens: 'properties',
    properties: 'properties',
    property: 'properties',
    annonces: 'properties',
    methode: 'method',
    method: 'method',
    trust: 'reviews',
    preuves: 'reviews',
    reviews: 'reviews',
    avis: 'reviews',
    sellerspace: 'sellerSpace',
    'seller-space': 'sellerSpace',
    'espace-vendeur': 'sellerSpace',
    estimation: 'contact',
    contact: 'contact',
    cta: 'contact',
  }
  const ordered = source
    .split(',')
    .map((item) => aliases[toBlueprintClassValue(item)])
    .filter((item): item is PublicSectionKey => Boolean(item))
  const uniqueOrdered = [...new Set(ordered)]

  return [...uniqueOrdered, ...defaultOrder.filter((item) => !uniqueOrdered.includes(item))]
}

function getUsableImageSource(candidate: string | undefined, fallback: string) {
  if (!candidate) return fallback
  const value = candidate.trim()
  if (/^(https?:\/\/|data:image\/|blob:|\/)/i.test(value)) return value
  return fallback
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
  const featured = canShowProperties ? templateImmobilierConfig.properties.slice(0, 3) : []
  const agencyIdentity = createAgencyIdentity()
  const { visualBlueprint, primaryButtonStyle, accentTextStyle } = agencyIdentity
  const heroVariant = templateImmobilierConfig.heroVariant || 'premium'
  const heroVariantLabels: Record<string, string> = {
    premium: 'Agence premium',
    trust: 'Agence de confiance',
    estimation: 'Estimation',
    local: 'Agence locale',
  }
  const heroTitle = visualBlueprint?.hero.title || templateImmobilierConfig.heroTitle || 'Votre bien merite une signature.'
  const heroTitleLines = heroTitle === 'Votre bien merite une signature.'
    ? ['Votre bien merite', 'une signature.']
    : heroTitle
      .split(/\n|\. /)
      .map((line) => line.trim())
      .filter(Boolean)
  const heroSubtitle = visualBlueprint?.hero.subtitle || templateImmobilierConfig.heroSubtitle
  const primaryCtaLabel = visualBlueprint?.hero.cta || templateImmobilierConfig.primaryCtaLabel || 'Estimer mon bien'
  const heroImage = getUsableImageSource(visualBlueprint?.hero.imageUrl, templateImmobilierConfig.heroImage)
  const sectionBlocks: Record<PublicSectionKey, ReactNode | null> = {
    properties: canShowProperties ? (
      <section className="od-section" id="biens" key="properties">
        <div className="od-section-inner">
          <div className="od-section-heading">
            <div>
              <span className="od-kicker">Collection</span>
              <h2>Nos exclusivites</h2>
            </div>
            <button className="od-text-link od-desktop-only" type="button" onClick={() => scrollToId('biens')}>
              Tout voir <span aria-hidden="true">????????</span>
            </button>
          </div>
          <div className="od-property-grid">
            {featured.map((property) => (
              <PublicPropertyCard
                key={property.id}
                property={property}
                onOpen={canShowPropertyDetail ? () => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate) : undefined}
              />
            ))}
          </div>
        </div>
      </section>
    ) : null,
    method: (
      <section className="od-section od-method" id="methode" key="method">
        <div className="od-narrow">
          <span className="od-kicker">Methode</span>
          <h2>
            Une approche artisanale
            <br />
            de la vente immobiliere.
          </h2>
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
        </div>
      </section>
    ),
    sellerSpace: canShowSellerSpace ? (
      <section className="od-section" key="sellerSpace">
        <div className="od-seller-section">
          <div>
            <span className="od-kicker">Espace vendeur</span>
            <h2>Vous savez tout, en temps reel.</h2>
            <p>
              Visites, retours, offres, documents : votre espace vendeur vous donne une vision claire de la vente.
            </p>
            <p className="od-quote-line">Vous ne relancez plus l'agence. Vous voyez ou en est votre vente.</p>
            <button className="od-outline-button" type="button" onClick={() => openRoute(`${baseRoute}/vendeur`, onNavigate)}>
              Voir une demonstration <span aria-hidden="true">????????</span>
            </button>
          </div>
          <SellerPanel />
        </div>
      </section>
    ) : null,
    reviews: (
      <section className="od-testimonial" key="reviews">
        <div className="od-narrow">
          <span className="od-quote-mark">"</span>
          <p>
            Une clarte totale sur le processus. Notre appartement a ete vendu en onze jours au prix de l'estimation.
          </p>
          <div className="od-client">
            <span />
            <div>
              <strong>Marc-Antoine G.</strong>
              <small>Vendeur - Paris 16</small>
            </div>
          </div>
        </div>
      </section>
    ),
    contact: (
      <section className="od-final-cta" id="contact" key="contact">
        <div>
          <h2>Parlons de votre projet.</h2>
          <p>Une estimation indicative en 3 minutes. Sans engagement.</p>
          {canEstimate && <button type="button" style={primaryButtonStyle} onClick={() => openRoute(`${baseRoute}/estimation`, onNavigate)}>
            {primaryCtaLabel}
          </button>}
        </div>
      </section>
    ),
  }
  const publicSectionOrder = getBlueprintSectionOrder(visualBlueprint, templateImmobilierConfig.sectionOrder)

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <section className="od-hero">
        <img
          className="od-hero-image"
          src={heroImage}
          alt="Penthouse au coucher du soleil"
          width={1280}
          height={1600}
        />
        <div className="od-hero-overlay" />
        <nav className="od-topbar">
          <button className="od-brand od-brand-light" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
            {visualBlueprint?.brand.logoUrl ? (
              <img className="od-brand-logo" src={visualBlueprint.brand.logoUrl} alt={templateImmobilierConfig.agencyName} />
            ) : (
              templateImmobilierConfig.agencyName
            )}
          </button>
          <div className="od-toplinks">
            {canShowProperties && <button type="button" onClick={() => scrollToId('biens')}>Biens</button>}
            <button type="button" onClick={() => scrollToId('methode')}>Agence</button>
            <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>Contact</button>
          </div>
        </nav>
        <div className="od-hero-content">
          <span>{heroVariantLabels[heroVariant] ?? 'Agence'} - {templateImmobilierConfig.city}</span>
          <h1>
            {heroTitleLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 && <br />}
                {index === heroTitleLines.length - 1 && heroTitleLines.length > 1 ? (
                  <em style={accentTextStyle}>{line}</em>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>
          <p>{heroSubtitle}</p>
          <div className="od-hero-actions">
            {canEstimate && <button className="od-button od-button-dark" style={primaryButtonStyle} type="button" onClick={() => openRoute(`${baseRoute}/estimation`, onNavigate)}>
              {primaryCtaLabel}
            </button>}
            {canShowProperties && <button className="od-button od-button-glass" type="button" onClick={() => scrollToId('biens')}>
              Voir les biens
            </button>}
          </div>
        </div>
      </section>

      {visualBlueprint && publicSectionOrder.map((sectionKey) => sectionBlocks[sectionKey])}

      {!visualBlueprint && canShowProperties && (
      <section className="od-section" id="biens">
        <div className="od-section-inner">
          <div className="od-section-heading">
            <div>
              <span className="od-kicker">Collection</span>
              <h2>Nos exclusivites</h2>
            </div>
            <button className="od-text-link od-desktop-only" type="button" onClick={() => scrollToId('biens')}>
              Tout voir <span aria-hidden="true">???</span>
            </button>
          </div>
          <div className="od-property-grid">
            {featured.map((property) => (
              <PublicPropertyCard
                key={property.id}
                property={property}
                onOpen={canShowPropertyDetail ? () => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate) : undefined}
              />
            ))}
          </div>
        </div>
      </section>
      )}

      {!visualBlueprint && (
      <section className="od-section od-method" id="methode">
        <div className="od-narrow">
          <span className="od-kicker">Methode</span>
          <h2>
            Une approche artisanale
            <br />
            de la vente immobiliere.
          </h2>
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
        </div>
      </section>
      )}

      {!visualBlueprint && canShowSellerSpace && (
      <section className="od-section">
        <div className="od-seller-section">
          <div>
            <span className="od-kicker">Espace vendeur</span>
            <h2>Vous savez tout, en temps reel.</h2>
            <p>
              Visites, retours, offres, documents : votre espace vendeur vous donne une vision claire de la vente.
            </p>
            <p className="od-quote-line">Vous ne relancez plus l'agence. Vous voyez ou en est votre vente.</p>
            <button className="od-outline-button" type="button" onClick={() => openRoute(`${baseRoute}/vendeur`, onNavigate)}>
              Voir une demonstration <span aria-hidden="true">???</span>
            </button>
          </div>
          <SellerPanel />
        </div>
      </section>
      )}

      {!visualBlueprint && (
      <section className="od-testimonial">
        <div className="od-narrow">
          <span className="od-quote-mark">"</span>
          <p>
            Une clarte totale sur le processus. Notre appartement a ete vendu en onze jours au prix de l'estimation.
          </p>
          <div className="od-client">
            <span />
            <div>
              <strong>Marc-Antoine G.</strong>
              <small>Vendeur - Paris 16</small>
            </div>
          </div>
        </div>
      </section>
      )}

      {!visualBlueprint && (
      <section className="od-final-cta" id="contact">
        <div>
          <h2>Parlons de votre projet.</h2>
          <p>Une estimation indicative en 3 minutes. Sans engagement.</p>
          {canEstimate && <button type="button" style={primaryButtonStyle} onClick={() => openRoute(`${baseRoute}/estimation`, onNavigate)}>
            {primaryCtaLabel}
          </button>}
        </div>
      </section>
      )}

      <footer className="od-footer">
        <strong>{templateImmobilierConfig.agencyName}</strong>
        <span>{templateImmobilierConfig.address}</span>
        <span>2026 - Tous droits reserves.</span>
      </footer>

      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function TemplateMobileNav({ mode = 'public', onNavigate }: { mode?: NavMode; onNavigate?: Navigate }) {
  const currentPath = window.location.pathname
  const currentHash = window.location.hash
  const [collapsed, setCollapsed] = useState(false)
  const itemVisible = (moduleName?: RealEstateModuleName) => !moduleName || moduleEnabled(moduleName)
  const hasPrivateSpace = moduleEnabled('sellerSpace') || moduleEnabled('agentSpace') || moduleEnabled('ownerSpace')
  const itemsByMode: Record<NavMode, Array<[string, string, string, RealEstateModuleName?]>> = {
    public: [
      ['home', 'Accueil', baseRoute],
      ['building', 'Biens', `${baseRoute}#biens`, 'publicProperties'],
      ['calculator', 'Estimer', `${baseRoute}/estimation`, 'estimation'],
      ['user', 'Espaces', `${baseRoute}/connexion`, hasPrivateSpace ? undefined : 'sellerSpace'],
    ],
    seller: [
      ['home', 'Accueil', `${baseRoute}/vendeur`],
      ['calendar', 'Visites', `${baseRoute}/vendeur#visites`, 'visits'],
      ['offer', 'Offres', `${baseRoute}/vendeur#offres`, 'offers'],
      ['document', 'Docs', `${baseRoute}/vendeur#documents`, 'documents'],
      ['user', 'Profil', `${baseRoute}/connexion`],
    ],
    agent: [
      ['home', 'Accueil', `${baseRoute}/agent`],
      ['building', 'Biens', `${baseRoute}/agent#biens`],
      ['calendar', 'Visites', `${baseRoute}/agent#visites`, 'visits'],
      ['message', 'Demandes', `${baseRoute}/agent#demandes`],
      ['user', 'Profil', `${baseRoute}/connexion`],
    ],
    owner: [
      ['home', 'Accueil', `${baseRoute}/patron`],
      ['building', 'Biens', `${baseRoute}/patron#biens`],
      ['agents', 'Agents', `${baseRoute}/patron#agents`, 'agentSpace'],
      ['message', 'Demandes', `${baseRoute}/patron#demandes`],
      ['user', 'Profil', `${baseRoute}/connexion`],
    ],
  }

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

  const items = itemsByMode[mode].filter(([, , , moduleName]) => itemVisible(moduleName))

  return (
    <nav className={collapsed ? 'od-mobile-nav is-collapsed' : 'od-mobile-nav'} aria-label="Navigation template immobilier">
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
  return (
    <article className="od-seller-panel">
      <div className="od-panel-top">
        <span>Quai d'Orsay</span>
        <span>Mandat actif</span>
      </div>
      <div className="od-progress-row">
        <div>
          <small>Progression</small>
          <strong>60 %</strong>
        </div>
        <div>
          <small>Prochaine visite</small>
          <span>Demain - 14:00</span>
        </div>
      </div>
      <div className="od-progress"><span /></div>
      <div className="od-panel-stats">
        <Stat value="12" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
      </div>
      <div className="od-panel-actions">
        <p><b>Dernier compte rendu</b> Tres bon retour sur la luminosite et le quartier.</p>
        <p><b>Prochaine action</b> Relance acquereur qualifie demain matin.</p>
      </div>
    </article>
  )
}

function EstimationTunnel({ onNavigate }: { onNavigate?: Navigate }) {
  const agencyIdentity = createAgencyIdentity(['od-estimation-page'])
  const [step, setStep] = useState(0)
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
          <form className="od-tunnel-card" onSubmit={submit}>
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
            <div className="od-tunnel-actions">
              <button className="od-tunnel-back" type="button" onClick={back} disabled={step === 0}>Retour</button>
              <button className="od-tunnel-next" type="submit">{step === 5 ? 'Transmettre' : 'Continuer'}</button>
            </div>
          </form>
        )}

        {isConfirmation && (
          <div className="od-tunnel-card od-confirmation">
            <span className="od-confirmation-mark">???</span>
            <h1>Votre demande a bien ete transmise.</h1>
            <p>Un conseiller vous rappellera pour affiner l'estimation.</p>
            <button className="od-tunnel-next" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
              Retour a la template
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

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TemplateLogin({ onNavigate }: { onNavigate?: Navigate }) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [data] = useTemplateData()
  const visibleDemoAccounts = Object.values(demoAccounts)
    .filter((account) => routeForRoleEnabled(account.route as TemplateLoginRoute))
    .map((account) => `${account.email} / demo`)
  const agencyIdentity = createAgencyIdentity(['od-login-page'])

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
          <h1>Connectez votre espace immobilier.</h1>
          <p>Entrez votre email et votre mot de passe. Le bon espace s'ouvre automatiquement.</p>
        </div>
        <form className="od-form" onSubmit={submit}>
          <TextField label="Email" type="email" value={email} onChange={setEmail} />
          <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {error && <p className="od-error">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
        <button className="od-login-back" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>Retour template publique</button>
        {visibleDemoAccounts.length > 0 && <p className="od-demo-ids">{visibleDemoAccounts.join(' - ')}</p>}
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
  const agencyIdentity = createAgencyIdentity(['od-login-page'])

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
  const canManage = false
  const canUseSellerSpace = moduleEnabled('sellerSpace')
  const canUseVisits = moduleEnabled('visits')
  const canUseDocuments = moduleEnabled('documents')
  const canUseReports = moduleEnabled('reports')
  const canUseOffers = moduleEnabled('offers')
  const mode: NavMode = session?.role === 'vendeur' ? 'seller' : session?.role === 'patron' ? 'owner' : session?.role === 'agent' ? 'agent' : 'public'
  const galleryImages = [...new Set(photos.length ? photos.map((photo) => photo.url) : property.images)].filter(Boolean)
  const primaryImage = galleryImages[0] ?? property.imageUrl
  const agencyIdentity = createAgencyIdentity(['od-space-page', 'od-detail-theme-shell'])
  const detailHeroClass = canEdit
    ? 'od-property-detail-hero od-mandate-hero'
    : isPublic
      ? 'od-property-detail-hero od-public-property-hero'
      : 'od-property-detail-hero'

  async function completeDetailAction(action: ActionKind, values: ActionPayload) {
    await completeRepositoryAction(action, values, data, setData, property.id)
    setActivity((current) => [actionConfirmation(action), ...current].slice(0, 3))
  }

  function openManagementAction(action: ActionKind) {
    setActiveAction(action)
  }

  function archiveProperty() {
    setArchiveConfirm(false)
    setActivity((current) => ['Bien archiv??.', ...current].slice(0, 3))
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
              {canUseVisits && <span>{visits.length || 12} visites</span>}
              {canUseOffers && <span>{offers.length || 2} offres</span>}
              <span>{requests.length || 8} en attente</span>
            </div>
          )}
          <div className="od-detail-actions">
            {isPublic && <button className="od-solid-action" type="button" onClick={() => setActiveAction('requests')}>Demander une visite</button>}
            {canEdit && canUseSellerSpace && <button className="od-solid-action" type="button" onClick={() => openManagementAction('seller-access')}>Partager l'espace vendeur</button>}
            {canEdit && <button className="od-solid-action od-solid-action-light" type="button" onClick={() => openManagementAction('photo')}>Ajouter photo</button>}
            {canManage && (
              <>
                <button className="od-solid-action od-solid-action-light" type="button" onClick={() => setActiveAction('edit-property')}>Modifier fiche</button>
                <button className="od-solid-action" type="button" onClick={() => setActiveAction('photo')}>Ajouter photo</button>
                <button className="od-solid-action od-solid-action-light" type="button" onClick={() => setActiveAction('document')}>Ajouter document</button>
                <button className="od-solid-action" type="button" onClick={() => setActiveAction('seller-access')}>Cr??er espace vendeur</button>
              </>
            )}
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
          {property.highlights.map((highlight) => <LineItem key={highlight} title={highlight} text="Selection Opus Domus" />)}
        </Panel>
        {!isPublic && canUseVisits && (
          <Panel title="Visites" id="visites" action={canEdit ? <PanelAction label="+ Ajouter une visite" onClick={() => openManagementAction('visit')} /> : null}>
            {visits.length
              ? visits.map((visit) => <LineItem key={visit.id} title={`${visit.date} - ${visit.time}`} text={`${visit.buyerName} - ${visit.status}`} />)
              : <LineItem title="Aucune visite" text="Les visites apparaitront ici." />}
          </Panel>
        )}
        {!isPublic && canUseReports && (
          <Panel title="Comptes rendus" id="reports-detail" action={canEdit ? <PanelAction label="+ Ajouter un compte rendu" onClick={() => openManagementAction('report')} /> : null}>
            {reports.length ? reports.map((report) => <LineItem key={report.id} title={`${report.createdAt} - interet ${report.interestLevel}`} text={report.content} />) : <LineItem title="Aucun compte rendu" text="Les retours de visite apparaitront ici." />}
          </Panel>
        )}
        {!isPublic && canUseOffers && (
          <Panel title="Offres" id="offres">
            {offers.length ? offers.map((offer) => <LineItem key={offer.id} title={`${offer.buyerName} - ${offer.amount}`} text={offer.status} />) : <LineItem title="Aucune offre" text="Les offres apparaitront ici." />}
          </Panel>
        )}
        {!isPublic && canUseDocuments && (
          <Panel title="Documents" id="documents" action={canEdit ? <PanelAction label="+ Ajouter un document" onClick={() => openManagementAction('document')} /> : null}>
            {documents.length
              ? documents.map((document) => <DocumentLineItem key={document.id} document={document} />)
              : <LineItem title="Documents" text="Document en attente" />}
          </Panel>
        )}
        {canEdit && (
          <Panel title="Demandes">
            {requests.length ? requests.map((request) => <LineItem key={request.id} title={request.type} text={`${request.name} - ${request.status}`} />) : <LineItem title="Aucune demande" text="Les demandes acheteurs apparaitront ici." />}
          </Panel>
        )}
      </section>

      {canManage && (
        <QuickActions
          actions={[
            ['Modifier infos', 'edit-property'],
            ['Ajouter photo', 'photo'],
            ['Ajouter document', 'document'],
            ['Programmer visite', 'visit'],
            ['Ajouter compte rendu', 'report'],
            ['Cr??er espace vendeur', 'seller-access'],
          ]}
          onAction={setActiveAction}
        />
      )}

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

  return (
    <PrivatePage title="Espace vendeur" mode="seller" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-seller">
        <div>
          <span className="od-kicker">Espace vendeur</span>
          <h1>Bonjour,</h1>
          <p>Vous ne relancez plus l'agence. Vous voyez ou en est votre vente.</p>
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
        {canUseVisits && <Stat value={`${visits.length || 12}`} label="Visites" />}
        {canUseOffers && <Stat value={`${offers.length}`} label="Offres" />}
        {canUseDocuments && <Stat value={`${documents.length}`} label="Documents" />}
      </section>}

      <section className="od-seller-followup-grid">
        {canUseVisits && <SpaceCard
          id="visites"
          title="Prochaine visite"
          text={nextVisit ? `${nextVisit.date} - ${nextVisit.time}. ${nextVisit.buyerName} - ${nextVisit.note} Statut ${nextVisit.status}.` : 'Aucune visite programmee.'}
        />}
        {canUseReports && <SpaceCard
          title="Dernier compte rendu"
          text={lastReport?.content ?? 'Aucun compte rendu pour le moment.'}
        />}
        {canUseOffers && <SpaceCard id="offres" title="Offres recues" text={offers.map((offer) => `${offer.buyerName} - ${offer.amount}`).join(' / ') || 'Aucune offre recue.'} />}
      </section>

      {canUseDocuments && <section className="od-seller-documents">
        <Panel title="Documents" id="documents-detail">
          {documents.length
            ? documents.map((document) => <DocumentLineItem key={document.id} document={document} />)
            : <LineItem title="Documents" text="Document en attente" />}
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
  const todayVisits = agentVisits.length ? agentVisits.slice(0, 3) : [
    { id: 'today-bac', time: '10:30', property: 'Rue du Bac', buyerName: 'M. Charron', buyer: 'M. Charron' },
    { id: 'today-montaigne', time: '14:00', property: 'Av. Montaigne', buyerName: 'Famille Lebon', buyer: 'Famille Lebon' },
    { id: 'today-voltaire', time: '17:30', property: 'Quai Voltaire', buyerName: 'Mme Dupuis', buyer: 'Mme Dupuis' },
  ]
  const showLegacyActions = false
  const [activity, setActivity] = useState<string[]>([])
  const canUseVisits = moduleEnabled('visits')
  const canUseOffers = moduleEnabled('offers')

  async function completeAction(action: ActionKind, values: ActionValues) {
    await completeRepositoryAction(action, values, data, setData, undefined, agent.id)
    setActivity((current) => [actionConfirmation(action), ...current].slice(0, 3))
  }

  return (
    <PrivatePage title="Espace agent" mode="agent" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">Espace agent</span>
        <h1>{agent.name}</h1>
        <div className="od-private-actions">
          <button className="od-icon-button" type="button" aria-label="Recherche">
            <NavIcon name="building" />
          </button>
          <button className="od-icon-button" type="button" aria-label="Notifications">
            <NavIcon name="message" />
          </button>
          <button className="od-solid-action" type="button" onClick={() => setActiveAction('new-property')}>+ Nouveau bien</button>
        </div>
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value="12" label="Mandats actifs" />
        {canUseVisits && <Stat value="3" label="Visites aujourd'hui" />}
        {canUseOffers && <Stat value="5" label="Offres en cours" />}
        <Stat value="1.4M" label="CA en cours" />
      </section>

      <section className="od-dashboard-grid">
        {canUseVisits && <Panel title="Aujourd'hui" id="visites">
          {todayVisits.map((visit) => (
            <LineItem key={visit.id} title={`${visit.time} ${visit.property}`} text={visit.buyerName || visit.buyer} />
          ))}
        </Panel>}
        <Panel title="Mes mandats" id="biens">
          {localProperties.map((property) => (
            <MandateCard
              key={property.id}
              property={property}
              visits={visitsByProperty(data, property.id).length}
              showVisits={canUseVisits}
              onOpen={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)}
            />
          ))}
        </Panel>
      </section>
      {showLegacyActions && <QuickActions
        actions={[
          ['Nouveau bien', 'new-property'],
          ['Ajouter photo', 'photo'],
          ['Ajouter document', 'document'],
          ['Programmer visite', 'visit'],
          ['Ajouter compte rendu', 'report'],
          ['Cr??er espace vendeur', 'seller-access'],
          ['Modifier fiche bien', 'edit-property'],
        ]}
        onAction={setActiveAction}
      />}
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
  const showLegacyActions = false
  const [activity, setActivity] = useState<string[]>([])
  const [agentToDisable, setAgentToDisable] = useState<string | null>(null)
  const canUseAgentSpace = moduleEnabled('agentSpace')
  const canUseVisits = moduleEnabled('visits')
  const canUseOffers = moduleEnabled('offers')

  async function disableAgent(agentId: string) {
    await disableAgentWithRepository(agentId, setData)
    setAgentToDisable(null)
    setActivity((current) => ['Agent desactive.', ...current].slice(0, 3))
  }

  async function completeAction(action: ActionKind, values: ActionValues) {
    await completeRepositoryAction(action, values, data, setData, undefined, data.agents[0]?.id)
    setActivity((current) => [actionConfirmation(action), ...current].slice(0, 3))
  }

  return (
    <PrivatePage title="Espace patron" mode="owner" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">Espace patron</span>
        <h1>Direction agence</h1>
        <div className="od-private-actions">
          {canUseAgentSpace && <button className="od-solid-action od-solid-action-light" type="button" onClick={() => setActiveAction('agent')}>+ Ajouter agent</button>}
          <button className="od-solid-action" type="button" onClick={() => setActiveAction('new-property')}>+ Nouveau bien</button>
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
          {agents.map((agent) => (
            <article className="od-agent-row" key={agent.id}>
              <LineItem title={agent.name} text={`${agent.role} - ${agent.active ? 'actif' : 'inactif'} - ${agent.activeListings} biens suivis`} />
              {agentToDisable === agent.id ? (
                <div className="od-confirm-row">
                  <button type="button" onClick={() => disableAgent(agent.id)}>Confirmer</button>
                  <button type="button" onClick={() => setAgentToDisable(null)}>Annuler</button>
                </div>
              ) : (
                <button type="button" onClick={() => setAgentToDisable(agent.id)}>Desactiver</button>
              )}
            </article>
          ))}
        </Panel>}
        <Panel title="Biens de l'agence" id="biens">
          {localProperties.map((property) => (
            <MandateCard
              key={property.id}
              property={property}
              visits={visitsByProperty(data, property.id).length}
              showVisits={canUseVisits}
              onOpen={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)}
            />
          ))}
        </Panel>
        {showLegacyActions && (
        <Panel title="Demandes recues" id="demandes">
          {data.requests.map((request) => (
            <LineItem key={request.id} title={request.type} text={`${request.contact} - ${request.detail}`} />
          ))}
        </Panel>
        )}
        {showLegacyActions && (
        <Panel title="Offres en cours">
          {data.offers.map((offer) => (
            <LineItem key={offer.id} title={`${offer.buyer} - ${offer.amount}`} text={`${offer.property} - ${offer.status}`} />
          ))}
        </Panel>
        )}
        {showLegacyActions && (
        <Panel title="Visites">
          {data.visits.map((visit) => (
            <LineItem key={visit.id} title={`${visit.date} - ${visit.time}`} text={`${visit.property} - ${visit.buyerName}`} />
          ))}
        </Panel>
        )}
      </section>
      {showLegacyActions && <QuickActions
        actions={[
          ['Ajouter agent', 'agent'],
          ['Supprimer agent', 'disable-agent'],
          ['Nouveau bien', 'new-property'],
          ['Ajouter photo', 'photo'],
          ['Ajouter document', 'document'],
          ['Programmer visite', 'visit'],
          ['Ajouter compte rendu', 'report'],
          ['Cr??er espace vendeur', 'seller-access'],
        ]}
        onAction={(action) => {
          if (action === 'disable-agent') {
            setAgentToDisable(agents[0]?.id ?? null)
            return
          }
          setActiveAction(action)
        }}
      />}
      {showLegacyActions && <section className="od-quick-actions od-private-links">
        <span className="od-kicker">Liens rapides</span>
        <div>
          <button type="button" onClick={() => openRoute(baseRoute, onNavigate)}>Voir template publique</button>
          <button type="button" onClick={() => openRoute(`${baseRoute}/agent`, onNavigate)}>Ouvrir espace agent</button>
          <button type="button" onClick={() => openRoute(`${baseRoute}/vendeur`, onNavigate)}>Ouvrir espace vendeur demo</button>
        </div>
      </section>}
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

function PrivatePage({
  title,
  mode,
  children,
  onNavigate,
}: {
  title: string
  mode: NavMode
  children: ReactNode
  onNavigate?: Navigate
}) {
  const agencyIdentity = createAgencyIdentity(['od-space-page'])

  return (
    <main className={agencyIdentity.className} style={agencyIdentity.style}>
      <header className="od-space-header">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <span>{title}</span>
        <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>Changer d'espace</button>
      </header>
      {children}
      <TemplateMobileNav mode={mode} onNavigate={onNavigate} />
    </main>
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

function PublicPropertyCard({ property, onOpen }: { property: RealEstateProperty; onOpen?: () => void }) {
  const pointerStartX = useRef(0)
  const pointerDeltaX = useRef(0)
  const images = [...new Set(property.images.length ? property.images : [property.imageUrl || fallbackPropertyImage])].filter(Boolean)

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
      className="od-property-card"
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
      <PhotoCarousel images={images} alt={property.title} />
      <div className="od-property-meta">
        <div>
          <p>{property.address}</p>
          <h3>{property.title}</h3>
          {property.description && <small className="od-property-description">{property.description}</small>}
          <span>{property.surface} - {property.rooms}</span>
        </div>
        <strong>{formatPropertyPrice(property)}</strong>
      </div>
    </article>
  )
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
      <span>{document.type} - {document.status}</span>
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

function LineItem({ title, text, href }: { title: string; text: string; href?: string }) {
  const canOpen = Boolean(href && href !== '#')

  return (
    <article className="od-line-item">
      <strong>{title}</strong>
      <span>{text}</span>
      {canOpen && <a className="od-line-link" href={href} target="_blank" rel="noreferrer">Ouvrir</a>}
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

function QuickActions({
  actions,
  onAction,
}: {
  actions: Array<[string, ActionKind]>
  onAction: (action: ActionKind) => void
}) {
  return (
    <section className="od-quick-actions">
      <span className="od-kicker">Actions rapides</span>
      <div>
        {actions.map(([label, action]) => (
          <button type="button" key={action} onClick={() => onAction(action)}>
            {label}
          </button>
        ))}
      </div>
    </section>
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
    'seller-access': 'Cr??er espace vendeur',
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
          <form className="od-form" onSubmit={submit}>
            <ActionFields
              action={action}
              propertyOptions={propertyOptions}
              visitOptions={visitOptions}
              photoPreview={photoPreview}
              documentFileName={documentFileName}
              onPhotoPreview={setPhotoPreview}
              onDocumentFileName={setDocumentFileName}
            />
            {error && <p className="od-error">{error}</p>}
            <button type="submit" disabled={pending}>{pending ? 'Validation...' : 'Valider'}</button>
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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openRoute(route: string, onNavigate?: Navigate) {
  if (route.includes('#')) {
    const [path, hash] = route.split('#')
    if (onNavigate) onNavigate(route)
    else window.history.pushState({}, '', route)
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }))
    if (!onNavigate && path) window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }

  if (onNavigate) {
    onNavigate(route)
    return
  }

  window.location.assign(route)
}

