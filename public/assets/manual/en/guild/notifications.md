> Officer only.

The **Notifications** tab (in guild settings) configures which guild events post a message to a Discord channel via the RaidOps bot.

An "absence" event covers both a one-off declaration and a recurring pattern (weekly or custom cycle) — the posted message always spells out exactly what changed (the dates involved, partial time bounds, or a day-by-day breakdown for a recurring pattern), never a generic label.

![Notifications tab overview](/assets/manual/en/guild/notifications-settings-overview.png)

Raid events have three separate families, so you can enable any of them without the others:

- **Raid changes** posts when a raid is published, when an already-published raid is cancelled (deleted), or when its start time is rescheduled.
- **Raid composition changes** posts when a character is assigned, unassigned, swapped, or has its spec changed on an **already-published** raid — edits made while a raid is still a draft never post, since nobody outside officers can see it yet.
- **Raid composition announcement** posts a single embed showing a published raid's full composition, group by group — unlike *Raid composition changes* (one message per change), this same message is edited in place on every change, never reposted. The **DM players added to or removed from the raid** setting also sends a private message to each affected player; since a DM has no channel, no channel picker appears for that row.

> The channel chosen for **Raid composition announcement** is also the one used for the grouping ping (the **Ping to group up** button on a raid's page, or the `/raid invite` Discord command) — see the **Raids** guide. Grouping fails without a channel configured here.

### Choosing a scope

The **Scope** selector at the top switches the panel between **Whole guild** and one of the guild's branches. A branch's settings default to inheriting the guild-wide value for every event — an "Inherited from the guild-wide setting" hint appears next to any event that hasn't been overridden for that branch yet. Changing the channel or toggle for that branch creates an explicit override; **Revert to inherited** removes it and falls back to the guild-wide value again.

### Enabling an event

Each event has its own toggle. Turning it on reveals a channel picker listing every text channel the bot can see on your server.

### Choosing a channel

If a channel shows a ⚠️ warning, the bot is missing one or more permissions it needs to post there (e.g. *view channel*, *send messages*, *embed links* — spelled out by name so you know exactly what to fix). You can still select it ahead of fixing its permissions, but no message will be posted until the bot's access is corrected.

### Saving

Toggling an event or picking a channel saves automatically — no Save button. A row stays unsaved if it's enabled but has no channel picked yet.
