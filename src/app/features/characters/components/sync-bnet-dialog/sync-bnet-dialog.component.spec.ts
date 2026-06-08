import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { SyncBnetDialogComponent } from './sync-bnet-dialog.component';
import { CharacterService } from '../../services/character.service';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { Branch } from '../../../../shared/models/branch.model';

const mockBranches: Branch[] = [
  { id: 1, name: 'Retail', bnetNamespacePrefix: 'profile-eu', currentExpansionShortCode: 'TWW' },
  { id: 2, name: 'Classic Era', bnetNamespacePrefix: 'profile-classic-eu', currentExpansionShortCode: 'CLASSIC' },
];

/** Dispatches a MessageEvent on globalThis to simulate a BNet OAuth callback. */
const sendMessage = (data: unknown, origin = globalThis.location.origin) => {
  globalThis.dispatchEvent(new MessageEvent('message', { data, origin }));
};

describe('SyncBnetDialogComponent', () => {
  let fixture: ComponentFixture<SyncBnetDialogComponent>;
  let component: SyncBnetDialogComponent;
  let wowBranchesService: { getAll: ReturnType<typeof vi.fn> };
  let charService: { syncCharacters: ReturnType<typeof vi.fn> };
  let mockClose: ReturnType<typeof vi.fn>;
  let mockPopup: { closed: boolean; close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    wowBranchesService = { getAll: vi.fn().mockReturnValue(of(mockBranches)) };
    charService = { syncCharacters: vi.fn() };
    mockClose = vi.fn();
    mockPopup = { closed: false, close: vi.fn() };

    vi.stubGlobal('open', vi.fn().mockReturnValue(mockPopup));

    TestBed.configureTestingModule({
      imports: [SyncBnetDialogComponent],
      providers: [
        { provide: WowBrancheService, useValue: wowBranchesService },
        { provide: CharacterService, useValue: charService },
        { provide: MatDialogRef, useValue: { close: mockClose } },
        { provide: MAT_DIALOG_DATA, useValue: { region: 'eu' } },
      ],
    });
    TestBed.overrideComponent(SyncBnetDialogComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(SyncBnetDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure any registered message listeners are cleaned up between tests.
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

  // ── retry ───────────────────────────────────────────────────────────────────

  describe('retry', () => {
    it('resets step to branches', () => {
      component.ngOnInit();
      component.retry();
      expect(component.step()).toBe('branches');
    });
  });

  // ── selectBranch ────────────────────────────────────────────────────────────

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

    it('syncs characters and closes dialog with { synced: true } on success', () => {
      charService.syncCharacters.mockReturnValue(of({ message: 'ok' }));
      sendMessage({ type: 'bnet_oauth' });
      expect(charService.syncCharacters).toHaveBeenCalledWith(mockBranches[0].id);
      expect(mockClose).toHaveBeenCalledWith({ synced: true });
    });

    it('sets step to error when syncCharacters fails', () => {
      charService.syncCharacters.mockReturnValue(throwError(() => new Error('fail')));
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('error');
    });

    it('sets step to syncing before the sync call resolves', () => {
      // Use a never-completing observable to observe the intermediate state.
      charService.syncCharacters.mockReturnValue(new (require('rxjs').Subject)());
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('syncing');
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

      // Valid message → step moves to 'syncing' → dialog closes
      sendMessage({ type: 'bnet_oauth' });
      expect(component.step()).toBe('syncing');

      // Popup closes after the message was already processed
      mockPopup.closed = true;
      vi.advanceTimersByTime(500);
      vi.advanceTimersByTime(200);

      // step should not revert to 'error'
      expect(component.step()).toBe('syncing');
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
