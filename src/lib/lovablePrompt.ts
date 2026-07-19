import {
  desiredOutcomeModuleMap,
  resolveProjectClientBrief,
  type ClientBrief,
  type ClientBriefDesiredOutcome,
  type ClientBriefPerception,
  type ClientBriefBuildInput,
} from '../types/clientBrief'

export const LOVABLE_PROMPT_VERSION = 'v1'

export type LovablePromptInput = {
  brief: ClientBrief
  enabledModules?: string[]
}

export type LovablePromptSection = {
  title: string
  content: string
}

export type LovablePrompt = {
  version: typeof LOVABLE_PROMPT_VERSION
  prompt: string
  sections: LovablePromptSection[]
}

const perceptionLabels: Record<ClientBriefPerception, string> = {
  trust: 'inspirer immediatement confiance et serieux',
  premium: 'faire ressentir une experience haut de gamme sans ostentation',
  human: 'mettre en avant une relation humaine, locale et accompagnee',
  expert: 'montrer une expertise claire, structuree et rassurante',
  modern: 'donner une impression actuelle, fluide et efficace',
  transparent: 'rendre le parcours lisible, clair et sans ambiguite',
}

const desiredOutcomeLabels: Record<ClientBriefDesiredOutcome, string> = {
  'generate-estimation-leads': 'generer plus de demandes d estimation qualifiees',
  'improve-property-presentation': 'mieux presenter les biens et leur valeur percue',
  'increase-visit-requests': 'augmenter les demandes de visite qualifiees',
  'provide-seller-tracking': 'rassurer les vendeurs avec un suivi clair',
  'centralize-documents-and-reports': 'centraliser documents, comptes rendus et preuves de suivi',
  'improve-team-workflow': 'rendre le travail de l equipe plus structure et lisible',
}

const engineCapabilities = [
  '5 compositions officielles : editorial-immersive, commercial-direct, institutional-trust, local-human, data-investment.',
  'Navigation publique unique configurable : surface light/dark/transparent, densite compact/standard, comportement static/sticky, logo auto/light/dark, CTA et acces prive visibles ou masques.',
  'Hero unique configurable : layout full, split-left, split-right, centered, minimal ; surface light/dark/transparent ; hauteur compact/standard/large/screen ; alignement left/center ; titre display/xl/lg ; CTA secondaire et recherche visibles ou masques.',
  'Sections publiques existantes : hero, properties, method, sellerSpace, reviews, estimate, contact, agencyStory.',
  'Cartes de biens : visual, editorial, compact, horizontal, investment.',
  'Collection complete des biens et fiche bien publique complete.',
  'Systemes publics de preuves, CTA et formulaires.',
  'Espaces vendeur, agent et patron unifies.',
  'Contrat responsive mobile, tablette, desktop.',
  'Niveaux animation : reduced, restrained, expressive.',
]

const forbiddenResponsibilities = [
  'importer les annonces',
  'inventer des biens reels',
  'gerer les photos d annonces',
  'ecrire les descriptions de biens',
  'creer les workflows metier',
  'creer l authentification',
  'creer les permissions',
  'creer le stockage',
  'creer les espaces vendeur, agent ou patron comme systemes independants',
  'modifier le moteur Signature Digital',
]

const visualBlueprintContract = [
  'Le VisualBlueprint doit commencer exactement par :',
  '',
  'VisualBlueprint:',
  '  version: v1',
  '',
  'Sections reconnues : brand, layout, hero, navigation, header, sections, propertyCards, buttons, typography, images, forms, dashboard, responsive, mobileNavigation.',
  'Valeurs composition : editorial-immersive, commercial-direct, institutional-trust, local-human, data-investment.',
  'Navigation controlee : surface light/dark/transparent ; density compact/standard ; behavior static/sticky ; logoMode auto/light/dark ; primaryCta visible/hidden ; privateAccess visible/hidden.',
  'Hero controle : layout full/split-left/split-right/centered/minimal ; surface light/dark/transparent ; height compact/standard/large/screen ; alignment left/center ; headlineScale display/xl/lg ; secondaryCta visible/hidden ; search visible/hidden.',
  'Sections : sectionOrder limite aux sections existantes ; proofVariant numbers/testimonial/institutional/compact.',
  'PropertyCards : variant visual/editorial/compact/horizontal/investment ; imageRatio portrait/landscape/square/cinematic ; density minimal/standard/compact ; pricePosition top/content/footer/overlay ; badges visible/hidden ; radius none/subtle/rounded ; border none/subtle/strong ; shadow none/minimal/elevated ; hover none/subtle/lift/image-zoom ; excerpt visible/hidden.',
  'Buttons : variant solid/outline/text ; shape none/subtle/rounded/pill ; size compact/standard/large ; hover none/subtle/lift.',
  'Forms : variant minimal/standard/guided ; density compact/standard/airy ; layout stacked/split ; fieldStyle line/bordered/filled.',
  'Dashboard : style minimal/modern/premium ; density compact/standard/airy ; navigation sidebar/topbar ; cards flat/bordered/elevated.',
  'Responsive : heroMobileHeight, mobileSpacing, mobileTypographyScale, motionLevel reduced/restrained/expressive.',
  'Ne pas inventer de cle Blueprint libre pour une decision visuelle principale.',
]

