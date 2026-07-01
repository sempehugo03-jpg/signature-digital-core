import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient'
import {
  demoAccounts,
  getRealEstateAgencyConfig,
  realEstateTemplateKey,
  templateImmobilierConfig,
  templateImmobilierSlug,
  type RealEstateAgencyConfig,
  type RealEstateAgent as TemplateRealEstateAgent,
  type RealEstateDocument as TemplateRealEstateDocument,
  type RealEstateOffer as TemplateRealEstateOffer,
  type RealEstatePhoto as TemplateRealEstatePhoto,
  type RealEstateProperty as TemplateRealEstateProperty,
  type RealEstateReport as TemplateRealEstateReport,
  type RealEstateRequest as TemplateRealEstateRequest,
  type RealEstateSeller as TemplateRealEstateSeller,
  type RealEstateVisit as TemplateRealEstateVisit,
} from '../../data/realEstateTemplate'

type RemoteRecord = Record<string, unknown>
type JsonObject = Record<string, unknown>

export type RealEstateAgency = RealEstateAgencyConfig
export type RealEstateAgent = TemplateRealEstateAgent
export type RealEstateProperty = TemplateRealEstateProperty
export type RealEstatePhoto = TemplateRealEstatePhoto
export type RealEstateDocument = TemplateRealEstateDocument
export type RealEstateVisit = TemplateRealEstateVisit
export type RealEstateReport = TemplateRealEstateReport
export type RealEstateOffer = TemplateRealEstateOffer
export type RealEstateRequest = TemplateRealEstateRequest
export type RealEstateSeller = TemplateRealEstateSeller
export type RealEstateProfileRole = 'seller' | 'agent' | 'owner'

export type RealEstateProfile = {
  id: string
  agencyId: string
  email: string
  firstName: string
  lastName: string
  name: string
  phone: string
  role: RealEstateProfileRole
  status: string
  propertyId?: string
  assignedPropertyIds?: string[]
}

export type AddPropertyPhotoInput = Partial<Pick<RealEstatePhoto, 'url' | 'label'>> & {
  storagePath?: string
  fileName?: string
  mimeType?: string
  altText?: string
  sortOrder?: number
  isCover?: boolean
}

export type AddPropertyDocumentInput = Partial<Pick<RealEstateDocument, 'name' | 'title' | 'type' | 'status' | 'url'>> & {
  storagePath?: string
  fileName?: string
  mimeType?: string
  documentType?: string
}

export type AddVisitInput = Partial<Pick<RealEstateVisit, 'date' | 'time' | 'buyer' | 'buyerName' | 'note' | 'status' | 'agent'>>
export type AddReportInput = Partial<Pick<RealEstateReport, 'visitId' | 'content' | 'interestLevel'>>
export type AddAgentInput = Partial<Pick<RealEstateAgent, 'name' | 'role' | 'phone' | 'email' | 'assignedPropertyIds'>>
export type CreateSellerAccessInput = Partial<Pick<RealEstateSeller, 'name' | 'email'>>
export type CreateRequestInput = Partial<
  Pick<RealEstateRequest, 'type' | 'propertyId' | 'contact' | 'detail' | 'name' | 'phone' | 'email' | 'message' | 'status'>
>

const fallbackAgencies = new Map<string, RealEstateAgency>()

export async function getAgencyBySlug(agencySlug: string): Promise<RealEstateAgency | null> {
  const slug = requireNonEmpty(agencySlug, 'agencySlug')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data ? mapAgency(data as RemoteRecord) : null
  }

  return getFallbackAgencyBySlug(slug)
}

export async function getProperties(agencyId: string): Promise<RealEstateProperty[]> {
  const scopedAgencyId = requireAgencyId(agencyId)

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapProperty)
  }

  return getFallbackAgencyById(scopedAgencyId)?.properties ?? []
}

