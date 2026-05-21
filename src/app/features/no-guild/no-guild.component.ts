import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../core/stores/auth.store';
import { UserGuild } from '../../core/models/user-guild.model';
import { DiscordIconComponent } from '../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../shared/models/discord-icon-type.enum';
import { IconCardComponent } from '../../shared/components/icon-card/icon-card.component';

@Component({
  selector: 'app-no-guild',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTableModule, DiscordIconComponent, TranslocoPipe, IconCardComponent],
  templateUrl: './no-guild.component.html',
  styleUrl: './no-guild.component.scss',
})
export class NoGuildComponent {
  readonly #authStore = inject(AuthStore);

  readonly DiscordIconType = DiscordIconType;

  /** Guilds on which the user can initiate a RaidOps registration. */
  readonly adminGuilds = computed<UserGuild[]>(() =>
    (this.#authStore.user()?.guilds ?? []).filter((g) => g.isAdmin && !g.isRegistered),
  );

  /** True when the user is not admin of any unregistered guild. */
  readonly hasNoEligibleServer = computed(() => this.adminGuilds().length === 0);

  readonly columns = ['icon', 'name', 'action'];
}
