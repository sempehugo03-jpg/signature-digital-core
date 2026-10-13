# FABRYA post-achat — nouvelle politique versionnée

La politique initiale (`42222766`, candidate non déployée) facturait au moment de l'aperçu et utilisait des versions `fp_versions` historiques. **Elle est remplacée par le contrat `site-change/v1.0.0`** dans la nouvelle candidate de revue.

Source de vérité et vérifications : [site-changes-v1.md](site-changes-v1.md) et `contracts/site-changes/v1/README.md`.

Aucun changement de l'abonnement public 59 €/mois. Les 100 crédits inclus restent conditionnés à la facture Stripe payée ; les prix des recharges ne sont pas définis. Nouvelle politique : réserve provisoire, aperçu technique Engine, approbation humaine, publication réellement prouvée et débit final côté Produit **une fois**, retour des réservations en cas de refus/échec prépublication, restauration effective côté Engine.

Le drapeau `FABRYA_CREDITS_ENABLED` reste désactivé et le serveur Produit ne connaît pas encore l'adaptateur authentifié du moteur. Aucune promesse de modification LIVE ne découle des tests isolés.