export async function getPropertyById(agencyId: string, propertyId: string): Promise<RealEstateProperty | null> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('id', scopedPropertyId)
      .maybeSingle()

    if (error) throw error
    return data ? mapProperty(data as RemoteRecord) : null
  }

  return getFallbackAgencyById(scopedAgencyId)?.properties.find((property) => property.id === scopedPropertyId) ?? null
}

export async function getAgents(agencyId: string): Promise<RealEstateAgent[]> {
  const scopedAgencyId = requireAgencyId(agencyId)

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('role', 'agent')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapAgentProfile)
  }

  return getFallbackAgencyById(scopedAgencyId)?.agents ?? []
}

export async function getProfileByEmail(email: string): Promise<RealEstateProfile | null> {
  const normalizedEmail = requireNonEmpty(email, 'email').toLowerCase()

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) throw error
    return data ? mapProfile(data as RemoteRecord) : null
  }

  return findFallbackProfileByEmail(normalizedEmail)
}

export async function getSellerByEmail(agencyId: string, email: string): Promise<RealEstateSeller | null> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const normalizedEmail = requireNonEmpty(email, 'email').toLowerCase()

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('role', 'seller')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) throw error
    return data ? mapSellerProfile(data as RemoteRecord, '') : null
  }

  return getFallbackAgencyById(scopedAgencyId)?.sellers.find((seller) => seller.email.toLowerCase() === normalizedEmail) ?? null
}

export async function getDocuments(agencyId: string, propertyId: string): Promise<RealEstateDocument[]> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('property_documents')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('property_id', scopedPropertyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapDocument)
  }

  return getFallbackAgencyById(scopedAgencyId)?.documents.filter((document) => document.propertyId === scopedPropertyId) ?? []
}

export async function getPhotos(agencyId: string, propertyId: string): Promise<RealEstatePhoto[]> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('property_photos')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('property_id', scopedPropertyId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapPhoto)
  }

  return getFallbackAgencyById(scopedAgencyId)?.photos.filter((photo) => photo.propertyId === scopedPropertyId) ?? []
}

export async function getVisits(agencyId: string, propertyId: string): Promise<RealEstateVisit[]> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('property_id', scopedPropertyId)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapVisit)
  }

  return getFallbackAgencyById(scopedAgencyId)?.visits.filter((visit) => visit.propertyId === scopedPropertyId) ?? []
}

export async function getReports(agencyId: string, propertyId: string): Promise<RealEstateReport[]> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('property_id', scopedPropertyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapReport)
  }

  return getFallbackAgencyById(scopedAgencyId)?.reports.filter((report) => report.propertyId === scopedPropertyId) ?? []
}

export async function getOffers(agencyId: string, propertyId: string): Promise<RealEstateOffer[]> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .eq('property_id', scopedPropertyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapOffer)
  }

  return getFallbackAgencyById(scopedAgencyId)?.offers.filter((offer) => offer.propertyId === scopedPropertyId) ?? []
}

export async function getRequests(agencyId: string): Promise<RealEstateRequest[]> {
  const scopedAgencyId = requireAgencyId(agencyId)

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('agency_id', scopedAgencyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as RemoteRecord[] | null ?? []).map(mapRequest)
  }

  return getFallbackAgencyById(scopedAgencyId)?.requests ?? []
}

export async function addPropertyPhoto(
  agencyId: string,
  propertyId: string,
  data: AddPropertyPhotoInput,
): Promise<RealEstatePhoto> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const storagePath = data.storagePath ?? data.url ?? ''
    const { data: inserted, error } = await supabase
      .from('property_photos')
      .insert({
        agency_id: scopedAgencyId,
        property_id: scopedPropertyId,
        storage_path: storagePath,
        file_name: data.fileName ?? data.label ?? '',
        mime_type: data.mimeType ?? '',
        alt_text: data.altText ?? data.label ?? '',
        sort_order: data.sortOrder ?? 0,
        is_cover: data.isCover ?? false,
      })
      .select('*')
      .single()

    if (error) throw error
    return mapPhoto(inserted as RemoteRecord)
  }

  const photo: RealEstatePhoto = {
    id: createId('photo'),
    agencyId: scopedAgencyId,
    propertyId: scopedPropertyId,
    url: data.url ?? data.storagePath ?? '',
    label: data.label ?? data.altText ?? 'Photo',
    createdAt: today(),
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.photos = [photo, ...store.photos]
  store.properties = store.properties.map((property) =>
    property.id === scopedPropertyId ? { ...property, photos: [photo.url, ...property.photos] } : property,
  )
  return photo
}

