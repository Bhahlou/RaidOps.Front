> Nur für Officer.

Der Tab **Benachrichtigungen** (in den Gildeneinstellungen) legt fest, welche Gildenereignisse über den RaidOps-Bot eine Nachricht in einen Discord-Kanal posten.

Ein „Abwesenheit"-Ereignis umfasst sowohl eine einmalige Eintragung als auch eine Wiederholung (wöchentlich oder benutzerdefinierter Zyklus) — die gepostete Nachricht beschreibt immer genau, was sich geändert hat (betroffene Daten, teilweise Zeitgrenzen, oder Tag für Tag bei einer Wiederholung), nie eine allgemeine Bezeichnung.

![Übersicht des Tabs Benachrichtigungen](/assets/manual/de/guild/notifications-settings-overview.png)

Raid-Ereignisse haben vier getrennte Gruppen, die du unabhängig voneinander aktivieren kannst:

- **Raid-Änderungen** postet, wenn ein Raid veröffentlicht wird, wenn ein bereits veröffentlichter Raid abgesagt (gelöscht) wird, oder wenn seine Startzeit verschoben wird.
- **Zusammensetzungsänderungen** postet, wenn ein Charakter auf einem **bereits veröffentlichten** Raid zugewiesen, entfernt, getauscht wird oder seine Skillung geändert wird — Änderungen, die noch im Entwurfsstadium vorgenommen werden, werden nie gepostet, da außer den Officern noch niemand den Raid sehen kann.
- **Zusammensetzungsankündigung** postet ein einziges Embed mit der vollständigen Zusammensetzung eines veröffentlichten Raids, Gruppe für Gruppe — anders als bei *Zusammensetzungsänderungen* (eine Nachricht pro Änderung) wird dieselbe Nachricht bei jeder Änderung bearbeitet, nie neu gepostet. Die Einstellung **DM an hinzugefügte oder entfernte Spieler** sendet zusätzlich eine private Nachricht an jeden betroffenen Spieler; da eine DM keinen Kanal hat, erscheint für diese Zeile keine Kanalauswahl.
- **Raid-Anmeldeaufruf** postet ein dauerhaftes Embed mit Zusagen/Vielleicht/Absagen-Buttons für einen veröffentlichten Raid im Planer-Modus (siehe [Raids](/manual/guild/raid-builder)) — wird bei jeder Antwort bearbeitet, sodass direkt aus Discord geantwortet werden kann, ohne das Web zu öffnen.

> Der für **Zusammensetzungsankündigung** gewählte Kanal wird auch für den Gruppierungs-Ping verwendet (der Button **Gruppierung anpingen** auf der Seite eines Raids, oder der Discord-Befehl `/raid invite`) — siehe die Anleitung **Raids**. Ohne hier konfigurierten Kanal schlägt die Gruppierung fehl.

### Einen Geltungsbereich wählen

Die Auswahl **Geltungsbereich** oben im Panel wechselt zwischen **Ganze Gilde** und einem bestimmten Spielzweig der Gilde. Die Einstellungen eines Spielzweigs übernehmen standardmäßig für jedes Ereignis den gildenweiten Wert — ein Hinweis „Übernommen von der gildenweiten Einstellung" erscheint neben jedem Ereignis, das für diesen Spielzweig noch nicht überschrieben wurde. Änderst du den Kanal oder den Schalter für diesen Spielzweig, entsteht eine explizite Überschreibung; **Vererbung wiederherstellen** entfernt sie und übernimmt wieder den gildenweiten Wert.

### Ein Ereignis aktivieren

Jedes Ereignis hat einen eigenen Schalter. Aktivierst du ihn, erscheint eine Kanalauswahl mit allen Textkanälen, die der Bot auf deinem Server sehen kann.

### Einen Kanal auswählen

Zeigt ein Kanal eine ⚠️-Warnung an, fehlen dem Bot eine oder mehrere Berechtigungen, die er zum Posten dort benötigt (z. B. *Kanal ansehen*, *Nachrichten senden*, *Links einbetten* — namentlich aufgelistet, damit du genau weißt, was zu korrigieren ist). Du kannst ihn trotzdem auswählen, bevor du seine Berechtigungen korrigierst, aber es wird keine Nachricht gepostet, bis der Zugriff des Bots korrigiert ist.

### Speichern

Das Umschalten eines Ereignisses oder die Auswahl eines Kanals speichert automatisch — kein Speichern-Button. Eine Zeile bleibt ungespeichert, wenn sie aktiviert ist, aber noch kein Kanal ausgewählt wurde.
