import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { BnetLinkedAccountsComponent } from './bnet-linked-accounts.component';
import { CharacterStore } from '../../stores/character.store';
import { BnetAccount } from '../../models/bnet-account.model';

const mockAccount: BnetAccount = {
  bnetId: '1',
  battleTag: 'Bhahlou#1234',
  region: 'eu',
  tokenExpiry: '2026-01-01T00:00:00Z',
};

describe('BnetLinkedAccountsComponent', () => {
  let storeMock: {
    bnetAccounts: ReturnType<typeof signal<BnetAccount[] | undefined>>;
    loadCharacters: ReturnType<typeof vi.fn>;
    confirmAndUnlinkBnetAccount: ReturnType<typeof vi.fn>;
  };

  const setup = (accounts: BnetAccount[] = [mockAccount]) => {
    storeMock = {
      bnetAccounts: signal(accounts),
      loadCharacters: vi.fn().mockReturnValue(of([])),
      confirmAndUnlinkBnetAccount: vi.fn().mockReturnValue(of(true)),
    };

    TestBed.configureTestingModule({
      imports: [BnetLinkedAccountsComponent],
      providers: [{ provide: CharacterStore, useValue: storeMock }],
    });
    TestBed.overrideComponent(BnetLinkedAccountsComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(BnetLinkedAccountsComponent).componentInstance;
  };

  it('exposes the store bnetAccounts as accounts', () => {
    const component = setup([mockAccount]);
    expect(component.accounts()).toEqual([mockAccount]);
  });

  describe('refresh', () => {
    it('sets isRefreshing while the reload is in flight, clearing it on success', () => {
      const component = setup();
      const subject = new Subject<[]>();
      storeMock.loadCharacters.mockReturnValue(subject.asObservable());

      component.refresh();
      expect(component.isRefreshing()).toBe(true);

      subject.next([]);
      subject.complete();
      expect(component.isRefreshing()).toBe(false);
    });

    it('clears isRefreshing on error too', () => {
      const component = setup();
      storeMock.loadCharacters.mockReturnValue(throwError(() => new Error('fail')));

      component.refresh();

      expect(component.isRefreshing()).toBe(false);
    });
  });

  describe('unlink', () => {
    it('sets unlinkingBnetId while the request is in flight, clearing it once it settles', () => {
      const subject = new Subject<boolean>();
      const component = setup();
      storeMock.confirmAndUnlinkBnetAccount.mockReturnValue(subject.asObservable());

      component.unlink(mockAccount);
      expect(component.unlinkingBnetId()).toBe(mockAccount.bnetId);

      subject.next(true);
      subject.complete();
      expect(component.unlinkingBnetId()).toBeNull();
    });

    it('delegates to the store with the given account', () => {
      const component = setup();

      component.unlink(mockAccount);

      expect(storeMock.confirmAndUnlinkBnetAccount).toHaveBeenCalledWith(mockAccount);
    });

    it('clears unlinkingBnetId even when cancelled (store emits false)', () => {
      const component = setup();
      storeMock.confirmAndUnlinkBnetAccount.mockReturnValue(of(false));

      component.unlink(mockAccount);

      expect(component.unlinkingBnetId()).toBeNull();
    });
  });
});
