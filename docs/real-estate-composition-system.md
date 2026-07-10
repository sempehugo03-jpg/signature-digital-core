# Real Estate Composition System

Le Composition System controle la mise en scene des sections publiques de la template Signature Immobilier.

Il ne cree pas de template par agence. Il selectionne une composition officielle et l'applique au meme moteur de sections.

## Role

Une composition definit :

- l'ordre des sections existantes ;
- la largeur de contenu ;
- la densite ;
- l'espacement vertical ;
- l'alternance image / texte ;
- la dominance des images ;
- le rythme des fonds ;
- la priorite des preuves ;
- la priorite des CTA.

Elle ne definit jamais :

- une nouvelle section metier ;
- un nouveau composant client ;
- une route ;
- une logique de donnees ;
- une exception agence.

## Sections concernees

La PR 5 applique les compositions uniquement aux sections publiques existantes :

- `properties`
- `method`
- `sellerSpace`
- `reviews`
- `contact`

Le Hero, la navigation, les cartes, la fiche bien et les espaces prives restent hors perimetre.

## Compositions officielles

Il existe exactement 5 compositions officielles.

### editorial-immersive

Perception : haut de gamme, contemplative, image dominante, peu dense, rythme lent.

Ordre :

1. `properties`
2. `sellerSpace`
3. `method`
4. `reviews`
5. `contact`

Regles :

- contenu large ;
- forte respiration ;
- images dominantes ;
- alternance visuelle marquee ;
- CTA rares ;
- preuves presentes mais non agressives.

### commercial-direct

Perception : claire, efficace, orientee conversion, rapide a comprendre.

Ordre :

1. `properties`
2. `reviews`
3. `contact`
4. `method`
5. `sellerSpace`

Regles :

- biens visibles rapidement ;
- preuves proches du Hero ;
- CTA prioritaire ;
- densite moyenne ;
- rythme oriente action.

### institutional-trust

Perception : rassurante, credible, structuree, serieuse.

Ordre :

1. `reviews`
2. `method`
3. `properties`
4. `sellerSpace`
5. `contact`

Regles :

- preuves en premiere position ;
- structure stable ;
- largeur controlee ;
- densite moderee ;
- fonds sobres.

### local-human

Perception : humaine, chaleureuse, proche, locale.

Ordre :

1. `sellerSpace`
2. `method`
3. `reviews`
4. `properties`
5. `contact`

Regles :

- accompagnement valorise ;
- rythme doux ;
- surfaces chaleureuses ;
- respiration moderee ;
- CTA plus doux.

### data-investment

Perception : technique, experte, rationnelle, orientee donnees.

Ordre :

1. `properties`
2. `method`
3. `reviews`
4. `sellerSpace`
5. `contact`

Regles :

- densite plus forte ;
- sections plus compactes ;
- informations ordonnees ;
- moins de vide ;
- rythme fonctionnel.

## Mapping VisualBlueprint

Le champ officiel est :

```yaml
VisualBlueprint:
  version: v1
  layout:
    composition: editorial-immersive
```

Valeurs autorisees :

- `editorial-immersive`
- `commercial-direct`
- `institutional-trust`
- `local-human`
- `data-investment`

Les alias historiques acceptes par le resolveur de composition sont seulement des raccourcis generiques, par exemple `editorial`, `conversion`, `trust`, `local` ou `data`.

## Fallback

Si aucune composition explicite n'est fournie :

- le preset technique de fallback est `commercial-direct` ;
- l'ordre historique existant est conserve quand `sectionOrder` existe ;
- sinon l'ordre stable reste `properties`, `method`, `sellerSpace`, `reviews`, `contact`.

Ce fallback evite un changement brutal pour les agences existantes.

## Styles et tokens

Le Composition System expose :

- `data-composition="[preset]"` sur la home publique ;
- des classes `od-composition-*` ;
- `--od-composition-content-width` ;
- `--od-composition-narrow-width` ;
- `--od-composition-section-spacing` ;
- `--od-composition-mobile-spacing`.

Les styles sont centralises dans `opus-domus-template.css` et cibles uniquement sur la home publique via `data-composition`.

## Limites volontaires

Cette version ne cree pas :

- de page builder ;
- de nouvelle section ;
- de nouvelle navigation ;
- de nouveau Hero ;
- de nouvelle carte ;
- de variation specifique par agence.

## Regles d'extension

Pour ajouter une composition plus tard :

1. verifier qu'une composition existante ne suffit pas ;
2. ajouter une variante reutilisable, jamais un nom d'agence ;
3. definir un ordre uniquement avec les sections existantes ou officiellement ajoutees ;
4. documenter la perception, les regles et le fallback ;
5. ne jamais creer de template separe.

Une nouvelle agence doit toujours passer par configuration, Agency Identity et VisualBlueprint, jamais par exception.
