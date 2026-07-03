# Client Brief Spec

## 1. Vision

Le tunnel client global Signature Digital est l'entrée du Demo Engine.

Il ne s'agit pas du tunnel immobilier.

Il s'agit du tunnel maître commun à tous les secteurs, conçu pour transformer une demande client en `demoBrief`, puis en `demoConfig`.

Le tunnel doit être :

- court
- premium
- intelligent
- orienté vente
- compréhensible sans jargon technique
- capable de s'adapter au secteur sans créer plusieurs tunnels

Le tunnel client ne produit jamais une maquette complète, une route spécifique, une logique métier unique ou un code dédié.

Il produit uniquement un brief structuré exploitable par le Demo Engine.

## 2. Principe

La structure officielle est :

```text
Core questions universelles
+
sectorOptions[secteur]
=
brief personnalisé sans créer plusieurs tunnels
```

Le tunnel reste unique.

Le secteur choisi adapte certaines options, mais ne crée jamais un nouveau tunnel.

Le tunnel ne doit jamais devenir long.

Maximum côté client :

```text
10 questions visibles
```

Les questions doivent être formulées simplement, avec une impression de diagnostic premium.

Le client doit sentir que Signature Digital comprend son métier dès le tunnel.

## 3. Questions universelles obligatoires

Les 10 questions visibles côté client sont :

1. Nom de l'entreprise
2. Site actuel
3. Secteur d'activité
4. Ville / zone
5. Problème principal aujourd'hui
6. Objectif prioritaire
7. Type de client à convaincre
8. Ressenti souhaité
9. Éléments utiles dans la future démo
10. Phrase libre : "Qu'est-ce que votre site actuel ne montre pas assez bien ?"

Ces questions sont communes à tous les secteurs.

Après le choix du secteur, les options proposées pour les questions 5, 6, 7 et 9 doivent s'adapter au secteur.

Questions adaptées :

- question 5 : problème principal aujourd'hui
- question 6 : objectif prioritaire
- question 7 : type de client à convaincre
- question 9 : éléments utiles dans la future démo

Les questions 1, 2, 3, 4, 8 et 10 restent universelles.

## 4. Champs produits par le tunnel

Le tunnel doit produire un objet `demoBrief` structuré.

Structure attendue :

```ts
demoBrief = {
  companyName,
  currentWebsite,
  sector,
  city,
  mainPain,
  priorityGoal,
  targetClient,
  desiredFeeling,
  requestedDemoElements,
  freeText,
  source: "signature-digital-tunnel"
}
```

### companyName

Nom commercial de l'entreprise.

### currentWebsite

Site actuel ou lien existant.

Le champ peut être vide si le client n'a pas encore de site.

### sector

Secteur d'activité choisi dans le tunnel.

### city

Ville, zone ou territoire commercial.

### mainPain

Problème principal à résoudre dans la future démo.

Ce champ doit être sélectionné parmi les options adaptées au secteur ou saisi librement si nécessaire.

### priorityGoal

Objectif commercial prioritaire.

Ce champ oriente la démo vers la vente, la confiance, la qualification, la prise de rendez-vous ou la conversion.

### targetClient

Type de client que la future démo doit convaincre.

### desiredFeeling

Ressenti attendu :

- premium
- confiance
- proximité
- expertise
- modernité
- réassurance
- performance
- clarté

### requestedDemoElements

Éléments que le client souhaite voir dans la future démo.

Ces éléments doivent ensuite être transformés par le Demo Engine en configuration, module, variante ou parking produit.

### freeText

Réponse libre à :

```text
Qu'est-ce que votre site actuel ne montre pas assez bien ?
```

Cette réponse sert à enrichir l'analyse IA.

Elle ne doit jamais déclencher directement du code spécifique.

### source

Toujours :

```text
signature-digital-tunnel
```

## 5. sectorOptions

`sectorOptions` adapte les options du tunnel selon le secteur.

Chaque secteur doit définir :

- douleurs fréquentes
- objectifs fréquents
- clients à convaincre
- éléments de démo utiles
- angle de démo recommandé

Ces options ne créent pas une logique métier par secteur.

