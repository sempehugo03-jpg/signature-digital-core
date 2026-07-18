import {
  buildPublicPageImageRoles,
  type PublicPageImageRole,
  type PublicPageSource,
} from './publicPageConfig'

type ImageRoleProof = {
  name: string
  source: PublicPageSource
  heroImage?: string
  sectionImages?: string[]
  configuredRoles?: Partial<Record<PublicPageImageRole, string>>
  expectedRoles: Partial<Record<PublicPageImageRole, string | undefined>>
}

const roleUrls: Record<PublicPageImageRole, string> = {
  hero: 'https://example.com/hero.jpg',
  agency: 'https://example.com/agency.jpg',
  method: 'https://example.com/method.jpg',
  sellerSpace: 'https://example.com/seller-space.jpg',
  proof: 'https://example.com/proof.jpg',
  contact: 'https://example.com/contact.jpg',
  advisorPortrait: 'https://example.com/advisor.jpg',
  localArea: 'https://example.com/local-area.jpg',
}

export const publicPageImageRoleProofs: ImageRoleProof[] = [
  {
    name: 'tous les roles Lovable presents',
    source: 'lovable',
    sectionImages: [
      roleUrls.contact,
      roleUrls.proof,
      roleUrls.method,
      roleUrls.sellerSpace,
      roleUrls.agency,
      roleUrls.localArea,
    ],
    configuredRoles: roleUrls,
    expectedRoles: roleUrls,
  },
  {
    name: 'role Lovable manquant sans decalage',
    source: 'lovable',
    sectionImages: [
      roleUrls.method,
      roleUrls.sellerSpace,
      roleUrls.proof,
    ],
    configuredRoles: {
      hero: roleUrls.hero,
      contact: roleUrls.contact,
    },
    expectedRoles: {
      hero: roleUrls.hero,
      contact: roleUrls.contact,
      method: undefined,
      sellerSpace: undefined,
      proof: undefined,
    },
  },
  {
    name: 'ordre des images Lovable ignore si roles explicites',
    source: 'lovable',
    sectionImages: [
      roleUrls.sellerSpace,
      roleUrls.method,
      roleUrls.agency,
    ],
    configuredRoles: {
      agency: roleUrls.agency,
      method: roleUrls.method,
      sellerSpace: roleUrls.sellerSpace,
    },
    expectedRoles: {
      agency: roleUrls.agency,
      method: roleUrls.method,
      sellerSpace: roleUrls.sellerSpace,
    },
  },
  {
    name: 'imageRole partiel Lovable conserve uniquement les roles fournis',
    source: 'lovable',
    sectionImages: [
      roleUrls.agency,
      roleUrls.contact,
    ],
    configuredRoles: {
      advisorPortrait: roleUrls.advisorPortrait,
    },
    expectedRoles: {
      advisorPortrait: roleUrls.advisorPortrait,
      agency: undefined,
      contact: undefined,
    },
  },
  {
    name: 'source Lovable sans fallback index',
    source: 'lovable',
    heroImage: roleUrls.hero,
    sectionImages: [
      roleUrls.method,
      roleUrls.sellerSpace,
      roleUrls.proof,
      roleUrls.contact,
    ],
    expectedRoles: {
      hero: undefined,
      method: undefined,
      sellerSpace: undefined,
      proof: undefined,
      contact: undefined,
    },
  },
  {
    name: 'source legacy avec fallback index',
    source: 'legacy-fallback',
    heroImage: roleUrls.hero,
    sectionImages: [
      roleUrls.method,
      roleUrls.sellerSpace,
      roleUrls.agency,
      roleUrls.proof,
      roleUrls.contact,
      roleUrls.localArea,
    ],
    expectedRoles: roleUrls,
  },
]

export function resolvePublicPageImageRoleProofs() {
  return publicPageImageRoleProofs.map((proof) => {
    const roles = buildPublicPageImageRoles({
      heroImage: proof.heroImage,
      sectionImages: proof.sectionImages,
      configuredRoles: proof.configuredRoles,
      source: proof.source,
    })
    const passed = Object.entries(proof.expectedRoles).every(([role, expected]) => (
      roles[role as PublicPageImageRole] === expected
    ))

    return {
      name: proof.name,
      source: proof.source,
      passed,
      expectedRoles: proof.expectedRoles,
      actualRoles: roles,
    }
  })
}
