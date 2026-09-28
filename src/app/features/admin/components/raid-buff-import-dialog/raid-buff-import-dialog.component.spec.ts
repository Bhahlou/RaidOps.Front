import { TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { RaidBuffImportDialogComponent } from './raid-buff-import-dialog.component';
import { AdminStore } from '../../../../core/stores/admin.store';

const validFile = JSON.stringify({
  expansionId: 12,
  definitions: [
    {
      spellId: 16176,
      scope: 'Raid',
      kind: 'Buff',
      labelEn: '+25% armor',
      labelFr: '+25 % d\'armure',
      labelDe: '+25 % Rüstung',
      exclusiveGroupKey: null,
      capacityPoolKey: null,
      sortOrder: 10,
      sources: [{ classId: 7, specId: 264 }],
    },
  ],
});

describe('RaidBuffImportDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let adminStore: { importRaidBuffs: ReturnType<typeof vi.fn> };

  const setup = () => {
    dialogRef = { close: vi.fn() };
    adminStore = { importRaidBuffs: vi.fn().mockReturnValue(of({ created: 1, updated: 0, deleted: 0 })) };

    TestBed.configureTestingModule({
      imports: [RaidBuffImportDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: AdminStore, useValue: adminStore },
      ],
    }).overrideComponent(RaidBuffImportDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidBuffImportDialogComponent).componentInstance;
  };

  it('should create with an empty text and no parse result', () => {
    const component = setup();

    expect(component.text()).toBe('');
    expect(component.parsed()).toBeNull();
    expect(component.canSubmit()).toBe(false);
  });

  // ── onTextInput / parsed / preview ────────────────────────────────────────

  describe('onTextInput', () => {
    it('sets the text and clears any previous server error', () => {
      const component = setup();
      component.serverError.set('boom');

      component.onTextInput('hello');

      expect(component.text()).toBe('hello');
      expect(component.serverError()).toBeNull();
    });
  });

  describe('parsed', () => {
    it('is null while the text is blank', () => {
      const component = setup();
      component.onTextInput('   ');

      expect(component.parsed()).toBeNull();
    });

    it('parses a valid pasted file', () => {
      const component = setup();

      component.onTextInput(validFile);

      expect(component.parsed()).toEqual({ ok: true, file: expect.objectContaining({ expansionId: 12 }) });
    });

    it('reports the error for an invalid pasted file', () => {
      const component = setup();

      component.onTextInput('not json');

      expect(component.parsed()).toEqual({ ok: false, error: 'invalidJson' });
    });
  });

  describe('preview', () => {
    it('is null when nothing is parsed or parsing failed', () => {
      const component = setup();
      expect(component.preview()).toBeNull();

      component.onTextInput('not json');
      expect(component.preview()).toBeNull();
    });

    it('summarizes the definition count and expansion short code', () => {
      const component = setup();

      component.onTextInput(validFile);

      expect(component.preview()).toEqual({ count: 1, expansion: 'Forever' });
    });

    it('falls back to "#id" for an unrecognized expansion id', () => {
      const component = setup();
      const file = JSON.parse(validFile);
      file.expansionId = 999;

      component.onTextInput(JSON.stringify(file));

      expect(component.preview()).toEqual({ count: 1, expansion: '#999' });
    });
  });

  describe('canSubmit', () => {
    it('is false until the text parses successfully', () => {
      const component = setup();
      expect(component.canSubmit()).toBe(false);

      component.onTextInput('not json');
      expect(component.canSubmit()).toBe(false);

      component.onTextInput(validFile);
      expect(component.canSubmit()).toBe(true);
    });

    it('is false while submitting', () => {
      const component = setup();
      component.onTextInput(validFile);
      component.submitting.set(true);

      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when the text has not parsed successfully', () => {
      const component = setup();
      component.onTextInput('not json');

      component.submit();

      expect(adminStore.importRaidBuffs).not.toHaveBeenCalled();
    });

    it('does nothing while already submitting, even with a valid parse', () => {
      const component = setup();
      component.onTextInput(validFile);
      component.submitting.set(true);

      component.submit();

      expect(adminStore.importRaidBuffs).not.toHaveBeenCalled();
    });

    it('imports with the parsed expansion, definitions and the prune flag', () => {
      const component = setup();
      component.onTextInput(validFile);
      component.pruneMissing.set(true);

      component.submit();

      expect(adminStore.importRaidBuffs).toHaveBeenCalledWith(12, expect.any(Array), true);
    });

    it('closes the dialog with the expansion and summary on success', () => {
      const component = setup();
      component.onTextInput(validFile);
      adminStore.importRaidBuffs.mockReturnValue(of({ created: 3, updated: 1, deleted: 0 }));

      component.submit();

      expect(dialogRef.close).toHaveBeenCalledWith({ expansionId: 12, summary: { created: 3, updated: 1, deleted: 0 } });
    });

    it('shows the server detail and re-enables the form on failure', () => {
      const component = setup();
      component.onTextInput(validFile);
      adminStore.importRaidBuffs.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { detail: 'Spell 16176 is not known on this expansion.' } })));

      component.submit();

      expect(component.serverError()).toBe('Spell 16176 is not known on this expansion.');
      expect(component.submitting()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('leaves the server error null when the server gives no detail', () => {
      const component = setup();
      component.onTextInput(validFile);
      adminStore.importRaidBuffs.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.submit();

      expect(component.serverError()).toBeNull();
    });

    it('leaves the server error null when the response has no error body at all', () => {
      const component = setup();
      component.onTextInput(validFile);
      adminStore.importRaidBuffs.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component.submit();

      expect(component.serverError()).toBeNull();
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with null', () => {
      const component = setup();

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
