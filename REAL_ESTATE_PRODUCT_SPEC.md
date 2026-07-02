# Signature Digital Immobilier - Product Spec

## 1. Vision produit

Signature Digital Immobilier n'est pas un simple site vitrine.

C'est un moteur immobilier premium qui permet a une agence de proposer une experience complete :

- un espace public premium pour les prospects
- un tunnel d'estimation vendeur
- une fiche bien centrale
- un espace vendeur de suivi
- un espace agent de gestion des mandats
- un espace patron de pilotage de l'agence
- des documents, visites, comptes rendus et offres lies a chaque bien
- des acces par email et role

La regle centrale :

Le bien est le centre du systeme.

Toutes les actions metier importantes partent de la fiche bien.

## 2. Principe moteur

Le moteur ne se duplique pas.
L'agence se configure.
L'habillage s'applique.
Les donnees s'isolent par agencyId.

Une agence ne doit jamais etre une copie complete du moteur.

Une agence doit etre une instance configuree du moteur avec :

- agencyConfig
- themeConfig
- contentConfig
- dataConfig
- assets agence
- skin agence

Le moteur immobilier commun ne doit jamais etre modifie pour une agence specifique.

## 3. Architecture obligatoire

Le systeme doit respecter la separation :

### ENGINE

- logique commune
- routes
- roles
- connexion
- fiche bien
- tunnel estimation
- espace vendeur
- espace agent
- espace patron
- actions metier
- repository
- fallback mock/local

### SKIN

- couleurs
- logo
- typographie
- hero
- photos
- ambiance
- sections visuelles
- habillage Lovable compatible

### DATA

- agencyConfig
- properties
- agents
- sellers
- visits
- reports
- documents
- offers
- requests
- invitations

Toute donnee liee a une agence doit contenir ou dependre de agencyId.

## 4. Routes standard

La template mere utilise :

- /demo/template-immobilier
- /demo/template-immobilier/estimation
- /demo/template-immobilier/connexion
- /demo/template-immobilier/vendeur
- /demo/template-immobilier/agent
- /demo/template-immobilier/patron
- /demo/template-immobilier/bien/[id]

Les futures agences devront utiliser le meme moteur avec :

- /demo/[agencySlug]
- /demo/[agencySlug]/estimation
- /demo/[agencySlug]/connexion
- /demo/[agencySlug]/vendeur
- /demo/[agencySlug]/agent
- /demo/[agencySlug]/patron
- /demo/[agencySlug]/bien/[propertyId]

Aucune agence ne doit necessiter une architecture parallele.

## 5. Roles

Le moteur connait trois roles immobiliers principaux :

seller
= vendeur

agent
= agent immobilier

owner
= patron / gerant

La connexion se fait par email et mot de passe.

L'utilisateur ne choisit jamais manuellement son role.

Le role est determine par le compte / profil / invitation.

## 6. Public

Le public voit une experience immobiliere premium.

Il peut :

- voir la landing
- swiper les photos des biens depuis les cartes annonces
- ouvrir une fiche bien
- demander une visite
- demarrer une estimation
- demander un rappel si la section existe

Le public ne doit jamais voir :

- crayon modifier
- actions internes
- documents prives
- comptes rendus
- offres
- progression interne de vente
- boutons agent/patron
- espace vendeur
- donnees confidentielles

## 7. Cartes annonces publiques

Les cartes annonces publiques doivent etre premium et entierement cliquables.

Regles :

- pas de bouton "Voir le bien"
- la carte entiere ouvre la fiche bien
- les photos sont en carousel horizontal
- l'utilisateur peut swiper les photos dans la carte
- le tap / clic sur la carte ouvre la fiche
- le swipe ne doit pas empecher le clic
- afficher seulement :
  - photos
  - titre
  - adresse / ville
  - prix
  - surface
  - pieces

Interdit :

- photos empilees verticalement
- bouton "Voir le bien"
- CTA lourd dans la carte
- design de carte debutant
- doublons d'images

## 8. Fiche bien commune

Il ne doit exister qu'une seule fiche bien commune.

Elle adapte son affichage selon le role.

