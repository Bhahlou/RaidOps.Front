> Officer only.

The **Guild settings** page configures the guild's timezone and access rules.

![Settings page overview](/assets/manual/en/guild/settings-overview.png)

### Timezone

An autocomplete field, automatically pre-filled with your browser's timezone on first load. This timezone is the reference for all guild schedules (raids, calendar).

### Roster access

Two modes are available:
- **Open to all** — any authenticated member can join the roster.
- **Discord role required** — only members with a sufficient Discord role can join.

If you choose **Discord role required**, a **roster access threshold** picker appears: click a Discord role to set it as the minimum threshold. That role and every role above it in the Discord hierarchy grant roster access; the rest are listed under **Excluded roles**.

![Roster access threshold picker](/assets/manual/en/guild/roster-threshold-picker.png)

### Officer access threshold

Independent from the roster access mode: this setting defines the minimum Discord role required to get Officer access in RaidOps (editable roster, settings, audit log). Discord server administrators always keep full access, regardless of this choice. This field is required — the save button stays disabled until a role is picked.

### Save

**Save settings** saves both blocks (timezone/roster and Officer threshold) in a single action. A confirmation message appears once saved.