export async function addPropertyDocument(
  agencyId: string,
  propertyId: string,
  data: AddPropertyDocumentInput,
): Promise<RealEstateDocument> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const storagePath = data.storagePath ?? data.url ?? ''
    const { data: inserted, error } = await supabase
      .from('property_documents')
      .insert({
        agency_id: scopedAgencyId,
        property_id: scopedPropertyId,
        storage_path: storagePath,
        file_name: data.fileName ?? data.name ?? data.title ?? '',
        mime_type: data.mimeType ?? '',
        document_type: data.documentType ?? data.type ?? '',
      })
      .select('*')
      .single()

    if (error) throw error
    return mapDocument(inserted as RemoteRecord)
  }

  const document: RealEstateDocument = {
    id: createId('document'),
    agencyId: scopedAgencyId,
    propertyId: scopedPropertyId,
    title: data.title ?? data.name ?? 'Document',
    name: data.name ?? data.title ?? 'Document',
    type: data.type ?? data.documentType ?? 'Document',
    property: getFallbackPropertyTitle(scopedAgencyId, scopedPropertyId),
    status: data.status ?? 'Ajoute',
    url: data.url ?? data.storagePath ?? '#',
    createdAt: today(),
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.documents = [document, ...store.documents]
  store.properties = store.properties.map((property) =>
    property.id === scopedPropertyId ? { ...property, documents: [document.id, ...property.documents] } : property,
  )
  return document
}

export async function addVisit(agencyId: string, propertyId: string, data: AddVisitInput): Promise<RealEstateVisit> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const scheduledAt = buildScheduledAt(data.date, data.time)
    const { data: inserted, error } = await supabase
      .from('visits')
      .insert({
        agency_id: scopedAgencyId,
        property_id: scopedPropertyId,
        visitor_name: data.buyerName ?? data.buyer ?? '',
        scheduled_at: scheduledAt,
        status: normalizeVisitStatus(data.status),
        notes: data.note ?? '',
        payload: {
          buyer: data.buyer,
          buyerName: data.buyerName,
          date: data.date,
          time: data.time,
          agent: data.agent,
        },
      })
      .select('*')
      .single()

    if (error) throw error
    return mapVisit(inserted as RemoteRecord)
  }

  const visit: RealEstateVisit = {
    id: createId('visit'),
    agencyId: scopedAgencyId,
    propertyId: scopedPropertyId,
    property: getFallbackPropertyTitle(scopedAgencyId, scopedPropertyId),
    date: data.date ?? today(),
    time: data.time ?? '',
    buyer: data.buyer ?? data.buyerName ?? '',
    buyerName: data.buyerName ?? data.buyer ?? '',
    note: data.note ?? '',
    status: data.status ?? 'A confirmer',
    agent: data.agent ?? 'Agence',
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.visits = [visit, ...store.visits]
  store.properties = store.properties.map((property) =>
    property.id === scopedPropertyId ? { ...property, visits: [visit.id, ...property.visits] } : property,
  )
  return visit
}

