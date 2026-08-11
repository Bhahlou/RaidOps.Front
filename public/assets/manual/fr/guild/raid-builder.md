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

### Page de détail d'un raid

Une fois un raid **publié**, son nom devient cliquable dans la grille et ouvre sa page de détail dédiée (fil d'Ariane : Guilde > Raids > nom du raid) — pour l'instant, c'est là que vivront plus tard la présence, le loot et l'analyse de logs. Un raid encore en brouillon garde un nom en texte simple, sans lien.

### Annonce de composition Discord

Quand le salon **Annonce de composition** est configuré dans l'onglet Notifications (voir le guide dédié), publier un raid poste un embed listant tous les slots groupe par groupe. Ce même message est ensuite édité en place à chaque assignation, désassignation, échange ou changement de spécialisation — jamais republié, donc toujours à jour sans spammer le salon. Chaque joueur ajouté ou retiré peut en plus recevoir un DM détaillant sur quel personnage, si ce réglage est activé séparément.

![Embed Discord de l'annonce de composition](/assets/manual/fr/guild/raid-composition-announcement.png)

### Annoncer le groupage

> Réservé aux Officiers.

Sur la page de détail d'un raid publié, le bouton **Annoncer le groupage** poste un message ponctuel dans le salon d'annonce, mentionnant tous les joueurs assignés et précisant sur quel personnage les whisper pour une invitation — avec un instantané de la composition actuelle en embed (celui-ci n'est pas mis à jour après coup, contrairement à l'annonce vivante). Le personnage référencé est le tien si tu es toi-même assigné à ce raid ; sinon, une fenêtre **Qui les joueurs doivent-ils whisper ?** te fait choisir parmi les personnages assignés.

La même action est disponible directement depuis Discord via la commande `/raid invite <raid> [personnage]` — le raid se choisit par autocomplétion, et le paramètre personnage est optionnel (même logique de résolution que le bouton).

![Message Discord de groupage, avec la compo en embed](/assets/manual/fr/guild/raid-grouping-announcement.png)
