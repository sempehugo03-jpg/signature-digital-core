# Admin Responsibility Map

## Regle produit

Projet cree. Template maintient. Cockpit pilote.

Une agence immobiliere est une instance configuree de la template Signature Immobilier. Elle ne doit pas etre confondue avec la template, le projet commercial, la demande client, la demo Lovable ou le moteur Signature Digital.

## Cockpit

Mission :

- piloter les projets ;
- afficher les priorites ;
- afficher les prochaines actions ;
- ouvrir les fiches Projet.

Le Cockpit ne cree pas d'agence, ne modifie pas une agence en detail et ne declenche pas d'activation technique directe.

## Projets

Mission :

- transformer une demande client en plateforme ;
- gerer le prompt Lovable ;
- stocker le lien Lovable ;
- recevoir le VisualBlueprint ;
- importer les annonces ;
- creer ou mettre a jour la demo moteur de l'agence ;
- ouvrir la plateforme ;
- suivre la validation commerciale.

La fiche Projet est le workflow principal de creation d'agence. Elle conserve `generatedAgencyId` pour relier le projet a l'instance immobiliere creee.

## Templates

Mission :

- maintenir la template metier Signature Immobilier ;
- ouvrir les routes de test ;
- controler la base duplicable ;
- modifier une agence existante pour maintenance ;
- suspendre, archiver ou reactiver une agence existante.

Templates ne propose pas de workflow principal de creation d'agence. Une agence deja creee peut y etre corrigee pour maintenance : identite, VisualBlueprint, modules, statut technique, annonces existantes.

## Modules

Mission :

- configurer techniquement le moteur generique Signature Digital ;
- verifier les modules disponibles ;
- activer ou desactiver des modules generiques pour les donnees du moteur multi-client.

Cet espace n'est pas le workflow principal des agences immobilieres publiques.

## Projet, template et agence

- Template : base metier duplicable.
- Projet : parcours client et production.
- Agence : instance reelle generee depuis la template.
- Cockpit : vue de pilotage.

## Activation commerciale et statut technique

L'activation commerciale concerne la validation client, le paiement et l'accord de lancement.

Le statut technique agence concerne la disponibilite de la plateforme :

- `demo_ready`
- `active`
- `paused`
- `archived`

Ces deux mecanismes restent separes.

## Parcours officiel de creation

1. Le tunnel public cree un projet.
2. Le Cockpit oriente vers la fiche Projet.
3. La fiche Projet produit le prompt Lovable.
4. Lovable fournit la demo validee et le VisualBlueprint.
5. La fiche Projet recoit le VisualBlueprint et les annonces.
6. La fiche Projet cree ou met a jour la demo moteur.
7. La fiche Projet ouvre la plateforme.
8. Templates maintient ensuite l'agence existante si une correction technique est necessaire.

## Interdictions

- Ne pas creer un second workflow complet dans Templates.
- Ne pas creer une agence depuis le Cockpit.
- Ne pas creer un espace Instances tant que l'architecture n'est pas revalidee.
- Ne pas fusionner activation commerciale et statut technique agence.
