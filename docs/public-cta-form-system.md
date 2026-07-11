# Public CTA and Form System

Le Public CTA and Form System centralise les appels a l'action et la presentation des formulaires publics.
Il ne cree aucun nouveau workflow metier.

## CTA publics

Les actions autorisees sont :

- `estimation`
- `properties`
- `contact`
- `visit-request`
- `private-access`

Chaque contexte resout une seule action `primary`.
Les autres actions restent secondaires, textuelles ou masquees.

## Priorite

La priorite est resolue selon :

- contexte de page ;
- modules disponibles ;
- routes publiques existantes ;
- `AgencyIdentity` ;
- `VisualBlueprint.buttons`.

La fiche bien donne priorite a `visit-request`.
La collection donne priorite a `properties`.
La home et le contact donnent priorite a `estimation` lorsque le module est actif.

## Propriete Blueprint buttons

- `buttons.variant`: `solid`, `outline`, `text`
- `buttons.shape`: `none`, `subtle`, `rounded`, `pill`, avec compatibilite historique `sharp`, `soft`, `luxury-gold`
- `buttons.size`: `compact`, `standard`, `large`, ou longueur CSS sure historique
- `buttons.hover`: `none`, `subtle`, `lift`

## Formulaires publics

Les variantes autorisees sont :

- `minimal`
- `standard`
- `guided`

Les formulaires concernés sont :

- estimation ;
- demande de visite ;
- connexion, uniquement pour coherence visuelle.

Le formulaire contact reste limite aux CTA existants lorsqu'aucun workflow distinct n'est present.

## Propriete Blueprint forms

- `forms.variant`: `minimal`, `standard`, `guided`
- `forms.density`: `compact`, `standard`, `airy`
- `forms.layout`: `stacked`, `split`
- `forms.fieldStyle`: `line`, `bordered`, `filled`

## Etats

Les formulaires doivent gerer :

- initial ;
- focus ;
- erreur ;
- disabled ;
- envoi ;
- succes.

Les workflows existants restent responsables de la persistance et des traitements metier.

## Accessibilite

Les champs doivent conserver des labels visibles.
Les erreurs utilisent `aria-invalid`, `aria-describedby` et un message lisible.
Les boutons soumis pendant l'envoi exposent `aria-busy`.

## Limites volontaires

Cette PR ne cree pas :

- nouveau CRM ;
- nouveau formulaire metier ;
- nouveau tunnel ;
- nouvelle authentification ;
- CTA specifique a une agence.
