The **Raids** page is where officers compose raid groups by dragging characters from the roster pool onto the grid, and where every roster member can see who's assigned where.

![Raids page: grid and roster pool](/assets/manual/en/guild/raid-builder-overview.png)

### Roster pool

The panel on the side lists every character eligible for at least one of the raids currently on screen — filterable by class, spec, and rank, and searchable by character or player name. A character disappears from the pool once their player already holds a slot in every visible raid for that date.

### Assigning characters

Drag a character from the pool onto an empty slot to assign them. Dragging an already-assigned character onto another empty slot moves them; dropping them onto an occupied slot swaps the two. A slot turns red and rejects the drop when the player is declared absent that day, already holds a different slot in the same raid, or the character is already locked to that raid's zone through another raid sharing the same weekly lockout — dragging them out of that other raid instead moves them across.

Officers without a mouse handy for dragging can click an empty slot to search and assign a character directly. A character with more than one declared raid spec can switch which one they're playing for that slot from the assigned chip itself.

### Raid events and series

Up to four raids can be composed side by side for a given week — either one-off events, or occurrences generated automatically by a recurring **series** (same day of week, time, group size, and target raid zones every week or every N weeks). A raid starts as a **draft**, invisible to regular roster members, until an officer **publishes** it. Deleting an event also removes every assignment it holds; deactivating a series stops it from generating new occurrences going forward, with the option to also clean up its already-generated empty, unpublished ones.

The week shown defaults to the guild branch's actual weekly raid-lockout reset window once its region is configured in the General tab of guild settings.

![Edit raid event dialog: name, schedule, grid size, and raid zones](/assets/manual/en/guild/raid-builder-edit-dialog.png)

### Signup mode

By default a raid runs in **Auto** mode: every roster member is assumed present unless they've declared an absence, no sign-up needed (the branch-wide default is set in [Raids settings](/manual/guild/raid-settings)). A raid can instead run in **Planner** mode — either because its branch defaults to it, or because an officer ticks "Use Signup mode for this raid" when creating a one-off exceptional raid — in which case roster members self-serve their own response (see the raid detail page below) instead of relying on their declared absences.

Responding **Accept** or **Tentative** asks which character to bring, and which raid spec if more than one is declared; **Decline** needs neither. Officers see every response broken down by status on the raid's detail page — Accepted grouped by class, Tentative and Declined as flat lists — live, whether the response came from the web or Discord, and can drag an Accepted character straight into a slot from there, exactly like the roster pool.

### Dedicated Discord channel

A raid — one-off or generated from a series — can post to its own Discord channel instead of the guild-wide one configured in Notifications: tick **Dedicated Discord channel** in the creation or edit dialog, then either pick an **Existing channel** or have RaidOps create a **New channel** (in a category of your choice, with a name it suggests from the raid's name and date, editable). A series can do the same for every occurrence it generates, creating a fresh channel each time instead of reusing one.

![Create raid dialog: Signup mode override and dedicated channel picker](/assets/manual/en/guild/raid-builder-channel-picker.png)

### Raid detail page

Once a raid is **published**, its name becomes clickable in the grid and opens its dedicated detail page (breadcrumb: Guild > Raids > raid name) — a raid still in draft keeps a plain, unlinked name. The header shows the full date and time, the raid's zones, and a live role count (tank/heal/melee/ranged) tallied from the current assignments; a Planner-mode raid adds your own response (Accept/Tentative/Decline) right there. Below, the same composition grid as the Raids page sits next to either the roster's availability breakdown (Auto mode) or the signups breakdown (Planner mode) — both double as a drag source into the grid for officers, exactly like the roster pool. Officers additionally get **Publish** (while still a draft), **Ping to group up** (once published, see below), and an **Edit** shortcut, all from the same header.

![Raid detail page: header with RSVP buttons, composition grid, and the signups breakdown](/assets/manual/en/guild/raid-detail-overview.png)

### Discord composition announcement

Once the **Raid composition announcement** channel is configured in the Notifications tab (see the dedicated guide), publishing a raid posts an embed listing every slot group by group. That same message is then edited in place on every assignment, unassignment, swap, or spec change — never reposted, so it stays current without spamming the channel. Each player added or removed can also get a DM detailing which character, if that separate setting is enabled.

![Discord embed of the composition announcement](/assets/manual/en/guild/raid-composition-announcement.png)

### Ping to group up

> Officer only.

On a published raid's detail page, the **Ping to group up** button posts a one-off message in the announcement channel, mentioning every assigned player and stating which character to whisper for an invite — with a snapshot of the current composition attached as an embed (unlike the standing announcement, this one isn't updated afterward). The character referenced is your own if you're assigned to that raid yourself; otherwise, a **Who should players whisper?** dialog asks you to pick one from the assigned characters.

The same action is available directly from Discord via the `/raid invite <raid> [character]` command — the raid is chosen via autocomplete, and the character parameter is optional (same resolution logic as the button).

![Discord grouping message, with the composition as an embed](/assets/manual/en/guild/raid-grouping-announcement.png)
