import { Component, computed, inject, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';
import { DiscordIconComponent } from '../../../../shared/components/icons/discord-icon/discord-icon.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { IconCardComponent } from '../../../../shared/components/layout/icon-card/icon-card.component';
import { GuildSettingsFormComponent } from '../../../guilds/components/guild-settings-form/guild-settings-form.component';
import { LOCATION } from '../../../../core/tokens/location.token';
import { environment } from '../../../../../environments/environment';

/**
 * Step 2 of get-started: shows guilds the user can already use (registered) and guilds they can
 * register themselves (admin of an unregistered Discord server). Both lists can apply at once.
 * Joining the roster itself happens later, in step 4 — this step is purely about Discord/guild
 * access, which is automatic for registered guilds (synced at login, no action needed here).
 *
 * The bot-invite OAuth round-trip can't avoid leaving the page (full redirect to discord.com), but
 * everything else stays inline: the "Enregistrer" click goes straight to the backend's initiate
 * endpoint (skipping the standalone /guild-register page), and the settings form for a guild
 * that's registered-but-not-configured renders directly here once the user comes back.
 */
@Component({
  selector: 'app-get-started-guild-step',
  imports: [
    DiscordIconComponent,
    IconCardComponent,
    GuildSettingsFormComponent,
    TranslocoPipe,
    ButtonComponent,
  ],
  templateUrl: './get-started-guild-step.component.html',
  styleUrl: './get-started-guild-step.component.scss',
})
export class GetStartedGuildStepComponent {
  readonly #authStore = inject(AuthStore);
  readonly #location = inject(LOCATION);

  /** Emitted when the user explicitly chooses to move on to the next step. */
  readonly continue = output<void>();

  readonly DiscordIconType = DiscordIconType;
  readonly GuildAccessLevel = GuildAccessLevel;

  /** Guilds already usable (the access level dictates whether the roster is reachable yet). */
  readonly registeredGuilds = computed<UserGuild[]>(
    () => this.#authStore.user()?.guilds.filter((g) => g.isRegistered && g.isConfigured) ?? [],
  );

  /** Admin guilds where the bot still needs to be invited. */
  readonly pendingInviteGuilds = computed<UserGuild[]>(
    () => this.#authStore.user()?.guilds.filter((g) => g.isAdmin && !g.isRegistered) ?? [],
  );

  /** Admin guilds where the bot is invited but settings haven't been saved yet. */
  readonly pendingSettingsGuilds = computed<UserGuild[]>(
    () =>
      this.#authStore
        .user()
        ?.guilds.filter((g) => g.isAdmin && g.isRegistered && !g.isConfigured) ?? [],
  );

  readonly hasNoGuild = computed(
    () =>
      this.registeredGuilds().length === 0 &&
      this.pendingInviteGuilds().length === 0 &&
      this.pendingSettingsGuilds().length === 0,
  );

  inviteBot(guildId: string): void {
    this.#location.assign(
      `${environment.apiUrl}/guilds/register/initiate?guildId=${guildId}&returnTo=get-started`,
    );
  }

  onSettingsSaved(): void {
    this.#authStore.loadUser().subscribe();
  }
}