export async function addReport(agencyId: string, propertyId: string, data: AddReportInput): Promise<RealEstateReport> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from('reports')
      .insert({
        agency_id: scopedAgencyId,
        property_id: scopedPropertyId,
        visit_id: data.visitId || null,
        title: 'Compte rendu',
        summary: data.content ?? '',
        payload: {
          interestLevel: data.interestLevel,
        },
      })
      .select('*')
      .single()

    if (error) throw error
    return mapReport(inserted as RemoteRecord)
  }

  const report: RealEstateReport = {
    id: createId('report'),
    agencyId: scopedAgencyId,
    propertyId: scopedPropertyId,
    visitId: data.visitId ?? '',
    content: data.content ?? '',
    interestLevel: data.interestLevel ?? 'A qualifier',
    createdAt: today(),
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.reports = [report, ...store.reports]
  store.properties = store.properties.map((property) =>
    property.id === scopedPropertyId ? { ...property, reports: [report.id, ...property.reports] } : property,
  )
  return report
}

export async function addAgent(agencyId: string, data: AddAgentInput): Promise<RealEstateAgent> {
  const scopedAgencyId = requireAgencyId(agencyId)

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from('profiles')
      .insert({
        agency_id: scopedAgencyId,
        email: data.email ?? '',
        first_name: readNamePart(data.name, 'first'),
        last_name: readNamePart(data.name, 'last'),
        phone: data.phone ?? '',
        role: 'agent',
        status: 'active',
        metadata: {
          displayRole: data.role,
          assignedPropertyIds: data.assignedPropertyIds ?? [],
        },
      })
      .select('*')
      .single()

    if (error) throw error
    return mapAgentProfile(inserted as RemoteRecord)
  }

  const agent: RealEstateAgent = {
    id: createId('agent'),
    agencyId: scopedAgencyId,
    name: data.name ?? 'Nouvel agent',
    role: data.role ?? 'Conseiller',
    activeListings: data.assignedPropertyIds?.length ?? 0,
    phone: data.phone ?? '',
    email: data.email ?? '',
    active: true,
    assignedPropertyIds: data.assignedPropertyIds ?? [],
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.agents = [agent, ...store.agents]
  return agent
}

export async function deactivateAgent(agencyId: string, agentId: string): Promise<void> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedAgentId = requireNonEmpty(agentId, 'agentId')

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'disabled' })
      .eq('agency_id', scopedAgencyId)
      .eq('id', scopedAgentId)
      .eq('role', 'agent')

    if (error) throw error
    return
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.agents = store.agents.map((agent) => (agent.id === scopedAgentId ? { ...agent, active: false } : agent))
}

export async function createSellerAccess(
  agencyId: string,
  propertyId: string,
  sellerData: CreateSellerAccessInput,
): Promise<RealEstateSeller> {
  const scopedAgencyId = requireAgencyId(agencyId)
  const scopedPropertyId = requireNonEmpty(propertyId, 'propertyId')

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from('profiles')
      .insert({
        agency_id: scopedAgencyId,
        email: sellerData.email ?? '',
        first_name: readNamePart(sellerData.name, 'first'),
        last_name: readNamePart(sellerData.name, 'last'),
        role: 'seller',
        status: 'invited',
        metadata: { propertyId: scopedPropertyId },
      })
      .select('*')
      .single()

    if (error) throw error

    const seller = mapSellerProfile(inserted as RemoteRecord, scopedPropertyId)
    await supabase
      .from('properties')
      .update({ seller_profile_id: seller.id })
      .eq('agency_id', scopedAgencyId)
      .eq('id', scopedPropertyId)

    return seller
  }

  const seller: RealEstateSeller = {
    id: createId('seller'),
    agencyId: scopedAgencyId,
    name: sellerData.name ?? 'Vendeur',
    email: sellerData.email ?? '',
    propertyId: scopedPropertyId,
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.sellers = [seller, ...store.sellers]
  store.properties = store.properties.map((property) =>
    property.id === scopedPropertyId ? { ...property, sellerId: seller.id } : property,
  )
  return seller
}

