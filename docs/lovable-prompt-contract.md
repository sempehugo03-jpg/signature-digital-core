# Lovable Prompt Contract

Version officielle : `LOVABLE_PROMPT_VERSION = "v1"`

Le generateur officiel se trouve dans `src/lib/lovablePrompt.ts`.

## Role

Le prompt Lovable transforme un `ClientBrief` en consigne directement exploitable par Lovable.

Chaine cible :

```text
ClientBrief -> Prompt Lovable structure -> Demo Lovable -> LovableOutput unique -> VisualBlueprint v1 -> VisualPack -> PublicPageConfig
```

Lovable cree l'univers visuel. Signature Digital execute cet univers dans son moteur.

## Source metier

La source officielle est :

- `ClientBrief`
- ou `resolveProjectClientBrief(project)` pour les projets historiques

Le generateur ne lit pas directement les anciens champs metier comme `diagnosticBlocker`, `diagnosticGoal`, `desiredFeeling`, `freeText` ou `features`.

## Signature

```ts
generateLovablePrompt(input: {
  brief: ClientBrief
  enabledModules?: string[]
}): {
  version: 'v1'
  prompt: string
  sections: Array<{ title: string; content: string }>
}
```

## Structure du prompt

Le prompt contient ces sections :

1. `MISSION`
2. `CONTEXTE AGENCE`
3. `OBJECTIF COMMERCIAL`
4. `PERCEPTION RECHERCHEE`
5. `IDENTITE EXISTANTE A ANALYSER`
6. `CAPACITES DU MOTEUR SIGNATURE DIGITAL`
7. `MODULES METIER A REPRESENTER VISUELLEMENT`
8. `RESPONSABILITES INTERDITES A LOVABLE`
9. `FORMAT DE SORTIE ATTENDU`
10. `FORMAT UNIQUE LOVABLEOUTPUT`
11. `CONTRAT VISUALBLUEPRINT V1`
12. `CONTRAT PUBLICPAGECONFIG`

Les champs vides ne sont pas inclus. Le prompt ne doit pas inventer de site, de logo, de cible, d'annonce ou de contenu metier absent du brief.

## Responsabilites de Lovable

Lovable doit :

- analyser l'identite actuelle de l'agence ;
- creer une direction visuelle forte ;
- produire une demo visuelle ;
- recuperer les elements visuels publics ;
- produire un `VisualBlueprint v1` compatible ;
- produire un `VisualPack` structure ;
- produire une configuration `PublicPageConfig` complete ;
- lister les `unsupportedCapabilities`.

## Responsabilites de Signature Digital

Signature Digital conserve :

- les annonces ;
- les descriptions de biens ;
- les photos d'annonces ;
- les donnees metier ;
- les espaces vendeur, agent et patron ;
- les workflows ;
- l'auth ;
- les permissions ;
- le stockage ;
- l'activation.

## Capacites moteur communiquees

Le prompt communique uniquement les capacites generiques deja construites :

- 5 compositions : `editorial-immersive`, `commercial-direct`, `institutional-trust`, `local-human`, `data-investment`
- navigation publique configurable
- Hero unique configurable
- sections publiques : `hero`, `properties`, `method`, `sellerSpace`, `reviews`, `estimate`, `contact`, `agencyStory`
- cartes : `visual`, `editorial`, `compact`, `horizontal`, `investment`
- collection complete des biens
- fiche bien publique complete
- preuves, CTA, formulaires
- home publique configurable via `publicPage.sections`
- espaces vendeur, agent et patron
- responsive mobile/tablette/desktop
- animation `reduced`, `restrained`, `expressive`

## Format de sortie attendu

Lovable doit fournir une seule reponse technique pour Signature Digital : un objet YAML `LovableOutput`.

Ce bloc unique contient :

- `demo.url` pour le lien ou projet de demo Lovable ;
- `VisualBlueprint` pour le Blueprint v1 complet et valide ;
- `VisualPack` pour le logo, la palette, les typographies et les images rolees ;
- `publicPage` pour la carrosserie concrete de la home publique ;
- `unsupportedCapabilities` pour les elements visibles que le moteur actuel ne sait pas reproduire.

Lovable peut ecrire un tres court resume humain avant le bloc YAML. Apres le bloc `LovableOutput`, Lovable ne doit rien ajouter.

Aucune donnee necessaire a Signature Digital ne doit exister uniquement dans le texte libre. Le pack visuel ne doit jamais etre uniquement decrit en prose.

