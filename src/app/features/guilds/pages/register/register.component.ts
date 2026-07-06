import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { IconCardComponent } from '../../../../shared/components/icon-card/icon-card.component';
import { GuildSettingsFormComponent } from '../../components/guild-settings-form/guild-settings-form.component';
import { LOCATION } from '../../../../core/tokens/location.token';
import { environment } from '../../../../../environments/environment';
import {
  PageHeaderComponent,
  BreadcrumbItem,
} from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-register',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    DiscordIconComponent,
    GuildSettingsFormComponent,
    TranslocoPipe,
    IconCardComponent,
    PageHeaderComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #authStore = inject(AuthStore);
  readonly #location = inject(LOCATION);

  readonly #guildId = this.#route.snapshot.paramMap.get('id')!;

  readonly loading = signal(true);

  readonly guild = computed<UserGuild | null>(
    () => this.#authStore.user()?.guilds.find((g) => g.id === this.#guildId) ?? null,
  );

  readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const user = this.#authStore.user();
    return [
      {
        label: user?.name ?? '…',
        discordIcon: user
          ? { id: user.discordId, hash: user.avatarHash, type: DiscordIconType.User }
          : undefined,
      },
      { i18nKey: 'sidenav.guilds', link: ['/guilds'] },
      { label: this.guild()?.name ?? '…' },
    ];
  });

  /** 0 = invite bot, 1 = settings. Driven by isRegistered after fresh user load. */
  readonly stepIndex = computed(() => (this.guild()?.isRegistered ? 1 : 0));

  readonly isAlreadyConfigured = computed(() => this.guild()?.isConfigured ?? false);

  readonly DiscordIconType = DiscordIconType;

  ngOnInit(): void {
    // Always reload user data — the user may be returning from the Discord OAuth2 bot invite,
    // in which case the store is stale and isRegistered needs to reflect the server state.
    this.#authStore.loadUser().subscribe({
      next: () => {
        this.loading.set(false);
        if (!this.guild()) {
          this.#router.navigate(['/no-guild']);
        } else if (this.guild()?.isRegistered && this.isAlreadyConfigured()) {
          this.#router.navigate(['/guilds', this.#guildId, 'dashboard']);
        }
      },
      error: () => {
        this.loading.set(false);
        this.#router.navigate(['/no-guild']);
      },
    });
  }

  initiateRegistration(): void {
    this.#location.assign(
      `${environment.apiUrl}/guilds/register/initiate?guildId=${this.#guildId}`,
    );
  }

  onSettingsSaved(): void {
    this.#router.navigate(['/guilds', this.#guildId, 'dashboard']);
  }
}
