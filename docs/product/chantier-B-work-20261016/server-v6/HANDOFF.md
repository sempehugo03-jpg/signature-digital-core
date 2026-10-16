# B6 — première barrière corrigée, suite canonique documentée et fermée

## Propriété et base exacte

Intégrateur unique ee22dc8c2fb4 conserve tous les Work, leases/jobs/env, configurations, wrapper/natif/UI/private-integration et publications. Produit86/f36e0fa8b562471312d0188d90dbbc0f7c4ac50b/env10, source native5bec, Work original claimed et site_registered vers appgprj_6ad29707965c8191a73d804549061f4f sont des faits du mandat, pas une nouvelle lecture B6. Aucun outil du Work/Site réel appelé ; aucune requête/DB/donnée/clé/env réelle lue ou modifiée. Aucune génération, tâche, publication ou action client. Le gel Produit86 reste intact.

Delta sur B5 PR212/e047eb2851fd41f25ed92b0c39e413c8d181369f, source locale c49b9acb27618cd75acdab4b7b0cafb1551af524. Seulement product/native-work-projects.mjs et tests/product/native-work-reception.test.mjs. Adapter et overrides intégrateur HORS PATCH ; ne pas recopier l'adapter du checkout. Méthode pinée, review Work existante, callback de réparation B5 et native-work-server inchangés. Checksums avant/après fournis.

## Reproduction et correction de la première barrière

before.log est le test ROUGE sur le backend B5 intact : une vraie completion de FIXTURE preview_only, vrai aperçu propriétaire, puis review passée par le même MCP/work-delivery-review et ses readback/writer existants ; review retourne verified mais native approve renvoie409 au lieu de200. Aucune review positive n'est seedée. Tests locaux en mémoire, preuve QA synthétique explicitement signalée ; aucune observation navigateur réelle revendiquée.

nativeWorkDeliveryVerifier lit désormais l'éventuel fp_work_delivery_reviews du MÊME request_id/version/hash, avant de choisir le reçu de preuve utilisé pour le verrou natif. Le reçu original fp_work_mcp_requests.result reste preview_only, bit-for-bit inchangé. Le correctif n'appelle ni ne crée de review. Sans review authentifiée et ses preuves, l'aperçu reste refusé à l'approbation/paiement.

Gardes cumulatives :

- projet native_work_ et propriétaire canonique ; job/version originaux exacts, ready/work-mcp, même result_hash et artefact ; request completed ; fp_work_site_bindings du même request/project/user/version ; Site/URL/client hash du reçu original identiques au binding.
- octets de fp_versions.html égaux à l'artefact Work conservé, SHA256 réel identique au hash de la version, au hash Work et au binding ; aucune substitution d'un artefact/site/client au moyen d'une review.
- vrai enregistrement d'aperçu client du même request/project/user/version/hash via la route canonique authentifiée. Un marqueur client reviewed=true n'entre jamais dans cette sélection.
- si review présente : record version/request/hash exact ; receipt qualification verified, request_id/product_version_id/client hash exacts ; proof product_version/project/user et artifact hash exacts ; request_id dans proof, s'il est fourni, doit correspondre. Les deux appareils requièrent cas PASS nommés et références de preuve non vides ; chaîne ou objet de références accepté, booléen seul refusé.
- publisher_readback enregistré par le pipeline review existant : verified, même Site, même hash, release work_release_<version originale> exacte. Puis le workDeliveryVerifier existant doit encore confirmer son propre reçu/access/provenance. deliveryGate canonique reste exigé avant approval.

L'approbation peut alors être enregistrée pour la même version, sans publier ni activer. Le reçu original ne change jamais de qualification. La validation visuelle actuelle du vrai Work, déclaré sans navigateur dans le mandat, reste NOT_VERIFIED : ce patch ne transforme pas cette absence en PASS. Il faudra un examen réel autorisé, sur ordinateur/téléphone, avant que l'opérateur existant puisse produire cette review. Aucun record de QA réelle ne doit être fabriqué.

## Contrat de review existant pour l'intégrateur

Aucun nouvel endpoint : le transport /mcp déjà monté utilise le MÊME outil fabrya_work_request_complete sur une request déjà completed, proof.operation=review. Aucun nouveau claim, job/version, consumer ou tâche. Le lease de CETTE opération est le hash de l'artefact client, selon le contrat existant, pas une reprise de lease de construction.

Correspondances indispensables : args.request_id original ; args.site_project_id Site réellement livré ; args.version_id VERSION DU SITE livrée (receipt.version_id), pas l'identifiant fp_versions ; args.demo_url URL canonique du binding ; args.lease et artifact_sha256 hash client exact ; proof.product_version_id version fp_versions originale, product_project_id et product_user_id exacts ; proof.site_change_baseline reproduit les octets ; preuves desktop/mobile issues d'un véritable examen, avec cas et références. Le serveur relit les octets privés et vérifie le writer/release avant l'enregistrement du reçu review. Ne pas envoyer cette opération dans le Work réel à partir de B6 ; l'intégrateur conserve les autorisations et le bon moment.

Limite volontaire : le port natif vise toujours la première version originale de ce parcours. Les anciennes routes de révision et les révisions artistiques ultérieures n'ont pas été ouvertes. Les projets legacy/QA114 ne passent pas par ce vérificateur natif et restent conservés.

## Validation locale et reprise

39 tests ciblés PASS/0FAIL : chaîne review réelle de fixture via MCP/readback/writer, original preview_only inchangé, idempotence du review, approbation rendue possible par cette seule preuve ; refus sans preview ou preuves QA, mauvais owner/version/site/hash, writer absent, booléen client ou reçu incomplet, release erronée, preview étranger, octets de version/Work altérés. Pas de Checkout/activation/subscription/publication dans ce test positif. B4 payload/HMAC/legacy, B5 D1/récupération et parcours historiques de connexion couverts par les suites ciblées.

Bundle backend ESM browser/es2022 PASS ; git diff --check, node --check et git apply --check sur B5 exact PASS. Fermeture62fichiers inchangée en composition ; seul hash runtime changé = native-work-projects.mjs. Aucun module/paquet/migration ajouté. Build complet UI non relancé : bundle pertinent vérifié.

**Stripe TEST/activation, après-achat et complex Work ne sont PAS livrés comme raccordés dans B6.** Le fichier ROUTES-NEXT.md décrit précisément le raccordement canonique suivant et les dépendances. Ils restent fermés, car un montage global webhook, les migrations native de conversation/crédits/engine/stockage et leurs validations TEST/owner/concurrence ne sont pas établis pour ce premier parcours gelé. Une ouverture générale dans ce delta risquerait les chemins conservés. Cette borne applique le mandat de livrer la première barrière sûre avec checkpoint, sans la présenter comme un produit terminé.

Reprise directe : appliquer seulement le delta B6 aux deux fichiers compatibles après le gel et selon la décision de l'intégrateur ; conserver tous ses overrides d'adapter. Vérifier la vraie réception originale via B5 ; conserver preview_only tant qu'aucun examen réel autorisé ne produit de review exacte. Ensuite seulement approbation canonique. Traiter ensuite le raccordement TEST indiqué dans ROUTES-NEXT.md avec fixtures isolées avant ouverture, sans nouveau moteur ni transfert QA. B6 ne réémet rien. **Validation hébergée B6 NOT_VERIFIED ;0/3 conservé.**