const publicPageContract = [
  'Le bloc LovableOutput doit contenir une section obligatoire publicPage.',
  'Cette section decrit la carrosserie concrete de la home publique : quoi afficher, dans quel ordre, avec quels textes, CTA, surfaces et images par role.',
  'Format attendu :',
  '',
  'publicPage:',
  '  sections:',
  '    - id: hero-main',
  '      type: hero',
  '      enabled: true',
  '      variant: editorial-split',
  '      surface: ink',
  '      eyebrow: "IMMOBILIER A TARBES"',
  '      title: "L immobilier signe, avec discretion."',
  '      description: "Texte public exact affiche dans la section."',
  '      imageRole: hero',
  '      primaryCta:',
  '        label: "Estimer mon bien"',
  '        action: estimate',
  '      secondaryCta:',
  '        label: "Decouvrir nos biens"',
  '        action: properties',
  '      emphasis: "Phrase courte de mise en avant visible."',
  '      desktopOrder: 0',
  '      mobileOrder: 0',
  '  imageRoles:',
  '    hero: "https://example.com/hero.jpg"',
  '    agency: "https://example.com/agence.jpg"',
  '',
  'Types de sections autorises : hero, properties, method, sellerSpace, reviews, estimate, contact, agencyStory.',
  'Variantes hero : legacy, editorial-split, compact.',
  'Variantes properties : legacy-grid, featured-first, dense-grid.',
  'Variantes sellerSpace : legacy-dashboard, dashboard-proof, promise.',
  'Variantes method et agencyStory : image-text, editorial, steps.',
  'Variantes reviews : legacy-proof, stats, editorial.',
  'Variantes contact : legacy-contact, portrait-form, compact.',
  'Variantes estimate : quick-estimate, cta-estimate.',
  'Surfaces autorisees : default, white, ivory, ink, muted, brand.',
  'Actions CTA autorisees : estimate, properties, contact, sellerSpace, privateSpace, none.',
  'Roles image autorises : hero, agency, method, sellerSpace, proof, contact, advisorPortrait, localArea.',
  'Chaque section doit fournir desktopOrder et mobileOrder.',
  'Chaque texte public doit etre exact, comprehensible par un visiteur, et ne jamais contenir de jargon interne comme Blueprint, LovableOutput, runtime, module, agencyId, slug ou ProjectDetail.',
  'Si un module metier est actif mais ne doit pas apparaitre sur la home, fournir la section correspondante avec enabled: false plutot que de la supprimer silencieusement.',
  'Chaque image utilisee par la home doit avoir un role explicite dans imageRoles ou dans la section via imageRole. Ne jamais fournir une image sans role.',
  'Si une decision visuelle visible dans la demo ne peut pas etre exprimee avec ces valeurs Signature Digital, la placer dans unsupportedCapabilities au lieu d inventer un type, une variante, une surface, un CTA ou un role image.',
]

