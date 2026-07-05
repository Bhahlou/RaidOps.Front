> Nur für Officer.

Die Seite **Gildeneinstellungen** konfiguriert die Zeitzone und die Zugriffsregeln der Gilde.

![Übersicht der Einstellungsseite](/assets/manual/de/guild/settings-overview.png)

### Zeitzone

Ein Autocomplete-Feld, das beim ersten Laden automatisch mit der Zeitzone deines Browsers vorausgefüllt wird. Diese Zeitzone dient als Referenz für alle Termine der Gilde (Raids, Kalender).

### Roster-Zugriff

Zwei Modi stehen zur Verfügung:
- **Für alle offen** — jedes authentifizierte Mitglied kann dem Roster beitreten.
- **Discord-Rolle erforderlich** — nur Mitglieder mit einer ausreichenden Discord-Rolle können beitreten.

Wählst du **Discord-Rolle erforderlich**, erscheint ein Auswahlfeld für die **Roster-Zugriffsschwelle**: Klicke auf eine Discord-Rolle, um sie als Mindestschwelle festzulegen. Diese Rolle und alle Rollen darüber in der Discord-Hierarchie erhalten Roster-Zugriff; die übrigen werden unter **Ausgeschlossene Rollen** aufgelistet.

![Auswahl der Roster-Zugriffsschwelle](/assets/manual/de/guild/roster-threshold-picker.png)

### Officer-Zugriffsschwelle

Unabhängig vom Roster-Zugriffsmodus: Diese Einstellung legt die Mindest-Discord-Rolle fest, die für Officer-Zugriff in RaidOps erforderlich ist (bearbeitbarer Roster, Einstellungen, Audit-Log). Discord-Server-Administratoren behalten unabhängig von dieser Wahl immer vollen Zugriff. Dieses Feld ist erforderlich — der Speichern-Button bleibt deaktiviert, bis eine Rolle ausgewählt wurde.

### Speichern

**Einstellungen speichern** sichert beide Blöcke (Zeitzone/Roster und Officer-Schwelle) in einer Aktion. Nach dem Speichern erscheint eine Bestätigungsmeldung.
