import { cityaAgency, cityaAgencyId, cityaAgencySlug, cityaProperties, readCityaProperties } from './cityaMontauban'

export const realEstateTemplateKey = 'real_estate_master_template'

export type RealEstateTemplateVariant = 'trust' | 'premium' | 'estimation' | 'local'

export type RealEstateProperty = {
  id: string
  agencyId: string
  title: string
  city: string
  neighborhood?: string
  price?: string
  rent?: string
  surface: string
  rooms: string
  bedrooms?: string
  type: string
  transaction?: 'vente' | 'location'
  description: string
  highlights: string[]
  imageUrl?: string
  imageLabel?: string
  photos: string[]
  sourceUrl?: string
  isTemporary: boolean
}

export type RealEstateAgencyConfig = {
  template: typeof realEstateTemplateKey
  agencyId: string
  agencySlug: string
  agencyName: string
  city: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  visualStyle: string
  painPoint: string
  mainObjective: string
  heroTitle: string
  heroSubtitle: string
  phone: string
  email: string
  address: string
  properties: RealEstateProperty[]
  variant: RealEstateTemplateVariant
}

export const demoAccounts = {
  seller: { email: 'vendeur@demo.fr', password: 'demo', route: 'vendeur', label: 'Vendeur' },
  agent: { email: 'agent@demo.fr', password: 'demo', route: 'agent', label: 'Agent' },
  owner: { email: 'patron@demo.fr', password: 'demo', route: 'patron', label: 'Patron / Gérant' },
} as const

export type RealEstateDemoRole = keyof typeof demoAccounts

const templatePropertyStoragePrefix = 'signature-digital-real-estate-properties'

export function getRealEstateAgencyConfig(slug: string): RealEstateAgencyConfig | undefined {
  const baseConfig = realEstateAgencyConfigs[slug]
  if (!baseConfig) return undefined

  return {
    ...baseConfig,
    properties: readTemplateProperties(slug, baseConfig.agencyId, baseConfig.properties),
  }
}

export function listRealEstateAgencyConfigs() {
  return Object.keys(realEstateAgencyConfigs).map((slug) => getRealEstateAgencyConfig(slug)).filter(Boolean) as RealEstateAgencyConfig[]
}

export function readTemplateProperties(slug: string, agencyId: string, defaults: RealEstateProperty[]) {
  if (slug === cityaAgencySlug) return mapCityaProperties(readCityaProperties())
  if (typeof window === 'undefined') return defaults

  try {
    const raw = window.localStorage.getItem(`${templatePropertyStoragePrefix}-${slug}`)
    if (!raw) return defaults

    const stored = JSON.parse(raw) as RealEstateProperty[]
    return Array.isArray(stored) && stored.length > 0 ? stored.map((property) => normalizeProperty(property, agencyId)) : defaults
  } catch {
    return defaults
  }
}

export function writeTemplateProperties(slug: string, agencyId: string, properties: RealEstateProperty[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    `${templatePropertyStoragePrefix}-${slug}`,
    JSON.stringify(properties.map((property) => normalizeProperty(property, agencyId))),
  )
}

function mapCityaProperties(properties = cityaProperties): RealEstateProperty[] {
  return properties.map((property) => ({
    id: property.id,
    agencyId: cityaAgencyId,
    title: property.title,
    city: property.city,
    neighborhood: 'Montauban',
    price: property.transaction === 'vente' ? property.price : undefined,
    rent: property.transaction === 'location' ? property.price : undefined,
    surface: property.surface,
    rooms: property.rooms,
    type: property.type,
    transaction: property.transaction,
    description: property.description,
    highlights: property.highlights,
    imageUrl: property.imageUrl,
    imageLabel: property.imageLabel,
    photos: property.imageUrl ? [property.imageUrl] : [],
    sourceUrl: property.sourceUrl,
    isTemporary: property.isTemporary,
  }))
}

