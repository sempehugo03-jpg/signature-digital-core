# Fabrya — Supervisor Produit, état réel du 11 octobre 2026

PRODUCT_SUPERVISOR_READY = FAIL. 7 des 9 gates sont PASS. Les deux transports exécutants restent absents : Codex durable et QA navigateur durable. Une file de tâches ne constitue pas leur exécution. Aucun fournisseur payant n'a été appelé.

## Installation

Runtime et contrats : supervisor/product/{model,github,run}.mjs et README.md. Tests : tests/supervisor/product-supervisor.test.mjs.

Workflows : .github/workflows/fabrya-product-supervisor.yml et fabrya-product-watchdog.yml. Ils sont installés sur la branche Produit et seuls ces workflows sont présents dans main pour activer les événements durables. Bootstrap final main : 68e734870608247fabf3a1c76740b4fc5f2fd96f. La PR 202 n'a pas été fusionnée. Aucun site n'est publié par ces workflows.

État durable : branche state/fabrya-product-supervisor, state.json, avec historique append-only et mise à jour sans force. Le JSON ne contient aucun identifiant client, session Checkout, secret ou autorisation financière.

Les 21 gates interface restent PASS sur leur référence acquise 903d2715dc0962306d77272755dae574453a149c. Aucun fichier d'interface, backend Produit, catalogue/webhook historique, Kévin ou SEO n'est modifié. Le nouveau code invalide uniquement les zones touchées lors d'une évolution ultérieure ; les tâches gardent les fichiers concernés à travers les réveils.

## Preuve hébergée réelle

1. [Run interrompu 38161830233](https://github.com/sempehugo03-jpg/signature-digital-core/actions/runs/38161830233) : checkout réel de la branche Produit, 12 tests PASS, action non sensible de lecture repo/PR, checkpoint durable avant et après l'action. SIGKILL volontaire, exit 137, après le marqueur CONTROLLED_INTERRUPTION_AFTER_DURABLE_CHECKPOINT.
2. [Watchdog 38161846162](https://github.com/sempehugo03-jpg/signature-digital-core/actions/runs/38161846162) : déclenché automatiquement par workflow_run, SUCCESS. Lecture du checkpoint, contrôle que le précédent runner est terminé, reçu retrouvé, aucun replay. effect_count=1, recovery_count=1.
3. [Réveil manuel 38161941321](https://github.com/sempehugo03-jpg/signature-digital-core/actions/runs/38161941321) : workflow_dispatch, SUCCESS. SAFE_STOP, compteur toujours 1, même preuve conservée.

Cette preuve porte sur la lecture repo/PR interrompue après son checkpoint. Elle ne prouve pas la reprise d'un vrai paiement, d'une session navigateur fermée ou d'une tâche Codex interrompue ; ces transports ne sont pas raccordés. Une action externe inconnue bloque la reprise plutôt que d'être répétée aveuglément. Les tests/build interrompus sont sans effet métier et peuvent être repris après confirmation de la fin du runner.

[Capture du Watchdog](supervisor-recovery.jpg). [Gates machine et limites](supervisor-gates.json).

Les réveils périodiques sont configurés : Supervisor aux minutes 17/47, Watchdog aux minutes 7/37. La preuve ci-dessus est un réveil automatique workflow_run ; aucun premier run schedule n'a encore été observé. Le scheduler GitHub est best effort et peut être retardé/désactivé après une longue inactivité du dépôt public.

## Gates

| Gate | Statut |
| --- | --- |
| PRODUCT_SUPERVISOR_INSTALLED | PASS |
| PRODUCT_STATE_DURABLE | PASS |
| PRODUCT_RESUME_AFTER_CRASH | PASS, lecture contrôlée |
| PRODUCT_IDEMPOTENCE | PASS dans le périmètre exécuté |
| PRODUCT_WATCHDOG_RECOVERY | PASS |
| PRODUCT_WORKER_DISPATCH | FAIL, aucun consommateur Codex durable |
| PRODUCT_QA_DISPATCH | FAIL, aucun consommateur navigateur durable |
| PRODUCT_HUMAN_GATES | PASS |
| PRODUCT_PRIVACY_GATE | PASS |

PRODUCT_SUPERVISOR_RECOVERY = PASS dans le périmètre du probe non sensible.

## Prochaine action et limite humaine

État Produit : BLOCKED_HUMAN, raison FIRST_LIVE_PAYMENT_AUTHORIZATION.

Prochaine action : WAITING_FOR_FIRST_LIVE_PAYMENT_AUTHORIZATION.

Aucun paiement et aucun déploiement public. Aucun budget fournisseur ouvert. La référence acquise READY_FOR_FIRST_LIVE_PAYMENT=YES est conservée ; READY_TO_CHARGE_59_EUR reste NO dans ce nouveau Supervisor, car il ne possède pas une attestation privée fraîche du projet, de la version et de la session sans doublon. Il ne faut pas afficher YES sans cette preuve.

Sans Hugo, le Supervisor lit branche/PR/état, crée les checkpoints, récupère le probe, exécute les tests/build concernés et prépare des tâches ciblées. Il ne peut pas encore lancer lui-même Codex ou la QA visuelle cloud. Il s'arrête pour le paiement, la banque/3DS/MFA, les secrets nécessitant une intervention, les changements légaux/fiscaux/identité, les suppressions irréversibles et la publication publique.

Pour terminer cette mission, raccorder et prouver les deux consommateurs durables sans ouvrir un budget fournisseur implicite. Aucun endpoint ou secret existant n'a été trouvé dans ce dépôt pour les effectuer. Ils ne sont pas remplacés par des faux workflows de développeur ou une QA DOM présentée comme visuelle.

Validation : 12 tests Supervisor PASS localement et sur GitHub ; npm run build PASS. Les 32 tests Produit et la QA navigateur restent leurs preuves acquises, sans modification du Produit ni répétition inutile.
