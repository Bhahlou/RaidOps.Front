import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { SetRaidSpecsDialogComponent, SetRaidSpecsDialogData } from './set-raid-specs-dialog.component';
import { CharacterStore } from '../../stores/character.store';
import { Spec } from '../../../../shared/models/spec.model';
import { Character } from '../../models/character.model';
import { CharacterSpec } from '../../models/character-spec.model';

const makeChar = (id: number, classId: number, overrides: Partial<Character> = {}): Character => ({
  id,
  name: `Char${id}`,
  classId,
  className: classId === 1 ? 'Warrior' : 'Mage',
  classColor: '#C69B3A',
  raceId: 1,
  raceName: 'Human',
  faction: 'ALLIANCE',
  branchName: 'Retail',
  realmName: 'Silvermoon',
  realmSlug: 'silvermoon',
  level: 80,
  itemLevel: 620,
  avatarUrl: null,
  guildName: null,
  bnetSpecs: [],
  raidSpecs: [],
  guildMemberships: [],
  ...overrides,
});

const warrior: Character = makeChar(1, 1);
const mage: Character = makeChar(2, 8);

const specs: Spec[] = [
  { id: 71, name: 'Arms', role: 'Dps', classId: 1, iconUrl: null },
  { id: 72, name: 'Fury', role: 'Dps', classId: 1, iconUrl: null },
  { id: 73, name: 'Protection', role: 'Tank', classId: 1, iconUrl: null },
  { id: 62, name: 'Arcane', role: 'Dps', classId: 8, iconUrl: null },
];

const makeSpec = (specId: number, isMain: boolean): CharacterSpec => ({
  specId,
  name: `Spec${specId}`,
  iconUrl: null,
  isMain,
});

