> Officer only.

The **Notifications** tab (in guild settings) configures which guild events post a message to a Discord channel via the RaidOps bot.

An "absence" event covers both a one-off declaration and a recurring pattern (weekly or custom cycle) — the posted message always spells out exactly what changed (the dates involved, partial time bounds, or a day-by-day breakdown for a recurring pattern), never a generic label.

![Notifications tab overview](/assets/manual/en/guild/notifications-settings-overview.png)

### Choosing a scope

The **Scope** selector at the top switches the panel between **Whole guild** and one of the guild's branches. A branch's settings default to inheriting the guild-wide value for every event — an "Inherited from the guild-wide setting" hint appears next to any event that hasn't been overridden for that branch yet. Changing the channel or toggle for that branch creates an explicit override; **Revert to inherited** removes it and falls back to the guild-wide value again.

### Enabling an event

Each event has its own toggle. Turning it on reveals a channel picker listing every text channel the bot can see on your server.

### Choosing a channel

If a channel shows a ⚠️ warning, the bot is missing one or more permissions it needs to post there (e.g. *view channel*, *send messages*, *embed links* — spelled out by name so you know exactly what to fix). You can still select it ahead of fixing its permissions, but no message will be posted until the bot's access is corrected.

### Save

**Save notification settings** persists every event's toggle and channel in a single action, independently of the General tab.
