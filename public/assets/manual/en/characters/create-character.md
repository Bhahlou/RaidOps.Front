This guide explains how to link your Battle.net account to RaidOps to import your World of Warcraft characters, then join a guild with them.

### Why Battle.net?

RaidOps syncs your characters directly from your Battle.net account instead of letting you create them by hand. This guarantees each character really belongs to its owner, and saves you from re-entering realm, class, spec or item level every time something changes — it all comes straight from Battle.net.

> Battle.net doesn't let RaidOps stay permanently connected to your profile, so you'll go through the authorization window again on every sync. That's expected, not a bug.

### 1. Open the Characters page

From the sidebar, go to **Characters**.

![Navigate to Characters](/assets/manual/en/characters/sidenav-characters.png)

### 2. Link your Battle.net account

Click **Link Battle.net** and choose your region.

![Region picker](/assets/manual/en/characters/region-picker.png)

Then pick the game branch your characters are on (Retail, Classic, ...).

![Branch selector](/assets/manual/en/characters/branch-selector.png)

A Battle.net window then opens automatically for authorization — sign in and grant access. The window closes itself once authorization succeeds, and RaidOps syncs your characters for that branch, realm by realm.

> **Tip** — if your browser is already signed into Battle.net, authorization is automatic: the window closes right away with nothing to type.

> **Tip** — if the window stays blank or closes without doing anything, check that your browser hasn't blocked popups for RaidOps, then try again.

### 3. Import your characters

Back on **Characters**, the **Import characters** button is now available. Click it — the **Import characters** dialog opens with your synced characters, grouped by realm.

<img src="/assets/manual/en/welcome/wizard-step3.png" alt="character import" width="420">

Check the characters you want to use in RaidOps — an already-imported character shows up grayed out. You can filter by name, then click **Import (N)**.

> Leveled up a new character since then? The **Sync Battle.net** button in this same dialog re-runs the branch selection and sync, without going back through step 2.

### 4. Confirm raid specs

For every newly imported character, RaidOps opens the **Raid-viable specs** dialog: check the specs that character can play in raid and pick a main spec. This step is mandatory — without confirmation, the import is rolled back automatically.

<img src="/assets/manual/en/characters/spec-selection.png" alt="raid-viable specs" width="420">

Once done, your characters show up under **Characters** and you can use them to join a guild.

![imported characters](/assets/manual/en/characters/created-characters.png)

### 5. Link a second Battle.net account

Play on more than one Battle.net account? You can link them all to your RaidOps account and import characters from each.

From **Characters**, click **Add another account** next to your battletag (grouped into the **⋮** menu on mobile).

![Add another Battle.net account](/assets/manual/en/characters/bnet-add-another-account.png)

A Battle.net window opens and automatically signs you out of the currently linked account, then prompts you to sign back in — sign in with the other account you want to add. RaidOps then walks through the same steps as a first link (branch selection, sync, import).

> If RaidOps doesn't detect a new account by the end of the process, you signed back in with the same account that was already linked — make sure you actually authenticated with the other Battle.net account in the window, then try again.

Once linked, each account shows up by its own battletag in the menu — they stay independent, each with its own characters.

### 6. Unlink a Battle.net account

From the same menu, choose **Unlink** on the account you want to remove, then confirm.

![Unlink a Battle.net account](/assets/manual/en/characters/bnet-unlink-confirm.png)

> **Warning** — unlinking an account permanently deletes every character sourced from it, along with their history in any affected guilds. This isn't a simple deactivation: the action can't be undone.
