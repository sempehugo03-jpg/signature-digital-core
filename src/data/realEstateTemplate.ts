export const realEstateTemplateKey = 'real_estate_master_template'
export const templateImmobilierSlug = 'template-immobilier'
export const templateImmobilierAgencyId = 'template-immobilier'

const opusAssetBase = 'https://raw.githubusercontent.com/sempehugo03-jpg/opus-domus/main/src/assets'

export type RealEstateProperty = {
  id: string
  agencyId: string
  title: string
  address: string
  city: string
  price: string
  priceValue: number
  surface: string
  rooms: string
  bedrooms?: string
  type: string
  description: string
  highlights: string[]
  imageUrl: string
  images: string[]
  photos: string[]
  documents: string[]
  visits: string[]
  reports: string[]
  offers: string[]
  progress: number
  assignedAgentId: string
  sellerId: string
  isTemporary: boolean
  listingReviewStatus?: 'review-required' | 'ready'
}

export type RealEstateAgent = {
  id: string
  agencyId: string
  name: string
  role: string
  activeListings: number
  phone: string
  email: string
  active: boolean
  assignedPropertyIds: string[]
}

export type RealEstateSeller = {
  id: string
  agencyId: string
  name: string
  email: string
  propertyId: string
}

export type RealEstateVisit = {
  id: string
  agencyId: string
  propertyId: string
  property: string
  date: string
  time: string
  buyer: string
  buyerName: string
  note: string
  status: string
  agent: string
}

export type RealEstateDocument = {
  id: string
  agencyId: string
  propertyId: string
  title: string
  name: string
  type: string
  property: string
  status: string
  url: string
  createdAt: string
}

export type RealEstatePhoto = {
  id: string
  agencyId: string
  propertyId: string
  url: string
  label: string
  createdAt: string
}

export type RealEstateReport = {
  id: string
  agencyId: string
  propertyId: string
  visitId: string
  content: string
  interestLevel: string
  createdAt: string
}

export type RealEstateOffer = {
  id: string
  agencyId: string
  propertyId: string
  buyer: string
  buyerName: string
  amount: string
  property: string
  status: string
}

export type RealEstateRequest = {
  id: string
  agencyId: string
  type: string
  propertyId: string
  contact: string
  detail: string
  name: string
  phone: string
  email: string
  message: string
  status: string
}

export type RealEstateAgencyConfig = {
  template: typeof realEstateTemplateKey
  agencyId: string
  agencySlug: string
  agencyName: string
  baseVisual: string
  city: string
  phone: string
  email: string
  address: string
  logoUrl?: string
  faviconUrl?: string
  heroImage: string
  sectionImages?: string[]
  typographyHeading?: string
  typographyBody?: string
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel?: string
  themePreset?: string
  heroVariant?: string
  sectionOrder?: string
  visualBlueprint?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  properties: RealEstateProperty[]
  agents: RealEstateAgent[]
  sellers: RealEstateSeller[]
  visits: RealEstateVisit[]
  documents: RealEstateDocument[]
  photos: RealEstatePhoto[]
  reports: RealEstateReport[]
  offers: RealEstateOffer[]
  requests: RealEstateRequest[]
  enabledModules?: Record<string, boolean>
  mode?: 'demo' | 'live'
  status?: string
  contactLegalIdentity?: import('../lib/agencyContactLegalIdentity').AgencyContactAndLegalIdentity
  complianceConfig?: import('../lib/agencyCompliance').AgencyComplianceConfig
  lifecycleState?: import('../lib/agencyLifecycle').AgencyLifecycleState
}

export const demoAccounts = {
  seller: { agencyId: templateImmobilierAgencyId, email: 'vendeur@demo.fr', password: 'demo', route: 'vendeur', role: 'vendeur', name: 'Claire Garnier', label: 'Vendeur' },
  agent: { agencyId: templateImmobilierAgencyId, email: 'agent@demo.fr', password: 'demo', route: 'agent', role: 'agent', name: 'Camille Aurel', label: 'Agent' },
  owner: { agencyId: templateImmobilierAgencyId, email: 'patron@demo.fr', password: 'demo', route: 'patron', role: 'patron', name: 'Direction agence', label: 'Patron' },
} as const

export type RealEstateDemoRole = keyof typeof demoAccounts

export const fallbackPropertyImage = `${opusAssetBase}/property-1.jpg`