Elles améliorent la qualité du brief et aident le Demo Engine à produire une configuration pertinente.

## 6. Secteur : immobilier

### Douleurs fréquentes

- les vendeurs ne comprennent pas assez vite la valeur de l'agence
- l'image n'est pas assez premium
- le suivi vendeur n'est pas visible
- le site ne génère pas assez d'estimations
- les biens ne sont pas assez bien présentés
- les prospects ne voient pas la différence avec une agence classique

### Objectifs fréquents

- obtenir plus de mandats
- rassurer les vendeurs
- vendre une image plus premium
- générer des estimations
- mieux valoriser les biens
- montrer le suivi vendeur

### Clients à convaincre

- vendeurs
- propriétaires en réflexion
- acquéreurs qualifiés
- investisseurs
- propriétaires de biens premium
- clients qui comparent plusieurs agences

### Éléments de démo utiles

- estimation
- biens publics
- fiche bien premium
- espace vendeur
- suivi de dossier
- visites
- comptes rendus
- documents
- offres
- avis / preuves

### Angle de démo recommandé

La démo doit montrer que l'agence valorise mieux le bien, rassure le vendeur et donne une vision claire du suivi.

Angle recommandé :

```text
Une agence premium qui transforme la vente en expérience suivie, claire et rassurante.
```

## 7. Secteur : avocat

### Douleurs fréquentes

- expertise mal comprise
- manque de confiance avant le rendez-vous
- site trop froid ou trop générique
- demandes peu qualifiées
- domaines d'intervention mal hiérarchisés
- difficulté à rassurer sans trop promettre

### Objectifs fréquents

- rassurer avant le contact
- mieux présenter les domaines d'intervention
- obtenir des demandes qualifiées
- renforcer l'autorité
- clarifier le premier rendez-vous
- donner une image sérieuse et humaine

### Clients à convaincre

- particuliers avec besoin urgent
- dirigeants
- entreprises
- familles
- clients en litige
- prospects qui cherchent une expertise spécifique

### Éléments de démo utiles

- présentation expertise
- domaines d'intervention
- prise de rendez-vous
- preuves / avis
- espace client
- FAQ claire
- parcours de demande qualifiée
- présentation de l'équipe

### Angle de démo recommandé

La démo doit rassurer avant le contact, rendre l'expertise lisible et qualifier les demandes.

Angle recommandé :

```text
Un cabinet clair, expert et rassurant, qui transforme la prise de contact en démarche qualifiée.
```

## 8. Secteur : architecte

### Douleurs fréquentes

- réalisations mal valorisées
- style difficile à comprendre
- site trop portfolio sans conversion
- manque de pédagogie sur la méthode
- prospects qui ne perçoivent pas le niveau d'accompagnement
- image pas assez haut de gamme

### Objectifs fréquents

- montrer la qualité des projets
- attirer des projets mieux qualifiés
- expliquer la méthode
- rassurer sur l'accompagnement
- renforcer l'image premium
- obtenir des demandes de rendez-vous

### Clients à convaincre

- particuliers avec projet de maison
- propriétaires en rénovation
- investisseurs
- promoteurs
- professionnels
- clients sensibles au design

### Éléments de démo utiles

- portfolio projets
- avant / après
- méthode de travail
- prise de rendez-vous
- témoignages
- présentation équipe
- filtres par type de projet
- formulaire projet qualifié

### Angle de démo recommandé

La démo doit montrer une signature créative, une méthode claire et une capacité à accompagner des projets exigeants.

Angle recommandé :

```text
Un studio qui transforme ses réalisations en preuve de vision, de méthode et de confiance.
```

## 9. Secteur : clinique / santé

### Douleurs fréquentes

- parcours patient peu clair
- manque de réassurance avant le rendez-vous
- spécialités mal expliquées
- site trop administratif
- difficulté à mettre en avant l'équipe
- besoin de confiance immédiate

### Objectifs fréquents

- rassurer les patients
- clarifier les spécialités
- faciliter la prise de rendez-vous
- présenter l'équipe
- expliquer le parcours de soin
- moderniser l'image

