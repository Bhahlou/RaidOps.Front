import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ImportDialogComponent } from './import-dialog.component';
import { CharacterService } from '../../services/character.service';

describe('ImportDialogComponent', () => {
  let fixture: ComponentFixture<ImportDialogComponent>;
  let component: ImportDialogComponent;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClose = vi.fn();

    // Real template (not stripped) — the wrapper's own tests query into the real child panel via
    // viewChild, so TranslocoTestingModule provides a working TranslocoService instead.
    TestBed.configureTestingModule({
      imports: [
        ImportDialogComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
      providers: [
        {
          provide: CharacterService,
          useValue: { getSyncedCharacters: vi.fn().mockReturnValue(of([])), activateCharacters: vi.fn() },
        },
        { provide: MatDialogRef, useValue: { close: mockClose } },
      ],
    });

    fixture = TestBed.createComponent(ImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes the dialog with the activation result when the panel emits activated', () => {
    component.panel().activated.emit({ activated: 2, activatedCharacterIds: [1, 2] });

    expect(mockClose).toHaveBeenCalledWith({ activated: 2, activatedCharacterIds: [1, 2] });
  });

  it('closes the dialog with { error: true } when the panel emits activateError', () => {
    component.panel().activateError.emit();

    expect(mockClose).toHaveBeenCalledWith({ error: true });
  });

  it('closes the dialog with { openSync: true } when the panel emits openSyncRequested', () => {
    component.panel().openSyncRequested.emit();

    expect(mockClose).toHaveBeenCalledWith({ openSync: true });
  });
});
