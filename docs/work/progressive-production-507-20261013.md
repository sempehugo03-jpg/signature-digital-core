# FABRYA — publication commerciale progressive, 13 octobre 2026

L'offre commerciale 59 EUR/mois est publiée sur https://fabrya.fr et https://fabrya.fr/tarifs. Le projet public existant est conservé, audience publique et domaine personnalisé confirmés par Sites après publication. Pas de reconstruction ni remplacement par le Produit QA.

## Publication réellement effectuée
- Projet : appgprj_6a7a115459c88191868cc0878eb0cfa9
- Version publique : 507, appgprj_6a7a115459c88191868cc0878eb0cfa9~appgver_d47d2a222ae88191afd2f246f6f5729f
- Déploiement : appgdep_6acd85d8c9fc8191aff4aa16a08a0b68, succeeded, 2026-10-13T01:14:25.256719+00:00
- Source publique : 22619183a017cf268f458b74baf687fc8e2fd59f
- Version précédente conservée : 506, source 4b7369b5bee6d400d13e0d52616ea88d87d4aab6
- Patch exact : public-commercial-507-20261013.patch, dans cette branche, commit 1e66849607a4b86c365c6a24a76df65bd3b00dde.

## Ce qui est ouvert / fermé
Présentation commerciale et conditions : 59 EUR/mois, installation 0 EUR, essai de 30 jours après démo validée puis activation, 5 nouvelles versions mensuelles et 3 ajustements de démo conservés des conditions existantes. Adresse FABRYA incluse, domaine externe hors forfait. Contact email, connexion et espaces clients existants conservés.
Nouvelles demandes de démo, nouvelles activations Stripe et achats de crédits fermés côté serveur par une décision codée non contournable avec un flag navigateur ou une variable d'environnement. Réponse 503 DELIVERY_NOT_VALIDATED avant parsing du brief, accès DB ou Stripe. Aucun abonnement existant ni tarif capturé modifié ; gestion/résiliation et webhooks existants préservés. Cette fermeture n'annule pas d'éventuelles sessions Stripe déjà émises avant cette version.

## Preuves et limites
npm run build PASS (Vinext + validation ESM Worker/manifest).
5/5 tests PASS : appels des trois handlers refusés sans dépendances externes/body, offre 59 pour nouveau client et snapshots 90 des abonnements actifs préservés, vieux défaut navigateur migré.
Worker compilé exécuté directement : POST /api/client-projects, /api/create-checkout-session, /api/credits/checkout => 503 DELIVERY_NOT_VALIDATED ; GET /tarifs => 200, 59 EUR et notice de fermeture.
Publication Sites => succeeded ; get_site => https://fabrya.fr, version 507, public.
Vérification HTTP réelle sur fabrya.fr après publication : PASS pour /tarifs (200, 59 EUR, aucun ancien 90 EUR, avis de fermeture), /api/create-checkout-session, /api/client-projects et /api/credits/checkout (503 DELIVERY_NOT_VALIDATED, aucune URL de paiement). /api/platform-auth/session et /api/platform-conversations renvoient 401 sans session ni données client. Les requêtes Python initiales sans User-Agent étaient filtrées par Cloudflare 403 / code 1010 ; les requêtes suivantes avec User-Agent standard ont réellement atteint l'application. Ces contrôles HTTP ne certifient pas un parcours multi-comptes connecté ni les pixels.
Pixels : NOT_VERIFIED, navigateur managed requis indisponible. Aucun contournement de preview.

Le circuit Work reçoit bien l'événement authentifié et a publié Méridien dans un projet privé. Son reçu n'est pas complété. Retour multi-clients, ouverture réelle par le propriétaire, reprise après interruption et notifications du nouveau circuit non certifiés. Commande complète Stripe TEST : BLOCKED. Aucun paiement LIVE activé. Ces gates doivent rester fermées avant leurs vrais tests de bout en bout.

## Coordination
PR205 reste draft et non fusionnée : ne pas déployer tout son delta produit QA. Son webhook existant reste enabled pour poursuivre les missions autorisées ; pas de nouveau moteur, provider, automation, Supervisor ou service payant. Aucun appel de génération lancé pendant cette publication.
Dépense nouvelle engagée 0 EUR ; historique communiqué 45,37552 EUR HT ; plafond 55 EUR HT. Facture historique non recontrôlée.

Fichiers modifiés dans la source publique :
- app/api/client-projects/route.ts
- app/api/create-checkout-session/route.ts
- app/api/credits/checkout/route.ts
- app/layout.tsx
- app/page.tsx
- app/tarifs/page.tsx
- docs/work/progressive-launch-20261013.json
- docs/work/progressive-launch-20261013.md
- src/components/public/ActivationPage.tsx
- src/components/public/MarketingPage.tsx
- src/components/public/PlatformEntry.tsx
- src/data/commercialOfferStore.ts
- src/lib/commercialLaunch.ts
- tests/commercial-launch.test.mjs
