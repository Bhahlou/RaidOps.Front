> Réservé aux Officiers.

L'onglet **Raids** (dans les paramètres de la guilde) configure, par branche WoW active, le **mode de raid** par défaut — comment la présence est déterminée pour les nouveaux raids créés sur cette branche.

![Onglet Raids : mode de raid par branche](/assets/manual/fr/guild/raid-settings-overview.png)

### Mode de raid

Deux options :
- **Auto** (par défaut) — tout membre du roster est considéré présent sauf s'il a déclaré une absence. Aucune inscription n'est requise.
- **Planificateur** — les membres s'inscrivent par raid : Présent, Peut-être ou Absent, depuis la page du raid ou un embed Discord permanent à boutons (voir [Raids](/manual/guild/raid-builder)).

Chaque raid peut aussi surcharger le mode depuis sa propre boîte de dialogue de création — un raid Planificateur ponctuel sur une branche en Auto, ou l'inverse, sans changer le réglage par défaut de la branche.

> Active d'abord une branche dans l'onglet **Général** si tu ne la vois pas encore ici.

### Modèle d'attributions de raid

Sous le réglage du mode de raid, les officiers peuvent définir un modèle réutilisable de lignes que chaque raid doit avoir remplies — buffs, malédictions, échanges tank/heal, interrupts, etc. Les officiers remplissent chaque ligne avec de vrais personnages présents, raid par raid, depuis l'onglet **Attributions** propre à ce raid (voir [Raids](/manual/guild/raid-builder)).

![Modèle d'attributions de raid : lignes groupées par section](/assets/manual/fr/guild/raid-attribution-settings-overview.png)

Chaque ligne appartient à une **section** (texte libre, ex. « Buffs », « Malédictions », « Tanks & Heals ») et contient une liste ordonnée de cellules — une icône (marqueur de raid, rôle ou sort) ou un **emplacement nominatif**, avec un libellé optionnel affiché en placeholder tant qu'il n'est pas rempli, et une restriction d'éligibilité optionnelle (classes, rôles et/ou spécialisations autorisées). Une ligne peut être marquée **Répétable** : son nombre d'instances sur un raid donné est alors calculé automatiquement selon les personnages présents (ex. un emplacement Innervation par druide présent), au lieu d'être toujours exactement un.

Chaque ligne appartient aussi à une **portée** : **Générale** (affichée sur chaque raid, quel que soit le boss en cours) ou un boss précis d'une instance de raid. À choisir depuis le sélecteur **Raid** au-dessus de la liste, puis le sélecteur **Boss** une fois un raid précis choisi. Une ligne liée à un boss ne s'affiche que sur les raids qui ciblent effectivement la zone de ce boss, et chaque boss garde sa propre liste, réordonnable indépendamment — modifier ou réordonner les lignes d'un boss ne touche jamais la Générale ni les autres boss.

![Modèle d'attributions de raid : sélecteur de portée par boss](/assets/manual/fr/guild/raid-attribution-boss-scope.png)

Une section peut aussi avoir sa propre icône — affichée une fois au-dessus de toutes les lignes qui partagent cette section, indépendamment de l'icône des lignes elles-mêmes (pratique pour un marqueur en tête d'une section « Interrupts », par exemple). À choisir directement en créant la première ligne d'une section, ou après coup depuis le bouton palette à côté du nom de la section.