Le format cote Signature Digital est formalise par `docs/lovable-output-contract.md` et parse par `src/lib/lovableOutput.ts`.

## Format unique LovableOutput

Exemple complet :

```yaml
LovableOutput:
  version: v1

  demo:
    url: "https://demo-lovable.example"

  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Nom agence"
        primaryColor: "#111827"
        accentColor: "#B08D57"
      layout:
        composition: editorial-immersive
      hero:
        layout: split-left
        surface: dark
        height: screen
        alignment: left
        headlineScale: display
      navigation:
        surface: transparent
        density: standard
      sections:
        sectionOrder: hero, agencyStory, properties, contact
        proofVariant: testimonial
      propertyCards:
        variant: editorial
        imageRatio: portrait
        density: minimal
      buttons:
        variant: solid
        shape: subtle
      forms:
        variant: minimal
        density: airy
      dashboard:
        style: premium
        density: airy
      responsive:
        heroMobileHeight: large
        mobileSpacing: airy
        motionLevel: restrained

  VisualPack:
    logo:
      status: found
      url: "https://example.com/logo.svg"
    palette:
      primary: "#111827"
      secondary: "#F7F2EA"
      accent: "#B08D57"
      background: "#FFFFFF"
      surface: "#F8F8F8"
      text: "#111827"
    typography:
      heading: "Playfair Display"
      body: "Inter"
      source: detected
    imageRoles:
      hero: "https://example.com/hero.jpg"
      agency: "https://example.com/agence.jpg"
      method: "https://example.com/methode.jpg"
      proof: "https://example.com/preuve.jpg"
      contact: "https://example.com/contact.jpg"
      advisorPortrait: "https://example.com/portrait.jpg"
      localArea: "https://example.com/quartier.jpg"
      sellerSpace: "https://example.com/suivi-vendeur.jpg"
    heroImageUrl: "https://example.com/hero.jpg"
    homeImages:
      - role: hero
        url: "https://example.com/hero.jpg"
        alt: "Facade de l'agence"
        sourceUrl: "https://example.com"
    sectionImages:
      - role: agency
        url: "https://example.com/agence.jpg"
        alt: "Equipe en agence"
        sourceUrl: "https://example.com"
      - role: contact
        url: "https://example.com/contact.jpg"
        alt: "Portrait conseiller"
        sourceUrl: "https://example.com"

  publicPage:
    sections:
      - id: hero-main
        type: hero
        enabled: true
        variant: editorial-split
        surface: ink
        eyebrow: "IMMOBILIER A TARBES"
        title: "L'immobilier signe, avec discretion."
        description: "Une approche locale, attentive et premium pour vendre ou acheter avec confiance."
        imageRole: hero
        primaryCta:
          label: "Estimer mon bien"
          action: estimate
        secondaryCta:
          label: "Decouvrir nos biens"
          action: properties
        emphasis: "Une selection courte, claire et exigeante."
        desktopOrder: 0
        mobileOrder: 0

      - id: agency-story
        type: agencyStory
        enabled: true
        variant: image-text
        surface: ivory
        eyebrow: "AGENCE LOCALE"
        title: "Une presence locale, une exigence particuliere."
        description: "Un accompagnement humain, precis et lisible pour chaque projet immobilier."
        imageRole: agency
        primaryCta:
          label: "Parler a l'agence"
          action: contact
        desktopOrder: 10
        mobileOrder: 20

      - id: properties-main
        type: properties
        enabled: true
        variant: featured-first
        surface: white
        eyebrow: "SELECTION"
        title: "Nos biens"
        description: "Des biens presentes comme une collection choisie."
        imageRole: agency
        primaryCta:
          label: "Voir les biens"
          action: properties
        desktopOrder: 20
        mobileOrder: 10

      - id: seller-promise
        type: sellerSpace
        enabled: false
        variant: promise
        surface: muted
        title: "Un suivi vendeur clair"
        description: "Ce module est actif dans le moteur mais non presente sur cette home."
        imageRole: sellerSpace
        desktopOrder: 30
        mobileOrder: 30

      - id: contact-main
        type: contact
        enabled: true
        variant: portrait-form
        surface: ink
        eyebrow: "CONTACT"
        title: "Parlons de votre projet"
        description: "Une premiere conversation suffit pour clarifier la suite."
        imageRole: contact
        primaryCta:
          label: "Contacter l'agence"
          action: contact
        secondaryCta:
          label: "Demander une estimation"
          action: estimate
        desktopOrder: 40
        mobileOrder: 40
    imageRoles:
      hero: "https://example.com/hero.jpg"
      agency: "https://example.com/agence.jpg"
      contact: "https://example.com/contact.jpg"

  unsupportedCapabilities:
    - category: navigation
      importance: medium
      label: "Navigation transparente devenant claire au scroll"
      description: "Decision visible non exprimable avec les valeurs Signature Digital actuelles."
```

