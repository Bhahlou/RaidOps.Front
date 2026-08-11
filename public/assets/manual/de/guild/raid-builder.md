Auf der Seite **Raids** stellen Officer Raidgruppen zusammen, indem sie Charaktere aus dem Roster-Pool auf das Raster ziehen — und jedes Roster-Mitglied kann sehen, wer wo eingeteilt ist.

![Raids-Seite: Raster und Roster-Pool](/assets/manual/de/guild/raid-builder-overview.png)

### Roster-Pool

Das seitliche Panel listet jeden Charakter, der für mindestens einen der aktuell angezeigten Raids infrage kommt — filterbar nach Klasse, Spezialisierung und Rang, durchsuchbar nach Charakter- oder Spielername. Ein Charakter verschwindet aus dem Pool, sobald sein Spieler bereits in jedem sichtbaren Raid an diesem Tag einen Slot belegt.

### Charaktere einteilen

Ziehen Sie einen Charakter aus dem Pool auf einen leeren Slot, um ihn einzuteilen. Wird ein bereits eingeteilter Charakter auf einen anderen leeren Slot gezogen, wird er verschoben; das Ablegen auf einem belegten Slot tauscht beide Charaktere. Ein Slot färbt sich rot und verweigert das Ablegen, wenn der Spieler an diesem Tag als abwesend gemeldet ist, bereits einen anderen Slot im selben Raid belegt, oder der Charakter bereits über einen anderen Raid mit demselben wöchentlichen Lockout auf diese Raidzone gesperrt ist — ihn aus diesem anderen Raid herauszuziehen verschiebt ihn stattdessen.

Officer ohne Lust auf Drag & Drop können auch auf einen leeren Slot klicken, um direkt einen Charakter zu suchen und einzuteilen. Ein Charakter mit mehr als einer deklarierten Raid-Spezialisierung kann direkt über seine zugewiesene Karte wechseln, welche er für diesen Slot spielt.

### Raid-Events und -Serien

Bis zu vier Raids können für eine gegebene Woche nebeneinander zusammengestellt werden — entweder einmalige Events oder Vorkommen, die automatisch von einer wiederkehrenden **Serie** erzeugt werden (gleicher Wochentag, Uhrzeit, Gruppengröße und Zielraidzonen jede Woche oder alle N Wochen). Ein Raid startet als **Entwurf**, unsichtbar für reguläre Roster-Mitglieder, bis ein Officer ihn **veröffentlicht**. Das Löschen eines Events entfernt auch alle seine Einteilungen; das Deaktivieren einer Serie stoppt die Erzeugung neuer Vorkommen, mit der Option, bereits erzeugte, aber noch leere und unveröffentlichte Vorkommen gleich mit aufzuräumen.

Die standardmäßig angezeigte Woche entspricht dem tatsächlichen wöchentlichen Raid-Lockout-Reset-Fenster des Gilden-Zweigs, sobald dessen Region im Tab Allgemein der Gildeneinstellungen konfiguriert ist.

![Dialog „Raid-Event bearbeiten": Name, Zeitplan, Rastergröße und Raidzonen](/assets/manual/de/guild/raid-builder-edit-dialog.png)

### Detailseite eines Raids

Sobald ein Raid **veröffentlicht** ist, wird sein Name im Raster anklickbar und öffnet seine eigene Detailseite (Breadcrumb: Gilde > Raids > Raid-Name) — hier werden später Anwesenheit, Loot und Log-Analyse zu finden sein. Ein noch im Entwurf befindlicher Raid behält einen einfachen, nicht verlinkten Namen.

### Discord-Kompositions-Ankündigung

Sobald der Kanal **Zusammensetzungsankündigung** im Tab Benachrichtigungen konfiguriert ist (siehe die eigene Anleitung), postet das Veröffentlichen eines Raids ein Embed mit allen Slots, Gruppe für Gruppe. Dieselbe Nachricht wird danach bei jeder Zuweisung, Entfernung, jedem Tausch oder Skillungswechsel bearbeitet — nie neu gepostet, sodass sie stets aktuell bleibt, ohne den Kanal zuzuspammen. Jeder hinzugefügte oder entfernte Spieler kann zusätzlich eine DM erhalten, die angibt, mit welchem Charakter — sofern diese separate Einstellung aktiviert ist.

![Discord-Embed der Zusammensetzungsankündigung](/assets/manual/de/guild/raid-composition-announcement.png)

### Gruppierung anpingen

> Nur für Officer.

Auf der Detailseite eines veröffentlichten Raids postet der Button **Gruppierung anpingen** eine einmalige Nachricht im Ankündigungskanal, die alle zugewiesenen Spieler erwähnt und angibt, welchen Charakter sie für eine Einladung anflüstern sollen — mit einem Schnappschuss der aktuellen Zusammensetzung als Embed (im Gegensatz zur dauerhaften Ankündigung wird dieser danach nicht aktualisiert). Referenziert wird dein eigener Charakter, falls du selbst diesem Raid zugewiesen bist; andernfalls fragt dich ein Dialog **Wen sollen die Spieler anflüstern?**, welchen zugewiesenen Charakter du wählst.

Dieselbe Aktion ist auch direkt über Discord per Befehl `/raid invite <raid> [charakter]` verfügbar — der Raid wird per Autovervollständigung ausgewählt, und der Charakter-Parameter ist optional (gleiche Auflösungslogik wie der Button).

![Discord-Gruppierungsnachricht, mit der Zusammensetzung als Embed](/assets/manual/de/guild/raid-grouping-announcement.png)
