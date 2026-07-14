# Blueprint Assistant Contract

## Role

L'assistant de modification Blueprint transforme une demande admin en francais en proposition de `VisualBlueprint v1`.

Il ne modifie pas le code, ne cree aucune variante moteur, ne contacte pas Lovable et n'applique jamais une proposition sans validation humaine.

## Source Des Capacites

Le catalogue officiel est expose par `src/lib/engineCapabilities.ts`.

Il est construit depuis les valeurs reconnues par `src/lib/visualBlueprint.ts` et couvre :

- compositions ;
- navigation ;
- Hero ;
- sections ;
- cartes de biens ;
- preuves ;
- boutons ;
- formulaires ;
- dashboard prive ;
- responsive ;
- animations.

Toute demande hors catalogue doit etre retournee dans `unsupportedRequests`.

## Endpoint

Endpoint serveur :

```txt
POST /api/blueprint-assistant
```

Entree :

```ts
{
  instruction: string
  currentBlueprint: string
  clientBrief?: {
    agency?: unknown
    commercial?: unknown
    perception?: unknown
    desiredOutcomes?: unknown
  }
  capabilities: EngineCapabilityCatalog
  projectId: string
  agencyId?: string
}
```

Les donnees envoyees doivent rester limitees au besoin visuel. Ne jamais envoyer de secrets, donnees bancaires, mots de passe, documents prives ou annonces completes inutiles.

## Reponse

La reponse structuree attendue est :

```ts
{
  proposedBlueprint: string
  changes: Array<{
    section: string
    property?: string
    from?: string
    to?: string
    summary: string
  }>
  unsupportedRequests: string[]
  warnings: string[]
}
```

`proposedBlueprint` doit commencer par :

```yaml
VisualBlueprint:
  version: v1
```

## Validation

Le serveur bloque les entrees manifestement invalides, les instructions trop longues et les demandes qui sortent du perimetre produit.

Le frontend valide toujours la proposition avec `parseVisualBlueprintV1Result()` avant de l'afficher comme applicable.

La proposition est refusee si :

- le Blueprint est vide ;
- la version n'est pas `v1` ;
- le parseur officiel retourne une erreur ;
- une section ou propriete inconnue importante est detectee ;
- la proposition contient une demande de modification de code ou de workflow.

Les warnings non bloquants peuvent etre affiches sans empecher l'application.

## Modes

Variables serveur :

```txt
OPENAI_API_KEY
BLUEPRINT_ASSISTANT_MODEL
BLUEPRINT_ASSISTANT_MODE=simulation|live
```

Mode par defaut : `simulation`.

En simulation, aucun fournisseur IA n'est appele. Une proposition limitee et clairement marquee est produite depuis quelques intentions simples, ou la demande est signalee comme non supportee.

En live, l'appel fournisseur se fait uniquement cote serveur. Aucune cle ne doit etre exposee dans Vite ou React.

## Interface Admin

Dans `ProjectDetail`, le bloc "Assistant de modification" permet :

1. saisir une demande en francais ;
2. proposer un Blueprint ;
3. voir les changements, warnings et demandes impossibles ;
4. afficher le Blueprint propose en mode technique ;
5. previsualiser par comparaison non destructive ;
6. appliquer ou annuler.

## Application

Au clic "Appliquer" :

- le nouveau Blueprint est enregistre dans le Projet ;
- le formulaire local est synchronise ;
- la QA repasse en `review-required` ;
- les confirmations QA sont videes ;
- l'ancien Blueprint est conserve dans l'historique leger.

L'application ne touche jamais aux annonces, comptes, domaines, paiements, statuts d'activation ou imports.

## Historique

Chaque proposition enregistre :

- instruction admin ;
- ancien Blueprint ;
- nouveau Blueprint ;
- resume ;
- date ;
- statut `proposed`, `applied` ou `cancelled` ;
- auteur admin.

L'historique est volontairement court et ne remplace pas un systeme de versioning complet.

## Limites

Demandes explicitement non supportees :

- Hero video ;
- parallax ;
- 3D ;
- nouvelle section moteur ;
- nouveau workflow ;
- annonces ou photos d'annonces ;
- auth, permissions, Stripe ;
- modification de fichiers ou de code.

Ces demandes doivent etre expliquees a l'admin, pas appliquees.