export async function createRequest(agencyId: string, data: CreateRequestInput): Promise<RealEstateRequest> {
  const scopedAgencyId = requireAgencyId(agencyId)

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from('requests')
      .insert({
        agency_id: scopedAgencyId,
        property_id: data.propertyId || null,
        request_type: normalizeRequestType(data.type),
        first_name: readNamePart(data.name, 'first'),
        last_name: readNamePart(data.name, 'last'),
        email: data.email ?? '',
        phone: data.phone ?? '',
        message: data.message ?? data.detail ?? '',
        status: normalizeRequestStatus(data.status),
        payload: {
          contact: data.contact,
          detail: data.detail,
        },
      })
      .select('*')
      .single()

    if (error) throw error
    return mapRequest(inserted as RemoteRecord)
  }

  const request: RealEstateRequest = {
    id: createId('request'),
    agencyId: scopedAgencyId,
    type: data.type ?? 'Demande',
    propertyId: data.propertyId ?? '',
    contact: data.contact ?? data.name ?? '',
    detail: data.detail ?? data.message ?? '',
    name: data.name ?? data.contact ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    message: data.message ?? data.detail ?? '',
    status: data.status ?? 'Nouvelle',
  }

  const store = requireFallbackAgency(scopedAgencyId)
  store.requests = [request, ...store.requests]
  return request
}

function mapAgency(record: RemoteRecord): RealEstateAgency {
  const agencyId = readString(record, 'id') ?? ''
  const agencySlug = readString(record, 'slug') ?? agencyId

  return {
    template: realEstateTemplateKey,
    agencyId,
    agencySlug,
    agencyName: readString(record, 'name') ?? agencySlug,
    baseVisual: 'Supabase real estate engine',
    city: readString(record, 'city') ?? '',
    phone: '',
    email: readString(record, 'email_reception') ?? '',
    address: '',
    heroImage: readString(record, 'logo_url') ?? '',
    heroTitle: readString(record, 'name') ?? agencySlug,
    heroSubtitle: readString(record, 'commercial_angle') ?? '',
    properties: [],
    agents: [],
    sellers: [],
    visits: [],
    documents: [],
    photos: [],
    reports: [],
    offers: [],
    requests: [],
  }
}

function mapProfile(record: RemoteRecord): RealEstateProfile {
  const firstName = readString(record, 'first_name') ?? ''
  const lastName = readString(record, 'last_name') ?? ''
  const role = normalizeProfileRole(readString(record, 'role'))
  const metadata = readJson(record, 'metadata')

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    email: readString(record, 'email') ?? '',
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' ') || (readString(record, 'email') ?? ''),
    phone: readString(record, 'phone') ?? '',
    role,
    status: readString(record, 'status') ?? 'active',
    propertyId: readString(metadata, 'propertyId'),
    assignedPropertyIds: readStringArray(metadata, 'assignedPropertyIds'),
  }
}

function mapAgentProfile(record: RemoteRecord): RealEstateAgent {
  const profile = mapProfile(record)
  const metadata = readJson(record, 'metadata')

  return {
    id: profile.id,
    agencyId: profile.agencyId,
    name: profile.name || profile.email,
    role: readString(metadata, 'displayRole') ?? 'Agent',
    activeListings: profile.assignedPropertyIds?.length ?? 0,
    phone: profile.phone,
    email: profile.email,
    active: profile.status !== 'disabled',
    assignedPropertyIds: profile.assignedPropertyIds ?? [],
  }
}

function mapSellerProfile(record: RemoteRecord, propertyId: string): RealEstateSeller {
  const profile = mapProfile(record)

  return {
    id: profile.id,
    agencyId: profile.agencyId,
    name: profile.name || profile.email,
    email: profile.email,
    propertyId: profile.propertyId ?? propertyId,
  }
}