const singleLovableOutputContract = [
  'Lovable peut ecrire un tres court resume humain avant le bloc technique.',
  'Lovable doit ensuite terminer sa reponse par un seul bloc YAML copiable appele LovableOutput.',
  'Toutes les informations destinees a Signature Digital doivent etre dans ce bloc unique.',
  'Ne pas produire plusieurs blocs techniques separes.',
  'Ne pas ecrire le pack visuel uniquement en prose.',
  'Apres le bloc LovableOutput, ne rien ajouter : aucun commentaire technique, aucun mapping supplementaire, aucun second bloc.',
  'Structure obligatoire :',
  '',
  'LovableOutput:',
  '  version: v1',
  '',
  '  demo:',
  '    url: "https://demo-lovable.example"',
  '',
  '  VisualBlueprint: |',
  '    VisualBlueprint:',
  '      version: v1',
  '      brand:',
  '        name: "Nom agence"',
  '      layout:',
  '        composition: editorial-immersive',
  '',
  '  VisualPack:',
  '    logo:',
  '      status: found',
  '      url: "https://example.com/logo.svg"',
  '    palette:',
  '      primary: "#111827"',
  '      secondary: "#F7F2EA"',
  '      accent: "#B08D57"',
  '      background: "#FFFFFF"',
  '      surface: "#F8F8F8"',
  '      text: "#111827"',
  '    typography:',
  '      heading: "Playfair Display"',
  '      body: "Inter"',
  '      source: detected',
  '    heroImageUrl: "https://example.com/hero.jpg"',
  '    homeImages:',
  '      - role: hero',
  '        url: "https://example.com/hero.jpg"',
  '        alt: "Facade de l agence"',
  '        sourceUrl: "https://example.com"',
  '    sectionImages:',
  '      - role: agency',
  '        url: "https://example.com/agence.jpg"',
  '        alt: "Equipe en agence"',
  '        sourceUrl: "https://example.com"',
  '',
  '  publicPage:',
  '    sections:',
  '      - id: hero-main',
  '        type: hero',
  '        enabled: true',
  '        variant: editorial-split',
  '        surface: ink',
  '        eyebrow: "IMMOBILIER A TARBES"',
  '        title: "L immobilier signe, avec discretion."',
  '        description: "Texte public exact affiche dans la section."',
  '        imageRole: hero',
  '        primaryCta:',
  '          label: "Estimer mon bien"',
  '          action: estimate',
  '        secondaryCta:',
  '          label: "Decouvrir nos biens"',
  '          action: properties',
  '        emphasis: "Phrase courte de mise en avant visible."',
  '        desktopOrder: 0',
  '        mobileOrder: 0',
  '    imageRoles:',
  '      hero: "https://example.com/hero.jpg"',
  '      agency: "https://example.com/agence.jpg"',
  '',
  '  unsupportedCapabilities:',
  '    - category: section',
  '      importance: medium',
  '      label: "Navigation transparente devenant claire au scroll"',
  '      description: "Decision visible non exprimable avec les valeurs Signature Digital actuelles."',
  '',
  'La palette doit etre structuree dans VisualPack.palette, pas decrite en phrase.',
  'Les typographies doivent etre structurees dans VisualPack.typography.',
  'Chaque image doit avoir un role explicite : hero, agency, method, sellerSpace, proof, contact, advisorPortrait ou localArea quand elle sert la home.',
  'L URL de demo doit etre dans LovableOutput.demo.url.',
  'unsupportedCapabilities doit etre dans le meme objet LovableOutput.',
]

export function generateLovablePrompt(input: LovablePromptInput): LovablePrompt {
  const sections = [
    createSection('MISSION', [
      'Tu es directeur artistique Lovable pour Signature Digital.',
      'Cree une demo visuelle premium pour une agence immobiliere a partir du brief fourni.',
      'Lovable cree l univers visuel. Signature Digital rend cet univers vivant dans son moteur.',
    ]),
    createSection('CONTEXTE AGENCE', formatAgencyContext(input.brief)),
    createSection('OBJECTIF COMMERCIAL', formatCommercialContext(input.brief)),
    createSection('PERCEPTION RECHERCHEE', formatPerceptions(input.brief)),
    createSection('IDENTITE EXISTANTE A ANALYSER', formatIdentityAnalysis(input.brief)),
    createSection('CAPACITES DU MOTEUR SIGNATURE DIGITAL', engineCapabilities),
    createSection('MODULES METIER A REPRESENTER VISUELLEMENT', formatModules(input.brief, input.enabledModules ?? [])),
    createSection('RESPONSABILITES INTERDITES A LOVABLE', forbiddenResponsibilities.map((item) => `Lovable ne doit pas ${item}.`)),
    createSection('FORMAT DE SORTIE ATTENDU', [
      'La reponse technique destinee a Signature Digital doit etre un seul objet YAML LovableOutput.',
      'A l interieur de LovableOutput : demo.url avec le lien ou projet de demo Lovable.',
      'A l interieur de LovableOutput : VisualBlueprint v1 complet et valide.',
      'A l interieur de LovableOutput : VisualPack structure avec logo, palette, typography et images rolees.',
      'A l interieur de LovableOutput : publicPage complete avec publicPage.sections et publicPage.imageRoles.',
      'A l interieur de LovableOutput : unsupportedCapabilities listant uniquement les elements visibles que le moteur actuel ne sait pas reproduire.',
      'Aucune donnee necessaire a Signature Digital ne doit exister uniquement dans le texte libre.',
      'Ne pas produire de Mapping Report complexe, de Content Manifest separe ou d Activation Pack automatise.',
    ]),
    createSection('FORMAT UNIQUE LOVABLEOUTPUT', singleLovableOutputContract),
    createSection('CONTRAT VISUALBLUEPRINT V1', visualBlueprintContract),
    createSection('CONTRAT PUBLICPAGECONFIG', publicPageContract),
  ]

  return {
    version: LOVABLE_PROMPT_VERSION,
    prompt: sections.map((section) => `## ${section.title}\n${section.content}`).join('\n\n'),
    sections,
  }
}