Regles du bloc unique :

- ne pas produire plusieurs blocs techniques separes ;
- ne pas ecrire `VisualPack` uniquement en prose ;
- structurer la palette dans `VisualPack.palette` ;
- structurer les typographies dans `VisualPack.typography` ;
- donner un role explicite a chaque image ;
- fournir uniquement des URLs publiques `http://` ou `https://` dans `VisualPack.imageRoles`, `homeImages`, `sectionImages` et `publicPage.imageRoles` ;
- ne jamais fournir de chemin interne ou local comme `src/assets/...`, `/src/assets/...`, `localhost`, `file://` ou une URL relative ;
- laisser le role image absent et declarer la limite dans `unsupportedCapabilities` si aucune URL publique n'est disponible ;
- placer `publicPage` et `unsupportedCapabilities` dans le meme objet `LovableOutput` ;
- placer toute decision non supportee dans `unsupportedCapabilities` au lieu d'inventer une valeur.

## Contrat VisualBlueprint

Le Blueprint doit commencer dans le bloc unique :

```yaml
LovableOutput:
  VisualBlueprint:
    version: v1
```

Il doit rester limite aux sections et proprietes reconnues par `docs/visual-blueprint-v1.md` et `src/lib/visualBlueprint.ts`.

Il ne doit pas inventer de cle libre pour une decision visuelle principale.

## Contrat PublicPageConfig

Lovable doit fournir une section `publicPage` complete dans le meme objet `LovableOutput`.

Champs supportes pour chaque section :

- `id`
- `type`
- `enabled`
- `variant`
- `surface`
- `eyebrow`
- `title`
- `description`
- `imageRole`
- `primaryCta`
- `secondaryCta`
- `emphasis`
- `desktopOrder`
- `mobileOrder`

Types de sections autorises :

- `hero`
- `properties`
- `method`
- `sellerSpace`
- `reviews`
- `estimate`
- `contact`
- `agencyStory`

Variantes autorisees :

- `hero` : `legacy`, `editorial-split`, `compact`
- `properties` : `legacy-grid`, `featured-first`, `dense-grid`
- `sellerSpace` : `legacy-dashboard`, `dashboard-proof`, `promise`
- `method` et `agencyStory` : `image-text`, `editorial`, `steps`
- `reviews` : `legacy-proof`, `stats`, `editorial`
- `contact` : `legacy-contact`, `portrait-form`, `compact`
- `estimate` : `quick-estimate`, `cta-estimate`

Surfaces autorisees :

- `default`
- `white`
- `ivory`
- `ink`
- `muted`
- `brand`

Actions CTA autorisees :

- `estimate`
- `properties`
- `contact`
- `sellerSpace`
- `privateSpace`
- `none`

Roles image autorises :

- `hero`
- `agency`
- `method`
- `sellerSpace`
- `proof`
- `contact`
- `advisorPortrait`
- `localArea`

Regles obligatoires :

- fournir `desktopOrder` et `mobileOrder` pour chaque section ;
- fournir les textes publics exacts a afficher dans la home ;
- fournir les CTA de chaque section uniquement avec les actions supportees ;
- fournir `enabled: false` lorsqu'un module actif ne doit pas etre presente sur la home ;
- ne fournir aucune image sans role explicite ;
- ne jamais inserer de texte technique interne dans la page publique : `Blueprint`, `LovableOutput`, `runtime`, `module`, `agencyId`, `slug`, `ProjectDetail` ;
- placer dans `unsupportedCapabilities` toute decision visible impossible a exprimer avec ce contrat, au lieu d'inventer une valeur.

## Compatibilite anciens projets

`generateLovablePromptFromProject(project)` appelle `resolveProjectClientBrief(project)`.

Un ancien projet sans `clientBrief` continue donc de produire un prompt stable via reconstruction depuis les champs historiques.

## Regle de mise a jour

Le prompt maitre ne doit evoluer que lorsqu'une capacite generique du moteur est ajoutee ou retiree.

Une demande specifique agence ne doit jamais modifier ce contrat.
