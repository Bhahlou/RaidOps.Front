import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { CharacterStore } from '../../stores/character.store';
import { Spec } from '../../../../shared/models/spec.model';
import { Character } from '../../models/character.model';
import { CharacterSpec } from '../../models/character-spec.model';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { DialogStateComponent } from '../../../../shared/components/feedback/dialog-state/dialog-state.component';

export interface SetRaidSpecsDialogData {
  characters: Character[];
  /**
   * 'activate' — fresh import/activation: always default from current BNet specs, ignoring any
   * raid specs left over from a previous activation cycle (they may no longer reflect reality).
   * 'edit' — editing an already-active character: default from its existing raid specs.
   */
  mode: 'activate' | 'edit';
}

interface CharacterSpecsState {
  character: Character;
  availableSpecs: Spec[];
  viableSpecIds: Set<number>;
  mainSpecId: number | null;
}

type LoadState = 'loading' | 'idle' | 'error' | 'submitting';

/** Dialog for picking a main spec + additional raid-viable specs, per character. */
@Component({
  selector: 'app-set-raid-specs-dialog',
  standalone: true,
  imports: [
    NgOptimizedImage,
    CheckboxComponent,
    TranslocoPipe,
    WowClassIconComponent,
    ButtonComponent,
    DialogStateComponent,
  ],
  templateUrl: './set-raid-specs-dialog.component.html',
  styleUrl: './set-raid-specs-dialog.component.scss',
})
export class SetRaidSpecsDialogComponent implements OnInit {
  readonly #characterStore = inject(CharacterStore);
  readonly #dialogRef = inject(DialogRef<{ success?: boolean; error?: boolean } | undefined>);
  readonly #data = inject<SetRaidSpecsDialogData>(DIALOG_DATA);

  readonly loadState = signal<LoadState>('loading');
  readonly characterStates = signal<CharacterSpecsState[]>([]);

  readonly canSubmit = computed(
    () =>
      this.characterStates().length > 0 &&
      this.characterStates().every((s) => s.viableSpecIds.size > 0 && s.mainSpecId !== null),
  );

  ngOnInit(): void {
    this.#characterStore.loadSpecs().subscribe({
      next: (specs) => {
        this.characterStates.set(
          this.#data.characters.map((character) => {
            const defaults = this.#defaultSelection(character);
            return {
              character,
              availableSpecs: specs.filter((s) => s.classId === character.classId),
              viableSpecIds: defaults.viableSpecIds,
              mainSpecId: defaults.mainSpecId,
            };
          }),
        );
        this.loadState.set('idle');
      },
      error: () => this.loadState.set('error'),
    });
  }

  /**
   * In 'edit' mode, defaults to the character's existing raid specs if set.
   * In 'activate' mode (or if there are no raid specs yet), defaults to its current BNet main/offspec.
   */
  #defaultSelection(character: Character): {
    viableSpecIds: Set<number>;
    mainSpecId: number | null;
  } {
    const source: CharacterSpec[] =
      this.#data.mode === 'edit' && character.raidSpecs.length > 0
        ? character.raidSpecs
        : character.bnetSpecs;
    if (source.length === 0) return { viableSpecIds: new Set(), mainSpecId: null };

    return {
      viableSpecIds: new Set(source.map((s) => s.specId)),
      mainSpecId: (source.find((s) => s.isMain) ?? source[0]).specId,
    };
  }

  isViable(state: CharacterSpecsState, specId: number): boolean {
    return state.viableSpecIds.has(specId);
  }

  isMain(state: CharacterSpecsState, specId: number): boolean {
    return state.mainSpecId === specId;
  }

  toggleViable(state: CharacterSpecsState, specId: number): void {
    const viableSpecIds = new Set(state.viableSpecIds);
    let mainSpecId = state.mainSpecId;

    if (viableSpecIds.has(specId)) {
      viableSpecIds.delete(specId);
      if (mainSpecId === specId) {
        mainSpecId = viableSpecIds.size > 0 ? [...viableSpecIds][0] : null;
      }
    } else {
      viableSpecIds.add(specId);
      mainSpecId ??= specId;
    }

    this.#patchState(state.character.id, { viableSpecIds, mainSpecId });
  }

  setMain(state: CharacterSpecsState, specId: number): void {
    if (!state.viableSpecIds.has(specId)) return;
    this.#patchState(state.character.id, { mainSpecId: specId });
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.loadState.set('submitting');

    const requests = this.characterStates()
      .filter((s): s is CharacterSpecsState & { mainSpecId: number } => s.mainSpecId !== null)
      .map((s) =>
        this.#characterStore.setRaidSpecs(s.character.id, {
          mainSpecId: s.mainSpecId,
          viableSpecIds: [...s.viableSpecIds],
        }),
      );

    forkJoin(requests).subscribe({
      next: () => this.#dialogRef.close({ success: true }),
      error: () => this.#dialogRef.close({ error: true }),
    });
  }

  cancel(): void {
    this.#dialogRef.close();
  }

  #patchState(characterId: number, patch: Partial<CharacterSpecsState>): void {
    this.characterStates.update((states) =>
      states.map((s) => (s.character.id === characterId ? { ...s, ...patch } : s)),
    );
  }
}
