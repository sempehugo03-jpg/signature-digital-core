# Lovable Compliance Check

Avant d'integrer une nouvelle maquette Lovable pour une agence immobiliere, Codex doit verifier que la maquette est compatible avec le moteur immobilier commun.

## Modules obligatoires

- accueil premium present
- biens presents
- fiche bien presente
- tunnel estimation present
- demande de visite presente
- connexion presente
- espace vendeur present
- espace agent present
- espace patron present
- contact / rappel present
- pas de choix manuel de role dans la connexion

## Architecture obligatoire

- architecture compatible moteur
- pas de nouveau systeme independant
- pas de modification moteur necessaire pour une seule agence
- donnees isolables par agencyId
- habillage integrable comme skin
- pas de duplication du moteur

## Decision

Si la maquette n'est pas conforme, Codex doit refuser l'integration et lister clairement les modules manquants.

Si la maquette est conforme, Codex doit integrer uniquement :

- agencyConfig
- themeConfig
- contentConfig
- dataConfig
- assets agence
- skin agence

Le moteur immobilier commun ne doit pas etre copie, fork ou remplace.
