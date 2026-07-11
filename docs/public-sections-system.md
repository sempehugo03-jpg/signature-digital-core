# Public Sections System

Le Public Sections System est le moteur officiel des sections publiques Signature Immobilier.
Il ne cree aucune section nouvelle. Il met en scene uniquement les sections existantes.

## Sections supportees

- `properties`
- `method`
- `sellerSpace`
- `reviews`
- `contact`

## Source

Chaque section est resolue depuis :

- Agency Identity ;
- VisualBlueprint v1 ;
- Composition System.

Le contenu métier reste dans la template. Le wrapper, le rythme et la mise en scene passent par `PublicSectionConfig`.

## Configuration

`PublicSectionConfig` contient :

- `key`
- `id`
- `surface`: `default`, `muted`, `dark`, `accent`, `transparent`
- `width`: `wide`, `standard`, `narrow`
- `rhythm`: `quiet`, `regular`, `immersive`, `compact`
- `alignment`: `left`, `center`, `split`
- `density`: `airy`, `balanced`, `compact`
- `contrast`: `soft`, `strong`
- `alternateMedia`
- `className`
- `innerClassName`

## Rendu

Toutes les sections publiques passent par :

```tsx
<PublicSections>
  <PublicSection />
</PublicSections>
```

Les composants internes restent les mêmes :

- grille de biens ;
- methode ;
- aperçu espace vendeur ;
- avis ;
- CTA contact.

## Regles

Interdit :

- creer une section specifique agence ;
- creer un second moteur de sections ;
- modifier les cartes ;
- modifier le Hero ;
- modifier la navigation ;
- modifier les espaces prives ;
- coder une condition sur `agencyId` ou `agencySlug`.

Autorise :

- ajouter une valeur generique de section ;
- ajouter un token de composition ;
- ajuster les styles de la primitive officielle.

## Extension

Pour faire varier une section, modifier :

1. la configuration centrale dans `src/lib/publicSectionsSystem.ts` ;
2. les styles `.od-public-section-*` ;
3. la documentation si une nouvelle valeur generique est ajoutee.

Ne jamais dupliquer le JSX d'une section pour obtenir un style different.