function mapProperty(record: RemoteRecord): RealEstateProperty {
  const payload = readJson(record, 'payload')
  const id = readString(record, 'id') ?? ''
  const title = readString(record, 'title') ?? 'Bien'
  const priceValue = readNumber(record, 'price') ?? 0

  return {
    id,
    agencyId: readString(record, 'agency_id') ?? '',
    title,
    address: readString(record, 'address') ?? '',
    city: readString(record, 'city') ?? '',
    price: priceValue ? formatPrice(priceValue) : readString(payload, 'price') ?? '',
    priceValue,
    surface: readString(payload, 'surface') ?? '',
    rooms: readString(payload, 'rooms') ?? '',
    bedrooms: readString(payload, 'bedrooms'),
    type: readString(record, 'property_type') ?? readString(payload, 'type') ?? '',
    description: readString(payload, 'description') ?? '',
    highlights: readStringArray(payload, 'highlights') ?? [],
    imageUrl: readString(payload, 'imageUrl') ?? '',
    images: readStringArray(payload, 'images') ?? [],
    photos: readStringArray(payload, 'photos') ?? [],
    documents: readStringArray(payload, 'documents') ?? [],
    visits: readStringArray(payload, 'visits') ?? [],
    reports: readStringArray(payload, 'reports') ?? [],
    offers: readStringArray(payload, 'offers') ?? [],
    progress: readNumber(payload, 'progress') ?? 0,
    assignedAgentId: readString(record, 'agent_profile_id') ?? '',
    sellerId: readString(record, 'seller_profile_id') ?? '',
    isTemporary: readBoolean(payload, 'isTemporary') ?? false,
  }
}

function mapPhoto(record: RemoteRecord): RealEstatePhoto {
  const bucket = readString(record, 'storage_bucket') ?? 'property-photos'
  const storagePath = readString(record, 'storage_path') ?? ''

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    propertyId: readString(record, 'property_id') ?? '',
    url: readPublicStorageUrl(bucket, storagePath),
    label: readString(record, 'alt_text') ?? readString(record, 'file_name') ?? 'Photo',
    createdAt: readDate(record, 'created_at'),
  }
}

function mapDocument(record: RemoteRecord): RealEstateDocument {
  const bucket = readString(record, 'storage_bucket') ?? 'property-documents'
  const storagePath = readString(record, 'storage_path') ?? ''
  const name = readString(record, 'file_name') ?? 'Document'

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    propertyId: readString(record, 'property_id') ?? '',
    title: name,
    name,
    type: readString(record, 'document_type') ?? 'Document',
    property: '',
    status: 'Ajoute',
    url: readPublicStorageUrl(bucket, storagePath),
    createdAt: readDate(record, 'created_at'),
  }
}

function mapVisit(record: RemoteRecord): RealEstateVisit {
  const payload = readJson(record, 'payload')
  const scheduledAt = readString(record, 'scheduled_at') ?? ''
  const scheduled = splitScheduledAt(scheduledAt)
  const buyerName = readString(record, 'visitor_name') ?? readString(payload, 'buyerName') ?? ''

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    propertyId: readString(record, 'property_id') ?? '',
    property: '',
    date: readString(payload, 'date') ?? scheduled.date,
    time: readString(payload, 'time') ?? scheduled.time,
    buyer: readString(payload, 'buyer') ?? buyerName,
    buyerName,
    note: readString(record, 'notes') ?? '',
    status: displayVisitStatus(readString(record, 'status')),
    agent: readString(payload, 'agent') ?? '',
  }
}

function mapReport(record: RemoteRecord): RealEstateReport {
  const payload = readJson(record, 'payload')

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    propertyId: readString(record, 'property_id') ?? '',
    visitId: readString(record, 'visit_id') ?? '',
    content: readString(record, 'summary') ?? '',
    interestLevel: readString(payload, 'interestLevel') ?? '',
    createdAt: readDate(record, 'created_at'),
  }
}

function mapOffer(record: RemoteRecord): RealEstateOffer {
  const amount = readNumber(record, 'amount') ?? 0

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    propertyId: readString(record, 'property_id') ?? '',
    buyer: readString(record, 'buyer_name') ?? '',
    buyerName: readString(record, 'buyer_name') ?? '',
    amount: amount ? formatPrice(amount) : '',
    property: '',
    status: readString(record, 'status') ?? '',
  }
}

