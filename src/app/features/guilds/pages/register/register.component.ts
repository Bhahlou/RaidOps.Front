import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { IconCardComponent } from '../../../../shared/components/icon-card/icon-card.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [MatButtonModule, MatIconModule, DiscordIconComponent, TranslocoPipe, IconCardComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #authStore = inject(AuthStore);

  readonly #guildId = this.#route.snapshot.paramMap.get('id');

  /** The guild being registered, resolved from the authenticated user's guild list. */
  readonly guild = computed<UserGuild | null>(
    () => this.#authStore.user()?.guilds.find(g => g.id === this.#guildId) ?? null,
  );

  readonly DiscordIconType = DiscordIconType;

  ngOnInit(): void {
    // Guard: if the guild isn't in the user's list, the route guard should have caught it,
    // but redirect defensively in case the store is stale.
    if (!this.guild()) {
      this.#router.navigate(['/no-guild']);
    }
  }

  /** Starts the Discord bot OAuth2 invite flow by navigating to the back-end initiate endpoint. */
  initiateRegistration(): void {
    const guild = this.guild();
    if (!guild) return;
    window.location.href = `${environment.apiUrl}/api/v1/guilds/register/initiate?guildId=${guild.id}`;
  }
}
