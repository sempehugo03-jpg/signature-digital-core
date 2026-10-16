# Reprise FABRYA — 16 octobre 2026, 14h UTC
Métier et clientèle : entrepreneurs propriétaires d’un site, sans connaissances techniques.
Objectif : faire évoluer leur site en conversation sans perdre l’aperçu ou la demande.
Compréhension : l’état publié, la proposition et une réponse en attente restent distincts.
Action attendue : explorer, demander, vérifier, accepter ou restaurer naturellement.
Signature : le vrai site reste vivant dans l’espace FABRYA existant, avec sa position et son format conservés.

Base source QA109 5cd3957142bc14b268ea635fe99a7b4f22a92976, ouverture officielle confirmée. PR36 head8840b648, PR212 head6f1c78ad. Anciennes modifications locales limitées aux preuves/checkpoint, conservées. Aucun processus node/build/test actif au contrôle14:03UTC. QA owner/custom109 confirmé. ChatGPT Cloud toujours déconnecté ; aucune conversation Work accessible.
Handoff DG007 lu dans commentaire6213498149 de signature-digital-core issue206 et rerouté dans PR36 commentaire6216409415. Patch limité à2fichiers, git apply --check PASS, intégration une seule fois. Pas de cycle métier supplémentaire pour fabriquer une preuve.
Défaut source identifié : render() reconstruit l’iframe courante à chaque ouverture d’aperçu/actualisation, donc nouveau chargement lent, état métier et format perdus. Corriger la conservation DOM ; forcer une lecture fraîche sur publication/restauration ou actualisation explicite. Garder droits/hash/reçu/sandbox inchangés.

QA111 source1d718d42510034e2d42008a7d6fe1a05a34fb9e7 SUCCEEDED appgdep_6ad231cb1b1c819196ca6b342b3b041f/env16. QA110 avait révélé dans Cloud le placeholder .change-shell conservé au démarrage ; corrigé en détectant .change-grid et testant le véritable change-center.html,49/49PASS. Première archive111 tronquée/refusée : aucun saved_version_id ; nouvelle archive officielle intégrale validée gzip/tar puis déploiement réussi.
Cloud111 : vrai Clair ouvre, téléphone puis simulation locale de fermeture20:30 ; ajout du JPG fictif existant dans la file locale SANS envoyer. Retrait du fichier : format is-mobile et valeur20:30 conservés avant/après, donc pas de rechargement de l’iframe. Remis19:00, aucune demande/credit/site publié changé. Le sélecteur de fichier Cloud a pris486s ; cela n’est pas une mesure serveur. Menu pièce jointe blanc avec texte clair découvert : correction CSS ciblée en cours. Solde97, historique4demandes identiques, current09:00.

Dernier point14:40UTC : natif64a64381561315df41438d34d4988611f5bad547, privé73/source903e82ef8d22389ef58dac1550308dd32c0bf4c9 SUCCEEDED appgdep_6ad236eba3c08191b6e30d55d247ff37/env4 ; QA113/source4ef51de88f938c58b74f176e7014a118e76bbf4a SUCCEEDED appgdep_6ad2368a2a248191b0cec4e4a1d21025/env16. Aucun autre processus de build/deploy de ce Work en attente. QA113 corrige la priorité CSS !important du fond du menu. Gzip/tar contrôlés avant envoi ; archive73 initialement tronquée repackagée officiellement avant toute sauvegarde. Public inchangé.