describe('SetRaidSpecsDialogComponent', () => {
  let fixture: ComponentFixture<SetRaidSpecsDialogComponent>;
  let component: SetRaidSpecsDialogComponent;
  let storeMock: { loadSpecs: ReturnType<typeof vi.fn>; setRaidSpecs: ReturnType<typeof vi.fn> };
  let mockClose: ReturnType<typeof vi.fn>;

  const setup = (characters: Character[], mode: SetRaidSpecsDialogData['mode'] = 'edit') => {
    storeMock = {
      loadSpecs: vi.fn().mockReturnValue(of(specs)),
      setRaidSpecs: vi.fn(),
    };
    mockClose = vi.fn();

    TestBed.configureTestingModule({
      imports: [SetRaidSpecsDialogComponent],
      providers: [
        { provide: CharacterStore, useValue: storeMock },
        { provide: DialogRef, useValue: { close: mockClose } },
        { provide: DIALOG_DATA, useValue: { characters, mode } satisfies SetRaidSpecsDialogData },
      ],
    });
    TestBed.overrideComponent(SetRaidSpecsDialogComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(SetRaidSpecsDialogComponent);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    setup([warrior]);
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('filters available specs per character by classId', () => {
      setup([warrior, mage]);
      component.ngOnInit();

      const states = component.characterStates();
      expect(states).toHaveLength(2);
      expect(states[0].availableSpecs.map((s) => s.id)).toEqual([71, 72, 73]);
      expect(states[1].availableSpecs.map((s) => s.id)).toEqual([62]);
      expect(component.loadState()).toBe('idle');
    });

    it('sets loadState to error on failure', () => {
      setup([warrior]);
      storeMock.loadSpecs.mockReturnValue(throwError(() => new Error('oops')));

      component.ngOnInit();

      expect(component.loadState()).toBe('error');
    });

    it('defaults to empty selection when the character has no bnet or raid specs', () => {
      setup([warrior]);
      component.ngOnInit();

      const state = component.characterStates()[0];
      expect(state.viableSpecIds.size).toBe(0);
      expect(state.mainSpecId).toBeNull();
    });

    it('defaults to the bnet main+offspec when no raid specs are set yet', () => {
      setup([makeChar(1, 1, { bnetSpecs: [makeSpec(72, true), makeSpec(71, false)] })]);
      component.ngOnInit();

      const state = component.characterStates()[0];
      expect(state.viableSpecIds).toEqual(new Set([72, 71]));
      expect(state.mainSpecId).toBe(72);
    });

    it('prefers existing raid specs over bnet specs in edit mode', () => {
      setup(
        [
          makeChar(1, 1, {
            bnetSpecs: [makeSpec(72, true)],
            raidSpecs: [makeSpec(73, true), makeSpec(71, false)],
          }),
        ],
        'edit',
      );
      component.ngOnInit();

      const state = component.characterStates()[0];
      expect(state.viableSpecIds).toEqual(new Set([73, 71]));
      expect(state.mainSpecId).toBe(73);
    });

    it('defaults the main spec to the first one when none is flagged as main', () => {
      setup([makeChar(1, 1, { bnetSpecs: [makeSpec(71, false), makeSpec(72, false)] })]);
      component.ngOnInit();

      const state = component.characterStates()[0];
      expect(state.viableSpecIds).toEqual(new Set([71, 72]));
      expect(state.mainSpecId).toBe(71);
    });

    it('ignores leftover raid specs from a previous activation cycle in activate mode', () => {
      setup(
        [
          makeChar(1, 1, {
            bnetSpecs: [makeSpec(72, true)],
            raidSpecs: [makeSpec(73, true), makeSpec(71, false)], // stale, from before a deactivate/reactivate
          }),
        ],
        'activate',
      );
      component.ngOnInit();

      const state = component.characterStates()[0];
      expect(state.viableSpecIds).toEqual(new Set([72]));
      expect(state.mainSpecId).toBe(72);
    });
  });

  describe('toggleViable', () => {
    it('checking the first spec auto-sets it as main', () => {
      setup([warrior]);
      component.ngOnInit();
      const state = component.characterStates()[0];

      component.toggleViable(state, 71);

      const updated = component.characterStates()[0];
      expect(updated.viableSpecIds.has(71)).toBe(true);
      expect(updated.mainSpecId).toBe(71);
    });

    it('checking a second spec does not change the existing main', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 72);

      const updated = component.characterStates()[0];
      expect(updated.viableSpecIds.has(72)).toBe(true);
      expect(updated.mainSpecId).toBe(71);
    });

    it('unchecking a non-main spec leaves the main untouched', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 72);
      component.toggleViable(component.characterStates()[0], 72);

      const updated = component.characterStates()[0];
      expect(updated.viableSpecIds.has(72)).toBe(false);
      expect(updated.mainSpecId).toBe(71);
    });

    it('unchecking the main spec promotes another viable spec to main', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 72);
      component.toggleViable(component.characterStates()[0], 71);

      const updated = component.characterStates()[0];
      expect(updated.viableSpecIds.has(71)).toBe(false);
      expect(updated.mainSpecId).toBe(72);
    });

    it('unchecking the only viable spec clears the main', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 71);

      const updated = component.characterStates()[0];
      expect(updated.viableSpecIds.size).toBe(0);
      expect(updated.mainSpecId).toBeNull();
    });

    it('only updates the targeted character', () => {
      setup([warrior, mage]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);

      expect(component.characterStates()[1].viableSpecIds.size).toBe(0);
    });
  });

  describe('isViable', () => {
    it('returns true when the spec is in viableSpecIds', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);

      expect(component.isViable(component.characterStates()[0], 71)).toBe(true);
    });

    it('returns false when the spec is not in viableSpecIds', () => {
      setup([warrior]);
      component.ngOnInit();

      expect(component.isViable(component.characterStates()[0], 71)).toBe(false);
    });
  });

  describe('isMain', () => {
    it('returns true when the spec is the main spec', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);

      expect(component.isMain(component.characterStates()[0], 71)).toBe(true);
    });

    it('returns false when the spec is not the main spec', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 72);

      expect(component.isMain(component.characterStates()[0], 72)).toBe(false);
    });
  });

  describe('setMain', () => {
    it('changes the main spec when the target is viable', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 72);

      component.setMain(component.characterStates()[0], 72);

      expect(component.characterStates()[0].mainSpecId).toBe(72);
    });

    it('does nothing when the target spec is not viable', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);

      component.setMain(component.characterStates()[0], 73);

      expect(component.characterStates()[0].mainSpecId).toBe(71);
    });
  });

  describe('canSubmit', () => {
    it('is false before specs load', () => {
      setup([warrior]);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when a character has no viable spec selected', () => {
      setup([warrior]);
      component.ngOnInit();
      expect(component.canSubmit()).toBe(false);
    });

    it('is true once every character has a viable + main spec', () => {
      setup([warrior, mage]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);

      expect(component.canSubmit()).toBe(false); // mage still has none

      component.toggleViable(component.characterStates()[1], 62);

      expect(component.canSubmit()).toBe(true);
    });
  });

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      setup([warrior]);
      component.ngOnInit();

      component.submit();

      expect(storeMock.setRaidSpecs).not.toHaveBeenCalled();
    });

    it('calls setRaidSpecs per character and closes with success', () => {
      setup([warrior, mage]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      component.toggleViable(component.characterStates()[0], 72);
      component.toggleViable(component.characterStates()[1], 62);
      storeMock.setRaidSpecs.mockReturnValue(of({ message: 'ok' }));

      component.submit();

      expect(storeMock.setRaidSpecs).toHaveBeenCalledWith(1, { mainSpecId: 71, viableSpecIds: [71, 72] });
      expect(storeMock.setRaidSpecs).toHaveBeenCalledWith(2, { mainSpecId: 62, viableSpecIds: [62] });
      expect(mockClose).toHaveBeenCalledWith({ success: true });
    });

    it('closes with error when any request fails', () => {
      setup([warrior]);
      component.ngOnInit();
      component.toggleViable(component.characterStates()[0], 71);
      storeMock.setRaidSpecs.mockReturnValue(throwError(() => new Error('fail')));

      component.submit();

      expect(mockClose).toHaveBeenCalledWith({ error: true });
    });
  });

  describe('cancel', () => {
    it('closes the dialog without a result', () => {
      setup([warrior]);
      component.cancel();
      expect(mockClose).toHaveBeenCalledWith();
    });
  });
});
