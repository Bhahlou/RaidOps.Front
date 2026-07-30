> Nur für Officer.

Der Tab **Benachrichtigungen** (in den Gildeneinstellungen) legt fest, welche Gildenereignisse über den RaidOps-Bot eine Nachricht in einen Discord-Kanal posten.

Ein „Abwesenheit"-Ereignis umfasst sowohl eine einmalige Eintragung als auch eine Wiederholung (wöchentlich oder benutzerdefinierter Zyklus) — die gepostete Nachricht beschreibt immer genau, was sich geändert hat (betroffene Daten, teilweise Zeitgrenzen, oder Tag für Tag bei einer Wiederholung), nie eine allgemeine Bezeichnung.

![Übersicht des Tabs Benachrichtigungen](/assets/manual/de/guild/notifications-settings-overview.png)

### Einen Geltungsbereich wählen

Die Auswahl **Geltungsbereich** oben im Panel wechselt zwischen **Ganze Gilde** und einem bestimmten Spielzweig der Gilde. Die Einstellungen eines Spielzweigs übernehmen standardmäßig für jedes Ereignis den gildenweiten Wert — ein Hinweis „Übernommen von der gildenweiten Einstellung" erscheint neben jedem Ereignis, das für diesen Spielzweig noch nicht überschrieben wurde. Änderst du den Kanal oder den Schalter für diesen Spielzweig, entsteht eine explizite Überschreibung; **Vererbung wiederherstellen** entfernt sie und übernimmt wieder den gildenweiten Wert.

### Ein Ereignis aktivieren

Jedes Ereignis hat einen eigenen Schalter. Aktivierst du ihn, erscheint eine Kanalauswahl mit allen Textkanälen, die der Bot auf deinem Server sehen kann.

### Einen Kanal auswählen

Zeigt ein Kanal eine ⚠️-Warnung an, fehlen dem Bot eine oder mehrere Berechtigungen, die er zum Posten dort benötigt (z. B. *Kanal ansehen*, *Nachrichten senden*, *Links einbetten* — namentlich aufgelistet, damit du genau weißt, was zu korrigieren ist). Du kannst ihn trotzdem auswählen, bevor du seine Berechtigungen korrigierst, aber es wird keine Nachricht gepostet, bis der Zugriff des Bots korrigiert ist.

### Speichern

**Benachrichtigungseinstellungen speichern** sichert Schalter und Kanal jedes Ereignisses in einer Aktion, unabhängig vom Tab Allgemein.
