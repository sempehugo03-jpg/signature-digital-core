# Politique provisoire isolée — QA A/B

Activée seulement sur le Produit QA avec Stripe TEST et FABRYA_QA_CREDIT_POLICY=measured-bytes-v1. Elle ne vaut ni validation commerciale ni coût facturé par l'hébergeur.

Les modifications simples du moteur déterministe n'appellent aucun fournisseur IA : 0 appel et 0 coût IA. Les octets du HTML réellement produit sont mesurés et journalisés après vérification des octets servis. Le coût total de l'hébergement facturé reste inconnu.

Pour exercer le circuit sans inventer une facture : coût COMPTABLE DE TEST = 10 000 microeuros + 10 microeuros par Kio de HTML (arrondi supérieur). 1 crédit TEST = 100 000 microeuros. Les coefficients et l'unité sont configurables. Limite HTML : 2 300 000 octets. Une modification simple réserve normalement 1 crédit ; l'aperçu ne débite rien ; seule une publication vérifiée règle le débit, au minimum 1 crédit. Une demande refusée libère sa réserve ; la restauration ne débite pas de nouveau crédit. Les clés de demande, commandes et règlements existantes restent les protections contre le double débit.

Ce modèle basé sur le volume mesure une composante observable, pas CPU/D1/requêtes ni facture complète. Avant une politique commerciale : intégrer télémétrie CPU, lectures/écritures D1, requêtes et stockage, les taux du contrat d'hébergement, puis marge commerciale explicitement approuvée. Aucun taux fournisseur n'est affirmé ici. Aucune recharge, abonnement ou nouveau service payant activé.

Configuration : FABRYA_QA_COST_BASE_MICROEUR, FABRYA_QA_COST_KIB_MICROEUR, FABRYA_QA_CREDIT_UNIT_MICROEUR. Désactivation : retirer FABRYA_QA_CREDIT_POLICY. La politique commerciale approuvée conserve son verrou séparé.
