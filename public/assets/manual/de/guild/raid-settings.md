> Nur für Officer.

Der Tab **Raids** (in den Gildeneinstellungen) konfiguriert pro aktivem WoW-Spielzweig den Standard-**Raid-Modus** — wie die Anwesenheit für neue Raids auf diesem Spielzweig bestimmt wird.

![Tab Raids: Raid-Modus pro Spielzweig](/assets/manual/de/guild/raid-settings-overview.png)

### Raid-Modus

Zwei Optionen:
- **Automatisch** (Standard) — jedes Roster-Mitglied wird als anwesend angenommen, sofern es keine Abwesenheit eingetragen hat. Es ist keine Anmeldung erforderlich.
- **Planer** — Mitglieder melden sich stattdessen pro Raid an: Zusagen, Vielleicht oder Absagen, über die Seite des Raids oder ein dauerhaftes Discord-Embed mit Buttons (siehe [Raids](/manual/guild/raid-builder)).

Jeder Raid kann den Modus außerdem in seinem eigenen Erstellungsdialog überschreiben — ein einmaliger Planer-Raid auf einem Automatisch-Spielzweig, oder umgekehrt, ohne den Standard des Spielzweigs zu ändern.

> Aktiviere zuerst einen Spielzweig im Tab **Allgemein**, falls du ihn hier noch nicht siehst.

### Raid-Zuweisungsvorlage

Unter der Raid-Modus-Einstellung können Officer eine wiederverwendbare Vorlage aus Zeilen anlegen, die jeder Raid ausgefüllt braucht — Buffs, Flüche, Tank-/Heal-Wechsel, Interrupts und so weiter. Officer füllen jede Zeile pro Raid-Event mit echten anwesenden Charakteren aus, über den eigenen **Zuweisungen**-Tab dieses Raids (siehe [Raids](/manual/guild/raid-builder)).

![Raid-Zuweisungsvorlage: nach Abschnitt gruppierte Zeilen](/assets/manual/de/guild/raid-attribution-settings-overview.png)

Jede Zeile gehört zu einem **Abschnitt** (Freitext, z. B. „Buffs", „Flüche", „Tanks & Heals") und enthält eine geordnete Liste von Zellen — ein Icon (Raid-Markierung, Rolle oder Zauber) oder einen **Namensplatz** mit optionaler, bis zum Ausfüllen als Platzhalter angezeigter Bezeichnung und optionaler Berechtigungseinschränkung (erlaubte Klassen, Rollen und/oder Spezialisierungen). Eine Zeile kann als **Wiederholbar** markiert werden: Ihre Anzahl an Instanzen wird dann pro Raid automatisch anhand der Anwesenden berechnet (z. B. ein Anregen-Platz pro anwesendem Druiden), statt immer genau eine zu sein.

Jede Zeile gehört außerdem zu einem **Geltungsbereich**: **Allgemein** (auf jedem Raid sichtbar, unabhängig vom aktuellen Boss) oder ein bestimmter Boss einer Raid-Instanz. Auswählbar über den **Raid**-Picker oberhalb der Liste, dann den **Boss**-Picker, sobald ein bestimmter Raid gewählt ist. Eine bossgebundene Zeile erscheint nur bei Raid-Events, die tatsächlich die Zone dieses Bosses anvisieren, und jeder Boss behält seine eigene, unabhängig sortierbare Liste — das Bearbeiten oder Umsortieren der Zeilen eines Bosses betrifft nie Allgemein oder einen anderen Boss.

![Raid-Zuweisungsvorlage: Boss-Geltungsbereich-Auswahl](/assets/manual/de/guild/raid-attribution-boss-scope.png)

Ein Abschnitt kann auch ein eigenes Icon tragen — einmal über allen Zeilen dieses Abschnitts angezeigt, unabhängig vom Icon der Zeilen selbst (praktisch für eine Markierung über einem ganzen „Interrupts"-Abschnitt, zum Beispiel). Direkt beim Anlegen der ersten Zeile eines Abschnitts wählbar, oder nachträglich über die Paletten-Schaltfläche neben dem Abschnittsnamen.
