# Public Navigation System

La navigation publique Signature Immobilier est un seul systeme configurable.
Elle ne doit jamais etre dupliquee par agence, par theme ou par demo.

## Role

Le Public Navigation System transforme l'Agency Identity et le VisualBlueprint v1 en une configuration unique consommee par le desktop et le mobile.

Il controle uniquement :

- surface claire, sombre ou transparente ;
- densite compacte ou standard ;
- comportement statique ou sticky ;
- logo clair, sombre ou automatique ;
- liens publics disponibles ;
- CTA principal ;
- acces prive.

## Configuration

La configuration resolue contient :

- `surface`: `light`, `dark`, `transparent`
- `density`: `compact`, `standard`
- `behavior`: `static`, `sticky`
- `logoMode`: `auto`, `light`, `dark`
- `showPrimaryCta`: booleen resolu depuis `navigation.primaryCta`
- `showPrivateAccess`: booleen resolu depuis `navigation.privateAccess`
- `links`: liens publics réellement disponibles
- `primaryCta`: action principale
- `privateAccess`: action d'acces aux espaces
- `logo`: logo choisi avec fallback
- `className`: classes stables de rendu

## VisualBlueprint v1

La section `navigation` peut fournir :

```yaml
navigation:
  surface: transparent
  density: standard
  behavior: sticky
  logoMode: auto
  primaryCta: visible
  privateAccess: visible
```

Valeurs autorisees :

- `surface`: `light`, `dark`, `transparent`
- `density`: `compact`, `standard`
- `behavior`: `static`, `sticky`
- `logoMode`: `auto`, `light`, `dark`
- `primaryCta`: `visible`, `hidden`
- `privateAccess`: `visible`, `hidden`

Les anciennes valeurs de `navigation.style` peuvent servir d'alias de compatibilite lorsque les champs controles sont absents.

## Liens

Les liens sont centralises. Ils ne doivent pas etre recodes dans le JSX desktop ou mobile.

Liens possibles :

- `Accueil`: toujours disponible
- `Biens`: visible si le module biens publics est actif
- `Agence`: visible vers la section methode existante
- `Contact`: visible vers la section contact existante

Le CTA principal et l'acces prive ne sont pas des liens ordinaires.

## CTA

Le CTA principal suit cet ordre :

1. estimation si le module estimation est actif ;
2. biens si les biens publics sont actifs ;
3. contact sinon.

Il peut etre masque par `navigation.primaryCta: hidden`.

## Acces prive

L'acces prive pointe vers la connexion existante.
Il est visible uniquement si un espace prive est actif et si `navigation.privateAccess` n'est pas `hidden`.

## Logo

`logoMode: auto` choisit :

- logo clair sur surface sombre ou transparente ;
- logo sombre sur surface claire.

Si le logo demande n'existe pas, le systeme utilise le logo principal.

## Mobile

Le mobile consomme la meme configuration que le desktop :

- memes liens ;
- meme CTA ;
- meme acces prive ;
- memes regles de visibilite.

La presentation peut changer, pas la logique.

## Fallbacks

Fallbacks stables :

- `surface`: `transparent`
- `density`: `standard`
- `behavior`: `static`
- `logoMode`: `auto`
- `primaryCta`: `visible`
- `privateAccess`: `visible`

Une valeur inconnue doit etre ignoree au profit du fallback.

## Regles d'extension

Ajouter une option uniquement si elle est reutilisable par plusieurs agences.

Interdit :

- composant `HeaderLight`, `HeaderDark`, `HeaderPrestige` ;
- condition sur `agencyId`, `agencySlug` ou nom d'agence ;
- lien vers une destination inexistante ;
- navigation specifique client ;
- mega menu dans ce systeme.
