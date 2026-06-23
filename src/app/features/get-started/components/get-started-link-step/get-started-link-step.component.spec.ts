import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { GetStartedLinkStepComponent } from './get-started-link-step.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { Character } from '../../../characters/models/character.model';
import { GuildMembership } from '../../../guilds/models/guild-membership.model';
import { CharacterRank } from '../../../guilds/models/character-rank.enum';

const makeMembership = (guildId: string): GuildMembership => ({
  guildId, guildName: `Guild ${guildId}`, guildIconHash: null,
  characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
});

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id, name: `Char${id}`, classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Classic Anniversary', realmName: 'Thunderstrike', realmSlug: 'thunderstrike',
  level: 60, itemLevel: null, avatarUrl: null, guildName: null, bnetSpecs: [], raidSpecs: [],
  guildMemberships: [],
  ...overrides,
});

describe('GetStartedLinkStepComponent', () => {
  let component: GetStartedLinkStepComponent;
  let navigate: ReturnType<typeof vi.fn>;

  const setup = (characters: Character[] = []) => {
    navigate = vi.fn();

    TestBed.configureTestingModule({
      imports: [GetStartedLinkStepComponent],
      providers: [
        {
          provide: CharacterStore,
          useValue: {
            isCharactersLoading: signal(false),
            characterList: signal(characters),
          },
        },
        { provide: Router, useValue: { navigate } },
      ],
    });
    TestBed.overrideComponent(GetStartedLinkStepComponent, { set: { template: '', imports: [] } });
    component = TestBed.createComponent(GetStartedLinkStepComponent).componentInstance;
  };

  describe('canFinish', () => {
    it('is false when no character has a guild membership', () => {
      setup([makeChar(1), makeChar(2)]);
      expect(component.canFinish()).toBe(false);
    });

    it('is true when at least one character has a guild membership', () => {
      setup([makeChar(1), makeChar(2, { guildMemberships: [makeMembership('g1')] })]);
      expect(component.canFinish()).toBe(true);
    });

    it('is false when there are no characters', () => {
      setup([]);
      expect(component.canFinish()).toBe(false);
    });
  });

  describe('finish', () => {
    it('navigates to /guilds', () => {
      setup([]);
      component.finish();
      expect(navigate).toHaveBeenCalledWith(['/guilds']);
    });
  });
});
