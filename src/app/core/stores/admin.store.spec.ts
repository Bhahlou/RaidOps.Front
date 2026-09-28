import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { AdminStore } from './admin.store';
import { RaidBuffDefinitionInput } from '../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../shared/models/raid-buff-scope.enum';

const definition: RaidBuffDefinitionInput = {
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 10,
  sources: [{ classId: 7, specId: 264 }],
};

describe('AdminStore', () => {
  let syncSpells: ReturnType<typeof vi.fn>;
  let saveRaidBuff: ReturnType<typeof vi.fn>;
  let importRaidBuffs: ReturnType<typeof vi.fn>;
  let updateRaidBuff: ReturnType<typeof vi.fn>;
  let deleteRaidBuff: ReturnType<typeof vi.fn>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AdminService, useValue: { syncSpells, saveRaidBuff, importRaidBuffs, updateRaidBuff, deleteRaidBuff } }],
    });
    return TestBed.inject(AdminStore);
  };

  beforeEach(() => {
    syncSpells = vi.fn().mockReturnValue(of(undefined));
    saveRaidBuff = vi.fn().mockReturnValue(of({ created: 1, updated: 0, deleted: 0 }));
    importRaidBuffs = vi.fn().mockReturnValue(of({ created: 0, updated: 1, deleted: 0 }));
    updateRaidBuff = vi.fn().mockReturnValue(of(undefined));
    deleteRaidBuff = vi.fn().mockReturnValue(of(undefined));
  });

  describe('syncSpells', () => {
    it('delegates to AdminService.syncSpells and returns its observable', () => {
      const source$ = of(undefined);
      const store = setup();
      syncSpells.mockReturnValue(source$);

      const result$ = store.syncSpells();

      expect(syncSpells).toHaveBeenCalledOnce();
      expect(result$).toBe(source$);
    });

    it('emits and completes on success', () => {
      const store = setup();
      let completed = false;

      store.syncSpells().subscribe({ complete: () => { completed = true; } });

      expect(completed).toBe(true);
    });

    it('propagates service errors', () => {
      const store = setup();
      syncSpells.mockReturnValue(throwError(() => new Error('forbidden')));
      let message = '';

      store.syncSpells().subscribe({ error: (e: Error) => { message = e.message; } });

      expect(message).toBe('forbidden');
    });
  });

  describe('saveRaidBuff', () => {
    it('delegates to AdminService.saveRaidBuff and returns its observable', () => {
      const store = setup();

      const result$ = store.saveRaidBuff(12, definition);

      expect(saveRaidBuff).toHaveBeenCalledWith(12, definition);
      expect(result$).toBe(saveRaidBuff.mock.results[0].value);
    });
  });

  describe('importRaidBuffs', () => {
    it('delegates to AdminService.importRaidBuffs and returns its observable', () => {
      const store = setup();

      const result$ = store.importRaidBuffs(12, [definition], true);

      expect(importRaidBuffs).toHaveBeenCalledWith(12, [definition], true);
      expect(result$).toBe(importRaidBuffs.mock.results[0].value);
    });
  });

  describe('updateRaidBuff', () => {
    it('delegates to AdminService.updateRaidBuff and returns its observable', () => {
      const store = setup();

      const result$ = store.updateRaidBuff(42, definition);

      expect(updateRaidBuff).toHaveBeenCalledWith(42, definition);
      expect(result$).toBe(updateRaidBuff.mock.results[0].value);
    });
  });

  describe('deleteRaidBuff', () => {
    it('delegates to AdminService.deleteRaidBuff and returns its observable', () => {
      const store = setup();

      const result$ = store.deleteRaidBuff(7);

      expect(deleteRaidBuff).toHaveBeenCalledWith(7);
      expect(result$).toBe(deleteRaidBuff.mock.results[0].value);
    });
  });
});
