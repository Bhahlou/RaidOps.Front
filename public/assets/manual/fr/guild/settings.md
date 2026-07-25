> Réservé aux Officiers.

L'onglet **Général** (dans les paramètres de la guilde) configure le fuseau horaire, la langue et les règles d'accès de la guilde.

![Vue d'ensemble de la page Paramètres](/assets/manual/fr/guild/settings-overview.png)

### Fuseau horaire

Champ avec autocomplétion, pré-rempli automatiquement avec le fuseau de ton navigateur au premier chargement. Ce fuseau sert de référence pour tous les horaires de la guilde (raids, calendrier).

### Langue

Langue utilisée par RaidOps pour communiquer avec la guilde — pour l'instant, le contenu des messages postés par le bot Discord (absences ponctuelles et récurrences). Tant qu'elle n'a jamais été enregistrée pour cette guilde, elle est simplement pré-remplie à partir de la langue de ton propre navigateur, et un message te le signale clairement.

### Accès au roster

Deux modes possibles :
- **Ouvert à tous** — n'importe quel membre authentifié peut rejoindre le roster.
- **Rôle Discord requis** — seuls les membres ayant un rôle Discord suffisant peuvent rejoindre.

Si tu choisis **Rôle Discord requis**, un sélecteur de **seuil d'accès au roster** apparaît : clique sur un rôle Discord pour le désigner comme seuil minimum. Ce rôle et tous les rôles au-dessus dans la hiérarchie Discord donnent accès au roster ; les autres sont listés sous **Rôles exclus**.

![Sélecteur de seuil d'accès au roster](/assets/manual/fr/guild/roster-threshold-picker.png)

### Seuil d'accès Officier

Indépendant du mode d'accès au roster : ce réglage définit le rôle Discord minimum requis pour obtenir l'accès Officier dans RaidOps (roster éditable, paramètres, journal d'audit). Les administrateurs du serveur Discord gardent toujours l'accès complet, quel que soit ce choix. Ce champ est obligatoire — le bouton d'enregistrement reste désactivé tant qu'aucun rôle n'est choisi.

### Enregistrer

**Enregistrer les réglages** sauvegarde tous les réglages de cet onglet (fuseau horaire, langue, accès au roster, seuil Officier) en une seule action, indépendamment de l'onglet Notifications. Un message de confirmation s'affiche une fois enregistré.