Route template :

/demo/template-immobilier/bien/[id]

La fiche bien commune est le centre du systeme.

Elle contient selon le contexte :

- photos
- titre
- adresse
- prix
- surface
- pieces
- description
- points forts
- progression
- visites
- comptes rendus
- offres
- documents
- actions agent/patron si autorisees

Il est interdit de creer une fiche bien parallele par role.

On ne cree pas :

- une fiche publique separee
- une fiche agent separee
- une fiche patron separee
- une fiche vendeur separee

On utilise une fiche commune avec rendu conditionnel.

## 9. Fiche bien publique

Si aucun utilisateur n'est connecte, la fiche bien doit etre une fiche annonce publique premium.

Elle affiche :

- carousel photos
- titre
- adresse / ville
- prix
- surface
- pieces
- description
- points forts
- bouton "Demander une visite"

Elle ne doit pas afficher :

- crayon
- modifier
- partager espace vendeur
- documents prives
- comptes rendus
- offres
- progression interne
- visites internes
- actions agent/patron
- bouton de gestion

La fiche publique ne doit pas avoir de doublons :

- pas deux prix
- pas deux boutons de visite
- pas deux descriptions
- pas de photos repetees

## 10. Fiche bien vendeur

Si role = seller, la fiche bien affiche l'annonce et le suivi vendeur.

Elle doit afficher :

- carousel photos
- titre
- adresse
- prix
- description complete
- progression
- prochaines visites
- comptes rendus
- offres
- documents ouvrables / telechargeables

Le vendeur ne doit jamais voir :

- crayon
- modifier
- ajouter photo
- ajouter document
- programmer visite
- ajouter compte rendu
- archiver
- actions agent/patron

Le vendeur consulte uniquement.

## 11. Fiche bien agent / patron

Si role = agent ou owner, la fiche bien devient une fiche mandat.

Elle doit ressembler a une fiche bien publique premium, mais avec les outils de gestion en plus.

Elle doit afficher :

- header mandat
- retour "Mandats"
- actions en haut :
  - partager
  - modifier / crayon
  - archiver si disponible
- carousel photos
- carte bien
- description
- caracteristiques
- sections verticales :
  - Apercu
  - Visites
  - Comptes rendus
  - Offres
  - Documents

Les actions de gestion doivent etre disponibles dans la fiche bien, pas dispersees dans l'accueil agent.

Actions possibles :

- modifier l'annonce
- ajouter photo
- ajouter document
- programmer visite
- ajouter compte rendu
- creer / partager espace vendeur
- archiver bien si disponible
- assigner agent si owner

## 12. Crayon / modifier

Le bouton crayon / modifier est visible uniquement pour :

- agent
- owner

Il est invisible pour :

- public
- seller

Le crayon ouvre un panneau ou une modale "Gerer ce bien" ou "Modifier l'annonce".

La modification de l'annonce doit permettre au minimum :

- titre
- adresse
- prix
- surface
- pieces
- chambres si disponible
- description
- points forts

Les champs longs comme description et points forts doivent etre des textarea avec hauteur suffisante.

Le texte long ne doit jamais etre cache dans un champ trop petit.

## 13. Photos

Toutes les photos de biens doivent etre affichees en carousel horizontal premium.

Cette regle vaut pour :

- cartes annonces publiques
- fiche bien publique
- fiche bien vendeur
- espace vendeur
- fiche mandat agent
- fiche mandat patron

Regles carousel :

- photo principale visible
- swipe horizontal mobile
- scroll-snap horizontal
- coins arrondis
- image pleine largeur
- hauteur maitrisee
- indicateur discret si plusieurs photos

Interdit :

- galerie verticale longue
- photos empilees
- photos repetees
- section photo separee inutile
- grille photo moche
- images mal alignees

Quand agent/patron ajoute une photo, elle doit apparaitre dans le carousel du bien, pas dans une section separee.

## 14. Documents

Les documents doivent etre lies au bien.

Ils peuvent etre visibles selon le role :

Public :

- ne voit pas les documents prives

Vendeur :

