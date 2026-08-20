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

### Anmeldemodus

Standardmäßig läuft ein Raid im Modus **Automatisch**: Jedes Roster-Mitglied gilt als anwesend, sofern es keine Abwesenheit eingetragen hat, keine Anmeldung nötig (der Standard pro Spielzweig wird in den [Raid-Einstellungen](/manual/guild/raid-settings) festgelegt). Ein Raid kann stattdessen im Modus **Planer** laufen — entweder weil sein Spielzweig das als Standard hat, oder weil ein Officer beim Erstellen eines einmaligen Ausnahme-Raids „Anmeldemodus für diesen Raid verwenden" ankreuzt — dann melden sich Roster-Mitglieder selbst an (siehe die Detailseite des Raids weiter unten), statt sich auf ihre eingetragenen Abwesenheiten zu verlassen.

Mit **Zusagen** oder **Vielleicht** zu antworten fragt, welcher Charakter mitkommt und welche Raid-Spezialisierung, falls mehr als eine deklariert ist; **Absagen** braucht keins von beidem. Officer sehen jede Antwort nach Status aufgeschlüsselt auf der Detailseite des Raids — Zusagen nach Klasse gruppiert, Vielleicht und Absagen als einfache Listen — live, egal ob die Antwort vom Web oder aus Discord kam, und können einen zugesagten Charakter von dort direkt in einen Slot ziehen, genau wie aus dem Roster-Pool.

### Dedizierter Discord-Kanal

Ein Raid — einmalig oder aus einer Serie erzeugt — kann in seinen eigenen Discord-Kanal posten statt in den unter Benachrichtigungen konfigurierten: Aktiviere **Dedizierter Discord-Kanal** im Erstellungs- oder Bearbeitungsdialog, wähle dann entweder einen **Bestehenden Kanal** oder lass RaidOps einen **Neuen Kanal** anlegen (in einer Kategorie deiner Wahl, mit einem aus Raidname und Datum vorgeschlagenen, änderbaren Namen). Eine Serie kann dasselbe für jedes von ihr erzeugte Vorkommen tun und dabei jedes Mal einen frischen Kanal anlegen, statt einen wiederzuverwenden.

![Erstellungsdialog: Umschalter für Anmeldemodus und Auswahl des dedizierten Kanals](/assets/manual/de/guild/raid-builder-channel-picker.png)

### Detailseite eines Raids

Sobald ein Raid **veröffentlicht** ist, wird sein Name im Raster anklickbar und öffnet seine eigene Detailseite (Breadcrumb: Gilde > Raids > Raid-Name) — ein noch im Entwurf befindlicher Raid behält einen einfachen, nicht verlinkten Namen. Der Header zeigt Datum und Uhrzeit vollständig, die Zonen des Raids und eine live aus den aktuellen Einteilungen berechnete Rollenzählung (Tank/Heal/Nahkampf/Fernkampf); ein Raid im Planer-Modus fügt dort deine eigene Antwort (Zusagen/Vielleicht/Absagen) hinzu. Darunter steht dasselbe Kompositionsraster wie auf der Raids-Seite neben entweder der Verfügbarkeitsübersicht des Rosters (Modus Automatisch) oder der Anmeldungsübersicht (Modus Planer) — beide dienen Officern zugleich als Ziehquelle ins Raster, genau wie der Roster-Pool. Officer bekommen zusätzlich **Veröffentlichen** (solange es ein Entwurf ist), **Gruppierung anpingen** (sobald veröffentlicht, siehe unten) und einen **Bearbeiten**-Shortcut, alles vom selben Header aus.

![Detailseite eines Raids: Header mit Antwort-Buttons, Kompositionsraster und Anmeldungsübersicht](/assets/manual/de/guild/raid-detail-overview.png)

### Discord-Kompositions-Ankündigung

Sobald der Kanal **Zusammensetzungsankündigung** im Tab Benachrichtigungen konfiguriert ist (siehe die eigene Anleitung), postet das Veröffentlichen eines Raids ein Embed mit allen Slots, Gruppe für Gruppe. Dieselbe Nachricht wird danach bei jeder Zuweisung, Entfernung, jedem Tausch oder Skillungswechsel bearbeitet — nie neu gepostet, sodass sie stets aktuell bleibt, ohne den Kanal zuzuspammen. Jeder hinzugefügte oder entfernte Spieler kann zusätzlich eine DM erhalten, die angibt, mit welchem Charakter — sofern diese separate Einstellung aktiviert ist.

![Discord-Embed der Zusammensetzungsankündigung](/assets/manual/de/guild/raid-composition-announcement.png)

### Gruppierung anpingen

> Nur für Officer.

Auf der Detailseite eines veröffentlichten Raids postet der Button **Gruppierung anpingen** eine einmalige Nachricht im Ankündigungskanal, die alle zugewiesenen Spieler erwähnt und angibt, welchen Charakter sie für eine Einladung anflüstern sollen — mit einem Schnappschuss der aktuellen Zusammensetzung als Embed (im Gegensatz zur dauerhaften Ankündigung wird dieser danach nicht aktualisiert). Referenziert wird dein eigener Charakter, falls du selbst diesem Raid zugewiesen bist; andernfalls fragt dich ein Dialog **Wen sollen die Spieler anflüstern?**, welchen zugewiesenen Charakter du wählst.

Dieselbe Aktion ist auch direkt über Discord per Befehl `/raid invite <raid> [charakter]` verfügbar — der Raid wird per Autovervollständigung ausgewählt, und der Charakter-Parameter ist optional (gleiche Auflösungslogik wie der Button).

![Discord-Gruppierungsnachricht, mit der Zusammensetzung als Embed](/assets/manual/de/guild/raid-grouping-announcement.png)
