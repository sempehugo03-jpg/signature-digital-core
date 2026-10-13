# Work MCP QA — reprise sans reconstruire

Le connecteur est publié sur le site privé existant `fabrya-product-qa`, avec MCP 2.0, tools et events. Lire `mcp-live-checkpoint-20261013.json` pour le déploiement réel et les limites.

Le plugin provisionné par Sites existe mais son état confirmé est NOT_INSTALLED. La page Plugins n'était pas lisible dans le navigateur cloud (Page.getFrameTree et Page.getLayoutMetrics timeouts). Ne pas inventer une permission, un callback ou un abonnement Work ; ne pas réutiliser une session ou un secret de navigateur. L'installation personnelle doit être confirmée avant tout appel aux outils.

La nouvelle source GitHub est préparée pour le Worker produit simple. La QA actuellement publiée utilise le renderer privé composé existant : `private-release/worker.ts` importe `workMcp` et route `/mcp` seulement si le host exact est `fabrya-product-qa.sempehugo03.chatgpt.site`. Son manifeste `.openai/hosting.json` conserve le project_id et DB, et ajoute `capabilities: ["mcp"]`. Le source Sites complet, distinct de l'historique GitHub, fait autorité pour ce déploiement. Aucun fichier de fabrya.fr, Stripe ou Supervisor modifié.

Les outils fournissent la méthode et une file de demandes fictives persistante avec identité Sites, idempotence, claim/lease, checkpoints et reçu de livraison. Ils ne constituent pas un moteur de génération. Work doit produire lui-même l'artefact et ses vraies preuves. Le service public et son adapter ne sont pas remplacés.

Après installation : appeler le statut en lecture ; découvrir l'événement auprès du connector_id réellement renvoyé ; créer une automation événementielle sur fabrya.demo.requested, sans horaire ni polling ; lui faire lire et réclamer la demande, appliquer la méthode pinée, créer et contrôler le site, publier en privé et enregistrer le reçu seulement après vérification desktop/mobile et accès du client. Le secret et le callback doivent provenir du véritable events/subscribe et être vérifiés, jamais copiés dans Git.

Ne pas lancer de fournisseur payant : paid_calls_allowed=false tant que le ledger autoritaire n'est pas réconcilié. Une création en utilisant les capacités déjà incluses de Work doit rester honnêtement mesurée. Ne pas présenter l'ancienne démo Équinoxe ou la demande locale SQLite comme un test client automatiquement exécuté.

Restent à vérifier en réel : découverte des events après installation, OAuth, signature/challenge, webhook réel, réveil Work, génération, lien, retour client, abonnement expiré/révocation, livraison dupliquée, reprise après interruption. Le contrôle local de deux identités est un test SQLite, pas une certification multi-comptes de production.
