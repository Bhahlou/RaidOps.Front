> Réservé aux Officiers.

L'onglet **Notifications** (dans les paramètres de la guilde) configure quels évènements de la guilde postent un message dans un salon Discord via le bot RaidOps.

Un évènement « absence » couvre aussi bien une déclaration ponctuelle qu'une récurrence (hebdomadaire ou cycle personnalisé) — le message posté détaille toujours précisément ce qui a changé (dates concernées, horaires partiels, ou jour par jour pour une récurrence), jamais un intitulé générique.

![Vue d'ensemble de l'onglet Notifications](/assets/manual/fr/guild/notifications-settings-overview.png)

Les évènements de raid ont deux familles distinctes, activables indépendamment l'une de l'autre :

- **Changements de raid** poste quand un raid est publié, quand un raid déjà publié est annulé (supprimé), ou quand son horaire est reprogrammé.
- **Changements de composition** poste quand un personnage est assigné, désassigné, échangé, ou change de spé sur un raid **déjà publié** — les modifications faites pendant qu'un raid est encore en brouillon ne postent jamais, puisque personne en dehors des officiers ne peut encore le voir.

### Choisir une portée

Le sélecteur **Portée** en haut du panneau bascule entre **Toute la guilde** et une branche précise de la guilde. Les réglages d'une branche héritent par défaut de la valeur de toute la guilde pour chaque évènement — une indication « Hérité du réglage général de la guilde » apparaît près de tout évènement pas encore surchargé pour cette branche. Changer le salon ou l'interrupteur pour cette branche crée une surcharge explicite ; **Revenir à l'héritage** la supprime et repasse sur la valeur générale de la guilde.

### Activer un évènement

Chaque évènement a son propre interrupteur. L'activer fait apparaître un sélecteur de salon listant tous les salons textuels visibles par le bot sur ton serveur.

### Choisir un salon

Si un salon affiche un avertissement ⚠️, il manque au bot une ou plusieurs permissions nécessaires pour y poster (par exemple *voir le salon*, *envoyer des messages*, *intégrer des liens* — listées nommément pour que tu saches exactement quoi corriger). Tu peux quand même le sélectionner avant de corriger ses permissions, mais aucun message ne sera posté tant que l'accès du bot n'est pas corrigé.

### Enregistrer

**Enregistrer les notifications** sauvegarde l'interrupteur et le salon de chaque évènement en une seule action, indépendamment de l'onglet Général.
