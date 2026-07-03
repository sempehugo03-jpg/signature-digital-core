# Lovable Extraction Spec

## 1. Vision

Lovable sert d'eclaireur creatif pour explorer une direction visuelle, une tonalite commerciale et une composition de demo.

Signature Digital ne copie jamais une demo Lovable. Signature Digital interprete une demo Lovable pour en extraire une direction applicable au moteur.

Le moteur Signature Digital reste maitre :

- le moteur ne se duplique pas ;
- l'agence se configure ;
- l'habillage s'applique ;
- les donnees restent isolees par `agencyId`.

Le code Lovable ne doit jamais etre colle dans le moteur. Les routes Lovable ne doivent jamais etre importees. Les logiques Lovable ne doivent jamais remplacer les logiques Signature Digital.

Le resultat attendu d'une extraction est une configuration exploitable :

- `themeConfig`
- `sectionVariants`
- `contentOverrides`
- `enabledModules` si necessaire
- `agencyConfig`

Cette spec s'applique d'abord au workflow immobilier et a la template immobiliere, mais elle doit rester generique pour etre reutilisable plus tard par d'autres moteurs metiers.

## 2. Entrees Acceptees

Une extraction Lovable peut partir de :

- captures d'ecran ;
- code Lovable ;
- export ZIP Lovable ;
- repo GitHub Lovable ;
- URL publique plus tard, si techniquement disponible.

Chaque entree doit etre traitee comme une source d'inspiration et d'analyse, pas comme un code a importer.

## 3. Ce Qu'on Extrait

L'extraction doit se limiter a la direction compatible avec le moteur :

- palette couleurs ;
- typographie ;
- ambiance visuelle ;
- hero title ;
- hero subtitle ;
- CTA principal ;
- `heroVariant` ;
- `sectionOrder` ;
- style des cartes ;
- style des boutons ;
- rythme visuel ;
- niveau de densite ;
- sections interessantes ;
- sections inutiles ;
- preuves / avis / confiance ;
- angle commercial.

Ces elements doivent etre reformules en configuration, variantes ou contenus reutilisables.

## 4. Ce Qu'on Refuse D'extraire

Il est interdit d'importer ou de reprendre :

- code Lovable brut ;
- routes ;
- auth ;
- logique metier ;
- permissions ;
- espaces vendeur / agent / patron ;
- composants specifiques non reutilisables ;
- donnees client non controlees ;
- exceptions codees pour une agence.

Si un element Lovable implique une nouvelle logique metier ou une exception client, il doit etre refuse ou place en parking produit.

## 5. Sortie Attendue

Une extraction doit produire une sortie standardisee :

```ts
lovableExtraction = {
  sourceType,
  extractedAt,
  summary,
  themeConfig,
  sectionVariants,
  contentOverrides,
  recommendedModules,
  rejectedElements,
  killCriticNotes
}
```

### Exemple Immobilier

```yaml
themeConfig:
  themePreset: premium_light
  primaryColor: "#0B1E4F"
  accentColor: "#D9B52C"

sectionVariants:
  hero: editorial_premium
  properties: luxury_cards
  trust: local_premium
  estimation: simple_cta
  sellerSpace: reassurance

contentOverrides:
  heroTitle: "Vendez votre bien avec une agence qui inspire confiance des les premieres secondes."
  heroSubtitle: "Une experience immobiliere premium pensee pour valoriser vos biens, rassurer vos vendeurs et rendre votre accompagnement evident."
  primaryCtaLabel: "Estimer mon bien"
  sectionOrder: "hero, properties, trust, estimation, sellerSpace, reviews, contact"
```

La sortie doit etre assez claire pour etre appliquee a une agence existante sans modifier le moteur.

## 6. Process Manuel Actuel

Le workflow manuel actuel est le suivant :

1. Hugo genere une demo Lovable depuis le brief client.
2. Hugo recupere les captures, le code, l'export ou le repo.
3. ChatGPT extrait la direction.
4. Hugo applique la config dans l'admin agence.
5. La demo moteur est verifiee.
6. Si la demo est validee, elle peut etre presentee ou activee.

Ce process reste volontairement humain au moment de la validation. L'extraction aide a accelerer la production, mais elle ne doit pas contourner les regles produit.

## 7. Process Futur

Le futur importeur devra permettre de :

1. coller du code Lovable ou importer un ZIP ;
2. analyser automatiquement la direction ;
3. previsualiser les champs extraits ;
4. laisser un humain valider, corriger ou refuser l'extraction ;
5. appliquer la configuration a `agencyConfig`.

L'importeur futur ne devra jamais :

- creer une route dediee ;
- copier un composant Lovable ;
- modifier le moteur ;
- changer les roles ou permissions ;
- melanger les donnees entre agences.

Il devra transformer Lovable en configuration, pas en code applicatif.

## 8. Definition of Done

Une extraction est valide uniquement si :

- elle ne copie aucun code Lovable ;
- elle ne modifie pas le moteur ;
- elle produit une config exploitable ;
- elle peut etre appliquee a une agence existante ;
- elle garde le moteur reutilisable ;
- elle ameliore la vitesse de production ;
- elle ameliore la qualite de la demo.

Une extraction n'est pas valide si elle force une exception client, une duplication du moteur, une route specifique ou une logique metier hors systeme de configuration.