- voit les documents de son bien
- peut les ouvrir / telecharger
- ne peut pas les modifier

Agent / Patron :

- voit les documents du bien
- peut ajouter un document
- peut ouvrir / telecharger

Regles :

Si document.url existe :

- bouton "Ouvrir"
- target="_blank"
- rel="noreferrer"
- download si possible

Si document.url est absent :

- afficher "Document en attente"
- ne pas afficher un lien casse

Interdit :

- telechargement casse
- bouton qui provoque une erreur
- documents affiches en doublon
- documents visibles en public si prives

## 15. Espace vendeur

L'espace vendeur doit etre court, clair et rassurant.

Le vendeur doit comprendre en 5 secondes :

- son bien
- sa description
- ou en est la vente
- prochaine visite
- dernier compte rendu
- offres
- documents

Structure standard :

1. Header simple
2. Carte principale du bien
3. Resume rapide
4. Prochaine visite
5. Dernier compte rendu
6. Offres recues
7. Documents

La carte principale contient :

- carousel photos
- adresse
- titre
- prix
- description
- progression
- etapes
- bouton "Voir la fiche complete"

La description doit etre affichee avant la progression.

L'espace vendeur ne doit pas contenir :

- section photos separee en bas
- doublons de documents
- doublons de comptes rendus
- actions de modification
- gros dashboard
- CRM

Le vendeur ne modifie rien.

## 16. Espace agent

L'espace agent est un tableau de bord simple.

Il doit contenir :

- header agent
- nom agent
- bouton "+ Nouveau bien"
- statistiques rapides
- visites du jour
- section "Mes mandats"

Chaque mandat / bien est une carte cliquable.

La carte mene vers la fiche bien commune.

Les actions suivantes ne doivent pas etre affichees en vrac dans l'accueil agent :

- Ajouter photo
- Ajouter document
- Programmer visite
- Ajouter compte rendu
- Creer espace vendeur

Ces actions doivent etre dans la fiche bien, apres avoir choisi le mandat.

Principe :

Espace agent = choix du bien.
Fiche bien = gestion du bien.

## 17. Espace patron

L'espace patron ressemble a l'espace agent, mais avec une vision globale.

Il doit contenir :

- header patron
- bouton "+ Nouveau bien"
- bouton "+ Ajouter agent"
- statistiques agence
- biens de l'agence
- agents
- demandes si disponible

Le patron voit toute l'agence.

Le patron peut :

- ajouter agent
- desactiver agent
- ouvrir tous les biens
- gerer un bien depuis la fiche bien
- inviter vendeur
- inviter agent

Les actions de gestion d'un bien doivent rester dans la fiche bien.

## 18. Sections dans la fiche mandat

Les petits onglets/pills "Apercu, Visites, Comptes rendus, Offres, Documents" ne doivent pas etre des boutons moches ou inutiles.

La logique preferee :

sections verticales premium.

Structure :

Apercu

- description
- caracteristiques

Visites

- liste visites
- bouton "+ Ajouter une visite" si agent/owner

Comptes rendus

- liste comptes rendus
- bouton "+ Ajouter un compte rendu" si agent/owner

Offres

- liste offres
- bouton "+ Ajouter une offre" si action disponible

Documents

- liste documents
- bouton "+ Ajouter un document" si agent/owner

Public ne voit pas les sections internes privees.

Vendeur voit les sections utiles a son suivi sans boutons d'ajout.

## 19. Connexion

La connexion immobilier est separee de la connexion admin Signature Digital.

Route template :

/demo/template-immobilier/connexion

La connexion se fait avec :

- email
- mot de passe

Il ne doit jamais y avoir de choix manuel :

- vendeur
- agent
- patron

Le systeme deduit le role selon le profil / invitation / session.

Redirections :

seller -> /demo/template-immobilier/vendeur
agent -> /demo/template-immobilier/agent
owner -> /demo/template-immobilier/patron

## 20. Invitations

Le systeme d'invitation immobilier doit reutiliser le systeme existant Signature Digital si disponible.

Quand un patron ajoute un agent :

