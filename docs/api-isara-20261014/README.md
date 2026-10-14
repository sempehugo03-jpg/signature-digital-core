# ISARA — import API dans le Produit privé

Le patch qa65-import.patch contient les neuf fichiers exacts de la modification appliquée au Site privé QA65, source initiale 367339dfe6c3b2b0fe693a93acafe9ff7c280e67. Source native finale : 00d67f79a1575cd2d3023c862c2285510718c5f0.

Ce paquet de revue conserve le patch plutôt que de remplacer main : main ne contient pas le Produit privé actuel. Il n'est pas un changement prêt à fusionner ni une reconstruction du public. Appliquer seulement sur la source QA65 indiquée, avec git apply --check puis git apply. Le patch contient l'HTML ISARA original, son SHA et sa provenance API. Aucun secret.

Import via productService existant, sessions client et aperçus protégés existants, aucune queue/event Work, aucun appel OpenAI ou Stripe. Qualification preview_only ; projet expérimental figé, paiements et nouvelles générations refusés. Reprise idempotente, provenance immutable. L'aperçu autorise ses scripts et ses téléchargements locaux, refuse le réseau et garde l'origine opaque.

Validation : 15/15 tests ciblés passent (import idempotent, octets exacts, mot de passe/session, propriétaire, accès croisés 404, anonyme 401, reconnexion, gel génération/paiement, regressions Work). npm run build PASS et assertions privées PASS : DB QA uniquement, pas de migration automatique, R2, workflow ou cron.

Contrôle navigateur desktop/mobile et comparaison immersive complète VANTA : NOT_VERIFIED, navigateur officiel indisponible. Aucun nouveau coût de génération ; usage antérieur calculé 1.821245 USD, facture EUR non vérifiée.
