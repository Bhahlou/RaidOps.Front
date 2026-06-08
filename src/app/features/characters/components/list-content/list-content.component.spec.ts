import { TestBed, ComponentFixture } from '@angular/core/testing';

import { ListContentComponent } from './list-content.component';
import { Character } from '../../models/character.model';

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id,
  name: `Char${id}`,
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
  itemLevel: null,
  avatarUrl: null,
  guildName: null,
  specs: [],
  ...overrides,
});

describe('ListContentComponent — branchGroups', () => {
  let fixture: ComponentFixture<ListContentComponent>;

  const setup = (chars: Character[]) => {
    TestBed.configureTestingModule({ imports: [ListContentComponent] });
    TestBed.overrideComponent(ListContentComponent, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(ListContentComponent);
    fixture.componentRef.setInput('isBnetLoading', false);
    fixture.componentRef.setInput('isBnetLinked', true);
    fixture.componentRef.setInput('isCharactersLoading', false);
    fixture.componentRef.setInput('characters', chars);
    return fixture.componentInstance;
  };

  it('returns an empty array when there are no characters', () => {
    const comp = setup([]);
    expect(comp.branchGroups()).toEqual([]);
  });

  it('groups characters by branch and then by realm', () => {
    const comp = setup([
      makeChar(1, { branchName: 'Retail', realmName: 'Silvermoon' }),
      makeChar(2, { branchName: 'Retail', realmName: 'Kazzak' }),
      makeChar(3, { branchName: 'Classic', realmName: 'Everlook' }),
    ]);

    const groups = comp.branchGroups();
    expect(groups).toHaveLength(2);

    const retail = groups.find(g => g.branchName === 'Retail')!;
    expect(retail).toBeDefined();
    expect(retail.realms).toHaveLength(2);
    expect(retail.realms.map(r => r.realmName).sort()).toEqual(['Kazzak', 'Silvermoon']);

    const classic = groups.find(g => g.branchName === 'Classic')!;
    expect(classic.realms[0].realmName).toBe('Everlook');
    expect(classic.realms[0].characters).toHaveLength(1);
  });

  it('places multiple characters in the same realm group', () => {
    const comp = setup([
      makeChar(1, { realmName: 'Silvermoon' }),
      makeChar(2, { realmName: 'Silvermoon' }),
    ]);

    const realm = comp.branchGroups()[0].realms[0];
    expect(realm.characters).toHaveLength(2);
  });
});
