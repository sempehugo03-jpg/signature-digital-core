# FABRYA — Mission Produit : confiance, accompagnement, image et expérience

Mandat utilisateur du 11 octobre 2026. Portée : plateforme FABRYA / interface, pas le moteur Kévin ni le chantier SEO. Version de départ : PR #202 sur work/fabrya-product-20261010, avec les preuves antérieures de 21 gates interface acquises sur le commit 903d2715dc0962306d77272755dae574453a149c.

## Thèse d'expérience

Fabrya doit être compris et désiré en quelques secondes, sans jamais contraindre ni tromper : « Je décris mon entreprise → Fabrya me guide → je découvre une proposition concrète → je l'améliore → je choisis ma version → je connais le prix et les limites → je décide de payer → je retrouve mon projet et mon abonnement. »

Un sentiment de confiance résulte d'une vraie expérience cohérente, pas d'animations impressionnantes isolées. Il est impossible de garantir qu'aucun client ne sera jamais déçu ; rendre la promesse exacte et la livraison vérifiable est donc obligatoire.

## Répartition du travail à reprendre

1. **Direction artistique et branding.** Conserver le logo FABRYA réel et l'identité violet #7047EB tant qu'aucune évolution vérifiée n'est approuvée ; les polir sans redessiner un autre produit. Créer une grammaire de composants, iconographie, illustrations spécifiques à FABRYA, hiérarchie et typographie exigeantes. Aucun logo client, témoignage, notation, label de sécurité ou certification inventé.
2. **Mouvement et visuels.** Les animations doivent expliquer les transitions et procurer de la fluidité, jamais remplacer une preuve métier. Légèreté, performance mobile, réduit-motion, visibilité sans animation, pas de contenu bloqué jusqu'au scroll. Montrer clairement les exemples fictifs.
3. **Promesse avant la carte.** Dans la landing, l'onboarding et l'écran abonnement, montrer avant tout paiement : prix 59 EUR/mois, renouvellement, absence de frais d'installation, annulation depuis l'espace, accès effectivement activé, et exclusion actuelle de publication publique du site. Ne jamais promettre publication, remboursements, délais, accompagnement humain ou révisions illimitées sans contrat et capacité réels.
4. **Accompagnement par le produit.** Guidage à chaque étape, progression visible, textes humains et compréhensibles, sauvegarde/reprise, états lents et échecs sans panique, modifications/historique avec explication, sortie libre, confirmation avant changement irréversible, support accessible uniquement si réellement opérationnel.
5. **Avant et après abonnement.** Prévisualiser la version exacte avant Checkout, rappeler inclusions et limites dans le dernier écran, indiquer que la confirmation est vérifiée côté serveur. Après paiement authentique seulement : afficher état, version active, gestion des factures/annulation et aide réelle. Pas de promesse « votre site est en ligne » si ce n'est pas le cas.
6. **Audit expérience niveau produit.** Ouvrir la vraie plateforme privée et tester 1440, 390, 320 pixels, clavier, contraste, reduced-motion, erreur, hors-ligne, inscription, brief, génération, comparaison V1/V2, approbation, pré-Checkout et retour. Tester compréhension du prix et des exclusions, confiance, possibilité de reprendre, et attentes de publication auprès d'utilisateurs réels avant déploiement.

## Critères de validation

- La personne comprend le tarif, le moment du débit, ce qu'elle reçoit et ce qu'elle ne reçoit PAS avant paiement.
- Un utilisateur novice termine le parcours sans avoir besoin d'une explication extérieure.
- Aucune fausse preuve sociale, fausse garantie, fausse sécurité ni fausse démonstration de site client.
- Visuels et animations pertinents, mémorables et spécifiques à Fabrya ; accessibles et stables en mobile, sans lourdeur.
- Les échecs conservent le projet, expliquent ce qui se passe et proposent une action réellement possible.
- Garder l'infrastructure de compte, stockage, Stripe, webhook, paiements, no-double-charge et gates humains ; aucune dépense fournisseur ni publication publique sans autorisation.
- Les précédents gates interface restent des preuves historiques liées à leur commit : toute modification CSS/JS doit repasser les vérifications affectées. Aucun auto-PASS.
- Le Supervisor conserve PRODUCT_WORKER_DISPATCH = FAIL et PRODUCT_QA_DISPATCH = FAIL jusqu'à vrais consommateurs durables Codex et navigateur. Une file de tâches ou un test DOM ne les valide pas.

## Réalisation initiale dans la PR

Premier lot réversible : pédagogie de la landing, illustration explicitement fictive, éléments visuels et motion reduced-motion, transparence prix/publication, FAQ native, récapitulatif avant Stripe, test DOM dédié. Ces changements ne sont pas déployés en public ni en QA hébergée. Les preuves d'interface de référence doivent être renouvelées pour les zones touchées.

## Reprise autonome demandée

Le Product Supervisor doit intégrer ce mandat au poste Produit et prioriser les écarts observés. Objectif réel : exécuter des petites tâches bornées, via un authentique consommateur Codex, puis une QA navigateur authentique, checkpoint et reprise. Il ne doit pas feindre de pouvoir lancer ces consommateurs s'ils ne sont pas encore raccordés. Toute activation demande des preuves de transport. Le blocage humain FIRST_LIVE_PAYMENT_AUTHORIZATION reste en place : ce mandat ne donne aucune autorisation de facturer 59 EUR ni de publier fabrya.fr.
