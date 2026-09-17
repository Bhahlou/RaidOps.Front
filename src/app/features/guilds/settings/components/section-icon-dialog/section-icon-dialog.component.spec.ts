import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { SectionIconDialogComponent, SectionIconDialogData } from './section-icon-dialog.component';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { BLANK_ICON_SOURCE } from '../../../raids/components/icon-source-picker/icon-source-picker.component';
import { AttributionIconSource } from '../../../raids/models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../../../raids/models/raid-marker-icon.enum';

describe('SectionIconDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let definitionsService: { setSectionIcon: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const setup = (data: Partial<SectionIconDialogData> = {}) => {
    dialogRef = { close: vi.fn() };
    definitionsService = { setSectionIcon: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { success: vi.fn(), error: vi.fn() };

    const fullData: SectionIconDialogData = {
      guildId: 'guild-1',
      expansionId: 2,
      raidBossId: null,
      section: 'Personals',
      icon: BLANK_ICON_SOURCE,
      ...data,
    };

    TestBed.configureTestingModule({
      imports: [SectionIconDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: fullData },
        { provide: AttributionDefinitionsService, useValue: definitionsService },
        { provide: SnackbarService, useValue: snackbar },
      ],
    }).overrideComponent(SectionIconDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(SectionIconDialogComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('initializes icon() from the injected dialog data', () => {
    const icon = { iconSource: AttributionIconSource.RaidMarker, raidMarker: RaidMarkerIcon.Skull, spellId: null, spellIconUrl: null, staticRole: null };

    expect(setup({ icon }).icon()).toEqual(icon);
  });

  describe('submit', () => {
    it('sends the guildId, boss scope, section and current icon state, then closes with true on success', () => {
      const component = setup({ guildId: 'guild-1', raidBossId: 14, section: 'Interrupts' });

      component.submit();

      expect(definitionsService.setSectionIcon).toHaveBeenCalledWith('guild-1', { raidBossId: 14, section: 'Interrupts', ...BLANK_ICON_SOURCE });
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.attributions.sectionIcon.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('sets submitting() while the request is in flight', () => {
      const component = setup();

      component.submit();

      expect(component.submitting()).toBe(true);
    });

    it('on a known API error, resets submitting() and shows the mapped error key', () => {
      const component = setup();
      definitionsService.setSectionIcon.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'AttributionDefinitionNotFound' } })));

      component.submit();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('guildSettings.attributions.errors.AttributionDefinitionNotFound');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('on an error with no mapped code, falls back to the generic server error key', () => {
      const component = setup();
      definitionsService.setSectionIcon.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('on an error with no response body at all, falls back to the generic server error key', () => {
      const component = setup();
      definitionsService.setSectionIcon.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup();

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
