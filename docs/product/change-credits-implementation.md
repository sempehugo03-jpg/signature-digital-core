# FABRYA — Modifications après achat, réserve de crédits (candidate privée)

## Périmètre

Cette livraison est une **candidate technique isolée**, non un déploiement. Elle ne modifie ni tarif de l'abonnement 59 EUR/mois, ni anciens objets Stripe, ni SEO, ni Kévin. Le moteur de création/modification reste explicitement hors périmètre. Aucune modification de site ou publication publique n'est simulée. L'activation du portail est **désactivée par défaut** (`FABRYA_CREDITS_ENABLED != true`). La migration SQL additionnelle n'est pas exécutée automatiquement.

## Expérience client

Page `/change-center?project=<id>` accessible aux clients abonnés via lien depuis l'espace Produit **seulement si la fonctionnalité est activée**. Conversation libre texte; images/photos/documents/audio disponibles uniquement si bucket R2 privé et vérification antivirus/format sont raccordés; capture vocale depuis MediaRecorder sur appareils compatibles. Barre des **100 crédits mensuels**, recharges distinctes, réservations et historique ; aucun prix par type de demande imposé. Texte d'explication accessible à chaque instant. L'écran ne dit jamais que le site est publié après une simple validation d'aperçu. Recharge visible mais désactivée jusqu'au prix accepté et vérifié.

## Règles internes et confiance

- Un **facturier serveur Stripe vérifié** doit confirmer chaque facture payée, la souscription au bon projet/compte, le prix 5900 EUR cents, la période réelle via les lignes de facture et le statut courant. L'opération interne `grantPaidMonth` accorde 100 crédits, avec idempotence par identifiant de facture et expiration en fin de période de facturation. Aucun crédit mensuel n'est généré par simple date calendaires ou depuis le navigateur. Les périodes non utilisées expirent; ne pas reporter automatiquement les crédits mensuels.
- Une requête unique `(project_id,request_key)` est enregistrée avec son hash et sa version de base. Les demandes distinctes en cours pour un même projet sont limitées à une. Les demandes identiques rejouées ne créent aucun nouvel événement facturable.
- Les quotas sont **estimés uniquement côté serveur** par un adaptateur de modification authentifié. Quote 1 à 50 crédits par demande avec provenance de coût. Si l'adaptateur n'existe pas : demande `awaiting_engine`, zéro crédit réservé ou débité, aucun faux résultat. Avant débit, le moteur doit fournir une preuve de version effective déjà persistée (`fp_versions`, `ready`, hash concordant, reçu vérifié).
- À l'envoi vers le moteur : **réservation provisoire**. À réception d'un aperçu réel vérifié : débit du coût constaté, plafonné par la réservation ; solde inutilisé libéré. En cas d'échec avant cette livraison : libération totale. Le refus d'un aperçu déjà livré **ne rembourse pas** le travail réalisé ; une nouvelle demande peut nécessiter des crédits supplémentaires. Aucune publication automatique de site après validation d'une version dans l'espace.
- Comptabilité atomique et append-only via déclencheurs SQLite : les comptes `held`, `spent` et `allowance` ne peuvent jamais être en négatif. Contrôle de concurrence au niveau base. Les crédits de recharges, s'ils sont ultérieurement autorisés, sont attribués seulement à partir d'une session Stripe **one-time payment** complète, `paid`, de bon montant, bon prix et bonnes métadonnées.
- Fichiers : MIME et signatures binaires contrôlés, max 8 MiB, 5 par message, quota 25 par jour; stockage dans un bucket R2 **privé**, statut quarantaine et scan obligatoire avant utilisation, aucune URL publique. En l'absence de R2/scanner : impossible d'envoyer de fichiers ou audio, interface l'explique. Prévoir politique RGPD de conservation, purge des objets orphelins et antivirus audité.
- Annulation avant livraison = libération. Après aperçu vérifié = crédit consommé. Erreurs de réseau ou moteur incertaines sont conservées et nécessitent réconciliation, pas répétées aveuglément. Aucun système de débit sur simple clic dans le navigateur.

## Contrat futur avec le moteur (non livré)

Interface attendue :

- `kind = 'authenticated-site-modifier'`
- `quote({project_id,request_id,base_version_id,message,attachments}) → {credits:int[1..50],cost_provenance}`
- `findTask(request_id)` pour déduplication et reprise après réponse perdue
- `submitTask({request_id,base_version_id,...})` **idempotent**
- `getTask(task_handle)` pour statut réel et erreurs
- `validateReceipt({request_id,project_id,base_version_id,receipt}) → {verified:true,version_id,artifact_hash,credits}` pour la preuve de livraison
- `publish({version_id,approval_id})` et `restore({previous_public_release_id})` **distincts** de l'aperçu, avec preuve indépendante de déploiement et rollback.

Le moteur doit être l'unique créateur autorisé des nouvelles versions de sites. Les routes destinées au client n'exposent **aucun endpoint de publication** ni de crédit forcé. Le retour arrière visible doit dépendre d'un déploiement sauvegardé ; l'actuelle action de choix de version privée ne suffit pas à restaurer un site public.

## Plan d'intégration sans rupture

1. Partir du dernier commit Produit vérifié; relire les commits UX et SEO non fusionnés et comparer avec la source Sites privée. Ne pas pousser aveuglément sur main ni les branches surveillées par Vercel/Netlify.
2. Appliquer `product/change-credits-schema.sql` **sur une base QA éphémère / clone vérifié**, jamais automatiquement sur la base publique. Introduire un vrai registre de migrations et des sauvegardes avant toute production.
3. Brancher `changeCreditsHttp` uniquement sous les routes authentifiées `/api/product/projects/:id/credits`, `/changes`, `/change-files`; vérifier les sessions, l'origine et la propriété du projet. Feature flag `FABRYA_CREDITS_ENABLED` reste false en LIVE.
4. Activer le centre et les uploads en QA; valider le scan des fichiers, les factures d'abonnement réelles en lecture seule, les tests multi-comptes, les interruptions provider et les transactions concurrentes.
5. Sur réception de `invoice.paid` **vérifié côté Stripe**, faire appeler le grant interne avec compensation/reconciliation sécurisée; ne pas déclarer 100 disponibles si le reçu de facture / période n'est pas probant. Pour les recharges : décider le nombre de crédits, prix TTC/HT, TVA, expiration, CGV; créer ensuite un prix Stripe conforme et le relier au paiement one-time avec idempotence et retour signé.
6. Déployer la version en QA Sites uniquement après inspection et tests navigateur 1440/390/320; vérifier qu'aucun abonnement/routage existant n'est régressé. Gate public Hugo inchangé.

## État des tests

Suite locale autonome `node --test tests/product/change-credits.test.mjs` : 10 PASS, 0 FAIL : facture payée/impayée, période, double grant, reprise, absence moteur, réserve, remboursement, aperçu prouvé, séparation propriétaires, refus anti-surconsommation et recharges non configurées.

**Non encore prouvé :** véritable paiement récurrent de crédits depuis Stripe LIVE, recharge Stripe réellement payable, scanner/R2 privé, dispatch du moteur, site modifié, aperçu hébergé, publication/restauration publiques et parcours navigateur QA complet. Tous restent FAIL/PENDING et doivent être validés avant publication.