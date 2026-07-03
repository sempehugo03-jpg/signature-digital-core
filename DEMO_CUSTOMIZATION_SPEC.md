# Demo Customization Spec

## 1. Vision

Signature Digital ne genere jamais un site specifique.

Signature Digital genere une configuration du moteur.

Le moteur ne se duplique jamais.

L'agence se configure.

L'habillage s'applique.

Les donnees restent isolees par `agencyId`.

Une demo doit toujours etre reproductible.

Une personnalisation de demo doit donc pouvoir etre rejouee a partir d'un brief, d'une configuration, de modules, de variantes et de donnees agence, sans copier de composant et sans creer de logique dediee a un client.

## 2. Pipeline officiel

Le pipeline officiel de personnalisation d'une demo Signature Digital est le suivant :

```text
Brief client
↓
Analyse IA
↓
Configuration
↓
Selection des modules
↓
Selection des variantes
↓
Application du theme
↓
Generation Lovable
↓
Demo
↓
Validation
↓
Activation Live
```

Aucune etape ne doit modifier le moteur.

### Brief client

Le brief client collecte les informations utiles :

- nom de l'agence
- ville et zone de chalandise
- positionnement
- douleur principale
- objectif commercial
- style visuel souhaite
- contraintes de contenu
- modules attendus

### Analyse IA

L'analyse IA transforme le brief en decisions produit.

Elle doit produire :

- une intention claire
- des modules proposes
- des variantes proposees
- un theme propose
- des textes adaptes
- des donnees initiales si necessaire
- les demandes a refuser ou placer en parking produit

### Configuration

La configuration cree ou met a jour les objets d'agence :

- `agencyConfig`
- `themeConfig`
- `contentConfig`
- `dataConfig`
- `enabledModules`
- variantes selectionnees
- assets agence

La configuration ne cree jamais de code client.

### Selection des modules

Les modules sont actives ou desactives via `enabledModules`.

Une fonctionnalite visible dans la demo doit correspondre a un module existant ou a un module reutilisable a definir.

### Selection des variantes

Les variantes changent la presentation d'une section sans changer sa logique metier.

Une variante doit rester compatible avec le moteur commun.

### Application du theme

Le theme applique :

- couleurs
- logo
- typographie
- boutons
- cartes
- images
- ambiance visuelle

Le theme ne change pas les roles, les routes, les permissions ou la structure du moteur.

### Generation Lovable

Lovable peut produire une peau visuelle compatible.

Lovable ne cree pas le systeme.

Lovable doit respecter les routes, modules, roles et conventions du moteur Signature Digital Immobilier.

### Demo

La demo presente une experience agence personnalisee, basee sur le moteur commun.

Elle doit donner l'impression d'une creation sur mesure tout en restant une configuration reproductible.

### Validation

La validation confirme :

- rendu visuel
- wording
- modules actives
- donnees de demo
- parcours public
- parcours vendeur
- parcours agent
- parcours patron

### Activation Live

L'activation live transforme une demo validee en agence active.

Elle conserve le moteur, l'`agencyId` et la structure de routes, sauf decision explicite et documentee.

## 3. Ce que Lovable peut modifier

Lovable peut modifier uniquement ce qui releve de l'habillage, du contenu, des variantes et de la configuration.

### Identite

Lovable peut modifier :

- logo
- couleurs
- typographie
- images
- icones

### Textes

Lovable peut modifier :

- titres
- CTA
- arguments
- promesses
- wording

### Variantes

Lovable peut proposer ou appliquer des variantes pour :

- Hero
- Presentation
- CTA
- blocs confiance
- preuves
- estimation
- contact

### Ordre des sections

Lovable peut modifier l'ordre des sections existantes si le moteur expose cette possibilite par configuration.

L'ordre des sections ne doit pas casser les parcours obligatoires.

### Modules activables

Lovable peut recommander des modules a activer ou desactiver.

La decision finale doit passer par `enabledModules`.

### Pre-remplissage des donnees

Lovable peut pre-remplir :

- biens de demo
- textes agence
- preuves
- photos
- agents
- vendeurs de demo
- documents de demonstration

Toutes les donnees doivent rester isolees par `agencyId`.

## 4. Ce que Lovable n'a jamais le droit de faire

Interdictions absolues :

- creer une nouvelle logique metier
- creer une nouvelle route
- modifier les permissions
- modifier les roles
- modifier `agencyId`
- modifier le moteur
- ecrire du code specifique a une agence
- creer une page unique uniquement pour un client
- casser le responsive
- casser les conventions du produit

Lovable ne doit jamais transformer une maquette en application parallele.

