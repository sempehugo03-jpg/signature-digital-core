# QA — retour Work au Produit

Le transport Produit utilise désormais la file MCP existante. Chaque job est lié immuablement à request/project/user/version côté serveur. Le client ne choisit pas l'opérateur Work : un seul abonnement webhook vérifié doit être présent, sinon la commande reste conservée et aucun mock n'est utilisé.

Work reçoit la méthode pinée et les références de livraison dans claim.delivery. Un reçu lié au Produit exige les bons request_id/product_project_id/product_user_id, un artefact HTML autonome dans proof.artifact_html, son hash proof.client_artifact_sha256, les preuves desktop/mobile et client_access_verified. L'HTML est stocké à part du reçu, ne sort pas via request_read et revient dans fp_versions via l'adapter existant, après hash et références vérifiés. Le preview authentifié applique connect-src none, images inline, sandbox allow-scripts sans same-origin. Aucun renvoi du lien privé Sites n'est utilisé comme preuve d'accès client. Les sessions navigateur Produit sont refusées sur /mcp.

Le checkout TEST utilise le deliveryGate existant et le vérificateur du reçu Work exact. Aucun flag ne transforme une proposition mock en livraison réelle. LIVE interdit par composition QA. Aucun prix/catalogue/clé Stripe modifié.

Tests locaux : 2 PASS (deux clients, doublon, accès croisé, retour mauvais client/hash, réconciliation exacte, rejeu refusé, opérateur absent). Les reçus sont SYNTHÉTIQUES LOCAUX et ne prouvent pas une livraison réelle, des pixels ou une commande Stripe.

Méridien : lease expiré réellement repris, checkpoint/site/version conservés, aucune nouvelle création.
Blocages E2E : navigateur managed requis absent ; reçu Méridien réel non complété ; clé Stripe TEST absente du QA ; moteur de modifications #32 encore fixture de test. Crédits/modifications restent désactivés séparément. Aucun changement de fabrya.fr version 507.