function mapRequest(record: RemoteRecord): RealEstateRequest {
  const payload = readJson(record, 'payload')
  const name = [readString(record, 'first_name'), readString(record, 'last_name')].filter(Boolean).join(' ')

  return {
    id: readString(record, 'id') ?? '',
    agencyId: readString(record, 'agency_id') ?? '',
    type: displayRequestType(readString(record, 'request_type')),
    propertyId: readString(record, 'property_id') ?? '',
    contact: readString(payload, 'contact') ?? name,
    detail: readString(payload, 'detail') ?? readString(record, 'message') ?? '',
    name,
    phone: readString(record, 'phone') ?? '',
    email: readString(record, 'email') ?? '',
    message: readString(record, 'message') ?? '',
    status: displayRequestStatus(readString(record, 'status')),
  }
}

function getFallbackAgencyBySlug(agencySlug: string) {
  const config = getRealEstateAgencyConfig(agencySlug)
  if (!config) return null
  return getFallbackAgencyById(config.agencyId)
}

function getFallbackAgencyById(agencyId: string) {
  if (fallbackAgencies.has(agencyId)) return fallbackAgencies.get(agencyId) ?? null

  const config = findFallbackConfigByAgencyId(agencyId)
  if (!config) return null

  const store = cloneAgencyConfig(config)
  fallbackAgencies.set(agencyId, store)
  return store
}

function requireFallbackAgency(agencyId: string) {
  const store = getFallbackAgencyById(agencyId)
  if (!store) throw new Error(`Fallback real estate agency not found: ${agencyId}`)
  return store
}

function findFallbackConfigByAgencyId(agencyId: string) {
  if (templateImmobilierConfig.agencyId === agencyId || templateImmobilierSlug === agencyId) return templateImmobilierConfig
  return getRealEstateAgencyConfig(agencyId)
}

function cloneAgencyConfig(config: RealEstateAgency): RealEstateAgency {
  return {
    ...config,
    properties: config.properties.map((item) => ({ ...item, highlights: [...item.highlights], images: [...item.images], photos: [...item.photos], documents: [...item.documents], visits: [...item.visits], reports: [...item.reports], offers: [...item.offers] })),
    agents: config.agents.map((item) => ({ ...item, assignedPropertyIds: [...item.assignedPropertyIds] })),
    sellers: config.sellers.map((item) => ({ ...item })),
    visits: config.visits.map((item) => ({ ...item })),
    documents: config.documents.map((item) => ({ ...item })),
    photos: config.photos.map((item) => ({ ...item })),
    reports: config.reports.map((item) => ({ ...item })),
    offers: config.offers.map((item) => ({ ...item })),
    requests: config.requests.map((item) => ({ ...item })),
  }
}

function findFallbackProfileByEmail(email: string): RealEstateProfile | null {
  const agency = getFallbackAgencyById(templateImmobilierConfig.agencyId)
  const agent = agency?.agents.find((item) => item.email.toLowerCase() === email)
  if (agent) return profileFromAgent(agent)

  const seller = agency?.sellers.find((item) => item.email.toLowerCase() === email)
  if (seller) return profileFromSeller(seller)

  const ownerAccount = demoAccounts.owner.email.toLowerCase() === email ? demoAccounts.owner : null
  if (!ownerAccount) return null

  return {
    id: 'owner-demo',
    agencyId: ownerAccount.agencyId,
    email: ownerAccount.email,
    firstName: ownerAccount.name,
    lastName: '',
    name: ownerAccount.name,
    phone: '',
    role: 'owner',
    status: 'active',
  }
}

function profileFromAgent(agent: RealEstateAgent): RealEstateProfile {
  return {
    id: agent.id,
    agencyId: agent.agencyId,
    email: agent.email,
    firstName: agent.name,
    lastName: '',
    name: agent.name,
    phone: agent.phone,
    role: 'agent',
    status: agent.active ? 'active' : 'disabled',
    assignedPropertyIds: agent.assignedPropertyIds,
  }
}

