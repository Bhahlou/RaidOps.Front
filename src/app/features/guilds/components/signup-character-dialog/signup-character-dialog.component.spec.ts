import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { SignupCharacterDialogComponent, SignupCharacterDialogData } from './signup-character-dialog.component';
import { CharacterSpec } from '../../../characters/models/character-spec.model';

const spec = (overrides?: Partial<CharacterSpec>): CharacterSpec => ({
  specId: 71,
  name: 'Arms',
  iconUrl: null,
  isMain: false,
  ...overrides,
});

describe('SignupCharacterDialogComponent', () => {
  let mockClose: ReturnType<typeof vi.fn>;

  const setup = (data: SignupCharacterDialogData) => {
    mockClose = vi.fn();

    TestBed.configureTestingModule({
      imports: [SignupCharacterDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: mockClose } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    TestBed.overrideComponent(SignupCharacterDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(SignupCharacterDialogComponent).componentInstance;
  };

  // ── characterOptions ──────────────────────────────────────────────────────

  describe('characterOptions', () => {
    it('maps each character to a select option', () => {
      const component = setup({
        characters: [
          { characterId: 1, characterName: 'Arthas', raidSpecs: [spec()] },
          { characterId: 2, characterName: 'Jaina', raidSpecs: [spec({ specId: 65, name: 'Holy' })] },
        ],
      });

      expect(component.characterOptions()).toEqual([
        { value: 1, label: 'Arthas' },
        { value: 2, label: 'Jaina' },
      ]);
    });
  });

  // ── selectedCharacterId (initial) ────────────────────────────────────────

  describe('initial selectedCharacterId', () => {
    it('defaults to currentCharacterId when given', () => {
      const component = setup({
        characters: [
          { characterId: 1, characterName: 'Arthas', raidSpecs: [spec()] },
          { characterId: 2, characterName: 'Jaina', raidSpecs: [spec({ specId: 65, name: 'Holy' })] },
        ],
        currentCharacterId: 2,
      });

      expect(component.selectedCharacterId()).toBe(2);
    });

    it('falls back to the first character when no currentCharacterId is given', () => {
      const component = setup({
        characters: [
          { characterId: 1, characterName: 'Arthas', raidSpecs: [spec()] },
          { characterId: 2, characterName: 'Jaina', raidSpecs: [spec({ specId: 65, name: 'Holy' })] },
        ],
      });

      expect(component.selectedCharacterId()).toBe(1);
    });

    it('is null when there are no characters at all', () => {
      const component = setup({ characters: [] });

      expect(component.selectedCharacterId()).toBeNull();
    });
  });

  // ── specOptions ───────────────────────────────────────────────────────────

  describe('specOptions', () => {
    it('lists the selected character\'s raid specs', () => {
      const component = setup({
        characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, name: 'Arms' }), spec({ specId: 72, name: 'Fury', isMain: true })] }],
      });

      expect(component.specOptions()).toEqual([
        { value: 71, label: 'Arms', iconUrl: null },
        { value: 72, label: 'Fury', iconUrl: null },
      ]);
    });

    it('is empty when no character is selected', () => {
      const component = setup({ characters: [] });

      expect(component.specOptions()).toEqual([]);
    });
  });

  // ── initial selectedSpecId (#defaultSpecId) ─────────────────────────────

  describe('initial selectedSpecId', () => {
    it('defaults to the main spec when no current signup is being edited', () => {
      const component = setup({
        characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, isMain: false }), spec({ specId: 72, isMain: true })] }],
      });

      expect(component.selectedSpecId()).toBe(72);
    });

    it('falls back to the first spec when none is flagged as main', () => {
      const component = setup({
        characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, isMain: false }), spec({ specId: 72, isMain: false })] }],
      });

      expect(component.selectedSpecId()).toBe(71);
    });

    it('is null when the selected character has no raid specs', () => {
      const component = setup({ characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [] }] });

      expect(component.selectedSpecId()).toBeNull();
    });

    it('preselects the current spec when re-responding for the same character', () => {
      const component = setup({
        characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, isMain: true }), spec({ specId: 72 })] }],
        currentCharacterId: 1,
        currentSpecId: 72,
      });

      expect(component.selectedSpecId()).toBe(72);
    });
  });

  // ── onCharacterChange ─────────────────────────────────────────────────────

  describe('onCharacterChange', () => {
    it('switches the selected character and resets to its default spec', () => {
      const component = setup({
        characters: [
          { characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, isMain: true })] },
          { characterId: 2, characterName: 'Jaina', raidSpecs: [spec({ specId: 65, isMain: true })] },
        ],
      });

      component.onCharacterChange(2);

      expect(component.selectedCharacterId()).toBe(2);
      expect(component.selectedSpecId()).toBe(65);
    });

    it('does not carry over currentSpecId when switching away to a different character', () => {
      const component = setup({
        characters: [
          { characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, isMain: false }), spec({ specId: 72, isMain: true })] },
          { characterId: 2, characterName: 'Jaina', raidSpecs: [spec({ specId: 65, isMain: true })] },
        ],
        currentCharacterId: 1,
        currentSpecId: 71,
      });

      component.onCharacterChange(2);

      expect(component.selectedSpecId()).toBe(65);
    });
  });

  // ── submit ────────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('closes the dialog with the selected character and spec', () => {
      const component = setup({
        characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [spec({ specId: 71, isMain: true })] }],
      });

      component.submit();

      expect(mockClose).toHaveBeenCalledWith({ characterId: 1, specId: 71 });
    });

    it('does not close when no character is selected', () => {
      const component = setup({ characters: [] });

      component.submit();

      expect(mockClose).not.toHaveBeenCalled();
    });

    it('does not close when the selected character has no spec', () => {
      const component = setup({ characters: [{ characterId: 1, characterName: 'Arthas', raidSpecs: [] }] });

      component.submit();

      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with null', () => {
      const component = setup({ characters: [] });

      component.cancel();

      expect(mockClose).toHaveBeenCalledWith(null);
    });
  });
});
