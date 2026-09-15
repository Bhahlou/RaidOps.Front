> Officers only.

The **Raids** tab (in guild settings) configures, per active WoW branch, the default **raid mode** — how attendance is determined for new raids created on that branch.

![Raids tab: raid mode per branch](/assets/manual/en/guild/raid-settings-overview.png)

### Raid mode

Two options:
- **Auto** (default) — every roster member is assumed present unless they've declared an absence. No sign-up is required.
- **Planner** — members sign up per raid instead: Accept, Tentative, or Decline, from the raid's own page or a standing Discord embed with buttons (see [Raids](/manual/guild/raid-builder)).

Either mode can be overridden per raid from its own creation dialog — a one-off Planner raid on an Auto branch, or the other way around, without changing the branch default.

> Activate a branch first in the **General** tab if you don't see it here yet.

### Raid attribution template

Below the raid mode setting, officers can define a reusable template of rows every raid needs assigned — buffs, curses, tank/heal swaps, interrupts, and so on. Officers fill each row in with real seated characters per raid event, from that raid's own **Assignments** tab (see [Raids](/manual/guild/raid-builder)).

![Raid attribution template: rows grouped by section](/assets/manual/en/guild/raid-attribution-settings-overview.png)

Each row belongs to a **section** (free text, e.g. "Buffs", "Curses", "Tanks & Heals") and holds an ordered list of cells — an icon (raid marker, role, or spell) or a **name slot**, with an optional label shown as a placeholder until it's filled, and an optional eligibility restriction (allowed classes, roles, and/or specs). A row can be marked **Repeatable**: its instance count on a given raid is then worked out automatically from who's seated (e.g. one Innervate slot per druid present), instead of always exactly one.