### Clients à convaincre

- patients
- familles
- patients anxieux
- prescripteurs
- professionnels de santé partenaires
- nouveaux patients locaux

### Éléments de démo utiles

- présentation des spécialités
- prise de rendez-vous
- parcours patient
- équipe médicale
- FAQ rassurante
- accès documents
- informations pratiques
- preuves de confiance

### Angle de démo recommandé

La démo doit rassurer vite, clarifier le parcours et montrer une prise en charge sérieuse et humaine.

Angle recommandé :

```text
Une expérience patient claire, rassurante et moderne, pensée pour faciliter le premier contact.
```

## 10. Secteur : artisan / service local

### Douleurs fréquentes

- manque de confiance avant l'appel
- prestations mal expliquées
- devis peu qualifiés
- site trop simple ou daté
- preuves locales peu visibles
- difficulté à se différencier des concurrents

### Objectifs fréquents

- générer plus de demandes
- rassurer localement
- présenter les prestations
- montrer des réalisations
- obtenir des appels qualifiés
- mettre en avant la réactivité

### Clients à convaincre

- particuliers locaux
- propriétaires
- entreprises locales
- clients en urgence
- syndics
- clients qui comparent plusieurs prestataires

### Éléments de démo utiles

- prestations
- zones d'intervention
- formulaire devis
- appels rapides
- réalisations
- avis clients
- preuves locales
- FAQ pratique

### Angle de démo recommandé

La démo doit inspirer confiance rapidement et transformer une visite en demande locale qualifiée.

Angle recommandé :

```text
Un service local clair, rassurant et réactif, qui convertit mieux les demandes de proximité.
```

## 11. Secteur : automobile

### Douleurs fréquentes

- véhicules mal valorisés
- manque de confiance avant la visite
- stock peu lisible
- demandes peu qualifiées
- image trop générique
- difficulté à rassurer sur la reprise ou le financement

### Objectifs fréquents

- mieux présenter le stock
- générer des essais
- qualifier les demandes
- rassurer sur le sérieux
- mettre en avant les garanties
- augmenter les contacts

### Clients à convaincre

- acheteurs particuliers
- clients reprise
- clients financement
- professionnels
- passionnés
- clients qui comparent plusieurs véhicules

### Éléments de démo utiles

- catalogue véhicules
- fiche véhicule premium
- demande d'essai
- financement
- reprise
- garanties
- avis clients
- contact rapide

### Angle de démo recommandé

La démo doit rendre le stock plus désirable, plus lisible et plus rassurant.

Angle recommandé :

```text
Une expérience automobile premium qui transforme le stock en parcours de confiance et de contact.
```

## 12. Secteur : gestion de patrimoine / courtier

### Douleurs fréquentes

- expertise complexe à comprendre
- manque de confiance avant rendez-vous
- offres peu lisibles
- site trop générique
- difficulté à qualifier les profils
- besoin de pédagogie

### Objectifs fréquents

- rassurer les prospects
- expliquer les services
- obtenir des rendez-vous qualifiés
- renforcer l'autorité
- segmenter les besoins
- améliorer la perception premium

### Clients à convaincre

- particuliers patrimoniaux
- dirigeants
- investisseurs
- familles
- clients en recherche de financement
- prospects qui cherchent un accompagnement long terme

### Éléments de démo utiles

- présentation expertise
- simulateur ou diagnostic
- prise de rendez-vous
- cas d'usage
- espace client
- preuves / avis
- FAQ pédagogique
- parcours de qualification

### Angle de démo recommandé

La démo doit rendre l'expertise lisible, rassurer et conduire vers un rendez-vous qualifié.

Angle recommandé :

```text
Un accompagnement expert et clair, pensé pour transformer une problématique financière en rendez-vous qualifié.
```

## 13. Secteur : autre

### Douleurs fréquentes

- proposition de valeur peu claire
- image pas assez professionnelle
- site actuel peu convaincant
- manque de preuves
- demandes peu qualifiées
- parcours de contact trop faible

### Objectifs fréquents

