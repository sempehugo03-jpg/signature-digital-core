# FABRYA → Work : raccordement préparé, production bloquée

## État constaté le 13 octobre 2026

FABRYA.FR = BLOQUÉ pour la création directe par Work. DEMANDE CLIENT → DÉMO = FAIL / non exécutée de bout en bout. Aucun déploiement, changement de configuration, paiement, abonnement, modification de tarif ou écriture de données client réalisé.

Public : Sites version 506, source `4b7369b5bee6d400d13e0d52616ea88d87d4aab6`. Navigation et vrais pixels du parcours chargé et de `/tarifs` examinés dans le navigateur Work. Session TEST existante : projet de recrutement à Montpellier affiché « CRÉATION EN COURS », trois crédits. Aucune relance. La page tarifs affiche 90 €/mois, sans installation, premier prélèvement après 30 jours. Le code public de Checkout exige 9000 centimes EUR/mois et configure un essai de 30 jours. Son prix LIVE actuel et un cycle complet de paiement ne sont pas certifiés par cet audit.

PR #202 reste ouverte en draft, HEAD `5f9d4e1633ee33d09339d105b31d92e27570e197`. Le Worker de cette branche compose encore `deterministicKevinAdapter()`. Ses propositions ne démontrent aucune exécution Work. La source publique utilise `ACTIVE_GENERATION_ENGINE = fabrya-engine` ; ce nom n'est pas un branchement Work. Le callback public `/api/engine-delivery` exige le secret et les états du workflow historique. Il ne peut pas être utilisé tel quel comme retour d'une mission Work.

Stripe connecté à cet audit : compte Fabrya TEST `acct_1QDQzUA4NzNcjm7q`. Lecture du prix actif `price_1UO5oJA4NzNcjm7qxb3LOYwC` : 5900 centimes EUR/mois, `livemode=false`. Ceci ne valide ni la facturation publique à 90 €, ni le prix LIVE. Aucun Checkout créé.

## Mécanismes officiels réels

Le chemin correspondant directement à Work est MCP Events : serveur MCP 2.0 authentifié, `events/list`, `events/subscribe`, `events/unsubscribe`, abonnement durable et webhook signé vérifié par ChatGPT. Les événements réveillent le chat Work sous les instructions du propriétaire. Documentation : https://developers.openai.com/plugins/build/mcp-events

Les sources d'événements disponibles dans cette session sont Gmail et GitHub ; aucun connecteur FABRYA ne figure dans cette liste. Aucun abonnement FABRYA ni callback de réception Work vérifié n'est disponible ici. La recherche de plugins n'a pas identifié un connecteur FABRYA installé. Une source GitHub de PR n'est pas un événement de demande client ; elle n'est pas utilisée comme détour. Aucun polling horaire, simulation de progression ou nouveau Supervisor ajouté.

Autre mécanisme documenté : API Workspace Agents pour un agent publié, canal `agtch_…`, token dédié et autorisations d'espace. `POST https://api.chatgpt.com/v1/workspace_agents/{id}/trigger` accepte une demande asynchrone. Le statut beta peut être lu mais la réponse finale ne peut pas être récupérée directement par cette API. Ce mécanisme ne permet pas d'appeler une conversation Work ordinaire. Aucun canal FABRYA et token dédié utilisables n'ont été établis dans cette session ; aucune clé Platform ou session de navigateur n'est réutilisée à leur place.

- https://developers.openai.com/workspace-agents/trigger-runs
- https://developers.openai.com/workspace-agents/authentication

## Préparation isolée livrée

`product/work-handoff.mjs` prépare un contrat de demande lié au propriétaire, projet, version et tentative du job durable. Il fixe le hash du brief, de la méthode et la clé idempotente ; vérifie le ledger et refuse une connexion manquante. Le webhook futur ne transporte que l'ID de demande et la tentative ; les briefs seront lus par une action MCP authentifiée et bornée au job.

La validation de reçu refuse une autre identité/tentative, un résultat mock, l'absence de captures liées au hash de l'artefact et l'absence d'accès client vérifié. Cette validation de forme ne prouve pas l'authenticité d'un reçu ni ses pixels. L'authentification MCP, la réservation budgétaire atomique, la file durable, le contrôle d'URL/projet Sites, les CAS de livraison et le stockage des preuves doivent précéder son usage.

La méthode `fabrya-creation-work` est copiée dans `docs/work/fabrya-creation-work.md` depuis la compétence utilisateur désormais proposée au chargement de cette mission. Elle prescrit Work seul, signature liée à une intention commerciale, contrôle réel, 600 secondes comme objectif mesuré et absence de fausses preuves. Elle n'ajoute pas d'instructions internes Work.

Ces fichiers ne sont importés par aucun Worker et ne remplacent pas l'adapter existant. Aucun serveur MCP incomplet n'est publié. Aucun secret requis n'est inventé ou inclus.

## Raccordement à réaliser avant mise en production

1. Utiliser les jobs existants et une outbox transactionnelle isolée par propriétaire ; ne pas exporter les comptes et données globales vers Work.
2. Fournir un connecteur FABRYA authentifié : événement ci-dessus, lecture de la demande, claim CAS/lease, checkpoint, dépôt d'artefact et finalisation bornés au job. Accorder à Work ces opérations seulement, sans accès aux comptes ou paiements.
3. Installer/connecter le plugin dans Work puis créer l'abonnement via le mécanisme supporté. Obtenir un callback signé et vérifier challenge, expiration/refresh, livraison durable, dédoublonnage et permissions révoquées. Cette session n'expose pas d'action pour installer arbitrairement un nouveau serveur MCP personnalisé ; elle ne fournit aucun callback réutilisable.
4. Faire réellement créer une démo fictive par le Work réveillé : méthode pinée, génération des visuels, code, contrôle desktop/mobile, preuve de publication et accès du compte client. Mesurer réception→lien accessible et début→fin de création séparément.
5. Répéter avec événement dupliqué, mauvaise signature, autre propriétaire, ancienne tentative, interruption, limite budgétaire, panne de publication et révocation. Aucune démo ne devient ready avant preuves durables et vérification d'accès client.
6. Valider la restauration de la version publique et l'isolation des tables/bindings. Conserver tarifs, Stripe et données. Promouvoir seulement après toutes ces preuves.

## Validation et limites

Huit tests hors ligne de contrat PASS : connexion absente, autre propriétaire, idempotence/tentative, plafond, hash de méthode, brief lié au serveur, reçu obsolète et mock refusé. Les données fictives de ces tests ne sont pas une demande cliente exécutée et ne démontrent pas un circuit complet. Build du Worker privé existant PASS ; aucune modification de son code ou publication. Build racine du dépôt GitHub et paiements LIVE non rejoués.

QUALITÉ VISUELLE DU NOUVEAU CIRCUIT = NON VALIDÉE. Aucun nouveau site n'a été produit automatiquement. TEMPS RÉEL DE CRÉATION = non mesurable, aucune mission déclenchée. L'ancienne démo Équinoxe créée directement dans Work ne sert pas de preuve de déclenchement depuis fabrya.fr.

Plafond demandé conservé : 55 € HT. Dernier engagement communiqué pour l'historique Équinoxe : 45,37552 € HT. Aucun appel fournisseur payant ou service supplémentaire déclenché dans cet audit. Les ledgers des autres missions ne sont pas fusionnés et le total facturé tous projets n'est pas certifié. Réconcilier le ledger autoritaire avant toute création automatique payante.