function profileFromSeller(seller: RealEstateSeller): RealEstateProfile {
  return {
    id: seller.id,
    agencyId: seller.agencyId,
    email: seller.email,
    firstName: seller.name,
    lastName: '',
    name: seller.name,
    phone: '',
    role: 'seller',
    status: 'active',
    propertyId: seller.propertyId,
  }
}

function getFallbackPropertyTitle(agencyId: string, propertyId: string) {
  return getFallbackAgencyById(agencyId)?.properties.find((property) => property.id === propertyId)?.title ?? ''
}

function requireAgencyId(agencyId: string) {
  return requireNonEmpty(agencyId, 'agencyId')
}

function requireNonEmpty(value: string, name: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${name} is required.`)
  return normalized
}

function normalizeProfileRole(value?: string): RealEstateProfileRole {
  if (value === 'agent' || value === 'owner') return value
  return 'seller'
}

function normalizeVisitStatus(value?: string) {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'confirme' || normalized === 'confirmé' || normalized === 'confirmed') return 'confirmed'
  if (normalized === 'termine' || normalized === 'terminé' || normalized === 'done') return 'done'
  if (normalized === 'annule' || normalized === 'annulé' || normalized === 'cancelled') return 'cancelled'
  return 'requested'
}

function normalizeRequestType(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (normalized === 'visit' || normalized.includes('visite')) return 'visit'
  if (normalized === 'estimate' || normalized.includes('estimation')) return 'estimate'
  if (normalized === 'information' || normalized.includes('information')) return 'information'
  return 'contact'
}

function normalizeRequestStatus(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (normalized === 'in_progress' || normalized.includes('cours')) return 'in_progress'
  if (normalized === 'closed' || normalized === 'fermee' || normalized === 'fermée') return 'closed'
  return 'new'
}

function displayVisitStatus(value?: string) {
  if (value === 'confirmed') return 'Confirme'
  if (value === 'done') return 'Termine'
  if (value === 'cancelled') return 'Annule'
  return value || 'A confirmer'
}

function displayRequestType(value?: string) {
  if (value === 'visit') return 'Demande visite'
  if (value === 'estimate') return 'Demande estimation'
  if (value === 'information') return 'Demande information'
  return 'Demande contact'
}

function displayRequestStatus(value?: string) {
  if (value === 'in_progress') return 'En cours'
  if (value === 'closed') return 'Traitee'
  return value || 'Nouvelle'
}

function readString(record: RemoteRecord | undefined, key: string) {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readStringArray(record: RemoteRecord | undefined, key: string) {
  const value = record?.[key]
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string')
}

function readNumber(record: RemoteRecord | undefined, key: string) {
  const value = record?.[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function readBoolean(record: RemoteRecord | undefined, key: string) {
  const value = record?.[key]
  return typeof value === 'boolean' ? value : undefined
}

function readJson(record: RemoteRecord, key: string): JsonObject {
  const value = record[key]
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {}
}

function readDate(record: RemoteRecord, key: string) {
  const value = readString(record, key)
  return value ? value.slice(0, 10) : ''
}

function readPublicStorageUrl(bucket: string, storagePath: string) {
  if (!storagePath) return ''
  if (/^https?:\/\//.test(storagePath)) return storagePath
  return supabase?.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl ?? storagePath
}

function buildScheduledAt(date?: string, time?: string) {
  if (!date) return null
  return time ? `${date}T${time}:00` : `${date}T00:00:00`
}

function splitScheduledAt(value: string) {
  if (!value) return { date: '', time: '' }
  const [date, rawTime = ''] = value.split('T')
  return { date, time: rawTime.slice(0, 5) }
}

function readNamePart(name: string | undefined, part: 'first' | 'last') {
  if (!name?.trim()) return ''
  const parts = name.trim().split(/\s+/)
  return part === 'first' ? parts[0] ?? '' : parts.slice(1).join(' ')
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}
