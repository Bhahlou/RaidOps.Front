La page **Raids** est l'endroit où les officiers composent les groupes de raid en glissant des personnages depuis les personnages disponibles vers la grille, et où chaque membre du roster peut voir qui est assigné où.

![Page Raids : grille et personnages disponibles](/assets/manual/fr/guild/raid-builder-overview.png)

### Personnages disponibles

Le panneau latéral liste tous les personnages éligibles pour au moins un des raids actuellement affichés — filtrable par classe, spécialisation et rang, et cherchable par nom de personnage ou de joueur. Un personnage disparaît de la liste dès que son joueur occupe déjà un slot dans tous les raids visibles pour cette date.

### Assigner des personnages

Glissez un personnage depuis la liste vers un slot vide pour l'assigner. Glisser un personnage déjà assigné vers un autre slot vide le déplace ; le déposer sur un slot occupé échange les deux personnages. Un slot passe en rouge et refuse le dépôt quand le joueur est déclaré absent ce jour-là, occupe déjà un autre slot dans le même raid, ou que le personnage est déjà verrouillé sur la zone de ce raid via un autre raid partageant le même lockout hebdomadaire — le glisser hors de cet autre raid le déplace en revanche.

Les officiers qui préfèrent ne pas faire de glisser-déposer peuvent cliquer sur un slot vide pour chercher et assigner un personnage directement. Un personnage ayant déclaré plusieurs spécialisations de raid peut changer laquelle il joue pour ce slot directement depuis sa carte assignée.

### Événements et séries de raid

Jusqu'à quatre raids peuvent être composés côte à côte pour une semaine donnée — soit des événements ponctuels, soit des occurrences générées automatiquement par une **série** récurrente (même jour de semaine, heure, taille de groupe et zones cibles chaque semaine ou toutes les N semaines). Un raid démarre en **brouillon**, invisible pour les membres du roster classiques, jusqu'à ce qu'un officier le **publie**. Supprimer un événement retire aussi toutes ses assignations ; désactiver une série arrête la génération de nouvelles occurrences, avec la possibilité de nettoyer en même temps celles déjà générées mais encore vides et non publiées.

La semaine affichée par défaut correspond à la fenêtre de reset hebdomadaire réelle de la branche de guilde, une fois sa région configurée dans l'onglet Général des paramètres de la guilde.

![Boîte de dialogue d'édition d'un raid : nom, horaire, taille de grille et zones](/assets/manual/fr/guild/raid-builder-edit-dialog.png)

### Suite d'un raid sur plusieurs soirs

Un raid peut être marqué comme la suite d'un autre — l'équivalent en jeu d'étendre l'ID d'un raid plutôt que d'en consommer un nouveau, par exemple pour cleaner Black Temple sur deux soirées consécutives avec le même lock. Le champ **Suite de**, dans la boîte de dialogue de création ou d'édition, propose les raids de la branche dans la même fenêtre de reset hebdomadaire. Une fois le lien posé, les mêmes personnages peuvent être assignés aux deux raids sans que le site ne bloque l'assignation pour conflit de verrouillage ; un badge **Suite de « nom »** apparaît alors sur la page de détail du raid concerné.

### Mode d'inscription

Par défaut, un raid tourne en mode **Auto** : tout membre du roster est considéré présent sauf s'il a déclaré une absence, aucune inscription n'est nécessaire (le réglage par défaut de la branche se configure dans les [paramètres Raids](/manual/guild/raid-settings)). Un raid peut à la place tourner en mode **Planificateur** — soit parce que sa branche l'a comme défaut, soit parce qu'un officier coche « Utiliser le mode inscription pour ce raid » en créant un raid exceptionnel ponctuel — auquel cas les membres du roster s'inscrivent eux-mêmes (voir la page de détail du raid ci-dessous) plutôt que de se baser sur leurs absences déclarées.