export const opusDomusProperties: RealEstateProperty[] = [
  {
    id: 'appartement-haussmannien',
    agencyId: templateImmobilierAgencyId,
    title: 'Appartement Haussmannien',
    address: 'Rue du Bac, 75007',
    city: 'Paris 7',
    price: '1 450 000 EUR',
    priceValue: 1_450_000,
    surface: '124 m2',
    rooms: '5 pieces',
    bedrooms: '3 chambres',
    type: 'Appartement',
    description:
      "Appartement traversant au 4e etage avec ascenseur. Parquet d'origine, moulures, cheminees en marbre. Vue degagee sur cour pavee.",
    highlights: ['Parquet ancien', 'Belle hauteur sous plafond', 'Lumiere traversante', 'Adresse rive gauche'],
    imageUrl: `${opusAssetBase}/property-1.jpg`,
    images: [`${opusAssetBase}/property-1.jpg`, `${opusAssetBase}/hero-penthouse.jpg`, `${opusAssetBase}/property-3.jpg`],
    photos: [`${opusAssetBase}/property-1.jpg`, `${opusAssetBase}/hero-penthouse.jpg`],
    documents: ['mandat', 'dpe', 'plomb', 'copro'],
    visits: ['v-rue-du-bac'],
    reports: ['report-dupuis'],
    offers: ['offer-charron', 'offer-vidal'],
    progress: 60,
    assignedAgentId: 'camille-aurel',
    sellerId: 'seller-garnier',
    isTemporary: true,
  },
  {
    id: 'duplex-contemporain',
    agencyId: templateImmobilierAgencyId,
    title: 'Duplex contemporain',
    address: 'Avenue Montaigne, 75008',
    city: 'Paris 8',
    price: '3 200 000 EUR',
    priceValue: 3_200_000,
    surface: '185 m2',
    rooms: '6 pieces',
    bedrooms: '4 chambres',
    type: 'Duplex',
    description:
      'Duplex lumineux entierement renove. Cuisine ouverte en marbre, terrasse plein sud de 22 m2.',
    highlights: ['Volumes genereux', 'Suite parentale', 'Terrasse confidentielle', 'Adresse prestige'],
    imageUrl: `${opusAssetBase}/property-2.jpg`,
    images: [`${opusAssetBase}/property-2.jpg`, `${opusAssetBase}/hero-penthouse.jpg`, `${opusAssetBase}/property-1.jpg`],
    photos: [`${opusAssetBase}/property-2.jpg`, `${opusAssetBase}/hero-penthouse.jpg`],
    documents: ['plan-montaigne'],
    visits: ['v-avenue-montaigne'],
    reports: [],
    offers: [],
    progress: 35,
    assignedAgentId: 'hugo-martin',
    sellerId: 'seller-lebon',
    isTemporary: true,
  },
  {
    id: 'loft-sur-seine',
    agencyId: templateImmobilierAgencyId,
    title: 'Loft sur Seine',
    address: 'Quai Voltaire, 75007',
    city: 'Paris 7',
    price: '1 890 000 EUR',
    priceValue: 1_890_000,
    surface: '92 m2',
    rooms: '3 pieces',
    bedrooms: '2 chambres',
    type: 'Loft',
    description:
      "Loft d'angle avec vue Seine. Verrieres d'atelier, plafonds 3,2 m, finitions sur-mesure.",
    highlights: ['Vue degagee', 'Architecture ouverte', 'Lumiere naturelle', 'Adresse iconique'],
    imageUrl: `${opusAssetBase}/property-3.jpg`,
    images: [`${opusAssetBase}/property-3.jpg`, `${opusAssetBase}/hero-penthouse.jpg`, `${opusAssetBase}/property-2.jpg`],
    photos: [`${opusAssetBase}/property-3.jpg`, `${opusAssetBase}/hero-penthouse.jpg`],
    documents: ['dpe-voltaire'],
    visits: ['v-quai-voltaire'],
    reports: [],
    offers: [],
    progress: 45,
    assignedAgentId: 'camille-aurel',
    sellerId: 'seller-voltaire',
    isTemporary: true,
  },
]

const templateAgents: RealEstateAgent[] = [
  {
    id: 'camille-aurel',
    agencyId: templateImmobilierAgencyId,
    name: 'Camille Aurel',
    role: 'Directrice de mandat',
    activeListings: 8,
    phone: '+33 6 11 22 33 44',
    email: 'agent@demo.fr',
    active: true,
    assignedPropertyIds: ['appartement-haussmannien', 'loft-sur-seine'],
  },
  {
    id: 'hugo-martin',
    agencyId: templateImmobilierAgencyId,
    name: 'Hugo Martin',
    role: 'Conseiller senior',
    activeListings: 5,
    phone: '+33 6 55 66 77 88',
    email: 'hugo@signature.fr',
    active: true,
    assignedPropertyIds: ['duplex-contemporain'],
  },
  {
    id: 'clara-moreau',
    agencyId: templateImmobilierAgencyId,
    name: 'Clara Moreau',
    role: 'Conseillere location et vente',
    activeListings: 3,
    phone: '+33 6 20 30 40 50',
    email: 'clara@signature.fr',
    active: true,
    assignedPropertyIds: [],
  },
]

