import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';

import { CompositionPreviewComposerComponent } from './composition-preview-composer.component';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { WowBrancheService } from '../../../../../shared/services/wow-branche.service';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildAccessLevel } from '../../../../../core/models/guild-access-level.enum';
import { User } from '../../../../../core/models/user.model';
import { GuildBranch } from '../../../models/guild-branch.model';
import { Branch } from '../../../../../shared/models/branch.model';
import { RaidCompositionPreview, RaidCompositionPreviewSlot } from '../../models/raid-composition-preview.model';
import { RenamePreviewDialogComponent } from '../../components/rename-preview-dialog/rename-preview-dialog.component';

const slot = (overrides?: Partial<RaidCompositionPreviewSlot>): RaidCompositionPreviewSlot => ({
  groupNumber: 1,
  slotNumber: 1,
  wowClassId: 1,
  wowClassName: 'Warrior',
  wowClassColor: '#C79C6E',
  specId: 73,
  specName: 'Protection',
  specIconUrl: null,
  note: null,
  ...overrides,
});

const preview = (overrides?: Partial<RaidCompositionPreview>): RaidCompositionPreview => ({
  id: 11,
  name: '40-man target',
  groupCount: 8,
  slotsPerGroup: 5,
  slots: [],
  ...overrides,
});

const guildBranch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Anniversary',
  isActive: true,
  rosterMode: null,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  signupMode: null,
  ...overrides,
});

const branch = (overrides?: Partial<Branch>): Branch => ({
  id: 3,
  name: 'Classic Anniversary',
  bnetNamespacePrefix: 'static-classic1x',
  currentExpansionShortCode: 'Classic',
  isActive: true,
  syncAvailable: true,
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

describe('CompositionPreviewComposerComponent', () => {
  let store: {
    preview: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    loadPreview: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let branchesStore: { branches: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let wowBrancheService: { getAll: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  const setup = (opts?: { preview?: RaidCompositionPreview | null; branches?: GuildBranch[]; wowBranches?: Branch[]; guildId?: string; branchId?: number; previewId?: number }) => {
    store = {
      preview: signal(opts?.preview === undefined ? preview() : opts.preview),
      isLoading: signal(false),
      loadPreview: vi.fn(),
      reload: vi.fn(),
    };
    branchesStore = { branches: signal(opts?.branches ?? [guildBranch()]), load: vi.fn() };
    wowBrancheService = { getAll: vi.fn().mockReturnValue(of(opts?.wowBranches ?? [branch()])) };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };

    const guildId = opts?.guildId ?? 'g1';
    const branchIdParam = opts?.branchId ?? 7;
    const previewId = opts?.previewId ?? 11;

    TestBed.configureTestingModule({
      imports: [CompositionPreviewComposerComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'previewId' ? String(previewId) : key === 'branchId' ? String(branchIdParam) : guildId) },
            },
            paramMap: of(convertToParamMap({ branchId: String(branchIdParam), previewId: String(previewId) })),
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap({ id: guildId })),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(fakeUser()) } },
        { provide: RaidCompositionPreviewsStore, useValue: store },
        { provide: GuildBranchesStore, useValue: branchesStore },
        { provide: WowBrancheService, useValue: wowBrancheService },
        { provide: Dialog, useValue: dialog },
      ],
    }).overrideComponent(CompositionPreviewComposerComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(CompositionPreviewComposerComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('reads previewId from the route and loads the preview', () => {
      setup({ guildId: 'g1', branchId: 7, previewId: 42 });

      expect(store.loadPreview).toHaveBeenCalledWith('g1', 7, 42);
    });

    it('loads the guild branches and the WoW branches reference data', () => {
      setup();
      expect(branchesStore.load).toHaveBeenCalledWith('g1');
      expect(wowBrancheService.getAll).toHaveBeenCalled();
    });
  });

  // ── expansionId ──────────────────────────────────────────────────────────

  describe('expansionId', () => {
    it('resolves the expansion id from the current guild branch\'s WoW branch short code', () => {
      const component = setup({ branches: [guildBranch({ id: 7, branchId: 3 })], wowBranches: [branch({ id: 3, currentExpansionShortCode: 'TBC' })] });

      expect(component.expansionId()).toBe(2);
    });

    it('is null when the guild branch is not found', () => {
      const component = setup({ branches: [] });
      expect(component.expansionId()).toBeNull();
    });

    it('is null when the short code has no known expansion id', () => {
      const component = setup({ branches: [guildBranch({ id: 7, branchId: 3 })], wowBranches: [branch({ id: 3, currentExpansionShortCode: 'Unknown' })] });
      expect(component.expansionId()).toBeNull();
    });
  });

  // ── roleCounts ───────────────────────────────────────────────────────────

  describe('roleCounts', () => {
    it('tallies roles from the current preview slots', () => {
      const component = setup({ preview: preview({ slots: [slot({ specId: 73 })] }) });
      expect(component.roleCounts().tank).toBe(1);
    });

    it('is all zero when there is no preview yet', () => {
      const component = setup({ preview: null });
      expect(component.roleCounts()).toEqual({ tank: 0, heal: 0, melee: 0, ranged: 0 });
    });
  });

  // ── breadcrumbs ──────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the preview name as the leaf crumb once loaded', () => {
      const component = setup({ preview: preview({ name: 'My preview' }) });
      expect(component.breadcrumbs().at(-1)).toEqual({ label: 'My preview' });
    });

    it('falls back to a generic breadcrumb key while the preview has not loaded', () => {
      const component = setup({ preview: null });
      expect(component.breadcrumbs().at(-1)).toEqual({ i18nKey: 'compositionPreviews.composer.breadcrumb' });
    });

    it('links the list crumb to the branch composition-previews page', () => {
      const component = setup({ guildId: 'g1', branchId: 7 });
      expect(component.breadcrumbs()[1]).toEqual(expect.objectContaining({ link: ['/guilds', 'g1', '7', 'composition-previews'] }));
    });
  });

  // ── renamePreview ────────────────────────────────────────────────────────

  describe('renamePreview', () => {
    it('does nothing when the preview has not loaded', () => {
      const component = setup({ preview: null });
      component.renamePreview();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the rename dialog prefilled with the current name', () => {
      const component = setup({ preview: preview({ id: 11, name: 'Current' }) });
      component.renamePreview();

      expect(dialog.open).toHaveBeenCalledWith(
        RenamePreviewDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ previewId: 11, mode: 'rename', initialName: 'Current' }) }),
      );
    });

    it('reloads on save', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.renamePreview();

      expect(store.reload).toHaveBeenCalled();
    });

    it('does not reload when cancelled', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });

      component.renamePreview();

      expect(store.reload).not.toHaveBeenCalled();
    });
  });
});
