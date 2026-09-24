import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { AdminStore } from './admin.store';

describe('AdminStore', () => {
  let syncSpells: ReturnType<typeof vi.fn>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AdminService, useValue: { syncSpells } }],
    });
    return TestBed.inject(AdminStore);
  };

  beforeEach(() => {
    syncSpells = vi.fn().mockReturnValue(of(undefined));
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
});
