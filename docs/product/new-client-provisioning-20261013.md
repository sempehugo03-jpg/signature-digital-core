# Provisionnement générique — checkpoint avant le test personnel

La livraison globale reste FAIL. Ce checkpoint reprend la QA privée v39, commit runtime 267c84b4c816e6945089551f4842bad20ed727be et dernier checkpoint source 4149b85bf201881230045e46d9d91c956fd55abf. Ne pas répéter les publications A/B déjà certifiées pour déclarer un nouveau parcours réussi.

## Changements de cette mission

Le factory qaSitesModifier sélectionne désormais le Site depuis fp_work_site_bindings, associé à fp_work_product_links et au propriétaire authentifié. Il exige un reçu Work completed, le hash/version du HTML livré, une activation portant cette même version/hash et un abonnement TEST actif à 59 EUR. Les identifiants A/B ne déterminent plus l'éligibilité ; ils servent uniquement à retrouver leurs noms historiques de secrets.

Chaque nouveau Site utilise ses propres clés serveur FABRYA_ENGINE_SITE_<site_project_id>_WRITE_SECRET et FABRYA_ENGINE_SITE_<site_project_id>_READ. Elles restent des secrets natifs Sites ; aucune clé n'est fournie par le navigateur, enregistrée dans le reçu ou exposée au client. Le worker du Site conserve FABRYA_SITE_WRITER_SECRET, la même association immuable et les mêmes migrations/publieur Sites data. Aucun proxy, nouveau Site central, second moteur ou circuit de publication n'est ajouté. Le contrat site-change/v1.0.0 reste identique.

Les futures démos sont modifiables par les champs déclarés par leur auteur Work, sans sélecteur fourni par le client. Work peut joindre proof.site_change_baseline avec exactement schema, slots, manifest et content (ou template à la place de slots pour les petits HTML). Schema : fabrya.work-baseline.v1 ; le manifest utilise fabrya.mutable-content.v1 existant. Les slots portent id/start/end, indices UTF-16 dans le HTML hash-vérifié, une plage par champ sans chevauchement. Les valeurs initiales image peuvent être omises de content : elles sont dérivées exclusivement de ces plages authentifiées. Cela évite de dupliquer de grandes images inline et de dépasser la limite du reçu Work. Les ranges/hash/slots et la reproduction exacte du rendu sont vérifiés avant de persister le reçu, puis avant de créer le baseline Engine. Le convertisseur automobile historique reste disponible exclusivement pour les démos A/B existantes.

La demande de création envoyée dans la file Work existante contient désormais les instructions de préparation du même writer, des migrations D1, des clés par Site et du baseline modifiable. La méthode artistique pinée reste inchangée ; les demandes déjà claimed ne sont pas invalidées par un changement de hash de méthode.

L'auteur Work doit réellement préparer et publier le worker modifiable dans chaque Site et installer les secrets via Sites avant la completion. Le code serveur Produit ne possède pas une API de déploiement Sites et ne prétend pas le contraire. Le factory initialise automatiquement ses tables Engine après activation et vérification du writer/rendu déjà provisionné. Sans ce writer ou ses secrets, il reste fermé. L'exécution de cette préparation par une nouvelle mission Work, puis la réception d'un nouveau paiement TEST, n'est PAS encore prouvée.

La completion privée QA possède désormais un verifier de publieur obligatoire injecté par sa composition serveur. Il contrôle le binding et le manifeste, effectue le reconcile signé du writer existant et relit indépendamment le HTML servi et son header de release avant de persister l'artefact/reçu prêt. Une assertion publisher_readback fournie dans le reçu est supprimée et remplacée uniquement par ce résultat serveur. Writer absent, clés absentes, verifier absent ou octets différents : la completion reste refusée ; le client ne reçoit pas une fausse démo prête. Ce commissioning est possible avant le paiement, sans grant/activation/baseline Engine ou commande de publication fabriqués.

## Vérification locale réelle, limitée

- work-engine-baseline : nouveau métier hors automobile, reproduction exacte des octets, modification horaire ciblée, refus de hash/contenu/slots invalides ; baseline A/B conservé ; photographie inline de 1,8 Mo référencée par un petit descriptor sans duplication dans le reçu.
- work-connection : file/livraison/isolation existantes et absence d'opérateur conservées.
- work-site-provisioning : troisième client local, réel worker Sites data en mémoire, association automatique après activation de fixture, reprise idempotente ; propriétaire étranger, abonnement impayé, clé absente et activation incohérente empêchent le raccordement avant transport.

Ces preuves utilisent des données et factures de fixture locales. Elles ne sont ni une inscription hébergée, ni un paiement Stripe réel TEST, ni une nouvelle démo Work, ni un clic dans la bulle. Aucun nouveau PASS E2E n'est revendiqué.

Validation finale : 32 tests ciblés PASS, build et assertions de composition privée PASS. Un simple octet de fin de ligne différent dans la copie Engine du protocole a été normalisé : les deux protocol.mjs sont byte-identiques, sans changement sémantique ou de version.

Corrections publiées uniquement sur la QA privée : source dbdf1a6838f4f03b252ae1776c9b6cea94fab85a, deployment appgdep_6acea6e41d6c8191b41c9e05a3197a81 succeeded, env8, MCP conservé. Une vérification read-only de compatibilité A après déploiement a confirmé le login normal, abonnement/activation d'origine, une attribution mensuelle unique, refus crédits/checkout étrangers, raccordement du factory générique et relecture des octets de la version restaurée. A conserve 98 crédits. Aucune publication/modification/paiement A/B répétés. Cette relecture n'est pas un nouveau parcours client. Preuves : new-client-provisioning-verification-20261013.json.

## Limite extérieure constatée

Le registre de capacités ne contient ni control-browser ni un contrôle navigateur Sites utilisable. Recherche officielle des plugins pour « Browser control-browser » et « Sheep control-browser » effectuée : Opera Browser Connector et TinyFish apparaissent, non installés ; aucun résultat n'expose le workflow control-browser requis. La présence d'un autre plugin de navigation ne confirme ni sa compatibilité avec les Sites privés ni l'autorisation de remplacer ce workflow.

Instruction exacte de Sites : « If $control-browser is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path. » Source : skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md. La référence managed exige control-browser pour sites-preview et indique que les URLs Sites publiées sont inaccessibles depuis son navigateur cloud. Aucune alternative par session fabriquée, service-token browser, faux clic, capture simulée, Playwright installé ou nouveaux droits n'a été tentée.

Cette absence bloque la preuve exigée de la bulle sur ordinateur/téléphone et les contrôles visuels obligatoires avant completion d'une nouvelle démo Work. Pour poursuivre cette partie, fournir le navigateur de contrôle Sites officiellement pris en charge dans l'environnement Work. Ce n'est pas une approbation commerciale ou une permission de contourner les protections.

## Suite exacte

Avec ce navigateur disponible : nouveau compte depuis /produit -> brief et déclenchement Work -> auteur Work prépare le même Site avec writer/manifest/clés -> contrôles desktop/mobile -> completion authentifiée -> aperçu personnel -> Checkout Stripe TEST 59 EUR -> facture provider/webhook -> activation/100 crédits -> factory générique -> demande depuis la bulle -> aperçu -> approbation -> publication/readback -> restauration/readback -> photo et refus du second compte. Conserver les comptes et abonnements A/B.

URL QA propriétaire privée : https://fabrya-product-qa.sempehugo03.chatgpt.site/produit . Aucun accès personnel complet n'est déclaré prêt. Pas de LIVE, de changement fabrya.fr, de paiement réel, de recharge commerciale ou d'appel fournisseur payant dans cette mission.
