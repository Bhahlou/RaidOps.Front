import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { RaidZoneFieldComponent } from './raid-zone-field.component';
import { RaidZone } from '../../models/raid-zone.model';

const zone = (overrides?: Partial<RaidZone>): RaidZone => ({
  id: 10,
  name: 'Serpentshrine Cavern',
  shortCode: 'SSC',
  iconUrl: null,
  groupCount: 5,
  slotsPerGroup: 5,
  sortOrder: 1,
  ...overrides,
});

describe('RaidZoneFieldComponent', () => {
  let fixture: ComponentFixture<RaidZoneFieldComponent>;
  let component: RaidZoneFieldComponent;

  const setup = (zones: RaidZone[], selected: Set<number> = new Set(), disabled = false) => {
    TestBed.configureTestingModule({
      imports: [
        RaidZoneFieldComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    });

    fixture = TestBed.createComponent(RaidZoneFieldComponent);
    fixture.componentRef.setInput('zones', zones);
    fixture.componentRef.setInput('selectedZoneIds', selected);
    fixture.componentRef.setInput('disabled', disabled);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  it('should create', () => {
    expect(setup([zone()])).toBeTruthy();
  });

  it('shows the "no zones" hint when there are none', () => {
    setup([]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.mode-hint')?.textContent).toContain('raidBuilder.seriesDialog.noZones');
    expect(compiled.querySelector('app-raid-zone-picker')).toBeNull();
  });

  it('renders the zone picker once zones are available', () => {
    setup([zone()]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-raid-zone-picker')).not.toBeNull();
    expect(compiled.querySelector('.mode-hint')).toBeNull();
  });

  it('forwards the selection back through the model', () => {
    const component = setup([zone()]);

    component.selectedZoneIds.set(new Set([10]));

    expect(component.selectedZoneIds()).toEqual(new Set([10]));
  });
});
