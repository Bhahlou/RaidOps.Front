import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';

import { BnetSyncPanelComponent } from './bnet-sync-panel.component';
import { CharacterService } from '../../services/character.service';
import { CharacterStore } from '../../stores/character.store';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { Branch } from '../../../../shared/models/branch.model';
import { BnetAccount } from '../../models/bnet-account.model';

const mockBranches: Branch[] = [
  { id: 1, name: 'Retail', bnetNamespacePrefix: 'profile-eu', currentExpansionShortCode: 'TWW' },
  { id: 2, name: 'Classic Era', bnetNamespacePrefix: 'profile-classic-eu', currentExpansionShortCode: 'CLASSIC' },
];

const makeAccount = (bnetId: string): BnetAccount => ({
  bnetId,
  battleTag: `Player${bnetId}#1234`,
  region: 'eu',
  tokenExpiry: '2026-01-01T00:00:00Z',
});

/** Dispatches a MessageEvent on globalThis to simulate a BNet OAuth callback. */
const sendMessage = (data: unknown, origin = globalThis.location.origin) => {
  globalThis.dispatchEvent(new MessageEvent('message', { data, origin }));
};

describe('BnetSyncPanelComponent', () => {
  let fixture: ComponentFixture<BnetSyncPanelComponent>;
  let component: BnetSyncPanelComponent;
  let wowBranchesService: { getAll: ReturnType<typeof vi.fn> };
  let charService: { syncCharacters: ReturnType<typeof vi.fn> };
  let storeMock: { bnetAccounts: ReturnType<typeof vi.fn>; loadCharacters: ReturnType<typeof vi.fn> };
  let mockPopup: { closed: boolean; close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    wowBranchesService = { getAll: vi.fn().mockReturnValue(of(mockBranches)) };
    charService = { syncCharacters: vi.fn() };
    // Default: no linked accounts — matches the pre-multi-account "direct to /authorize" path
    // used by most tests below. Tests exercising the logout-first chain override this.
    storeMock = {
      bnetAccounts: vi.fn().mockReturnValue([]),
      loadCharacters: vi.fn().mockReturnValue(of([])),
    };
    mockPopup = { closed: false, close: vi.fn() };

    vi.stubGlobal('open', vi.fn().mockReturnValue(mockPopup));

    TestBed.configureTestingModule({
      imports: [BnetSyncPanelComponent],
      providers: [
        { provide: WowBrancheService, useValue: wowBranchesService },
        { provide: CharacterService, useValue: charService },
        { provide: CharacterStore, useValue: storeMock },
      ],
    });
    TestBed.overrideComponent(BnetSyncPanelComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(BnetSyncPanelComponent);
    fixture.componentRef.setInput('region', 'eu');
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure any registered message listeners/timers are cleaned up between tests.
    component.ngOnDestroy();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads branches and clears the loading state on success', () => {
      component.ngOnInit();
      expect(component.branches()).toEqual(mockBranches);
      expect(component.isLoadingBranches()).toBe(false);
      expect(component.step()).toBe('branches');
    });

    it('sets step to error when branch loading fails', () => {
      wowBranchesService.getAll.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.step()).toBe('error');
      expect(component.isLoadingBranches()).toBe(false);
    });
  });

  // ── reset ───────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('resets step to branches', () => {
      component.ngOnInit();
      component.reset();
      expect(component.step()).toBe('branches');
    });
  });

  // ── selectBranch — single/no account (direct to /authorize) ────────────────

  describe('selectBranch', () => {
    it('sets step to authenticating', () => {
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      expect(component.step()).toBe('authenticating');
    });

    it('opens a popup window', () => {
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      expect(globalThis.open).toHaveBeenCalled();
    });

    it('includes the region in the popup URL', () => {
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      const url = (globalThis.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('region=eu');
    });

    it('goes straight to /authorize (no logout step) with exactly one linked account and no add-another intent', () => {
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1')]);
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      const url = (globalThis.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('/bnet/link/initiate');
    });

    it('goes straight to /authorize when bnetAccounts has not loaded yet (undefined) and no add-another intent', () => {
      storeMock.bnetAccounts.mockReturnValue(undefined);
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      const url = (globalThis.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('/bnet/link/initiate');
    });
  });

  // ── selectBranch — add-another / multi-account logout-first chain ──────────

  describe('selectBranch — logout-first chain', () => {
    it('points the popup at the BNet logout URL first when startInAddAnotherMode is true', () => {
      fixture.componentRef.setInput('startInAddAnotherMode', true);
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      const url = (globalThis.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe('https://account.battle.net/logout?logout');
      expect(component.step()).toBe('authenticating');
    });

    it('points the popup at the BNet logout URL first with 2+ linked accounts, even without add-another intent', () => {
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1'), makeAccount('2')]);
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      const url = (globalThis.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toBe('https://account.battle.net/logout?logout');
    });

    it('navigates the same popup to the real OAuth link after the scheduled delay', () => {
      vi.useFakeTimers();
      fixture.componentRef.setInput('startInAddAnotherMode', true);
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      vi.advanceTimersByTime(1000);

      const openMock = globalThis.open as ReturnType<typeof vi.fn>;
      expect(openMock).toHaveBeenCalledTimes(2);
      expect(openMock.mock.calls[1][0]).toContain('/bnet/link/initiate');
      expect(openMock.mock.calls[1][1]).toBe('bnet_oauth'); // same named window, not a fresh popup
    });

    it('does not navigate to the real OAuth link if the component is destroyed before the delay elapses', () => {
      vi.useFakeTimers();
      fixture.componentRef.setInput('startInAddAnotherMode', true);
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      component.ngOnDestroy();
      vi.advanceTimersByTime(1000);

      expect((globalThis.open as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    });
  });

  // ── message handler (dispatched via the popup) ─────────────────────────────

  describe('OAuth message handler', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
    });

    it('ignores messages from a different origin', () => {
      sendMessage({ type: 'bnet_oauth' }, 'https://evil.example.com');
      expect(component.step()).toBe('authenticating');
    });

    it('ignores messages with a different type', () => {
      sendMessage({ type: 'not_bnet_oauth' });
      expect(component.step()).toBe('authenticating');
    });

    it('ignores messages with no type', () => {
      sendMessage({ hello: 'world' });
      expect(component.step()).toBe('authenticating');
    });

    it('sets step to error when the message carries an error', () => {
      sendMessage({ type: 'bnet_oauth', error: 'access_denied' });
      expect(component.step()).toBe('error');
    });

    it('ignores a stale success message if reset cleared the selected branch first', () => {
      component.reset();

      sendMessage({ type: 'bnet_oauth' });

      expect(charService.syncCharacters).not.toHaveBeenCalled();
      expect(component.step()).toBe('branches');
    });

    it('syncs characters, reloads the store and emits a success outcome', () => {
      const syncedSpy = vi.fn();
      component.synced.subscribe(syncedSpy);
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));

      sendMessage({ type: 'bnet_oauth' });

      expect(charService.syncCharacters).toHaveBeenCalledWith(mockBranches[0].id);
      expect(storeMock.loadCharacters).toHaveBeenCalledWith(true);
      expect(syncedSpy).toHaveBeenCalledWith({ outcome: 'success' });
    });

    it('sets step to error when syncCharacters fails', () => {
      charService.syncCharacters.mockReturnValue(throwError(() => new Error('fail')));
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('error');
    });

    it('sets step to syncing before the sync call resolves', () => {
      // Use a never-completing observable to observe the intermediate state.
      charService.syncCharacters.mockReturnValue(new Subject());
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('syncing');
    });
  });

  // ── outcome resolution ──────────────────────────────────────────────────────

  describe('outcome resolution', () => {
    it('emits accountAlreadyLinked when adding another account but no new bnetId appears', () => {
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1')]);
      fixture.componentRef.setInput('startInAddAnotherMode', true);
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));

      const syncedSpy = vi.fn();
      component.synced.subscribe(syncedSpy);

      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      // storeMock.bnetAccounts() still returns the same single account after "sync" — same as
      // before the flow started, i.e. no new account was linked.
      sendMessage({ type: 'bnet_oauth' });

      expect(syncedSpy).toHaveBeenCalledWith({ outcome: 'accountAlreadyLinked' });
    });

    it('emits success when adding another account and a new bnetId actually appears', () => {
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1')]);
      fixture.componentRef.setInput('startInAddAnotherMode', true);
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));

      const syncedSpy = vi.fn();
      component.synced.subscribe(syncedSpy);

      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      // A second account appeared by the time the store reloads post-sync.
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1'), makeAccount('2')]);
      sendMessage({ type: 'bnet_oauth' });

      expect(syncedSpy).toHaveBeenCalledWith({ outcome: 'success' });
    });

    it('emits success for a plain multi-account resync even if an unlinked account ends up authenticated', () => {
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1'), makeAccount('2')]);
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));

      const syncedSpy = vi.fn();
      component.synced.subscribe(syncedSpy);

      component.ngOnInit();
      component.selectBranch(mockBranches[0]); // not add-another, just 2+ accounts
      storeMock.bnetAccounts.mockReturnValue([makeAccount('1'), makeAccount('2'), makeAccount('3')]);
      sendMessage({ type: 'bnet_oauth' });

      expect(syncedSpy).toHaveBeenCalledWith({ outcome: 'success' });
    });

    it('emits accountAlreadyLinked when adding another account but bnetAccounts is still undefined at resolution time', () => {
      storeMock.bnetAccounts.mockReturnValue(undefined);
      fixture.componentRef.setInput('startInAddAnotherMode', true);
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));

      const syncedSpy = vi.fn();
      component.synced.subscribe(syncedSpy);

      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      // storeMock.bnetAccounts() is still undefined after "sync" — the store hasn't reloaded yet.
      sendMessage({ type: 'bnet_oauth' });

      expect(syncedSpy).toHaveBeenCalledWith({ outcome: 'accountAlreadyLinked' });
    });
  });

  // ── popup close poll ────────────────────────────────────────────────────────

  describe('popup close poll', () => {
    it('sets step to error when popup is closed while still authenticating', () => {
      vi.useFakeTimers();
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      mockPopup.closed = true;
      vi.advanceTimersByTime(500);  // setInterval tick
      vi.advanceTimersByTime(200);  // inner setTimeout

      expect(component.step()).toBe('error');
    });

    it('does not set step to error when popup is closed after sync has already started', () => {
      vi.useFakeTimers();
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      // Valid message → step moves to 'syncing' → synced emitted
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('syncing');

      // Popup closes after the message was already processed
      mockPopup.closed = true;
      vi.advanceTimersByTime(500);
      vi.advanceTimersByTime(200);

      // step should not revert to 'error'
      expect(component.step()).toBe('syncing');
    });

    it('does not set step to error when the deferred check fires after step already moved on', () => {
      vi.useFakeTimers();
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      // Poll detects the popup closed first, scheduling the deferred 200ms check —
      // step is still 'authenticating' at this point.
      mockPopup.closed = true;
      vi.advanceTimersByTime(500);

      // The success message arrives before the deferred check runs.
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('syncing');

      // The deferred check now finds step !== 'authenticating' and does nothing.
      vi.advanceTimersByTime(200);

      expect(component.step()).toBe('syncing');
    });

    it('does nothing while the popup is still open', () => {
      vi.useFakeTimers();
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      mockPopup.closed = false;
      vi.advanceTimersByTime(500);

      expect(component.step()).toBe('authenticating');
    });

    it('does not throw when the popup never opened (e.g. blocked by the browser)', () => {
      (globalThis.open as ReturnType<typeof vi.fn>).mockReturnValue(null);
      vi.useFakeTimers();
      component.ngOnInit();

      expect(() => {
        component.selectBranch(mockBranches[0]);
        vi.advanceTimersByTime(500);
      }).not.toThrow();
      expect(component.step()).toBe('authenticating');
    });
  });

  // ── ngOnDestroy / cleanup ───────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('removes the message event listener', () => {
      const removeSpy = vi.spyOn(globalThis, 'removeEventListener');
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);

      component.ngOnDestroy();

      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('closes the popup if it is still open', () => {
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      mockPopup.closed = false;

      component.ngOnDestroy();

      expect(mockPopup.close).toHaveBeenCalled();
    });

    it('does not close the popup if it is already closed', () => {
      component.ngOnInit();
      component.selectBranch(mockBranches[0]);
      mockPopup.closed = true;

      component.ngOnDestroy();

      expect(mockPopup.close).not.toHaveBeenCalled();
    });

    it('does not throw when called without a prior selectBranch', () => {
      component.ngOnInit();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
