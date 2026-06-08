import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { IconCardComponent } from '../../../../shared/components/icon-card/icon-card.component';

@Component({
  selector: 'app-guild-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatTableModule,
    DiscordIconComponent,
    TranslocoPipe,
    IconCardComponent,
  ],
  templateUrl: './guild-list.component.html',
  styleUrl: './guild-list.component.scss',
})
export class GuildListComponent implements OnInit {
  readonly #authStore = inject(AuthStore);
  readonly #router = inject(Router);

  readonly loading = signal(true);

  ngOnInit(): void {
    this.#authStore.loadUser().subscribe(() => {
      this.loading.set(false);
      if (this.registeredGuilds().length === 1 && this.adminGuilds().length === 0) {
        this.#router.navigate(['/guilds', this.registeredGuilds()[0].id, 'dashboard']);
      } else if (this.registeredGuilds().length === 0 && this.adminGuilds().length === 1 && !this.adminGuilds()[0].isRegistered) {
        this.#router.navigate(['/guild-register', this.adminGuilds()[0].id]);
      }
    });
  }

  /** Fully configured guilds the user can access. */
  readonly registeredGuilds = computed<UserGuild[]>(
    () => this.#authStore.user()?.guilds.filter((g) => g.isRegistered && g.isConfigured) ?? [],
  );

  /** Guilds where the bot is invited but settings are incomplete, or not yet registered at all. */
  readonly adminGuilds = computed<UserGuild[]>(
    () =>
      this.#authStore.user()?.guilds.filter(
        (g) => g.isAdmin && (!g.isRegistered || !g.isConfigured),
      ) ?? [],
  );

  readonly DiscordIconType = DiscordIconType;
  readonly columns = ['icon', 'name', 'action'];
}
