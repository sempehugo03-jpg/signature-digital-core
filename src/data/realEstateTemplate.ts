import { cityaAgency, cityaAgencyId, cityaAgencySlug, readCityaProperties } from './cityaMontauban'

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
  photos: string[]
  isTemporary: boolean
}

export type RealEstateAgent = {
  id: string
  name: string
  role: string
  activeListings: number
  phone: string
  email: string
}

export type RealEstateVisit = {
  id: string
  property: string
  time: string
  buyer: string
  agent: string
}

export type RealEstateDocument = {
  id: string
  title: string
  property: string
  status: string
}

export type RealEstateOffer = {
  id: string
  buyer: string
  amount: string
  property: string
  status: string
}

export type RealEstateRequest = {
  id: string
  type: string
  contact: string
  detail: string
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
  heroImage: string
  heroTitle: string
  heroSubtitle: string
  properties: RealEstateProperty[]
  agents: RealEstateAgent[]
  visits: RealEstateVisit[]
  documents: RealEstateDocument[]
  offers: RealEstateOffer[]
  requests: RealEstateRequest[]
}

export const demoAccounts = {
  seller: { email: 'vendeur@demo.fr', password: 'demo', route: 'vendeur', label: 'Vendeur' },
  agent: { email: 'agent@demo.fr', password: 'demo', route: 'agent', label: 'Agent' },
  owner: { email: 'patron@demo.fr', password: 'demo', route: 'patron', label: 'Patron' },
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
    photos: [`${opusAssetBase}/property-1.jpg`, `${opusAssetBase}/hero-penthouse.jpg`],
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
    photos: [`${opusAssetBase}/property-2.jpg`, `${opusAssetBase}/hero-penthouse.jpg`],
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
    photos: [`${opusAssetBase}/property-3.jpg`, `${opusAssetBase}/hero-penthouse.jpg`],
    isTemporary: true,
  },
]

const templateAgents: RealEstateAgent[] = [
  {
    id: 'camille-aurel',
    name: 'Camille Aurel',
    role: 'Directrice de mandat',
    activeListings: 8,
    phone: '+33 6 11 22 33 44',
    email: 'camille@signature.fr',
  },
  {
    id: 'hugo-martin',
    name: 'Hugo Martin',
    role: 'Conseiller senior',
    activeListings: 5,
    phone: '+33 6 55 66 77 88',
    email: 'hugo@signature.fr',
  },
  {
    id: 'clara-moreau',
    name: 'Clara Moreau',
    role: 'Conseillere location et vente',
    activeListings: 3,
    phone: '+33 6 20 30 40 50',
    email: 'clara@signature.fr',
  },
]

const templateVisits: RealEstateVisit[] = [
  { id: 'v-rue-du-bac', property: 'Rue du Bac', time: '10:30', buyer: 'M. Charron', agent: 'Camille Aurel' },
  { id: 'v-avenue-montaigne', property: 'Av. Montaigne', time: '14:00', buyer: 'Famille Lebon', agent: 'Hugo Martin' },
  { id: 'v-quai-voltaire', property: 'Quai Voltaire', time: '17:30', buyer: 'Mme Dupuis', agent: 'Camille Aurel' },
]

const templateDocuments: RealEstateDocument[] = [
  { id: 'mandat', title: 'Mandat de vente', property: 'Appartement Haussmannien', status: 'Signe' },
  { id: 'dpe', title: 'DPE', property: 'Appartement Haussmannien', status: 'Ajoute' },
  { id: 'plomb', title: 'Diagnostic plomb', property: 'Appartement Haussmannien', status: 'Ajoute' },
  { id: 'copro', title: 'Reglement copropriete', property: 'Appartement Haussmannien', status: 'A verifier' },
]

const templateOffers: RealEstateOffer[] = [
  { id: 'offer-charron', buyer: 'M. Charron', amount: '1 380 000 EUR', property: 'Appartement Haussmannien', status: 'A negocier' },
  { id: 'offer-vidal', buyer: 'Famille Vidal', amount: '1 410 000 EUR', property: 'Appartement Haussmannien', status: 'Financement confirme' },
]

const templateRequests: RealEstateRequest[] = [
  { id: 'req-estimation', type: 'Demande estimation', contact: 'Claire M.', detail: 'Appartement familial Paris 7' },
  { id: 'req-visite', type: 'Demande visite', contact: 'M. Charron', detail: 'Rue du Bac - samedi matin' },
  { id: 'req-rappel', type: 'Rappel conseiller', contact: 'Famille Vidal', detail: 'Question financement et calendrier' },
]

export const templateImmobilierConfig: RealEstateAgencyConfig = {
  template: realEstateTemplateKey,
  agencyId: templateImmobilierAgencyId,
  agencySlug: templateImmobilierSlug,
  agencyName: 'Signature Immobilier',
  baseVisual: 'Opus Domus',
  city: 'Paris',
  phone: '01 42 00 00 00',
  email: 'contact@signature-immobilier.fr',
  address: "12 rue de l'Universite, 75007 Paris",
  heroImage: `${opusAssetBase}/hero-penthouse.jpg`,
  heroTitle: 'Votre bien merite une signature.',
  heroSubtitle: 'Une experience immobiliere claire, elegante et suivie a chaque etape.',
  properties: opusDomusProperties,
  agents: templateAgents,
  visits: templateVisits,
  documents: templateDocuments,
  offers: templateOffers,
  requests: templateRequests,
}

export const formatTemplatePrice = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

export function getRealEstateAgencyConfig(slug: string): RealEstateAgencyConfig | undefined {
  if (slug === templateImmobilierSlug) return templateImmobilierConfig
  if (slug === cityaAgencySlug) return getCityaCompatibilityConfig()
  return undefined
}

function getCityaCompatibilityConfig(): RealEstateAgencyConfig {
  return {
    template: realEstateTemplateKey,
    agencyId: cityaAgencyId,
    agencySlug: cityaAgencySlug,
    agencyName: cityaAgency.name,
    baseVisual: 'Citya live demo',
    city: cityaAgency.city,
    phone: cityaAgency.phone,
    email: cityaAgency.email,
    address: cityaAgency.address,
    heroImage: opusDomusProperties[1].imageUrl,
    heroTitle: 'Votre projet immobilier a Montauban, suivi avec clarte.',
    heroSubtitle:
      'Location, vente, gestion et syndic : Citya Montauban vous accompagne avec une experience plus simple, plus lisible et plus rassurante.',
    properties: readCityaProperties().map((property, index) => ({
      id: property.id,
      agencyId: cityaAgencyId,
      title: property.title,
      address: property.city,
      city: property.city,
      price: property.price,
      priceValue: Number(property.price.replace(/[^\d]/g, '')) || 0,
      surface: property.surface,
      rooms: property.rooms,
      type: property.type,
      description: property.description,
      highlights: property.highlights,
      imageUrl: property.imageUrl || opusDomusProperties[index % opusDomusProperties.length].imageUrl,
      photos: property.imageUrl ? [property.imageUrl] : [opusDomusProperties[index % opusDomusProperties.length].imageUrl],
      isTemporary: property.isTemporary,
    })),
    agents: templateAgents,
    visits: templateVisits,
    documents: templateDocuments,
    offers: templateOffers,
    requests: templateRequests,
  }
}
