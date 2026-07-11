# Lovable Prompt Contract

Version officielle : `LOVABLE_PROMPT_VERSION = "v1"`

Le generateur officiel se trouve dans `src/lib/lovablePrompt.ts`.

## Role

Le prompt Lovable transforme un `ClientBrief` en consigne directement exploitable par Lovable.

Chaine cible :

```text
ClientBrief -> Prompt Lovable structure -> Demo Lovable -> VisualBlueprint v1 -> Pack visuel
```

Le prompt ne demande jamais au client ou a Lovable de choisir librement une architecture technique. Lovable cree l'univers visuel. Signature Digital execute cet univers dans son moteur.

## Source metier

La source officielle est :

- `ClientBrief`
- ou `resolveProjectClientBrief(project)` pour les projets historiques

Le generateur ne lit pas directement les anciens champs metier comme `diagnosticBlocker`, `diagnosticGoal`, `desiredFeeling`, `freeText` ou `features`. Ces champs ne sont utilises qu'indirectement par le fallback de `ClientBrief`.

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
10. `CONTRAT VISUALBLUEPRINT V1`

Les champs vides ne sont pas inclus. Le prompt ne doit pas inventer de site, de logo, de cible, d'annonce ou de contenu metier absent du brief.

## Responsabilites de Lovable

Lovable doit :

- analyser l'identite actuelle de l'agence ;
- creer une direction visuelle forte ;
- produire une demo visuelle ;
- recuperer les elements visuels publics ;
- produire un `VisualBlueprint v1` compatible ;
- produire un pack visuel minimal ;
- lister les `Capacités non supportées détectées`.

## Responsabilites de Signature Digital

Signature Digital conserve :

- les annonces ;
- les descriptions de biens ;
- les photos d’annonces ;
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
- sections publiques : `properties`, `method`, `sellerSpace`, `reviews`, `contact`
- cartes : `visual`, `editorial`, `compact`, `horizontal`, `investment`
- collection complete des biens
- fiche bien publique complete
- preuves, CTA, formulaires
- espaces vendeur, agent et patron
- responsive mobile/tablette/desktop
- animation `reduced`, `restrained`, `expressive`

## Format de sortie attendu

Lovable doit fournir :

A. Un lien ou projet de demo Lovable.

B. Un `VisualBlueprint v1` complet et valide.

C. Un pack visuel minimal :

- logo trouve ou etat `logo non disponible` ;
- palette de couleurs ;
- typographies proposees ou detectees ;
- URLs ou references des photos publiques de home selectionnees.

D. Une section courte :

```text
Capacités non supportées détectées
```

Cette section liste uniquement les elements visibles de la demo que le moteur actuel ne sait pas reproduire.

## Contrat VisualBlueprint

Le Blueprint doit commencer exactement par :

```yaml
VisualBlueprint:
  version: v1
```

Il doit rester limite aux sections et proprietes reconnues par `docs/visual-blueprint-v1.md` et `src/lib/visualBlueprint.ts`.

Il ne doit pas inventer de cle libre pour une decision visuelle principale.

## Compatibilite anciens projets

`generateLovablePromptFromProject(project)` appelle `resolveProjectClientBrief(project)`.

Un ancien projet sans `clientBrief` continue donc de produire un prompt stable via reconstruction depuis les champs historiques.

## Regle de mise a jour

Le prompt maitre ne doit evoluer que lorsqu'une capacite generique du moteur est ajoutee ou retiree.

Une demande specifique agence ne doit jamais modifier ce contrat.