Répondre **Présent** ou **Peut-être** demande quel personnage amener, et quelle spécialisation de raid s'il en a déclaré plusieurs ; **Absent** ne demande ni l'un ni l'autre. Les officiers voient chaque réponse répartie par statut sur la page de détail du raid — les Présents groupés par classe, les Peut-être et les Absents en listes simples — en direct, que la réponse vienne du site ou de Discord, et peuvent glisser un personnage Présent directement dans un slot depuis là, exactement comme depuis les personnages disponibles.

### Salon Discord dédié

Un raid — ponctuel ou généré depuis une série — peut poster dans son propre salon Discord plutôt que dans celui configuré dans Notifications : coche **Salon Discord dédié** dans la boîte de dialogue de création ou d'édition, puis choisis soit un **Salon existant**, soit laisse RaidOps créer un **Nouveau salon** (dans une catégorie de ton choix, avec un nom suggéré à partir du nom et de la date du raid, modifiable). Une série peut faire de même pour chaque occurrence qu'elle génère, en créant un nouveau salon à chaque fois plutôt que de réutiliser le même.

![Boîte de dialogue de création : bascule mode inscription et sélecteur de salon dédié](/assets/manual/fr/guild/raid-builder-channel-picker.png)

### Page de détail d'un raid

Une fois un raid **publié**, son nom devient cliquable dans la grille et ouvre sa page de détail dédiée (fil d'Ariane : Guilde > Raids > nom du raid) — un raid encore en brouillon garde un nom en texte simple, sans lien. L'en-tête affiche la date et l'heure complètes, les zones du raid, et un comptage des rôles en direct (tank/soin/mêlée/distance) calculé depuis les assignations actuelles ; un raid en mode Planificateur y ajoute ta réponse (Présent/Peut-être/Absent). En dessous, la même grille de composition que la page Raids se trouve à côté soit de la répartition de disponibilité du roster (mode Auto), soit de la répartition des inscriptions (mode Planificateur) — les deux servent aussi de source de glisser-déposer vers la grille pour les officiers, exactement comme les personnages disponibles. Les officiers ont en plus **Publier** (tant que c'est un brouillon), **Annoncer le groupage** (une fois publié, voir plus bas), et un raccourci **Modifier**, le tout depuis le même en-tête.

![Page de détail d'un raid : en-tête avec boutons de réponse, grille de composition, et répartition des inscriptions](/assets/manual/fr/guild/raid-detail-overview.png)

### Annonce de composition Discord

Quand le salon **Annonce de composition** est configuré dans l'onglet Notifications (voir le guide dédié), publier un raid poste un embed listant tous les slots groupe par groupe. Ce même message est ensuite édité en place à chaque assignation, désassignation, échange ou changement de spécialisation — jamais republié, donc toujours à jour sans spammer le salon. Chaque joueur ajouté ou retiré peut en plus recevoir un DM détaillant sur quel personnage, si ce réglage est activé séparément.

![Embed Discord de l'annonce de composition](/assets/manual/fr/guild/raid-composition-announcement.png)

### Annoncer le groupage

> Réservé aux Officiers.

Sur la page de détail d'un raid publié, le bouton **Annoncer le groupage** poste un message ponctuel dans le salon d'annonce, mentionnant tous les joueurs assignés et précisant sur quel personnage les whisper pour une invitation — avec un instantané de la composition actuelle en embed (celui-ci n'est pas mis à jour après coup, contrairement à l'annonce vivante). Le personnage référencé est le tien si tu es toi-même assigné à ce raid ; sinon, une fenêtre **Qui les joueurs doivent-ils whisper ?** te fait choisir parmi les personnages assignés.

La même action est disponible directement depuis Discord via la commande `/raid invite <raid> [personnage]` — le raid se choisit par autocomplétion, et le paramètre personnage est optionnel (même logique de résolution que le bouton).

![Message Discord de groupage, avec la compo en embed](/assets/manual/fr/guild/raid-grouping-announcement.png)
