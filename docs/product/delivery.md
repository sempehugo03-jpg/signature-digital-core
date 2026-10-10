# Fabrya — livraison du produit client

**FABRYA_PRODUCT_READY = FAIL.** Le parcours compte → brief → démo déterministe → révision → validation fonctionne dans un environnement privé réel. Le paiement Stripe TEST et la QA navigateur ne sont pas prouvés, donc l'activation commerciale et le parcours complet ne sont pas déclarés prêts.

Preview privée : https://fabrya-product-qa.sempehugo03.chatgpt.site

Branche : `work/fabrya-product-20261010`, dépôt `sempehugo03-jpg/signature-digital-core`.

Worktree GitHub : `/workspace/scratch/90990d41f53c/fabrya-product-github`.

Source servie inspectée et worktree de développement isolé : `/workspace/scratch/90990d41f53c/fabrya-product` ; branche séparée portant le même nom, issue de la source Sites au commit `4b7369b5bee6d400d13e0d52616ea88d87d4aab6`. Aucun fichier de la source existante n'a été modifié : seuls les nouveaux namespaces produit sont ajoutés. La copie QA isolée est dans `/workspace/sites/fabrya-product-qa`.

## Ce qui est construit

Landing avec positionnement et offre 59 € / mois ; inscription/connexion/déconnexion ; sessions serveur persistantes ; projet avec entreprise et brief progressif ; autosave D1 avec boîte de sortie locale pour la déconnexion ; job durable ; états canoniques ; adapter déterministe READY/FAILED/TIMEOUT/SLOW ; reprise ; protections double clic et multi-onglets ; aperçu sandboxé ; modifications et versions immuables ; historique/comparaison ; validation figée ; gateway Stripe TEST ; webhook signé et réconciliation serveur ; activation idempotente ; espace client et gestion abonnement ; attribution initiale et événements produit.

Le produit ne connaît pas les fournisseurs, les Supervisors, les sessions Codex ou le renderer de Kévin. Le futur adapter est injecté au point de composition serveur. L'interface et les autres services produit n'ont pas à être réécrits.

L'adapter mock fabrique un HTML autonome explicitement de test ; il ne prétend pas apporter le niveau créatif de Kévin. Les références v115 sont restées intactes et n'ont pas été utilisées ou modifiées. Les liens de photos/documents sont conservés dans le brief ; aucun upload ou traitement fournisseur n'est promis.

## Preuves

- `architecture.md` : contrats, modèle de données, états, Stripe, promotion future.
- `ownership.md` : périmètre de fichiers et conflit historique évité.
- `qa-matrix.md` : chaque scénario de la matrice, avec sa méthode et ses limites.
- `hosted-http-qa.json` : 15 vérifications réelles réussies sur le Worker/D1 privé et le checkout bloqué à 503 ; aucun paiement réel ou test fournisseur simulé comme accompli.
- `tests.tap` : 21 tests automatisés réussis, 18 backend/contrat/SQL et 3 DOM. Les fixtures Stripe y sont explicitement locales.
- `gates.json` : verdicts binaires et causes restantes.
- `changed-files.txt` : liste exacte des fichiers ajoutés ; aucun fichier moteur partagé modifié.

La preuve de reprise sur disque ferme puis rouvre réellement une base SQLite, avec une horloge avancée d'une heure. La QA hébergée se déconnecte, se reconnecte et retrouve le même job ; les versions et la validation persistent dans D1. Les tests DOM vérifient la saisie hors connexion, la sauvegarde au retour réseau, la mise à jour V1 → V2, le retour de paiement via gateway-fixture et l'écran client. Linkedom ne produit ni layout ni capture d'écran : ce n'est pas une QA visuelle.

Le prix Stripe TEST existant a été vérifié par le connecteur Stripe : `price_1UO5oJA4NzNcjm7qxb3LOYwC`, 5900 centimes EUR, mensuel, actif et test, produit `prod_VOtb4X0VYbOkW3`. Aucun autre catalogue n'a été créé et le LIVE n'a pas été activé.

## Ce qui bloque le PASS complet

1. Configurer la clé Stripe TEST dans le runtime privé et le secret de signature spécifique du nouvel endpoint. Les outils disponibles masquent les secrets de Fabrya ; leur présence sur l'ancien site ne permet pas de les transférer.
2. Prévoir un ingress de webhook autorisé ou un relais serveur authentifié : l'accès propriétaire du site QA refuse les requêtes Stripe anonymes. Ne pas mettre une clé de service dans une URL, et ne pas rendre le site public pour contourner ce blocage.
3. Exécuter un vrai Checkout TEST accepté et refusé, puis une vraie confirmation/webhook et une activation dans D1. Les tests locaux correspondants passent, mais ne remplacent pas cette preuve.
4. Rendre disponible le navigateur pris en charge par l'environnement Managed Sites, puis effectuer le parcours réel et l'inspection 1440/390/320. Aucune capture n'a été inventée.

L'instance QA reste privée. `fabrya.fr` reste sur sa version actuelle et ne contient pas encore le nouveau parcours. Aucun déploiement commercial n'a été effectué. Le PASS final exige la fin des points ci-dessus avant toute promotion vers le domaine public.

## Publication et builds vérifiés

Site QA version 2 : source `5930c1f9de2869f32fafd964ce2a3e50320ec384`, deployment `appgdep_6acaa56a22a88191b79e512169909c13`, publication privée réussie.

`npm run build` du dépôt GitHub : PASS (TypeScript + Vite). `npm --prefix product run build` : PASS (Worker ESM isolé). Tests produit : 21/21 PASS. Les fichiers existants du dépôt ne sont pas modifiés.
