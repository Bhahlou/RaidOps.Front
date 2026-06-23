import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterStore } from '../../../characters/stores/character.store';
import { CharacterGuildsComponent } from '../../../characters/components/character-guilds/character-guilds.component';

/**
 * Step 4 of get-started: link each activated character to an eligible guild's roster.
 * Reuses CharacterGuildsComponent (already self-contained) per character, pre-expanded so the
 * user doesn't have to discover the "+" button themselves.
 *
 * Only one character needs to land on a roster to unlock "Terminer" — requiring every alt to be
 * linked immediately would be unnecessary friction; the rest can be linked later from /characters.
 */
@Component({
  selector: 'app-get-started-link-step',
  imports: [MatButtonModule, MatProgressSpinnerModule, TranslocoPipe, CharacterGuildsComponent],
  templateUrl: './get-started-link-step.component.html',
  styleUrl: './get-started-link-step.component.scss',
})
export class GetStartedLinkStepComponent {
  readonly #characterStore = inject(CharacterStore);
  readonly #router = inject(Router);

  readonly isCharactersLoading = this.#characterStore.isCharactersLoading;
  readonly characters = this.#characterStore.characterList;

  readonly canFinish = computed(() => this.characters().some((c) => c.guildMemberships.length > 0));

  finish(): void {
    this.#router.navigate(['/guilds']);
  }
}
