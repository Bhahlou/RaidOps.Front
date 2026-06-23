import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { SyncBnetDialogComponent } from './sync-bnet-dialog.component';
import { CharacterService } from '../../services/character.service';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';

describe('SyncBnetDialogComponent', () => {
  let fixture: ComponentFixture<SyncBnetDialogComponent>;
  let component: SyncBnetDialogComponent;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClose = vi.fn();

    // Real template (not stripped) — the wrapper's own tests query into the real child panel via
    // viewChild, so TranslocoTestingModule provides a working TranslocoService instead.
    TestBed.configureTestingModule({
      imports: [
        SyncBnetDialogComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
      providers: [
        { provide: WowBrancheService, useValue: { getAll: vi.fn().mockReturnValue(of([])) } },
        { provide: CharacterService, useValue: { syncCharacters: vi.fn() } },
        { provide: MatDialogRef, useValue: { close: mockClose } },
        { provide: MAT_DIALOG_DATA, useValue: { region: 'eu' } },
      ],
    });

    fixture = TestBed.createComponent(SyncBnetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the region from MAT_DIALOG_DATA to the panel', () => {
    expect(component.panel().region()).toBe('eu');
  });

  it('closes the dialog with { synced: true } when the panel emits synced', () => {
    component.onSynced();

    expect(mockClose).toHaveBeenCalledWith({ synced: true });
  });
});