const templateSellers: RealEstateSeller[] = [
  { id: 'seller-garnier', agencyId: templateImmobilierAgencyId, name: 'Claire Garnier', email: 'vendeur@demo.fr', propertyId: 'appartement-haussmannien' },
  { id: 'seller-lebon', agencyId: templateImmobilierAgencyId, name: 'Famille Lebon', email: 'lebon@example.fr', propertyId: 'duplex-contemporain' },
  { id: 'seller-voltaire', agencyId: templateImmobilierAgencyId, name: 'Mme Dupuis', email: 'dupuis@example.fr', propertyId: 'loft-sur-seine' },
]

const templateVisits: RealEstateVisit[] = [
  {
    id: 'v-rue-du-bac',
    agencyId: templateImmobilierAgencyId,
    propertyId: 'appartement-haussmannien',
    property: 'Rue du Bac',
    date: '2026-07-02',
    time: '14:00',
    buyer: 'M. & Mme Garnier',
    buyerName: 'M. & Mme Garnier',
    note: 'Couple, 38 ans, premiere acquisition.',
    status: 'Confirme',
    agent: 'Camille Aurel',
  },
  {
    id: 'v-avenue-montaigne',
    agencyId: templateImmobilierAgencyId,
    propertyId: 'duplex-contemporain',
    property: 'Av. Montaigne',
    date: '2026-07-02',
    time: '14:00',
    buyer: 'Famille Lebon',
    buyerName: 'Famille Lebon',
    note: 'Recherche residence principale avec terrasse.',
    status: 'Confirme',
    agent: 'Hugo Martin',
  },
  {
    id: 'v-quai-voltaire',
    agencyId: templateImmobilierAgencyId,
    propertyId: 'loft-sur-seine',
    property: 'Quai Voltaire',
    date: '2026-07-02',
    time: '17:30',
    buyer: 'Mme Dupuis',
    buyerName: 'Mme Dupuis',
    note: 'Profil investisseur, financement valide.',
    status: 'A confirmer',
    agent: 'Camille Aurel',
  },
]

const templateDocuments: RealEstateDocument[] = [
  { id: 'mandat', agencyId: templateImmobilierAgencyId, propertyId: 'appartement-haussmannien', title: 'Mandat de vente', name: 'Mandat de vente', type: 'Mandat', property: 'Appartement Haussmannien', status: 'Signe', url: '#', createdAt: '2026-06-15' },
  { id: 'dpe', agencyId: templateImmobilierAgencyId, propertyId: 'appartement-haussmannien', title: 'DPE', name: 'DPE', type: 'Diagnostic', property: 'Appartement Haussmannien', status: 'Ajoute', url: '#', createdAt: '2026-06-16' },
  { id: 'plomb', agencyId: templateImmobilierAgencyId, propertyId: 'appartement-haussmannien', title: 'Diagnostic plomb', name: 'Diagnostic plomb', type: 'Diagnostic', property: 'Appartement Haussmannien', status: 'Ajoute', url: '#', createdAt: '2026-06-17' },
  { id: 'copro', agencyId: templateImmobilierAgencyId, propertyId: 'appartement-haussmannien', title: 'Reglement copropriete', name: 'Reglement copropriete', type: 'Copropriete', property: 'Appartement Haussmannien', status: 'A verifier', url: '#', createdAt: '2026-06-18' },
  { id: 'plan-montaigne', agencyId: templateImmobilierAgencyId, propertyId: 'duplex-contemporain', title: 'Plans duplex', name: 'Plans duplex', type: 'Plan', property: 'Duplex contemporain', status: 'Ajoute', url: '#', createdAt: '2026-06-18' },
  { id: 'dpe-voltaire', agencyId: templateImmobilierAgencyId, propertyId: 'loft-sur-seine', title: 'DPE', name: 'DPE', type: 'Diagnostic', property: 'Loft sur Seine', status: 'Ajoute', url: '#', createdAt: '2026-06-19' },
]

const templatePhotos: RealEstatePhoto[] = opusDomusProperties.flatMap((property) =>
  property.images.map((url, index) => ({
    id: `${property.id}-photo-${index + 1}`,
    agencyId: templateImmobilierAgencyId,
    propertyId: property.id,
    url,
    label: index === 0 ? 'Photo principale' : `Ambiance ${index + 1}`,
    createdAt: '2026-06-15',
  })),
)