- clarifier l'offre
- renforcer la confiance
- moderniser l'image
- générer plus de demandes
- mieux qualifier les prospects
- mieux expliquer la différence

### Clients à convaincre

- prospects principaux de l'entreprise
- clients locaux
- décideurs
- utilisateurs finaux
- partenaires
- clients qui comparent plusieurs offres

### Éléments de démo utiles

- présentation de l'offre
- preuve sociale
- cas clients
- prise de contact
- FAQ
- présentation équipe
- formulaire qualifié
- CTA principal clair

### Angle de démo recommandé

La démo doit clarifier l'offre, rassurer et créer un chemin simple vers le contact.

Angle recommandé :

```text
Une expérience claire et crédible qui rend l'offre compréhensible et pousse au bon contact.
```

## 14. Expérience utilisateur du tunnel

Le tunnel doit être rapide.

Le langage doit être simple.

Le tunnel ne doit pas utiliser de jargon technique.

Il doit donner une impression de diagnostic premium.

Le client doit sentir qu'on comprend son métier.

Le tunnel doit éviter :

- listes trop longues
- questions redondantes
- termes techniques comme module, config, variante ou moteur
- demandes internes qui ne concernent pas le client
- embranchements complexes

Le tunnel doit privilégier :

- choix courts
- options adaptées au secteur
- micro-copy rassurante
- rythme fluide
- synthèse finale intelligente

La fin du tunnel doit afficher un résumé intelligent de la demande.

Résumé final attendu côté client :

```text
Nous allons préparer une démo centrée sur [douleur], avec un angle [objectif], pour convaincre [targetClient], dans un style [desiredFeeling].
```

Ce résumé doit confirmer que la demande a été comprise sans promettre une fonctionnalité qui n'existe pas encore.

## 15. Règles anti-bricolage

Le tunnel ne crée jamais une logique métier spécifique.

Le tunnel ne crée jamais une route spécifique.

Le tunnel ne déclenche jamais du code client unique.

Le tunnel produit uniquement un brief structuré.

Le Demo Engine transformera ensuite le brief en :

- config
- module
- variante
- parking produit

Une réponse client ne doit jamais devenir automatiquement :

- une exception dans le code
- une page dédiée codée en dur
- une route client spécifique
- une permission spéciale
- une modification du moteur
- une duplication de template

Toute demande non couverte doit passer par la logique produit :

```text
Configuration
ou
Module réutilisable
ou
Variante de section
ou
Parking Produit
```

## 16. Règles de compatibilité Demo Engine

Le `demoBrief` doit être compatible avec le Demo Engine.

Le Demo Engine peut transformer le brief en :

- `demoConfig`
- modules activés
- variantes sélectionnées
- thème recommandé
- contenu initial
- données de démonstration
- points de parking produit

Le Demo Engine ne doit pas recevoir un brief qui impose :

- une architecture parallèle
- une nouvelle application
- une route codée en dur
- une agence codée en dur
- une logique métier client unique

Le tunnel collecte une intention.

Le Demo Engine décide comment cette intention est convertie en système réutilisable.

## 17. Definition of Done

Le tunnel client global est considéré correctement défini uniquement si :

- `CLIENT_BRIEF_SPEC.md` existe à la racine du repo
- le tunnel est global, pas immobilier uniquement
- le tunnel contient maximum 10 questions visibles côté client
- les questions universelles obligatoires sont présentes
- les options des questions 5, 6, 7 et 9 s'adaptent au secteur
- `sectorOptions` couvre au moins immobilier, avocat, architecte, clinique / santé, artisan / service local, automobile, gestion de patrimoine / courtier et autre
- chaque secteur définit douleurs fréquentes, objectifs fréquents, clients à convaincre, éléments de démo utiles et angle de démo recommandé
- la structure `demoBrief` est documentée
- les règles anti-bricolage sont documentées
- l'expérience utilisateur du tunnel est documentée
- le résumé final côté client est documenté
- le tunnel est compatible Demo Engine
- aucun fichier applicatif n'est modifié
- aucune template n'est modifiée
- aucun écran n'est modifié
- aucune route n'est modifiée
- aucun code n'est ajouté