- il saisit email agent
- une invitation est creee
- email automatique si systeme email disponible
- lien fallback si email non disponible
- l'agent cree son mot de passe
- il accede a l'espace agent

Quand un agent/patron cree un espace vendeur :

- il saisit email vendeur
- invitation creee
- lien envoye / affiche
- vendeur cree mot de passe
- vendeur voit uniquement le bien lie

Un vendeur doit toujours etre lie a un propertyId.

Un agent/patron doit etre lie a agencyId.

## 21. Tunnel estimation

Le tunnel estimation doit rester simple et premium.

Etapes standard :

1. Type de bien
2. Localisation
3. Caracteristiques
4. Etat
5. Projet
6. Coordonnees
7. Confirmation

Le tunnel ne doit jamais ouvrir Gmail.
Il ne doit jamais utiliser mailto cote visiteur.
Il doit creer une demande liee a agencyId.

## 22. Menu mobile

Le menu mobile doit etre lisible, discret et utile.

Public :

- Accueil
- Biens
- Estimer
- Espaces

Le menu public ne doit pas avoir "Contact" si cela surcharge l'experience.

Prive vendeur :

- Accueil
- Visites
- Offres
- Documents
- Profil

Prive agent :

- Accueil
- Biens
- Visites
- Demandes
- Profil

Prive patron :

- Accueil
- Biens
- Agents
- Demandes
- Profil

Le menu ne doit jamais masquer les boutons principaux.
Le menu doit disparaitre ou rester discret si une modale est ouverte.

## 23. Mode demo / mode actif

Une agence peut etre en mode :

- draft
- demo_ready
- sent
- validated
- active
- paused

En mode demo :

- donnees mockees ou preparees
- acces demo
- liens de test

En mode actif :

- donnees reelles
- agents reels
- vendeurs reels
- invitations reelles
- documents / photos reels
- demandes reelles

L'activation d'une agence ne doit pas recoder le moteur.
Elle doit changer le statut et activer les fonctionnalites prevues.

## 24. Duplication agence

Dupliquer une agence ne signifie pas copier le moteur.

Creer une agence doit creer :

- agencyConfig
- themeConfig
- contentConfig
- dataConfig
- assets agence
- acces initiaux

La duplication ne doit jamais creer un moteur parallele.

Les futures agences doivent utiliser :

/demo/[agencySlug]

avec donnees isolees par agencyId.

## 25. Lovable

Lovable sert a creer une peau visuelle compatible.

Lovable ne cree pas le systeme.

Une maquette Lovable doit respecter le squelette Signature Digital Immobilier :

- accueil
- biens
- fiche bien
- estimation
- visite
- connexion
- vendeur
- agent
- patron
- contact / rappel

Codex doit verifier la conformite avant integration.

Une maquette Lovable non conforme doit etre refusee ou corrigee avant integration.

## 26. Regles Codex avant modification

Avant toute PR qui touche le moteur immobilier, Codex doit verifier :

- AGENTS.md lu
- LOVABLE_COMPLIANCE_CHECK.md lu
- REAL_ESTATE_PRODUCT_SPEC.md lu
- bon repo utilise
- signature-immobilier-app non touche
- page / non modifiee
- admin global non casse
- moteur non duplique
- fiche bien commune conservee
- repository existant respecte
- agencyId conserve
- roles respectes

## 27. Regles de merge

Une PR ne doit etre mergee que si :

- build OK
- lien PR ou comparaison fourni
- fichiers modifies coherents
- / non modifiee
- admin intact
- signature-immobilier-app non touche
- moteur non duplique
- template mere intacte
- spec produit respectee

## 28. Interdictions permanentes

Interdit :

- modifier le repo signature-immobilier-app
- remplacer Signature Digital par Signature Immobilier
- modifier la page / sans demande explicite
- casser l'admin
- creer une fiche bien differente par role
- mettre des actions de gestion en vrac dans l'accueil agent
- empiler les photos verticalement
- afficher documents prives en public
- laisser le vendeur modifier
- afficher le crayon au public ou au vendeur
- dupliquer le moteur pour une agence
- creer une app parallele par client
- creer des exceptions specifiques agence dans le moteur commun
