import { cityaAgency, cityaAgencyId, cityaAgencySlug, readCityaProperties } from './cityaMontauban'

export const realEstateTemplateKey = 'real_estate_master_template'
export const templateImmobilierSlug = 'template-immobilier'
export const templateImmobilierAgencyId = 'template-immobilier'

export type RealEstateProperty = {
  id: string
  agencyId: string
  title: string
  address: string
  city: string
  price: string
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
  heroTitle: string
  heroSubtitle: string
  properties: RealEstateProperty[]
}

export const demoAccounts = {
  seller: { email: 'vendeur@demo.fr', password: 'demo', route: 'vendeur', label: 'Vendeur' },
  agent: { email: 'agent@demo.fr', password: 'demo', route: 'agent', label: 'Agent' },
  owner: { email: 'patron@demo.fr', password: 'demo', route: 'patron', label: 'Patron' },
} as const

export type RealEstateDemoRole = keyof typeof demoAccounts

export const fallbackPropertyImage = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82'

export const opusDomusProperties: RealEstateProperty[] = [
  {
    id: 'appartement-haussmannien',
    agencyId: templateImmobilierAgencyId,
    title: 'Appartement Haussmannien',
    address: 'Rue du Bac, 75007',
    city: 'Paris 7',
    price: '1 450 000 €',
    surface: '124 m²',
    rooms: '5 pièces',
    bedrooms: '3 chambres',
    type: 'Appartement',
    description: 'Une adresse rive gauche, de beaux volumes, une lumière douce et une présentation pensée pour révéler chaque détail sans surcharger la lecture.',
    highlights: ['Parquet ancien', 'Belle hauteur sous plafond', 'Lumière traversante', 'Adresse rive gauche'],
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=84',
    photos: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=84',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82',
    ],
    isTemporary: true,
  },
  {
    id: 'duplex-contemporain',
    agencyId: templateImmobilierAgencyId,
    title: 'Duplex contemporain',
    address: 'Avenue Montaigne, 75008',
    city: 'Paris 8',
    price: '3 200 000 €',
    surface: '185 m²',
    rooms: '6 pièces',
    bedrooms: '4 chambres',
    type: 'Duplex',
    description: 'Une pièce de vie spectaculaire, une circulation fluide et une mise en scène premium pensée pour projeter l’acquéreur dès la première visite.',
    highlights: ['Volumes généreux', 'Suite parentale', 'Terrasse confidentielle', 'Adresse prestige'],
    imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84',
    photos: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=84',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=82',
    ],
    isTemporary: true,
  },
  {
    id: 'loft-sur-seine',
    agencyId: templateImmobilierAgencyId,
    title: 'Loft sur Seine',
    address: 'Quai Voltaire, 75007',
    city: 'Paris 7',
    price: '1 890 000 €',
    surface: '92 m²',
    rooms: '3 pièces',
    bedrooms: '2 chambres',
    type: 'Loft',
    description: 'Un lieu ouvert, élégant et rare, présenté avec une hiérarchie claire pour valoriser la vue, les matériaux et l’expérience de vie.',
    highlights: ['Vue dégagée', 'Architecture ouverte', 'Lumière naturelle', 'Adresse iconique'],
    imageUrl: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=84',
    photos: [
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=84',
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1400&q=82',
    ],
    isTemporary: true,
  },
]

export const templateImmobilierConfig: RealEstateAgencyConfig = {
  template: realEstateTemplateKey,
  agencyId: templateImmobilierAgencyId,
  agencySlug: templateImmobilierSlug,
  agencyName: 'Signature Immobilier Démo',
  baseVisual: 'Opus Domus',
  city: 'Paris',
  phone: '01 42 00 00 00',
  email: 'contact@signature-immobilier.fr',
  address: '12 rue de l’Université, 75007 Paris',
  heroTitle: 'Votre bien mérite une signature.',
  heroSubtitle: 'Une expérience immobilière claire, élégante et suivie à chaque étape.',
  properties: opusDomusProperties,
}

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
    heroTitle: 'Votre projet immobilier à Montauban, suivi avec clarté.',
    heroSubtitle: 'Location, vente, gestion et syndic : Citya Montauban vous accompagne avec une expérience plus simple, plus lisible et plus rassurante.',
    properties: readCityaProperties().map((property, index) => ({
      id: property.id,
      agencyId: cityaAgencyId,
      title: property.title,
      address: property.city,
      city: property.city,
      price: property.price,
      surface: property.surface,
      rooms: property.rooms,
      type: property.type,
      description: property.description,
      highlights: property.highlights,
      imageUrl: property.imageUrl || opusDomusProperties[index % opusDomusProperties.length].imageUrl,
      photos: property.imageUrl ? [property.imageUrl] : [opusDomusProperties[index % opusDomusProperties.length].imageUrl],
      isTemporary: property.isTemporary,
    })),
  }
}
