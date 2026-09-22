import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidCompositionPreview, RaidCompositionPreviewSummary } from '../models/raid-composition-preview.model';
import { RaidCompositionPreviewsStore } from './raid-composition-previews.store';

const BASE = '/guilds/g1/branches/7/composition-previews';

const summary = (overrides?: Partial<RaidCompositionPreviewSummary>): RaidCompositionPreviewSummary => ({
  id: 1,
  name: '40-man target',
  groupCount: 8,
  updatedAt: '2026-01-01T00:00:00Z',
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

describe('RaidCompositionPreviewsStore', () => {
  let store: RaidCompositionPreviewsStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidCompositionPreviewsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(RaidCompositionPreviewsStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('previews / preview / isLoading', () => {
    it('is empty and not loading before any load call', () => {
      TestBed.tick();
      expect(store.previews()).toEqual([]);
      expect(store.preview()).toBeNull();
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('loadList', () => {
    it('fetches the previews for the given guild branch', async () => {
      store.loadList('g1', 7);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith(BASE));
      expect(req.request.method).toBe('GET');
      req.flush([summary()]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.previews()).toEqual([summary()]);
    });

    it('clears any tracked single preview', async () => {
      store.loadPreview('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/11`)).flush(preview());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadList('g1', 7);
      TestBed.tick();

      expect(store.preview()).toBeNull();
      controller.expectOne((r) => r.url.endsWith(BASE)).flush([]);
    });

    it('re-fetches when called again for the same guild branch', async () => {
      store.loadList('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(BASE)).flush([summary()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadList('g1', 7);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(BASE));
      req.flush([summary({ name: 'Updated' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.previews()[0].name).toBe('Updated');
    });

    it('sets a new key and re-fetches when the branch changes', async () => {
      store.loadList('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(BASE)).flush([summary()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadList('g1', 8);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/8/composition-previews'));
      req.flush([summary({ name: 'Other branch' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.previews()[0].name).toBe('Other branch');
    });
  });

  describe('loadPreview', () => {
    it('fetches the single preview and clears the list key', async () => {
      store.loadList('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(BASE)).flush([summary()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadPreview('g1', 7, 11);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      expect(req.request.method).toBe('GET');
      req.flush(preview());
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.preview()).toEqual(preview());
      expect(store.previews()).toEqual([]);
    });

    it('re-fetches when called again for the same preview', async () => {
      store.loadPreview('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/11`)).flush(preview());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadPreview('g1', 7, 11);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      req.flush(preview({ name: 'Renamed' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.preview()!.name).toBe('Renamed');
    });

    it('sets a new key and re-fetches when the preview id changes', async () => {
      store.loadPreview('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/11`)).flush(preview());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadPreview('g1', 7, 12);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/12`));
      req.flush(preview({ id: 12, name: 'Other preview' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.preview()!.name).toBe('Other preview');
    });
  });

  describe('reload', () => {
    it('re-fetches the tracked list when in list mode', async () => {
      store.loadList('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(BASE)).flush([summary()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(BASE));
      req.flush([summary({ name: 'Reloaded' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.previews()[0].name).toBe('Reloaded');
    });

    it('re-fetches the tracked preview when in preview mode', async () => {
      store.loadPreview('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/11`)).flush(preview());
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      req.flush(preview({ name: 'Reloaded' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.preview()!.name).toBe('Reloaded');
    });
  });

  // ── pass-through API calls ───────────────────────────────────────────────

  describe('createPreview', () => {
    it('sends POST to the branch base URL with the payload', () => {
      store.createPreview('g1', 7, { name: '40-man', groupCount: 8 }).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(BASE));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: '40-man', groupCount: 8 });
      req.flush({ body: { id: 1 } });
    });
  });

  describe('renamePreview', () => {
    it('sends PATCH to .../:id with the new name', () => {
      store.renamePreview('g1', 7, 11, 'New name').subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'New name' });
      req.flush(null);
    });
  });

  describe('duplicatePreview', () => {
    it('sends POST to .../:id/duplicate with the new name', () => {
      store.duplicatePreview('g1', 7, 11, 'Copy').subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11/duplicate`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ newName: 'Copy' });
      req.flush({ body: { id: 2 } });
    });
  });

  describe('deletePreview', () => {
    it('sends DELETE to .../:id', () => {
      store.deletePreview('g1', 7, 11).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('updateSlot', () => {
    it('sends PATCH to .../:id/slots with the slot payload', () => {
      const payload = { groupNumber: 1, slotNumber: 2, wowClassId: 1, specId: 71, note: 'Bob' };
      store.updateSlot('g1', 7, 11, payload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11/slots`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });
});
