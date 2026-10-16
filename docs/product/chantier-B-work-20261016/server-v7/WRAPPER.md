# Montage B7 réservé à l'intégrateur

Aucun wrapper, UI, env ou runtime partagé modifié par ce lot.

## Dispatch exact

Conserver la même instance DB, même env privé et même authorizeWork officiel du montage B2/B3. Le point d'entrée reste nativeWorkServer({db,env,authorizeWork,clock}) ; stripeFetch est une dépendance optionnelle réservée aux tests (omise au runtime).

Avant le handler Product historique :

```js
const response = await nativeServer.fetch(request);
if (response !== null) return response;
return existingProductOrLegacyHandler(request);
```

Monter sur ce dispatch les chemins suivants, sans réécrire host/origin/cookie ni corps signé :

| Méthode | Route | Rôle |
|---|---|---|
| POST | /api/product/webhook | Entrée TEST signée globale, avant l'historique |
| POST | /api/product/projects/:projectId/checkout | Même checkout canonique et idempotence |
| GET | /api/product/projects/:projectId/checkout-recovery-proof | Relecture sans écriture de la même session |
| POST | /api/product/projects/:projectId/payment | Relecture fournisseur et activation vérifiée |
| POST | /api/product/projects/:projectId/abandon | Expiration ou confirmation si déjà payé |
| POST | /api/product/projects/:projectId/portal | Portail du customer canonique |

Conserver routes B6 : GET projet, versions/:versionId/preview, work-previews, work-previews/:previewId/preview ; GET /p/:versionId ; POST approve ; intake et /mcp. Une route native reconnue ne doit jamais tomber dans déterministicKevinFallback. Les anciens projets donnent null. Les événements inconnus donnent200 ignored sans ledger ; seul un événement associé à un ancien projet identifié donne null. Le corps signé reste lisible après null. Ne pas transmettre une enveloppe JSON reconstruite à la place des octets originaux.

Le webhook ne dépend pas d'un cookie client ; il dépend de la signature TEST canonique. Ne pas placer cet endpoint derrière une exigence de session navigateur. L'éventuel transport signé TEST EXISTANT doit conserver les octets/signature/origine privée autorisée. Aucune nouvelle souscription webhook/automation/tâche n'a été créée par ce patch.

## Prérequis même environnement, noms seulement

- DB : base canonique existante du même privé et de ses comptes/projets Work. Aucun transfert de session/compte/crédit/abonnement de QA114.
- FABRYA_NATIVE_WORK_ORIGIN : origine privée autorisée existante ; FABRYA_PRODUCT_QA=true et FABRYA_STRIPE_MODE=test.
- Migration0006 préparée dans ce dossier, enregistrée officiellement après0005 par l'intégrateur ; pas de migration runtime. Pas de schéma conversation/fm requis pour B7.
- FABRYA_NATIVE_TEST_PAYMENTS_ENABLED=true et FABRYA_CREDITS_ENABLED=true : options serveur à activer uniquement après raccordement officiel. Absentes, commerce fermé. Aucun de ces paramètres n'a été écrit par B7.
- Secret TEST : FABRYA_PRODUCT_STRIPE_TEST_KEY (ou alias canonique existant STRIPE_SECRET_KEY_TEST). B7 n'a lu/demandé/copier aucune valeur.
- Secret de signature : FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET, même secret canonique utilisé par l'entrée TEST existante pour ce Produit. Si le fallback legacy utilise un autre transport/secret, l'intégrateur doit conserver son routage explicite existant plutôt que réinterpréter le corps/signature.
- Catalogue TEST officiel : FABRYA_PRODUCT_STRIPE_TEST_PRICE et éventuellement FABRYA_PRODUCT_STRIPE_TEST_PRODUCT. Le gateway vérifie5900 EUR/mois, quantité1, sans promotion/essai/remise. Aucun catalogue ni abonnement créé ici.
- Preuves Work B6 et writer du même Site/Produit : reçus review/readback/release exacts, credentials writer/readback officiels déjà prévus par le circuit B3/B6. Aucun nouveau secret writer requis par B7, aucune copie QA. Sans vraie QA/review, le receipt original preview_only reste non approuvable/payable.

Aucune clé LIVE, aucun paramètre LIVE à fournir. Le port refuse mode LIVE avant appel, et refuse une clé LIVE déposée dans le slot TEST. Vérifier la configuration par les canaux officiels sans exposer de secret au client ou dans les captures/logs.

## Delta UI à raccorder ensuite par l'intégrateur

Aucune UI livrée dans B7. Réutiliser project.id et les cookies courants, jamais sd_project/copier un compte. Après preview+review serveur et approve de la version exacte, POST checkout, ouvrir uniquement l'URL serveur retournée. Après retour success/cancel, relire GET projet et POST payment pour vérité serveur ; ne jamais traduire payment=success en activation. Pour abandon explicite utiliser POST abandon. La reprise conserve la même session ; traiter CHECKOUT_RECOVERY_REQUIRED sans deuxième achat. Portal uniquement depuis la réponse serveur du projet activé. Afficher activation/crédits seulement après confirmation serveur ; si panne ledger temporaire, conserver le projet et permettre la reprise du même paiement. Les routes d'édition et de crédit restent fermées ; ne pas les exposer via ce lot.

## Validation distante encore requise

Migration officielle, configuration TEST, entrée webhook et parcours Cloud desktop/mobile restent NOT_VERIFIED par B7. Pas d'achat/activation réels de test exécutés ici. L'intégrateur conserve la QA/review de l'artefact original et toutes publications. Aucune raison de relancer la génération, recréer une request ou modifier une lease pour intégrer ce port.