export function generateLovablePromptFromProject(project: ClientBriefBuildInput & { modulesEnabled?: string[] }): LovablePrompt {
  return generateLovablePrompt({
    brief: resolveProjectClientBrief(project),
    enabledModules: project.modulesEnabled ?? [],
  })
}

function createSection(title: string, lines: string[]): LovablePromptSection {
  return {
    title,
    content: lines.filter((line) => line.trim()).join('\n'),
  }
}

function formatAgencyContext(brief: ClientBrief): string[] {
  return compact([
    `Nom : ${brief.agency.companyName}`,
    brief.agency.city || brief.agency.area ? `Ville / zone : ${[brief.agency.city, brief.agency.area].filter(Boolean).join(' - ')}` : '',
    brief.agency.hasWebsite && brief.agency.currentWebsite ? `Site actuel : ${brief.agency.currentWebsite}` : '',
    !brief.agency.hasWebsite && brief.agency.businessDescription ? `Activite sans site : ${brief.agency.businessDescription}` : '',
    brief.commercial.targetClient ? `Public prioritaire : ${brief.commercial.targetClient}` : '',
  ])
}

function formatCommercialContext(brief: ClientBrief): string[] {
  return compact([
    brief.commercial.primaryGoal ? `Objectif principal : ${brief.commercial.primaryGoal}` : '',
    brief.commercial.mainBlocker ? `Difficulte principale : ${brief.commercial.mainBlocker}` : '',
    ...brief.desiredOutcomes.map((outcome) => `Resultat attendu : ${desiredOutcomeLabels[outcome]}`),
  ])
}

function formatPerceptions(brief: ClientBrief): string[] {
  const perceptions = [
    brief.perception.primaryPerception,
    ...brief.perception.secondaryPerceptions,
  ].filter((value): value is ClientBriefPerception => Boolean(value))

  return perceptions.length
    ? perceptions.map((perception) => `${perception} : ${perceptionLabels[perception]}.`)
    : ['Aucune perception explicite fournie. Ne pas inventer de preference visuelle ; proposer une direction compatible avec le brief.']
}

function formatIdentityAnalysis(brief: ClientBrief): string[] {
  if (brief.agency.hasWebsite && brief.agency.currentWebsite) {
    return [
      'Analyse le site public existant et recupere uniquement les elements publics utiles :',
      '- logo public ;',
      '- couleurs existantes ;',
      '- typographies ou equivalents ;',
      '- photos publiques de la home ;',
      '- ton editorial ;',
      '- elements reconnaissables de l agence.',
    ]
  }

  return compact([
    'Aucun site public exploitable n est fourni.',
    brief.agency.businessDescription ? `Utilise cette description comme contexte : ${brief.agency.businessDescription}` : '',
    'Ne pas inventer un logo presente comme officiel.',
    'Signaler clairement les elements visuels manquants dans le pack visuel.',
  ])
}

function formatModules(brief: ClientBrief, enabledModules: string[]): string[] {
  const outcomeLines = brief.desiredOutcomes.map((outcome) => (
    `${desiredOutcomeLabels[outcome]} -> modules representables : ${(desiredOutcomeModuleMap[outcome] ?? []).join(', ')}`
  ))
  const moduleLines = enabledModules.length ? [`Modules deja actifs ou attendus : ${enabledModules.join(', ')}`] : []

  return [
    ...outcomeLines,
    ...moduleLines,
    'Lovable peut les representer visuellement dans la demo, mais ne code pas leur logique.',
  ]
}

function compact(lines: string[]): string[] {
  return lines.filter((line) => line.trim())
}
