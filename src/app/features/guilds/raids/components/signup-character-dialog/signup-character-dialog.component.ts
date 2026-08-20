import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { CharacterSpec } from '../../../../characters/models/character-spec.model';

export interface SignupCharacterDialogData {
  characters: { characterId: number; characterName: string; raidSpecs: CharacterSpec[] }[];
  /** The member's current signup, pre-selected when re-responding to change character/spec. */
  currentCharacterId?: number | null;
  currentSpecId?: number | null;
}

export interface SignupCharacterDialogResult {
  characterId: number;
  specId: number;
}

/**
 * Shown when a member accepts a Signup-mode raid's invite and either has more than one character
 * on the branch's roster, or their character has more than one declared raid spec — RSVPing
 * "Accepted" always commits a specific character+spec (slot-assignment eligibility later requires
 * an exact match), so with a single unambiguous option there's nothing to ask.
 */
@Component({
  selector: 'app-signup-character-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, SelectComponent],
  templateUrl: './signup-character-dialog.component.html',
  styleUrl: './signup-character-dialog.component.scss',
})
export class SignupCharacterDialogComponent {
  readonly #dialogRef = inject(DialogRef<SignupCharacterDialogResult | null>);
  readonly data = inject<SignupCharacterDialogData>(DIALOG_DATA);

  readonly characterOptions = computed<SelectOption<number>[]>(() =>
    this.data.characters.map((c) => ({ value: c.characterId, label: c.characterName })),
  );

  readonly selectedCharacterId = signal<number | null>(
    this.data.currentCharacterId ?? this.data.characters[0]?.characterId ?? null,
  );

  readonly specOptions = computed<SelectOption<number>[]>(() => {
    const character = this.data.characters.find((c) => c.characterId === this.selectedCharacterId());
    return (character?.raidSpecs ?? []).map((s) => ({ value: s.specId, label: s.name, iconUrl: s.iconUrl }));
  });

  readonly selectedSpecId = signal<number | null>(this.#defaultSpecId(this.selectedCharacterId()));

  onCharacterChange(characterId: number): void {
    this.selectedCharacterId.set(characterId);
    this.selectedSpecId.set(this.#defaultSpecId(characterId));
  }

  submit(): void {
    const characterId = this.selectedCharacterId();
    const specId = this.selectedSpecId();
    if (characterId === null || specId === null) return;
    this.#dialogRef.close({ characterId, specId });
  }

  cancel(): void {
    this.#dialogRef.close(null);
  }

  #defaultSpecId(characterId: number | null): number | null {
    const character = this.data.characters.find((c) => c.characterId === characterId);
    if (!character) return null;
    if (characterId === this.data.currentCharacterId && this.data.currentSpecId != null) return this.data.currentSpecId;
    return character.raidSpecs.find((s) => s.isMain)?.specId ?? character.raidSpecs[0]?.specId ?? null;
  }
}
