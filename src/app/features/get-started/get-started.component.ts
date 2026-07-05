import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CharacterStore } from '../characters/stores/character.store';
import { IconCardComponent } from '../../shared/components/icon-card/icon-card.component';
import { DiscordBrandIconComponent } from '../../shared/components/discord-brand-icon/discord-brand-icon.component';
import { GetStartedGuildStepComponent } from './components/get-started-guild-step/get-started-guild-step.component';
import { GetStartedBnetStepComponent } from './components/get-started-bnet-step/get-started-bnet-step.component';
import { GetStartedLinkStepComponent } from './components/get-started-link-step/get-started-link-step.component';

/**
 * Onboarding stepper guiding a new user through the 4 steps needed to use RaidOps: Discord auth,
 * guild access, Battle.net + character activation, then linking a character to a guild's roster.
 * Every step reuses existing flows — this is purely a guided shell around them.
 *
 * Drives its own position from existing state signals rather than user navigation, so a returning
 * user who already completed everything never sees the wizard (bounced straight to /guilds), and
 * one who's mid-way resumes exactly where they left off — including across the full-page redirects
 * involved in Discord/Battle.net OAuth (a fresh instance of this component on each return).
 */
@Component({
  selector: 'app-get-started',
  imports: [
    MatStepperModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
    IconCardComponent,
    DiscordBrandIconComponent,
    GetStartedGuildStepComponent,
    GetStartedBnetStepComponent,
    GetStartedLinkStepComponent,
  ],
  templateUrl: './get-started.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './get-started.component.scss',
})
export class GetStartedComponent implements OnInit {
  readonly #authStore = inject(AuthStore);
  readonly #authService = inject(AuthService);
  readonly #snackbar = inject(SnackbarService);
  readonly #characterStore = inject(CharacterStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly isAuthenticated = this.#authStore.isAuthenticated;

  readonly isGuildStepDone = computed(() =>
    (this.#authStore.user()?.guilds ?? []).some((g) => g.isRegistered && g.isConfigured),
  );

  readonly isBnetStepDone = computed(
    () => this.#characterStore.isBnetLinked() && this.#characterStore.characterList().length > 0,
  );

  readonly isLinkStepDone = computed(() =>
    this.#characterStore.characterList().some((c) => c.guildMemberships.length > 0),
  );

  /** Set once the user explicitly continues past the guild step — see stepIndex below. */
  readonly #guildStepAcknowledged = signal(false);

  /**
   * Deliberately does NOT auto-skip the guild step just because it's already done (e.g. a user
   * who registered their guild in a previous session, logs out, and back in) — doing so used to
   * silently fast-forward straight to Battle.net with no acknowledgment that the guild step ever
   * succeeded. Landing on it every time and requiring an explicit "Continuer" click is more
   * predictable than guessing whether the user has already seen it.
   */
  readonly stepIndex = computed(() => {
    if (!this.isAuthenticated()) return 0;
    if (!this.isGuildStepDone() || !this.#guildStepAcknowledged()) return 1;
    if (!this.isBnetStepDone()) return 2;
    return 3;
  });

  /** True until the fresh /user/me reload settles — avoids briefly showing a stale step on a
   * full page load (e.g. landing back here straight after the Discord/Battle.net OAuth round-trip). */
  readonly #isRefreshingUser = signal(true);

  /** True while we still need fresh data to know which step to show / whether to bounce an already-onboarded user. */
  readonly isResolving = computed(
    () =>
      this.isAuthenticated() &&
      (this.#isRefreshingUser() || this.#characterStore.isCharactersLoading()),
  );

  ngOnInit(): void {
    this.#handleDiscordLoginCancelled();

    if (!this.isAuthenticated()) return;

    this.#authStore.loadUser().subscribe({
      next: () => this.#isRefreshingUser.set(false),
      error: () => this.#isRefreshingUser.set(false),
    });

    this.#characterStore.loadCharacters().subscribe(() => {
      if (this.isLinkStepDone()) {
        this.#router.navigate(['/guilds']);
      }
    });
  }

  signup(): void {
    this.#authService.signup('get-started');
  }

  continuePastGuildStep(): void {
    this.#guildStepAcknowledged.set(true);
  }

  /** Surfaces the backend's ?error=access_denied when the user cancels Discord's consent screen. */
  #handleDiscordLoginCancelled(): void {
    if (this.#route.snapshot.queryParamMap.get('error') === 'access_denied') {
      // Delayed because Transloco's translation file may not have finished loading yet on a
      // fresh page load — translating right away can show the raw key instead of the message.
      setTimeout(() => this.#snackbar.error('errors.discordLoginCancelled'), 200);
    }
  }
}
