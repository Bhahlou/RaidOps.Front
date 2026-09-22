import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { CompositionPreviewsListComponent } from './composition-previews-list.component';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildAccessLevel } from '../../../../../core/models/guild-access-level.enum';
import { User } from '../../../../../core/models/user.model';
import { RaidCompositionPreviewSummary } from '../../models/raid-composition-preview.model';
import { CreatePreviewDialogComponent } from '../../components/create-preview-dialog/create-preview-dialog.component';
import { RenamePreviewDialogComponent } from '../../components/rename-preview-dialog/rename-preview-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

const summary = (overrides?: Partial<RaidCompositionPreviewSummary>): RaidCompositionPreviewSummary => ({
  id: 1,
  name: '40-man target',
  groupCount: 8,
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const fakeUser = (): User => ({
  discordId: 'player-1',
  name: 'Dah Boo',
  avatarHash: null,
  guilds: [{ id: 'g1', name: 'Dah Boo', iconHash: null, isRegistered: true, isConfigured: true, isAdmin: true, accessLevel: GuildAccessLevel.Officer, branches: [] }],
  notifications: [],
  seenChangelogEntryIds: [],
});

describe('CompositionPreviewsListComponent', () => {
  let store: {
    previews: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    loadList: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    deletePreview: ReturnType<typeof vi.fn>;
  };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let transloco: { activeLang: ReturnType<typeof signal>; translate: ReturnType<typeof vi.fn> };

  const setup = (opts?: { previews?: RaidCompositionPreviewSummary[]; guildId?: string; branchId?: number }) => {
    store = {
      previews: signal(opts?.previews ?? [summary()]),
      isLoading: signal(false),
      loadList: vi.fn(),
      reload: vi.fn(),
      deletePreview: vi.fn().mockReturnValue(of(undefined)),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };
    transloco = { activeLang: signal('en'), translate: vi.fn((key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key)) };

    const guildId = opts?.guildId ?? 'g1';
    const branchId = opts?.branchId ?? 7;

    TestBed.configureTestingModule({
      imports: [CompositionPreviewsListComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'branchId' ? String(branchId) : guildId) } },
            paramMap: of(convertToParamMap({ branchId: String(branchId) })),
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap({ id: guildId })),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(fakeUser()) } },
        { provide: RaidCompositionPreviewsStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(CompositionPreviewsListComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(CompositionPreviewsListComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── breadcrumbs ──────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('builds the breadcrumb trail from the guild context', () => {
      const component = setup();
      expect(component.breadcrumbs().length).toBeGreaterThan(0);
    });
  });

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads the preview list for the current guild branch', () => {
      setup({ guildId: 'g1', branchId: 7 });
      expect(store.loadList).toHaveBeenCalledWith('g1', 7);
    });
  });

  // ── openCreateDialog ─────────────────────────────────────────────────────

  describe('openCreateDialog', () => {
    it('opens the create dialog with the guild/branch ids', () => {
      const component = setup();
      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(CreatePreviewDialogComponent, expect.objectContaining({ data: { guildId: 'g1', guildBranchId: 7 } }));
    });

    it('reloads the list when the dialog closes with true', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openCreateDialog();

      expect(store.reload).toHaveBeenCalled();
    });

    it('does not reload when the dialog is cancelled', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });

      component.openCreateDialog();

      expect(store.reload).not.toHaveBeenCalled();
    });
  });

  // ── renamePreview / duplicatePreview ─────────────────────────────────────

  describe('renamePreview', () => {
    it('opens the rename dialog prefilled with the current name', () => {
      const component = setup();
      component.renamePreview(summary({ id: 5, name: 'Current' }));

      expect(dialog.open).toHaveBeenCalledWith(
        RenamePreviewDialogComponent,
        expect.objectContaining({ data: { guildId: 'g1', guildBranchId: 7, previewId: 5, mode: 'rename', initialName: 'Current' } }),
      );
    });

    it('reloads on save', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.renamePreview(summary());

      expect(store.reload).toHaveBeenCalled();
    });
  });

  describe('duplicatePreview', () => {
    it('opens the rename dialog in duplicate mode with a translated copy name', () => {
      const component = setup();
      component.duplicatePreview(summary({ id: 5, name: 'Original' }));

      expect(transloco.translate).toHaveBeenCalledWith('compositionPreviews.list.duplicateName', { name: 'Original' });
      expect(dialog.open).toHaveBeenCalledWith(
        RenamePreviewDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ mode: 'duplicate', previewId: 5 }) }),
      );
    });
  });

  // ── deletePreview ────────────────────────────────────────────────────────

  describe('deletePreview', () => {
    it('opens a confirm dialog with the preview name', () => {
      const component = setup();
      component.deletePreview(summary({ name: 'To delete' }));

      expect(dialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ messageParams: { name: 'To delete' } }) }),
      );
    });

    it('does not delete when not confirmed', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });

      component.deletePreview(summary());

      expect(store.deletePreview).not.toHaveBeenCalled();
    });

    it('deletes and reloads on confirmation', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.deletePreview(summary({ id: 5 }));

      expect(store.deletePreview).toHaveBeenCalledWith('g1', 7, 5);
      expect(snackbar.success).toHaveBeenCalledWith('compositionPreviews.list.deleteSuccess');
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows a snackbar error on delete failure', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      store.deletePreview.mockReturnValue(throwError(() => new Error('boom')));

      component.deletePreview(summary());

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });
});
