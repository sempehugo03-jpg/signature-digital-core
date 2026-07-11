# Public Proof System

Le Public Proof System centralise les preuves publiques de Signature Immobilier.
Il transforme uniquement des donnees fiables en elements rassurants visibles sur les pages publiques.

## Source

Le systeme lit :

- `AgencyIdentity`
- les biens publics de la meme agence
- les agents actifs de la meme agence
- les champs agence deja configures
- `VisualBlueprint.sections.proofVariant`

Il ne lit jamais le nom d'une agence pour choisir un rendu.

## Variantes

Quatre variantes sont autorisees :

- `numbers` : grands chiffres lisibles immediatement.
- `testimonial` : temoignage client, masque si aucun temoignage fiable n'existe.
- `institutional` : preuves d'expertise et d'ancrage disponibles.
- `compact` : preuves courtes en grille compacte.

## Donnees autorisees

Une preuve peut afficher :

- nombre de biens publics actuellement disponibles ;
- nombre d'agents actifs rattaches a l'agence ;
- secteur ou ville configuree ;
- temoignage uniquement si une source fiable existe dans les donnees.

Le systeme masque le bloc si aucune preuve fiable n'existe.

## Interdictions

Le systeme ne doit jamais afficher :

- chiffre fictif ;
- avis fictif ;
- certification absente ;
- valeur de demonstration presentee comme reelle ;
- preuve specifique a une agence.

## Fallback

Si `sections.proofVariant` est absent ou invalide, le fallback est `compact`.
Si la variante demandee ne dispose d'aucune donnee fiable, le bloc est masque.

## Extension

Pour ajouter une nouvelle preuve, ajouter d'abord une donnee fiable au modele metier ou a la configuration agence.
Ne jamais ajouter une preuve hardcodee pour un client.
