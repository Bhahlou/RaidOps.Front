import { TestBed, ComponentFixture } from '@angular/core/testing';

import { CharacterCardComponent } from './character-card.component';
import { Character } from '../../models/character.model';

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: 1,
  name: 'Azeriel',
  classId: 1,
  className: 'Warrior',
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

describe('CharacterCardComponent — charRoute', () => {
  let fixture: ComponentFixture<CharacterCardComponent>;

  const setup = (char: Character) => {
    TestBed.configureTestingModule({ imports: [CharacterCardComponent] });
    TestBed.overrideComponent(CharacterCardComponent, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(CharacterCardComponent);
    fixture.componentRef.setInput('character', char);
  };

  it('builds a route from the Retail branch', () => {
    setup(makeChar({ branchName: 'Retail', realmSlug: 'silvermoon', name: 'Azeriel' }));
    expect(fixture.componentInstance.charRoute()).toEqual(['/characters', 'retail', 'silvermoon', 'azeriel']);
  });

  it('converts spaces in branchName to hyphens', () => {
    setup(makeChar({ branchName: 'Classic Era', realmSlug: 'everlook', name: 'Teston' }));
    expect(fixture.componentInstance.charRoute()).toEqual(['/characters', 'classic-era', 'everlook', 'teston']);
  });

  it('converts underscores in branchName to hyphens', () => {
    setup(makeChar({ branchName: 'season_of_discovery', realmSlug: 'everlook', name: 'Raidops' }));
    expect(fixture.componentInstance.charRoute()).toEqual(['/characters', 'season-of-discovery', 'everlook', 'raidops']);
  });

  it('lowercases the character name', () => {
    setup(makeChar({ branchName: 'Retail', realmSlug: 'kazzak', name: 'UPPERNAME' }));
    expect(fixture.componentInstance.charRoute()).toEqual(['/characters', 'retail', 'kazzak', 'uppername']);
  });
});
