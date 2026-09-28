import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { RaidBuffsPanelComponent } from './raid-buffs-panel.component';
import { RaidBuffCoverage, RaidBuffCoverageEntry, RaidBuffCoverageItem, RaidBuffCoveragePool } from '../../utils/raid-buff-coverage.util';
import { RaidBuffDefinition } from '../../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../../../../shared/models/raid-buff-scope.enum';

const def = (overrides?: Partial<RaidBuffDefinition>): RaidBuffDefinition => ({
  id: 1,
  expansionId: 12,
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 0,
  sources: [],
  spell: { nameEn: 'Ancestral Healing', nameFr: 'Guérison des anciens', nameDe: 'Heilung der Ahnen', iconUrl: 'https://cdn/ancestral.jpg' },
  ...overrides,
});

const entry = (definition: RaidBuffDefinition, provided = true): RaidBuffCoverageEntry => ({
  key: `definition-${definition.id}`,
  definition,
  icons: [{ definition, provided }],
  covered: provided,
});

const entryItem = (definition: RaidBuffDefinition, provided = true): RaidBuffCoverageItem => ({ kind: 'entry', entry: entry(definition, provided) });

const poolItem = (key: string, entries: RaidBuffCoverageEntry[]): RaidBuffCoverageItem => {
  const pool: RaidBuffCoveragePool = { key, covered: entries.filter((e) => e.covered).length, total: entries.length, entries };
  return { kind: 'pool', pool };
};

const emptyCoverage: RaidBuffCoverage = { buffs: [], debuffs: [], individual: [], groups: new Map() };

describe('RaidBuffsPanelComponent', () => {
  let fixture: ComponentFixture<RaidBuffsPanelComponent>;
  let component: RaidBuffsPanelComponent;
  let translate: ReturnType<typeof vi.fn>;

  const setup = (coverage: RaidBuffCoverage, expansionId: number | null = 12, translateImpl: (key: string) => string = (key) => key) => {
    translate = vi.fn(translateImpl);

    TestBed.configureTestingModule({
      imports: [RaidBuffsPanelComponent],
      providers: [{ provide: TranslocoService, useValue: { getActiveLang: () => 'fr', translate } }],
    }).overrideComponent(RaidBuffsPanelComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidBuffsPanelComponent);
    fixture.componentRef.setInput('coverage', coverage);
    fixture.componentRef.setInput('expansionId', expansionId);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  it('has no sections when the coverage is entirely empty', () => {
    setup(emptyCoverage);
    expect(component.sections()).toEqual([]);
  });

  // ── sections ─────────────────────────────────────────────────────────────

  describe('sections', () => {
    it('includes only the non-empty sections, in buffs/debuffs/individual order', () => {
      const c = setup({ ...emptyCoverage, individual: [entryItem(def({ id: 3 }))], buffs: [entryItem(def({ id: 1 }))] });

      expect(c.sections().map((s) => s.key)).toEqual(['buffs', 'individual']);
    });

    it('computes iconSlots as the widest entry\'s icon count across the whole section, standalone entries included', () => {
      const a = def({ id: 1 });
      const b = def({ id: 2 });
      const threeIconEntry: RaidBuffCoverageEntry = {
        key: 'attack-power-debuff',
        definition: a,
        icons: [{ definition: a, provided: false }, { definition: b, provided: true }, { definition: def({ id: 3 }), provided: false }],
        covered: true,
      };
      const oneIconEntry = entryItem(def({ id: 4 }));
      const c = setup({ ...emptyCoverage, buffs: [oneIconEntry, { kind: 'entry', entry: threeIconEntry }] });

      expect(c.sections()[0].iconSlots).toBe(3);
    });

    it('also considers pool members\' icon counts', () => {
      const pool = poolItem('paladin-blessings', [entry(def({ id: 1 })), entry(def({ id: 2 }))]);
      const c = setup({ ...emptyCoverage, buffs: [pool] });

      expect(c.sections()[0].iconSlots).toBe(1);
    });
  });

  // ── label / spellName ────────────────────────────────────────────────────

  describe('label', () => {
    it('resolves the effect label in the active language', () => {
      const c = setup(emptyCoverage);
      expect(c.label(def())).toBe('+25 % d\'armure');
    });
  });

  describe('spellName', () => {
    it('resolves the spell name in the active language', () => {
      const c = setup(emptyCoverage);
      expect(c.spellName(def())).toBe('Guérison des anciens');
    });

    it('returns an empty string when the definition has no resolvable spell', () => {
      const c = setup(emptyCoverage);
      expect(c.spellName(def({ spell: null }))).toBe('');
    });
  });

  // ── poolLabel ────────────────────────────────────────────────────────────

  describe('poolLabel', () => {
    it('translates a known pool key', () => {
      const c = setup(emptyCoverage, 12, (key) => (key === 'compositionPreviews.buffs.pools.paladin-blessings' ? 'Blessings' : key));

      expect(c.poolLabel('paladin-blessings')).toBe('Blessings');
    });

    it('falls back to the raw key when there is no translation for it', () => {
      const c = setup(emptyCoverage);
      expect(c.poolLabel('curses')).toBe('curses');
    });
  });
});