const templateReports: RealEstateReport[] = [
  {
    id: 'report-dupuis',
    agencyId: templateImmobilierAgencyId,
    propertyId: 'appartement-haussmannien',
    visitId: 'v-rue-du-bac',
    content:
      'Visite du 24 juin - Mme Dupuis. Tres bon retour sur la luminosite et le quartier. Reserves sur la cuisine. Acquereur serieux, dossier financier valide.',
    interestLevel: 'Fort',
    createdAt: '2026-06-24',
  },
]

const templateOffers: RealEstateOffer[] = [
  { id: 'offer-charron', agencyId: templateImmobilierAgencyId, propertyId: 'appartement-haussmannien', buyer: 'M. Charron', buyerName: 'M. Charron', amount: '1 380 000 EUR', property: 'Appartement Haussmannien', status: 'A negocier' },
  { id: 'offer-vidal', agencyId: templateImmobilierAgencyId, propertyId: 'appartement-haussmannien', buyer: 'Famille Vidal', buyerName: 'Famille Vidal', amount: '1 410 000 EUR', property: 'Appartement Haussmannien', status: 'Financement confirme' },
]

const templateRequests: RealEstateRequest[] = [
  {
    id: 'req-estimation',
    agencyId: templateImmobilierAgencyId,
    type: 'Demande estimation',
    propertyId: 'appartement-haussmannien',
    contact: 'Claire M.',
    detail: 'Appartement familial Paris 7',
    name: 'Claire M.',
    phone: '06 10 20 30 40',
    email: 'claire@example.fr',
    message: 'Estimation appartement familial Paris 7.',
    status: 'Nouvelle',
  },
  {
    id: 'req-visite',
    agencyId: templateImmobilierAgencyId,
    type: 'Demande visite',
    propertyId: 'appartement-haussmannien',
    contact: 'M. Charron',
    detail: 'Rue du Bac - samedi matin',
    name: 'M. Charron',
    phone: '06 42 00 00 00',
    email: 'charron@example.fr',
    message: 'Souhaite visiter Rue du Bac samedi matin.',
    status: 'A traiter',
  },
  {
    id: 'req-rappel',
    agencyId: templateImmobilierAgencyId,
    type: 'Rappel conseiller',
    propertyId: 'duplex-contemporain',
    contact: 'Famille Vidal',
    detail: 'Question financement et calendrier',
    name: 'Famille Vidal',
    phone: '06 55 00 00 00',
    email: 'vidal@example.fr',
    message: 'Question financement et calendrier.',
    status: 'En cours',
  },
]

export const templateImmobilierConfig: RealEstateAgencyConfig = {
  template: realEstateTemplateKey,
  agencyId: templateImmobilierAgencyId,
  agencySlug: templateImmobilierSlug,
  agencyName: 'Signature Immobilier',
  baseVisual: 'Template immobilier',
  city: 'Paris',
  phone: '01 42 00 00 00',
  email: 'contact@signature-immobilier.fr',
  address: "12 rue de l'Universite, 75007 Paris",
  heroImage: `${opusAssetBase}/hero-penthouse.jpg`,
  heroTitle: 'Votre bien merite une signature.',
  heroSubtitle: 'Une experience immobiliere claire, elegante et suivie a chaque etape.',
  properties: opusDomusProperties,
  agents: templateAgents,
  sellers: templateSellers,
  visits: templateVisits,
  documents: templateDocuments,
  photos: templatePhotos,
  reports: templateReports,
  offers: templateOffers,
  requests: templateRequests,
}

export const formatTemplatePrice = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

export function getTemplatePropertyById(propertyId?: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.properties.find((property) => property.id === propertyId && property.agencyId === agencyId)
}

export function getTemplateDocumentsByProperty(propertyId: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.documents.filter((document) => document.propertyId === propertyId && document.agencyId === agencyId)
}

export function getTemplatePhotosByProperty(propertyId: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.photos.filter((photo) => photo.propertyId === propertyId && photo.agencyId === agencyId)
}

export function getTemplateVisitsByProperty(propertyId: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.visits.filter((visit) => visit.propertyId === propertyId && visit.agencyId === agencyId)
}

export function getTemplateReportsByProperty(propertyId: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.reports.filter((report) => report.propertyId === propertyId && report.agencyId === agencyId)
}

export function getTemplateOffersByProperty(propertyId: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.offers.filter((offer) => offer.propertyId === propertyId && offer.agencyId === agencyId)
}

export function getTemplateRequestsByProperty(propertyId: string, agencyId = templateImmobilierAgencyId) {
  return templateImmobilierConfig.requests.filter((request) => request.propertyId === propertyId && request.agencyId === agencyId)
}

export function getRealEstateAgencyConfig(slug: string): RealEstateAgencyConfig | undefined {
  if (slug === templateImmobilierSlug) return templateImmobilierConfig
  return undefined
}
