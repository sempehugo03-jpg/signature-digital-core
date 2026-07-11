# ClientBrief Contract

`ClientBrief` est la représentation métier officielle des réponses du tunnel client.

La chaine cible est :

```text
Reponses tunnel -> ClientBrief -> Projet -> Prompt Lovable -> Configuration agence -> Modules
```

Cette couche ne donne pas au client le choix d'un Hero, d'une composition, d'une navigation, d'une carte ou d'un style graphique technique. Le client décrit son besoin. Signature Digital traduit ensuite ce besoin.

## Emplacement

- Type et builder : `src/types/clientBrief.ts`
- Ecriture dans un projet : `src/data/projectStore.ts`
- Lecture compatible anciens projets : `resolveProjectClientBrief()`
- Passage vers le questionnaire interne : `src/data/signatureDigitalStore.ts`
- Passage vers les modules : `mapDesiredOutcomesToModules()`

## Structure

```ts
type ClientBrief = {
  agency: {
    companyName: string
    city: string
    area: string
    hasWebsite: boolean
    currentWebsite: string
    businessDescription: string
  }
  contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  commercial: {
    primaryGoal: string
    mainBlocker: string
    targetClient: string
  }
  perception: {
    primaryPerception: ClientBriefPerception | ''
    secondaryPerceptions: ClientBriefPerception[]
  }
  desiredOutcomes: ClientBriefDesiredOutcome[]
  sources: {
    propertiesPageUrl: string
    listingUrls: string[]
    assetSourceNotes: string
  }
  notes: {
    additionalContext: string
  }
}
```

## Champs obligatoires et facultatifs

Le builder ne bloque pas les donnees partielles. Il normalise les champs connus et laisse les champs absents vides.

- `agency.companyName` et `agency.city` viennent du tunnel actuel.
- `agency.hasWebsite` distingue une agence avec site d'une agence sans site.
- `agency.currentWebsite` est vide si `hasWebsite` vaut `false`.
- `agency.businessDescription` sert uniquement quand aucun site n'est disponible.
- `contact` peut rester partiel pour les anciens projets.
- `sources.listingUrls` et `sources.propertiesPageUrl` sont facultatifs.
- `notes.additionalContext` est facultatif.

## Vocabulaire de perception

Valeurs autorisees :

- `trust`
- `premium`
- `human`
- `expert`
- `modern`
- `transparent`

Le builder accepte les anciens libelles client comme `Confiance`, `Premium`, `Accompagnement`, `Modernite` ou `Transparence`, puis les normalise vers ce vocabulaire.

Ces valeurs ne selectionnent pas directement un design. Elles restent des signaux de brief pour les etapes suivantes.

## Desired outcomes

Valeurs autorisees :

- `generate-estimation-leads`
- `improve-property-presentation`
- `increase-visit-requests`
- `provide-seller-tracking`
- `centralize-documents-and-reports`
- `improve-team-workflow`

Le builder peut reconstruire ces outcomes depuis les anciens champs `features`, `requestedDemoElements`, `goal`, `goals`, `pain`, `pains`, `diagnosticGoal` et `diagnosticBlocker`.

## Mapping vers modules

Mapping central :

| Desired outcome | Modules existants demandes |
| --- | --- |
| `generate-estimation-leads` | `estimation`, `callback_request`, `lead_form` |
| `improve-property-presentation` | `property_listings`, `property_detail`, `premium_presentation` |
| `increase-visit-requests` | `visit_request`, `property_detail` |
| `provide-seller-tracking` | `seller_space`, `reports` |
| `centralize-documents-and-reports` | `documents`, `reports`, `seller_space` |
| `improve-team-workflow` | `professional_space`, `notifications`, `reports` |

Chaque consommateur filtre ensuite ce mapping selon son propre vocabulaire de modules. Aucun nouveau module n'est cree par ce contrat.

## Compatibilite anciens projets

Les champs historiques restent dans `Project` :

- `diagnosticBlocker`
- `pain`
- `pains`
- `diagnosticGoal`
- `goal`
- `goals`
- `diagnosticPriority`
- `desiredFeeling`
- `style`
- `freeText`
- `message`
- `currentWebsite`
- `businessDescription`
- `features`

`resolveProjectClientBrief()` applique la regle suivante :

1. si `project.clientBrief` existe, il est renormalise ;
2. sinon, le brief est reconstruit depuis les anciens champs ;
3. aucun champ historique n'est supprime ou migre destructivement.

## Regle produit

Le client exprime :

- qui est l'agence ;
- ce qu'elle veut obtenir ;
- ce qui la bloque ;
- qui elle veut convaincre ;
- comment elle veut etre percue ;
- ce que la plateforme doit ameliorer.

Signature Digital choisit ensuite la reponse technique et visuelle.