Lovable ne doit jamais imposer une exception client dans le moteur commun.

Lovable ne doit jamais contourner le systeme de modules, de roles ou d'isolation des donnees.

## 5. Systeme de variantes

Une section possede plusieurs variantes.

Une variante est une option de presentation reutilisable.

Elle peut changer :

- rythme visuel
- composition
- tonalite de texte
- niveau de preuve
- style d'image
- accent CTA

Elle ne peut pas changer :

- logique metier
- permissions
- routes
- roles
- isolation des donnees
- contrats du repository

### Hero

Variantes possibles :

- premium
- confiance
- estimation
- performance
- humain

### Presentation

Variantes possibles :

- locale
- premium
- expertise
- accompagnement

### CTA

Variantes possibles :

- rendez-vous
- estimation
- decouverte
- vendeur

Chaque variante reste compatible avec le moteur.

Une variante doit pouvoir etre reutilisee pour plusieurs agences.

Une variante ne doit jamais contenir une exception client.

## 6. Douleurs -> Configurations

Chaque douleur client devient une configuration.

Aucune douleur ne doit produire une exception de code.

### Exemple : image pas assez premium

Douleur :

```text
Mon image n'est pas premium.
```

Configuration :

```text
themePreset = luxury_dark
heroVariant = premium
copyVariant = prestige
trustVariant = preuves
```

### Exemple : suivi vendeur peu clair

Douleur :

```text
Les vendeurs ne comprennent pas notre suivi.
```

Configuration :

```text
sellerSpace = ON
timeline = ON
reports = ON
documents = ON
```

### Exemple : besoin de plus d'estimations

Douleur :

```text
Je veux obtenir plus d'estimations.
```

Configuration :

```text
estimation = ON
heroVariant = estimation
CTA = estimation
```

### Regle

Si une douleur client ne peut pas etre resolue par une configuration, un module reutilisable ou une variante reutilisable, elle doit aller en parking produit.

## 7. Parking Produit

Toute nouvelle demande client doit etre classee dans une seule categorie.

### A. Configuration

La demande peut etre satisfaite par :

- `agencyConfig`
- `themeConfig`
- `contentConfig`
- `dataConfig`
- `enabledModules`
- variantes existantes
- ordre de sections existant

Elle peut etre traitee dans la demo.

### B. Module reutilisable

La demande necessite une capacite produit nouvelle, mais utile pour plusieurs agences.

Elle peut devenir un module si :

- elle est generique
- elle respecte les roles
- elle respecte l'isolation `agencyId`
- elle respecte les routes standard
- elle peut etre activee ou desactivee
- elle ne duplique pas le moteur

### C. Variante de section

La demande concerne principalement la presentation d'une section existante.

Elle peut devenir une variante si :

- elle ne change pas la logique metier
- elle reste compatible avec les donnees existantes
- elle est reutilisable pour d'autres agences
- elle peut etre selectionnee par configuration

### D. Parking Produit

La demande ne rentre pas proprement dans les categories precedentes.

Elle ne doit pas etre developpee immediatement.

Elle doit etre documentee avec :

- demande client
- probleme sous-jacent
- impact potentiel
- risques produit
- decision attendue

Si une demande ne rentre dans aucune categorie, elle ne doit pas etre developpee immediatement.

## 8. Philosophie produit

Nous ne vendons pas des sites.

Nous vendons un moteur capable de produire rapidement des experiences premium adaptees a chaque client.

Le client doit avoir l'impression d'obtenir une creation sur mesure.

En realite, il recoit une configuration intelligente d'un moteur unique.

Cette philosophie protege :

- la vitesse de production
- la qualite du produit
- la maintenance
- la coherence des parcours
- l'isolation des donnees
- la capacite a activer de futures agences

Une personnalisation reussie est specifique dans la perception client, mais generique dans l'architecture.

## 9. Definition of Done

Une personnalisation est consideree terminee uniquement si :

- aucune modification du moteur
- aucune duplication
- aucune exception client
- uniquement config/modules/variantes
- totalement reutilisable
- compatible avec toutes les futures agences

Elle doit aussi respecter :

- `AGENTS.md`
- `LOVABLE_COMPLIANCE_CHECK.md`
- `REAL_ESTATE_PRODUCT_SPEC.md`
- `AGENCY_CREATION_SPEC.md`
- `MODULES_SPEC.md`
- `ACTIVATION_SPEC.md`

Une personnalisation ne doit pas etre livree si :

- elle cree une route client dediee
- elle copie un composant moteur
- elle modifie les roles
- elle modifie les permissions
- elle melange les donnees entre agences
- elle expose une donnee privee en public
- elle rend une future agence plus difficile a creer

