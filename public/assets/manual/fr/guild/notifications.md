> Réservé aux Officiers.

L'onglet **Notifications** (dans les paramètres de la guilde) configure quels évènements de la guilde postent un message dans un salon Discord via le bot RaidOps.

Un évènement « absence » couvre aussi bien une déclaration ponctuelle qu'une récurrence (hebdomadaire ou cycle personnalisé) — le message posté détaille toujours précisément ce qui a changé (dates concernées, horaires partiels, ou jour par jour pour une récurrence), jamais un intitulé générique.

![Vue d'ensemble de l'onglet Notifications](/assets/manual/fr/guild/notifications-settings-overview.png)

Les évènements de raid ont quatre familles distinctes, activables indépendamment les unes des autres :

- **Changements de raid** poste quand un raid est publié, quand un raid déjà publié est annulé (supprimé), ou quand son horaire est reprogrammé.
- **Changements de composition** poste quand un personnage est assigné, désassigné, échangé, ou change de spé sur un raid **déjà publié** — les modifications faites pendant qu'un raid est encore en brouillon ne postent jamais, puisque personne en dehors des officiers ne peut encore le voir.
- **Annonce de composition** poste un embed unique qui affiche l'état complet de la composition d'un raid publié, groupe par groupe — contrairement à *Changements de composition* (un message par changement), ce même message est réédité en place à chaque modification, jamais republié. Le réglage **DM aux joueurs ajoutés ou retirés du raid** envoie en plus un message privé à chaque joueur concerné ; comme un DM n'a pas de salon, aucun sélecteur de salon n'apparaît pour cette ligne.
- **Appel aux inscriptions** poste un embed permanent avec des boutons Présent/Peut-être/Absent pour un raid publié en mode Planificateur (voir [Raids](/manual/guild/raid-builder)) — réédité en place au fur et à mesure des réponses, pour répondre directement depuis Discord sans passer par le site.

> Le salon choisi pour **Annonce de composition** est aussi celui utilisé pour le message de groupage (bouton **Annoncer le groupage** sur la page d'un raid, ou commande Discord `/raid invite`) — voir le guide **Page Raids**. Sans salon configuré ici, le groupage échoue.

### Choisir une portée

Le sélecteur **Portée** en haut du panneau bascule entre **Toute la guilde** et une branche précise de la guilde. Les réglages d'une branche héritent par défaut de la valeur de toute la guilde pour chaque évènement — une indication « Hérité du réglage général de la guilde » apparaît près de tout évènement pas encore surchargé pour cette branche. Changer le salon ou l'interrupteur pour cette branche crée une surcharge explicite ; **Revenir à l'héritage** la supprime et repasse sur la valeur générale de la guilde.

### Activer un évènement

Chaque évènement a son propre interrupteur. L'activer fait apparaître un sélecteur de salon listant tous les salons textuels visibles par le bot sur ton serveur.

### Choisir un salon

Si un salon affiche un avertissement ⚠️, il manque au bot une ou plusieurs permissions nécessaires pour y poster (par exemple *voir le salon*, *envoyer des messages*, *intégrer des liens* — listées nommément pour que tu saches exactement quoi corriger). Tu peux quand même le sélectionner avant de corriger ses permissions, mais aucun message ne sera posté tant que l'accès du bot n'est pas corrigé.

### Enregistrement

Cocher un évènement ou choisir un salon enregistre automatiquement — pas de bouton Enregistrer. Une ligne reste non enregistrée si elle est activée mais sans salon choisi.
