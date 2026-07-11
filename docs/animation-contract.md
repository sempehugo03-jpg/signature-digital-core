# Animation Contract

L'Animation Contract clot la roadmap visuelle Signature Digital.
Il centralise les mouvements autorises pour la template Signature Immobilier sans ajouter d'effet spectaculaire.

## Intentions officielles

Le moteur ne reconnait que quatre intentions :

- `feedback` : clic, hover, focus, succes, erreur, chargement.
- `reveal` : ouverture d'un menu, d'une modale ou d'un panneau.
- `transition` : changement d'etat, de vue ou d'onglet.
- `continuity` : carrousel photo, galerie et maintien de la comprehension spatiale.

Aucune autre taxonomie n'est autorisee.

## Niveaux

Trois niveaux existent :

- `reduced` : animations presque nulles, feedback indispensable uniquement.
- `restrained` : fallback par defaut, transitions courtes et calmes.
- `expressive` : legerement plus present sur surfaces publiques seulement.

Fallback : `restrained`.

Les espaces prives plafonnent toujours `expressive` a `restrained`.

## Durations

La source TypeScript est `src/lib/animationContract.ts`.

- `instant` : `0ms`
- `fast` : `140ms`
- `standard` : `220ms`
- `slow` : `320ms`

En `reduced`, les durees effectives passent a `1ms`.

## Easings

- `standard` : `cubic-bezier(0.2, 0, 0, 1)`
- `enter` : `cubic-bezier(0.16, 1, 0.3, 1)`
- `exit` : `cubic-bezier(0.4, 0, 1, 1)`

Pas de rebond, elasticite ou effet 3D.

## Tokens CSS

Les tokens principaux sont :

- `--od-motion-fast`
- `--od-motion-standard`
- `--od-motion-slow`
- `--od-motion-ease-standard`
- `--od-motion-ease-enter`
- `--od-motion-ease-exit`
- `--od-motion-distance-small`
- `--od-motion-distance-medium`
- `--od-motion-image-zoom`
- `--od-token-animation`

## VisualBlueprint

Le Blueprint v1 peut piloter :

```yaml
responsive:
  motionLevel: restrained
```

Valeurs autorisees :

- `reduced`
- `restrained`
- `expressive`

Le Blueprint ne peut pas injecter de CSS libre.

## Agency Identity

`resolveAgencyIdentity()` consomme le Blueprint normalise et ajoute :

- `animation`
- les tokens motion
- la classe `od-motion-reduced`, `od-motion-restrained` ou `od-motion-expressive`

Les espaces prives recoivent toujours un niveau effectif calme.

## Regles par zone

Navigation :

- ouverture/fermeture rapide ;
- feedback discret ;
- pas de glissement long.

Hero :

- visible immediatement ;
- pas de retard artificiel ;
- pas d'apparition spectaculaire.

Sections :

- aucune animation au scroll globale ;
- contenu toujours visible sans JavaScript.

Cartes :

- hover limite a `none`, `subtle`, `lift`, `image-zoom` ;
- lift faible ;
- zoom image contenu dans le media ;
- aucun changement de layout.

Carrousels et galerie :

- transition courte ;
- pas de 3D ;
- pas d'autoplay.

CTA et boutons :

- feedback par contraste, ombre, opacite ou micro-deplacement ;
- active state tres court ;
- loading reserve aux actions en cours.

Formulaires :

- focus visible ;
- erreur et succes lisibles ;
- pas de secousse.

Modales :

- entree/sortie courte ;
- backdrop simple ;
- scroll interne si necessaire.

Espaces prives :

- maximum `restrained` ;
- pas d'animation marketing ;
- actions metier calmes.

## Reduced motion

`prefers-reduced-motion` a toujours priorite.
Les mouvements non essentiels sont neutralises, les zooms images sont supprimes et les durees deviennent quasi instantanees.

## Performance

Autorise :

- `transform`
- `opacity`
- couleurs et bordures sur feedback court.

Interdit :

- parallax ;
- scroll-jacking ;
- effets 3D ;
- curseur personnalise ;
- autoplay ;
- animations de layout repetees ;
- boucles infinies decoratives.

Les seuls keyframes conserves sont les spinners de chargement sur boutons.
