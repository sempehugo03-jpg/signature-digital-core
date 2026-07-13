# Agency Compliance Contract

PR 37 ajoute une couche de conformite par agence. Elle reutilise les donnees reelles de `AgencyContactAndLegalIdentity` et ne genere pas de donnees professionnelles fictives.

## Responsabilites

Signature Digital fournit des modeles, des routes, des mentions sous formulaires, un suivi de statut et une preuve minimale des consentements importants.

L'agence reste responsable de verifier les informations legales, les bases legales, les durees de conservation et les documents avant mise en production.

## Structure

`AgencyComplianceConfig` contient :

- `legalNotice` : statut, version, dates et validation des mentions legales.
- `privacyPolicy` : statut, contact droits RGPD et durees de conservation.
- `cookiePolicy` : statut et categories de traceurs.
- `formPrivacyNotices` : mention courte sous les formulaires et consentement marketing separe si necessaire.
- `consentSettings` : version et durees de conservation des preuves.
- `documentStatus` : statut global.

Statuts document :

- `missing`
- `draft`
- `review-required`
- `approved`

## Documents publics

Chaque agence expose :

- `/demo/:agencySlug/mentions-legales`
- `/demo/:agencySlug/confidentialite`
- `/demo/:agencySlug/cookies`

Les memes routes fonctionnent avec un domaine personnalise verifie. Les pages masquent les champs absents et affichent un avertissement de modele a verifier.

## Traitements couverts

La politique de confidentialite couvre les traitements presents dans le moteur :

- demandes d'estimation ;
- demandes de visite ;
- contact et rappel ;
- comptes patron, agent et vendeur ;
- documents et suivi metier ;
- paiements quand le parcours est branche ;
- emails automatiques.

Pour chaque traitement, le modele liste les donnees, la finalite, les destinataires, la duree configurable et une base legale a confirmer. Aucune base legale definitive n'est inventee.

## Formulaires

Les formulaires publics et de creation d'acces affichent une mention courte :

- responsable du traitement ;
- finalite generale ;
- champs obligatoires ;
- lien vers la confidentialite ;
- contact pour les droits.

Une case de consentement n'est affichee que si `requireMarketingConsent` est active. Elle n'est jamais precochée.

## Cookies

Audit PR37 :

- aucun `document.cookie` detecte ;
- aucun `gtag`, pixel ou analytics tiers detecte ;
- stockages locaux necessaires pour session, demandes, invitations, comptes locaux, projets et preferences.

Categories gerees :

- necessaires ;
- mesure audience ;
- marketing ;
- contenus tiers ;
- personnalisation.

Si seuls les stockages necessaires sont actives, aucun faux bandeau n'est affiche. Si une categorie facultative est configuree, le bandeau commun propose acceptation et refus avec une visibilite comparable, et la page cookies permet le retrait.

## Consentements

`ConsentRecord` stocke uniquement :

- `agencyId`
- `visitorId` ou `accountId`
- `purpose`
- `decision`
- `policyVersion`
- `createdAt`
- `updatedAt`

Decisions :

- `accepted`
- `refused`
- `withdrawn`

Le consentement aux conditions commerciales d'activation est separe des cookies et des traitements RGPD.

## Admin

Dans Templates > Modifier / maintenance :

- bloc `Conformite et documents legaux` ;
- statuts par document ;
- version ;
- email d'exercice des droits ;
- durees de conservation ;
- categories cookies ;
- validation explicite.

Les agences demo peuvent rester incompletes. Une agence active affiche un avertissement fort si les documents ne sont pas approuves.

## Limites

Cette PR ne promet pas une conformite juridique automatique. Elle ne redige pas des mentions definitives, n'ajoute pas de CMP externe, n'installe aucun traceur et ne modifie pas Stripe.