function normalizeProperty(property: RealEstateProperty, agencyId: string): RealEstateProperty {
  return {
    ...property,
    id: property.id || `property-${Date.now()}`,
    agencyId,
    title: property.title ?? '',
    city: property.city ?? '',
    price: property.price ?? '',
    rent: property.rent ?? '',
    surface: property.surface ?? '',
    rooms: property.rooms ?? '',
    type: property.type ?? 'Appartement',
    description: property.description ?? '',
    highlights: property.highlights ?? [],
    photos: property.photos ?? [],
    imageLabel: property.imageLabel ?? 'Photo temporaire',
    isTemporary: property.isTemporary ?? true,
  }
}

const cityaTemplateProperties = mapCityaProperties(cityaProperties)

export const realEstateAgencyConfigs: Record<string, RealEstateAgencyConfig> = {
  'template-immobilier': {
    template: realEstateTemplateKey,
    agencyId: 'template-immobilier',
    agencySlug: 'template-immobilier',
    agencyName: 'Opus Domus',
    city: 'Ville de démonstration',
    primaryColor: '#17120d',
    secondaryColor: '#f3ede3',
    accentColor: '#b88a52',
    backgroundColor: '#fbf8f1',
    visualStyle: 'Premium editorial, chaleureux, très aéré, inspiré Opus Domus.',
    painPoint: 'L’agence veut montrer une expérience immobilière plus claire, plus premium et plus rassurante.',
    mainObjective: 'Créer la base officielle Signature Digital Immobilier, duplicable pour chaque agence.',
    heroTitle: 'Votre bien mérite une signature.',
    heroSubtitle: 'Une expérience immobilière premium pour valoriser vos biens, rassurer les vendeurs et transformer les demandes en projets qualifiés.',
    phone: '05 00 00 00 00',
    email: 'contact@signature-digital.fr',
    address: 'Template Signature Digital Immobilier',
    properties: [
      createTemporaryProperty('template-maison-signature', 'Maison signature avec jardin', 'Centre-ville', '545 000 €', '164 m²', '6 pièces', 'Maison', 'Une propriété lumineuse pensée pour montrer le niveau premium du template immobilier.', 'template-immobilier'),
      createTemporaryProperty('template-appartement-terrasse', 'Appartement terrasse dernier étage', 'Quartier recherché', '348 000 €', '92 m²', '4 pièces', 'Appartement', 'Un appartement clair, avec une fiche bien plus lisible et plus rassurante.', 'template-immobilier'),
      createTemporaryProperty('template-villa-contemporaine', 'Villa contemporaine confidentielle', 'Secteur résidentiel', '690 000 €', '210 m²', '7 pièces', 'Villa', 'Une annonce de démonstration pour valoriser photos, points forts et demande de visite qualifiée.', 'template-immobilier'),
    ],
    variant: 'premium',
  },
  [cityaAgencySlug]: {
    template: realEstateTemplateKey,
    agencyId: cityaAgencyId,
    agencySlug: cityaAgencySlug,
    agencyName: cityaAgency.name,
    city: cityaAgency.city,
    primaryColor: '#0055a4',
    secondaryColor: '#eff6ff',
    accentColor: '#f7c948',
    backgroundColor: '#f6f8fb',
    visualStyle: 'Réseau national clair, bleu Citya, très lisible, rassurant.',
    painPoint: 'Les visiteurs doivent comprendre plus vite les services Citya et les annonces disponibles.',
    mainObjective: 'Rendre l’expérience plus claire pour louer, vendre ou gérer un bien à Montauban.',
    heroTitle: 'Votre projet immobilier à Montauban, suivi avec clarté.',
    heroSubtitle: 'Location, vente, gestion et syndic : Citya Montauban vous accompagne avec une expérience plus simple, plus lisible et plus rassurante.',
    phone: cityaAgency.phone,
    email: cityaAgency.email,
    address: cityaAgency.address,
    properties: cityaTemplateProperties,
    variant: 'trust',
  },
  'agence-foch': {
    template: realEstateTemplateKey,
    agencyId: 'agence-foch',
    agencySlug: 'agence-foch',
    agencyName: 'Agence Foch',
    city: 'Tarbes',
    primaryColor: '#111827',
    secondaryColor: '#f4efe7',
    accentColor: '#b68b4c',
    backgroundColor: '#fbfaf7',
    visualStyle: 'Local, élégant, noir et doré discret.',
    painPoint: 'L’agence veut renforcer la confiance avant le premier contact.',
    mainObjective: 'Mettre en scène l’accompagnement vendeur et la preuve locale.',
    heroTitle: 'Vendre à Tarbes avec une agence qui rend chaque étape lisible.',
    heroSubtitle: 'Une expérience immobilière premium pour comprendre, suivre et valoriser votre projet sans perdre le lien humain.',
    phone: '05 62 00 00 00',
    email: 'contact@agence-foch.fr',
    address: 'Tarbes centre',
    properties: [
      createTemporaryProperty('foch-maison-ossun', 'Maison familiale à Ossun', 'Ossun', '315 000 €', '128 m²', '5 pièces', 'Maison', 'Une maison lumineuse pensée pour une famille qui veut rester proche de Tarbes.', 'agence-foch'),
      createTemporaryProperty('foch-appartement-tarbes', 'Appartement rénové centre Tarbes', 'Tarbes', '189 000 €', '76 m²', '3 pièces', 'Appartement', 'Un bien urbain clair, proche des commerces et prêt à vivre.', 'agence-foch'),
    ],
    variant: 'local',
  },
  'espaces-atypiques': {
    template: realEstateTemplateKey,
    agencyId: 'espaces-atypiques',
    agencySlug: 'espaces-atypiques',
    agencyName: 'Espaces Atypiques',
    city: 'Montauban',
    primaryColor: '#18181b',
    secondaryColor: '#f1ede6',
    accentColor: '#8f6a4a',
    backgroundColor: '#faf8f4',
    visualStyle: 'Éditorial, rareté, biens singuliers, très photographique.',
    painPoint: 'Les biens doivent paraître rares et mieux racontés.',
    mainObjective: 'Créer une expérience plus premium pour valoriser les biens atypiques.',
    heroTitle: 'Des lieux singuliers, racontés avec plus de valeur.',
    heroSubtitle: 'Une expérience claire et éditoriale pour présenter chaque bien comme une opportunité rare.',
    phone: '05 63 00 00 00',
    email: 'contact@espaces-atypiques.fr',
    address: 'Montauban et alentours',
    properties: [
      createTemporaryProperty('ea-loft-montauban', 'Loft lumineux avec terrasse', 'Montauban', '498 000 €', '142 m²', '5 pièces', 'Loft', 'Un volume atypique, ouvert, pensé pour une vie contemporaine au calme.', 'espaces-atypiques'),
      createTemporaryProperty('ea-maison-architecte', 'Maison d’architecte confidentielle', 'Tarn-et-Garonne', '690 000 €', '210 m²', '7 pièces', 'Maison', 'Une maison rare avec lignes fortes, lumière et terrain arboré.', 'espaces-atypiques'),
    ],
    variant: 'premium',
  },
}

function createTemporaryProperty(
  id: string,
  title: string,
  city: string,
  price: string,
  surface: string,
  rooms: string,
  type: string,
  description: string,
  agencyId: string,
): RealEstateProperty {
  return {
    id,
    agencyId,
    title,
    city,
    neighborhood: city,
    price,
    surface,
    rooms,
    type,
    transaction: 'vente',
    description,
    highlights: ['Bien temporaire', 'Données de démonstration', 'À remplacer'],
    imageLabel: 'Photo temporaire',
    photos: [],
    isTemporary: true,
  }
}
